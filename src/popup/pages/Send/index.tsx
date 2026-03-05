import { TOKEN_BUILD } from "@/constant/tokenMsgTypes";
import useFetchAccountData from "@/hooks/useUpdateAccount";
import { DAppActions } from "@aurowallet/mina-provider";
import BigNumber from "bignumber.js";
import { useFeeValidation } from "@/hooks/useFeeValidation";
import i18n from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useStore";
import type { InputChangeEvent } from "../../types/common";
import { useNavigate, useLocation } from "react-router-dom";
import styled from "styled-components";
import { getTokenState, getZekoNetFee, sendTx } from "../../../background/api";
import { getLocal } from "../../../background/localStorage";
import {
  MAIN_COIN_CONFIG,
  TRANSACTION_FEE,
  ZEKO_FEE_INTERVAL_TIME,
} from "../../../constant";
import { ACCOUNT_TYPE, LEDGER_STATUS } from "../../../constant/commonType";
import {
  QA_SIGN_TRANSACTION,
  WALLET_CHECK_TX_STATUS,
  WALLET_GET_ALL_ACCOUNT,
} from "../../../constant/msgTypes";
import { ADDRESS_BOOK_CONFIG } from "../../../constant/storageKey";
import { TimerProvider } from "../../../hooks/TimerContext";
import { updateShouldRequest, updatePendingNonce } from "../../../reducers/accountReducer";
import { updateAddressDetail } from "../../../reducers/cache";
import { updateLedgerConnectStatus } from "../../../reducers/ledger";
import { sendMsg } from "../../../utils/commonMsg";
import ledgerManager from "../../../utils/ledger";
import {
  addressSlice,
  addressValid,
  getRealErrorMsg,
  isNaturalNumber,
  isNumber,
  isZekoNet,
  parsedZekoFee,
  trimSpace,
} from "../../../utils/utils";
import Button from "../../component/Button";
import { ConfirmModal } from "../../component/ConfirmModal";
import CustomView from "../../component/CustomView";
import NetworkFee from "../../component/NetworkFee";
import Input from "../../component/Input";
import { LedgerInfoModal } from "../../component/LedgerInfoModal";
import SvgIcon from "../../component/SvgIcon";
import Toast from "../../component/Toast";
import {
  StyledContainer,
  StyledContentContainer,
  StyledInputContainer,
  StyledBalance,
  StyledMax,
  StyledBottomContainer,
  StyledPlaceholder,
  StyledAddressCon,
  StyledIconAddressCon,
  StyledCloseMode,
  StyledOptionOuter,
  StyledOptionContainer,
  StyledEmptyCon,
  StyledAddressRowCon,
  StyledAddressRowLeft,
  StyledRowIconContainer,
  StyledAddressName,
  StyledNewBadge,
} from "./index.styled";

const StyledWrapper = styled.div`
  display: flex;
  align-items: center;
`;
const SendPage = () => {

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const currentNode = useAppSelector((state) => state.network.currentNode);
  const tokenList = useAppSelector((state) => state.accountInfo.tokenList);
  const mainTokenNetInfo = useAppSelector(
    (state) => state.accountInfo.mainTokenNetInfo
  );
  const currentAccount = useAppSelector(
    (state) => state.accountInfo.currentAccount
  );
  const currentAddress = useAppSelector(
    (state) => state.accountInfo.currentAccount.address
  );
  const { feeConfig } = useFeeValidation();
  const ledgerStatus = useAppSelector((state) => state.ledger.ledgerConnectStatus);
  const token = useAppSelector((state) => state.cache.nextTokenDetail);

  const isZeko = useMemo(() => {
    return isZekoNet(currentNode.networkID);
  }, [currentNode]);

  const { fetchAccountData } = useFetchAccountData(currentAccount as Parameters<typeof useFetchAccountData>[0]);

  const { isFromModal } = useMemo(() => {
    let params = location.state || {};
    let isFromModal = params?.isFromModal;
    return {
      isFromModal,
    };
  }, [location]);
  const {
    tokenSymbol,
    isSendMainToken,
    availableBalance,
    mainTokenBalance,
    availableDecimals,
    tokenPublicKey,
  } = useMemo(() => {
    interface TokenBaseInfo {
      isMainToken?: boolean;
      showBalance?: string | number;
      decimals?: number;
    }
    interface TokenNetInfo {
      tokenSymbol?: string;
      publicKey?: string;
    }
    interface TokenItemType {
      tokenId?: string;
      tokenBaseInfo?: TokenBaseInfo;
      tokenNetInfo?: TokenNetInfo;
    }
    const typedTokenList = tokenList as TokenItemType[];
    const typedToken = token as TokenItemType;
    
    let mainTokenInfo = typedTokenList.find(
      (tokenItem) => tokenItem.tokenBaseInfo?.isMainToken
    );
    let fungibleTokenInfo: TokenItemType | undefined;

    const isSendMainToken = typedToken.tokenBaseInfo?.isMainToken ?? false;
    let tokenSymbol = "";
    let availableBalance: string | number = "";
    let availableDecimals = 0;
    let mainTokenBalance = mainTokenInfo?.tokenBaseInfo?.showBalance ?? 0;
    let tokenPublicKey = "";
    if (isSendMainToken) {
      tokenSymbol = MAIN_COIN_CONFIG.symbol;
      availableBalance = mainTokenInfo?.tokenBaseInfo?.showBalance ?? "";
      availableDecimals = mainTokenInfo?.tokenBaseInfo?.decimals ?? 0;
    } else {
      const netSymbol = typedToken.tokenNetInfo?.tokenSymbol;
      tokenSymbol = netSymbol && netSymbol.length > 0 ? netSymbol : "UNKNOWN";
      fungibleTokenInfo = typedTokenList.find(
        (tokenItem) => tokenItem.tokenId === typedToken.tokenId
      );
      availableBalance = fungibleTokenInfo?.tokenBaseInfo?.showBalance ?? '';
      availableDecimals = fungibleTokenInfo?.tokenBaseInfo?.decimals ?? 0;
      tokenPublicKey = fungibleTokenInfo?.tokenNetInfo?.publicKey ?? '';
    }
    return {
      tokenSymbol,
      isSendMainToken,
      availableBalance,
      mainTokenBalance,
      availableDecimals,
      tokenPublicKey,
    };
  }, [token, tokenList]);

  useEffect(() => {
    dispatch(updateAddressDetail("" as unknown as Parameters<typeof updateAddressDetail>[0]));
  }, [location]);

  const [toAddress, setToAddress] = useState("");
  const [toAddressName, setToAddressName] = useState("");

  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [feeAmount, setFeeAmount] = useState("");
  const [advanceInputFee, setAdvanceInputFee] = useState("");
  const [inputNonce, setInputNonce] = useState("");

  const [confirmModalStatus, setConfirmModalStatus] = useState(false);
  const [confirmBtnStatus, setConfirmBtnStatus] = useState(false);
  const [waitLedgerStatus, setWaitLedgerStatus] = useState(false);

  const [contentList, setContentList] = useState<{ label: string; value: string; showTimer?: boolean }[]>([]);
  const [btnDisableStatus, setBtnDisableStatus] = useState(true);

  const [ledgerModalStatus, setLedgerModalStatus] = useState(false);

  interface AddressOption {
    address: string;
    accountName?: string;
    name?: string;
    type?: string;
  }
  const [addressOptionList, setAddressOptionList] = useState<AddressOption[]>([]);
  const [addressOptionStatus, setAddressOptionStatus] = useState(false);

  const [zekoPerFee, setZekoPerFee] = useState(TRANSACTION_FEE);
  const [isNewAccount, setIsNewAccount] = useState(false);

  const pendingNonce = useAppSelector((state) => state.accountInfo.pendingNonce);

  const effectiveNonce = useMemo(() => {
    const networkNonce = mainTokenNetInfo?.inferredNonce;
    if (pendingNonce !== null && networkNonce !== undefined) {
      return Math.max(pendingNonce, networkNonce);
    }
    return networkNonce ?? 0;
  }, [mainTokenNetInfo?.inferredNonce, pendingNonce]);

  useEffect(() => {
    const networkNonce = mainTokenNetInfo?.inferredNonce;
    if (networkNonce !== undefined && pendingNonce !== null && networkNonce >= pendingNonce) {
      dispatch(updatePendingNonce(null));
    }
  }, [mainTokenNetInfo?.inferredNonce, pendingNonce, dispatch]);

  const nextFee = useMemo(() => {
    if (isNumber(advanceInputFee) && Number(advanceInputFee) > 0) {
      return advanceInputFee;
    }
    if (isZeko) {
      return zekoPerFee;
    }
    if (isNumber(feeAmount) && Number(feeAmount) > 0) {
      // button fee
      return feeAmount;
    }
    if (feeConfig?.transactionFee?.medium) {
      return feeConfig.transactionFee.medium;
    }
    return TRANSACTION_FEE;
  }, [advanceInputFee, isZeko, zekoPerFee, feeConfig, feeAmount]);

  const feeIntervalTime = useMemo(() => {
    if (!isZeko) {
      return 0;
    }
    if (isNumber(advanceInputFee) && Number(advanceInputFee) > 0) {
      return 0;
    }
    return ZEKO_FEE_INTERVAL_TIME;
  }, [isZeko, advanceInputFee]);

  useEffect(() => {
    const fetchFee = async () => {
      if (isZeko) {
        const fee = await getZekoNetFee();
        const parsedFee = parsedZekoFee(fee as string);
        if (typeof parsedFee === 'number') {
          setZekoPerFee(parsedFee);
        }
      }
    };
    fetchFee();
  }, [isZeko]);

  const onFeeTimerComplete = useCallback(async () => {
    if (isZeko) {
      const fee = await getZekoNetFee();
      const parsedFee = parsedZekoFee(fee as string);
      if (typeof parsedFee === 'number') {
        setZekoPerFee(parsedFee);
      }
    }
  }, [isZeko]);

  const onToAddressInput = useCallback((e: InputChangeEvent) => {
    setToAddress(e.target.value);
    setToAddressName("");
    setIsNewAccount(false);
  }, []);

  const onAmountInput = useCallback(
    (e: InputChangeEvent) => {
      let value = e.target.value;
      if (value.indexOf(".") !== -1) {
        let splitList = value.split(".");
        if (splitList[splitList.length - 1]!.length <= (availableDecimals || 0)) {
          setAmount(e.target.value);
        }
      } else {
        setAmount(e.target.value);
      }
    },
    [availableDecimals]
  );
  const onMemoInput = useCallback((e: InputChangeEvent) => {
    setMemo(e.target.value);
  }, []);

  const onClickAll = useCallback(() => {
    setAmount(String(availableBalance));
  }, [availableBalance]);

  const fetchAccountInfo = useCallback(async () => {
    dispatch(updateShouldRequest(true, true));
  }, []);

  useEffect(() => {
    fetchAccountInfo();
  }, []);

  useEffect(() => {
    const checkTokenAccountStatus = async () => {
      if (isSendMainToken) {
        setIsNewAccount(false);
        return;
      }
      const trimmedAddress = trimSpace(toAddress) as string;
      if (!addressValid(trimmedAddress)) {
        setIsNewAccount(false);
        return;
      }
      const tokenState = await getTokenState(
        trimmedAddress as string,
        token.tokenId as string
      ).catch(() => null) as { err?: string; account?: unknown } | null;
      if (tokenState && !tokenState.err) {
        setIsNewAccount(tokenState.account == null);
      }
    };
    checkTokenAccountStatus();
  }, [toAddress, isSendMainToken, token]);

  const onAdvanceConfirm = useCallback((fee: string, nonce: string) => {
    setAdvanceInputFee(fee);
    setInputNonce(nonce);
  }, []);


  const isAllTransfer = useCallback(() => {
    return new BigNumber(amount).isEqualTo(availableBalance);
  }, [amount, availableBalance]);

  const getRealTransferAmount = useCallback(() => {
    let fee = trimSpace(nextFee) as string;
    let realAmount = 0;
    if (isAllTransfer() && isSendMainToken) {
      realAmount = new BigNumber(amount).minus(fee).toNumber();
    } else {
      realAmount = new BigNumber(amount).toNumber();
    }
    return realAmount;
  }, [nextFee, amount, isSendMainToken]);

  const getDisplayTransferAmount = useCallback(() => {
    let fee = trimSpace(nextFee) as string;
    let realAmount;
    if (isAllTransfer() && isSendMainToken) {
      realAmount = new BigNumber(amount).minus(fee);
    } else {
      realAmount = new BigNumber(amount);
    }
    return realAmount.toFixed();
  }, [nextFee, amount, isSendMainToken]);

  const onSubmitTx = useCallback(
    (data: { error?: string; sendPayment?: { payment?: { id?: string; hash?: string } } }, type: string) => {
      if (data.error) {
        let errorMessage = i18n.t("postFailed");
        let realMsg = getRealErrorMsg(data.error);
        errorMessage = realMsg ? realMsg : errorMessage;
        Toast.info(errorMessage, 5 * 1000);
        return;
      }
      let detail = (data.sendPayment && data.sendPayment.payment) || {};
      dispatch(updateShouldRequest(true, true));
      dispatch(updatePendingNonce(effectiveNonce + 1));
      if (type === "ledger") {
        sendMsg(
          {
            action: WALLET_CHECK_TX_STATUS,
            payload: {
              paymentId: detail.id,
              hash: detail.hash,
            },
          },
          () => {}
        );
      }

      setConfirmModalStatus(false);
      fetchAccountData();
      if (isFromModal) {
        navigate("/token_detail", { replace: true });
      } else {
        navigate(-1);
      }
    },
    [i18n, isFromModal, effectiveNonce]
  );

  useEffect(() => {
    if (!confirmModalStatus) {
      setWaitLedgerStatus(false);
    }
  }, [confirmModalStatus]);
  const ledgerTransfer = useCallback(
    async (params: { fromAddress: string; toAddress: string; amount: number; fee: string; nonce: string | number; memo: string }) => {
      if (!ledgerManager.app || ledgerManager.status !== LEDGER_STATUS.READY) {
        setLedgerModalStatus(true);
        return;
      }

      setWaitLedgerStatus(true);
      setConfirmBtnStatus(true);

      try {
        const result = await ledgerManager.signPayment(
          params,
          (currentAccount.hdPath as number) || 0
        ) as { rejected?: boolean; error?: { message?: string }; payload?: unknown; signature?: string } | null;
        if (result?.rejected) {
          Toast.info(i18n.t("ledgerRejected"));
          return;
        }
        if (result?.error) {
          Toast.info(result.error.message || "Signature failed");
          return;
        }

        const postRes = await sendTx(result?.payload as Parameters<typeof sendTx>[0], {
          rawSignature: result?.signature,
        });

        onSubmitTx(postRes as Parameters<typeof onSubmitTx>[0], "ledger");
      } catch (err) {
        Toast.info("Transaction failed");
      } finally {
        setWaitLedgerStatus(false);
        setConfirmBtnStatus(false);
        setConfirmModalStatus(false);
      }
    },
    [currentAccount, onSubmitTx]
  );
  const buildBodyInLocal = useCallback((buildTokenData: Record<string, unknown>) => {
    sendMsg(
      {
        action: TOKEN_BUILD.add,
        messageSource: "messageFromUpdate",
        payload: {
          sendParams: buildTokenData,
          left: window.screenLeft,
          top: window.screenTop,
        },
      },
      (id) => {}
    );
  }, []);
  interface SendPayload {
    fromAddress: string;
    toAddress: string;
    amount: number;
    fee: string;
    nonce: string | number;
    memo: string;
    sendAction?: string;
    transaction?: unknown;
    [key: string]: unknown;
  }
  const getTokenBody = useCallback(
    (payload: SendPayload) => {
      let decimal = new BigNumber(10).pow(availableDecimals);
      let mainCoinDecimal = new BigNumber(10).pow(MAIN_COIN_CONFIG.decimals);
      let sendFee = new BigNumber(payload.fee)
        .multipliedBy(mainCoinDecimal)
        .toNumber();
      let sendAmount = new BigNumber(payload.amount)
        .multipliedBy(decimal)
        .toNumber();
      const buildTokenData = {
        sender: payload.fromAddress,
        receiver: payload.toAddress,
        tokenAddress: tokenPublicKey,
        amount: sendAmount,
        memo: payload.memo,
        fee: sendFee,
        isNewAccount: isNewAccount,
        gqlUrl: currentNode.url,
        tokenId: token.tokenId,
        symbol: tokenSymbol,
        decimals: availableDecimals,
        langCode: i18n.language,
        networkID: currentNode.networkID,
      };
      buildBodyInLocal(buildTokenData);
      setConfirmModalStatus(false);
      setConfirmBtnStatus(false);
      fetchAccountData();
      if (isFromModal) {
        // Use replace to prevent history stack accumulation during continuous transfers
        navigate("/token_detail", { replace: true });
      } else {
        navigate(-1);
      }
    },
    [
      tokenPublicKey,
      availableDecimals,
      currentNode,
      token,
      tokenSymbol,
      isFromModal,
      i18n,
      isNewAccount,
    ]
  );
  const clickNextStep = useCallback(async () => {
    if (currentAccount.type === ACCOUNT_TYPE.WALLET_LEDGER) {
      const { status } = await ledgerManager.ensureConnect();
      dispatch(updateLedgerConnectStatus(status));
      if (status !== LEDGER_STATUS.READY) {
        setLedgerModalStatus(true);
        return;
      }
    }
    let fromAddress = currentAddress || "";
    let toAddressValue = (trimSpace(toAddress) || "") as string;
    let amount = getRealTransferAmount();
    let nonce = (trimSpace(inputNonce) || effectiveNonce || 0) as string | number;
    let realMemo = memo || "";
    let fee = (trimSpace(nextFee) || "") as string;
    const payload: SendPayload = {
      fromAddress,
      toAddress: toAddressValue,
      amount,
      fee,
      nonce,
      memo: realMemo,
    };
    if (currentAccount.type === ACCOUNT_TYPE.WALLET_LEDGER) {
      return ledgerTransfer(payload);
    }
    setConfirmBtnStatus(true);
    if (!isSendMainToken) {
      payload.sendAction = DAppActions.mina_sendTransaction;
      const tokenBody = await getTokenBody(payload);
      if (tokenBody === null || tokenBody === undefined) {
        return;
      }
      payload.transaction = tokenBody;
    } else {
      payload.sendAction = DAppActions.mina_sendPayment;
    }

    sendMsg(
      {
        action: QA_SIGN_TRANSACTION,
        payload,
      },
      (data: { error?: string; sendPayment?: { payment?: { id?: string; hash?: string } } }) => {
        setConfirmBtnStatus(false);
        onSubmitTx(data, 'normal');
      }
    );
  }, [
    getRealTransferAmount,
    onSubmitTx,
    ledgerTransfer,
    ledgerStatus,
    currentAccount,
    currentAddress,
    effectiveNonce,
    toAddress,
    inputNonce,
    memo,
    nextFee,
    isSendMainToken,
    getTokenBody,
  ]);

  const onClickClose = useCallback(() => {
    setConfirmModalStatus(false);
  }, []);

  useEffect(() => {
    if (!confirmModalStatus) {
      setConfirmBtnStatus(false);
    }
  }, [confirmModalStatus]);
  const onConfirm = useCallback(async () => {
    let toAddressValue = trimSpace(toAddress) as string;
    if (!addressValid(toAddressValue)) {
      Toast.info(i18n.t("sendAddressError"));
      return;
    }
    let amountValue = trimSpace(amount) as string;
    if (!isNumber(amountValue) || !new BigNumber(amountValue).gte(0)) {
      Toast.info(i18n.t("amountError"));
      return;
    }
    let inputFee = trimSpace(nextFee) as string;
    if (inputFee.length > 0 && !isNumber(inputFee)) {
      Toast.info(i18n.t("inputFeeError"));
      return;
    }
    if (!isSendMainToken && new BigNumber(inputFee).gt(mainTokenBalance)) {
      Toast.info(i18n.t("balanceNotEnough"));
      return;
    }
    if (isAllTransfer()) {
      let maxAmount = getRealTransferAmount();
      if (new BigNumber(maxAmount).lt(0)) {
        Toast.info(i18n.t("balanceNotEnough"));
        return;
      }
    } else {
      let maxAmount = isSendMainToken
        ? new BigNumber(amount).plus(inputFee).toString()
        : new BigNumber(amount).toString();
      if (new BigNumber(maxAmount).gt(availableBalance)) {
        Toast.info(i18n.t("balanceNotEnough"));
        return;
      }
    }
    let nonce = trimSpace(inputNonce) as string;
    if (nonce.length > 0 && !isNaturalNumber(nonce)) {
      Toast.info(i18n.t("inputNonceError", { nonce: "Nonce" }));
      return;
    }
    let list: { label: string; value: string; showTimer?: boolean }[] = [
      {
        label: i18n.t("to"),
        value: toAddress,
      },
      {
        label: i18n.t("from"),
        value: currentAddress || "",
      },
      {
        label: i18n.t("networkFee"),
        value: inputFee + " " + MAIN_COIN_CONFIG.symbol,
        showTimer: feeIntervalTime > 0,
      },
    ];
    if (isNaturalNumber(nonce)) {
      list.push({
        label: "Nonce",
        value: nonce,
      });
    }
    if (memo) {
      list.push({
        label: "Memo",
        value: memo,
      });
    }
    setContentList(list);

    if (!isSendMainToken) {
      if (currentAccount.type === ACCOUNT_TYPE.WALLET_LEDGER) {
        Toast.info(i18n.t("notSupportNow"));
        return;
      }
      let fromAddress = currentAddress || "";
      let toAddressValue = (trimSpace(toAddress) || "") as string;
      let amount = getRealTransferAmount();
      let nonce = (trimSpace(inputNonce) || effectiveNonce || 0) as string | number;
      let realMemo = memo || "";
      let fee = (trimSpace(nextFee) || "") as string;
      let payload: SendPayload = {
        fromAddress,
        toAddress: toAddressValue,
        amount,
        fee,
        nonce,
        memo: realMemo,
      };
      await getTokenBody(payload);
      return;
    }

    if (currentAccount.type === ACCOUNT_TYPE.WALLET_LEDGER) {
      const { status } = await ledgerManager.ensureConnect();
      dispatch(updateLedgerConnectStatus(status));
      if (status !== LEDGER_STATUS.READY) {
        setLedgerModalStatus(true);
        return;
      }
    }
    setConfirmModalStatus(true);
  }, [
    i18n,
    toAddress,
    amount,
    nextFee,
    inputNonce,
    currentAddress,
    memo,
    currentAccount,
    isAllTransfer,
    getRealTransferAmount,
    clickNextStep,
    ledgerStatus,
    availableBalance,
    mainTokenBalance,
    effectiveNonce,
    feeIntervalTime,
    isSendMainToken,
  ]);

  const onLedgerInfoModalConfirm = useCallback(async () => {
    const { status } = await ledgerManager.ensureConnect();
    if (status === LEDGER_STATUS.READY) {
      setLedgerModalStatus(false);
      onConfirm();
    }
  }, [onConfirm]);

  useEffect(() => {
    if ((trimSpace(toAddress) as string).length > 0 && (trimSpace(amount) as string).length > 0) {
      setBtnDisableStatus(false);
    } else {
      setBtnDisableStatus(true);
    }
  }, [toAddress, amount]);

  useEffect(() => {
    let cacheList: AddressOption[] = [];
    sendMsg(
      {
        action: WALLET_GET_ALL_ACCOUNT,
      },
      async (account: { accounts: { allList: AddressOption[] } }) => {
        let listData = account.accounts;
        let addressBookList = getLocal(ADDRESS_BOOK_CONFIG);
        if (addressBookList) {
          addressBookList = JSON.parse(addressBookList);
        } else {
          addressBookList = '';
        }

        if (Array.isArray(addressBookList)) {
          cacheList.push(...addressBookList);
        }
        cacheList.push(...listData.allList);
        cacheList = cacheList.filter((account: AddressOption) => {
          return account.address !== currentAddress;
        });
        setAddressOptionList(cacheList);
      }
    );
  }, [currentAddress]);
  const onShowAddressList = useCallback(() => {
    setAddressOptionStatus((state) => !state);
  }, []);
  const onClickRowAddress = useCallback((data: AddressOption) => {
    setToAddressName(data.accountName || data.name || "");
    setToAddress(data.address);
    setAddressOptionStatus(false);
  }, []);

  const onClickCloseMode = useCallback(() => {
    setAddressOptionStatus(false);
  }, []);

  return (
    <CustomView
      title={i18n.t("send") + " " + tokenSymbol}
      ContentWrapper={StyledContainer}
    >
      <TimerProvider
        intervalTime={feeIntervalTime}
        onTimerComplete={onFeeTimerComplete}
      >
        <StyledContentContainer>
          <StyledInputContainer>
            <Input
              label={i18n.t("to")}
              onChange={onToAddressInput}
              value={toAddress}
              inputType={"text"}
              subLabel={
                isNewAccount ? (
                  <>
                    {toAddressName}
                    <StyledNewBadge>{i18n.t("newAccount")}</StyledNewBadge>
                  </>
                ) : toAddressName as any
              }
              placeholder={i18n.t("address")}
              rightStableComponent={
                <StyledAddressCon>
                  <StyledIconAddressCon onClick={onShowAddressList}>
                    <img src="/img/icon_address.svg" />
                  </StyledIconAddressCon>
                  {addressOptionStatus && (
                    <>
                      <StyledCloseMode onClick={onClickCloseMode} />
                      <StyledOptionOuter>
                        <StyledOptionContainer>
                          {addressOptionList.length > 0 ? (
                            addressOptionList.map((data, index) => {
                              return (
                                <AddressRowItem
                                  data={data}
                                  onClickRowAddress={onClickRowAddress}
                                  key={index}
                                />
                              );
                            })
                          ) : (
                            <StyledEmptyCon>
                              {i18n.t("noAddressSaved")}
                            </StyledEmptyCon>
                          )}
                        </StyledOptionContainer>
                      </StyledOptionOuter>
                    </>
                  )}
                </StyledAddressCon>
              }
            />
            <Input
              label={i18n.t("amount")}
              onChange={onAmountInput}
              value={amount}
              inputType={"numric"}
              placeholder={'0'}
              rightComponent={
                <StyledBalance>
                  {availableBalance + " " + tokenSymbol}
                </StyledBalance>
              }
              rightStableComponent={
                <StyledMax onClick={onClickAll}>{i18n.t("max")}</StyledMax>
              }
            />
            <Input
              label={i18n.t("memo")}
              onChange={onMemoInput}
              value={memo}
              inputType={"text"}
            />
          </StyledInputContainer>
          <NetworkFee
            currentFee={String(nextFee)}
            currentNonce={inputNonce}
            advanceFee={advanceInputFee}
            advanceNonce={inputNonce}
            feeConfig={feeConfig}
            showFeeButtons={!isZeko}
            onAdvanceConfirm={onAdvanceConfirm}
          />
          <StyledPlaceholder />
        </StyledContentContainer>
        <StyledBottomContainer>
          <Button disable={btnDisableStatus} onClick={onConfirm}>
            <StyledWrapper>
              {i18n.t("next")}
              {!isSendMainToken && (
                <StyledWrapper>
                  <img src="/img/icon_window.svg" />
                </StyledWrapper>
              )}
            </StyledWrapper>
          </Button>
        </StyledBottomContainer>
        <ConfirmModal
          modalVisible={confirmModalStatus}
          title={i18n.t("transactionDetails")}
          highlightTitle={i18n.t("amount")}
          highlightContent={getDisplayTransferAmount()}
          subHighlightContent={tokenSymbol}
          onConfirm={clickNextStep}
          loadingStatus={confirmBtnStatus}
          onClickClose={onClickClose}
          waitingLedger={waitLedgerStatus}
          contentList={contentList}
          showCloseIcon={waitLedgerStatus}
        />
        <LedgerInfoModal
          modalVisible={ledgerModalStatus}
          onClickClose={() => setLedgerModalStatus(false)}
          onConfirm={onLedgerInfoModalConfirm}
        />
      </TimerProvider>
    </CustomView>
  );
};

interface AddressOption {
  type?: string;
  accountName?: string;
  name?: string;
  address: string;
}

interface AddressRowItemProps {
  data?: AddressOption;
  onClickRowAddress?: (data: AddressOption) => void;
}

const AddressRowItem = ({ data, onClickRowAddress }: AddressRowItemProps) => {
  const { showIconSrc, showName, showAddress } = useMemo(() => {
    const showIconSrc = data?.type ? "/img/icon_wallet_outline.svg" : "/img/icon_contact.svg";
    let showName = data?.accountName || data?.name;
    const showAddress = addressSlice(data?.address || "", 6);
    return {
      showIconSrc,
      showName,
      showAddress,
    };
  }, [data]);

  const [iconColor, setIconColor] = useState("black");

  const showWhiteIcon = useCallback(() => {
    setIconColor("white");
  }, []);
  const showBlackIcon = useCallback(() => {
    setIconColor("black");
  }, []);

  return (
    <StyledAddressRowCon
      onClick={() => onClickRowAddress?.(data!)}
      onMouseEnter={showWhiteIcon}
      onMouseLeave={showBlackIcon}
    >
      <StyledAddressRowLeft>
        <StyledRowIconContainer>
          <SvgIcon src={showIconSrc} color={iconColor} />
        </StyledRowIconContainer>
        <StyledAddressName>{showName}</StyledAddressName>
      </StyledAddressRowLeft>
      <div>{showAddress}</div>
    </StyledAddressRowCon>
  );
};

export default SendPage;
