import { TOKEN_BUILD } from "@/constant/tokenMsgTypes";
import useFetchAccountData from "@/hooks/useUpdateAccount";
import { DAppActions } from "@aurowallet/mina-provider";
import BigNumber from "bignumber.js";
import cls from "classnames";
import i18n from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
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
import { updateShouldRequest } from "../../../reducers/accountReducer";
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
import AdvanceMode from "../../component/AdvanceMode";
import Button from "../../component/Button";
import { ConfirmModal } from "../../component/ConfirmModal";
import CustomView from "../../component/CustomView";
import FeeGroup from "../../component/FeeGroup";
import Input from "../../component/Input";
import { LedgerInfoModal } from "../../component/LedgerInfoModal";
import ICON_Address from "../../component/SVG/ICON_Address";
import ICON_Wallet from "../../component/SVG/ICON_Wallet";
import Toast from "../../component/Toast";
import styles from "./index.module.scss";

const StyledWrapper = styled.div`
  display: flex;
  align-items: center;
`;
const SendPage = ({}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const currentNode = useSelector((state) => state.network.currentNode);
  const tokenList = useSelector((state) => state.accountInfo.tokenList);
  const mainTokenNetInfo = useSelector(
    (state) => state.accountInfo.mainTokenNetInfo
  );
  const currentAccount = useSelector(
    (state) => state.accountInfo.currentAccount
  );
  const currentAddress = useSelector(
    (state) => state.accountInfo.currentAccount.address
  );
  const netFeeList = useSelector((state) => state.cache.feeRecommend);
  const ledgerStatus = useSelector((state) => state.ledger.ledgerConnectStatus);
  const token = useSelector((state) => state.cache.nextTokenDetail);

  const isZeko = useMemo(() => {
    return isZekoNet(currentNode.networkID);
  }, [currentNode]);

  const { fetchAccountData } = useFetchAccountData(currentAccount);

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
    let mainTokenInfo = tokenList.find(
      (tokenItem) => tokenItem.tokenBaseInfo.isMainToken
    );
    let fungibleTokenInfo = {};

    const isSendMainToken = token.tokenBaseInfo.isMainToken;
    let tokenSymbol = "";
    let availableBalance = "";
    let availableDecimals = 0;
    let mainTokenBalance = mainTokenInfo.tokenBaseInfo.showBalance;
    let tokenPublicKey = "";
    if (isSendMainToken) {
      tokenSymbol = MAIN_COIN_CONFIG.symbol;
      availableBalance = mainTokenInfo.tokenBaseInfo.showBalance;
      availableDecimals = mainTokenInfo.tokenBaseInfo.decimals;
    } else {
      tokenSymbol =
        token.tokenNetInfo.tokenSymbol?.length > 0
          ? token.tokenNetInfo.tokenSymbol
          : "UNKNOWN";
      fungibleTokenInfo = tokenList.find(
        (tokenItem) => tokenItem.tokenId === token.tokenId
      );
      availableBalance = fungibleTokenInfo.tokenBaseInfo.showBalance;
      availableDecimals = fungibleTokenInfo.tokenBaseInfo.decimals;
      tokenPublicKey = fungibleTokenInfo.tokenNetInfo.publicKey;
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
    dispatch(updateAddressDetail(""));
  }, [location]);

  const [toAddress, setToAddress] = useState("");
  const [toAddressName, setToAddressName] = useState("");

  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [feeAmount, setFeeAmount] = useState("");
  const [advanceInputFee, setAdvanceInputFee] = useState("");
  const [inputNonce, setInputNonce] = useState("");
  const [feeErrorTip, setFeeErrorTip] = useState("");

  const [isOpenAdvance, setIsOpenAdvance] = useState(false);
  const [confirmModalStatus, setConfirmModalStatus] = useState(false);
  const [confirmBtnStatus, setConfirmBtnStatus] = useState(false);
  const [waitLedgerStatus, setWaitLedgerStatus] = useState(false);

  const [contentList, setContentList] = useState([]);
  const [btnDisableStatus, setBtnDisableStatus] = useState(true);

  const [ledgerModalStatus, setLedgerModalStatus] = useState(false);

  const [addressOptionList, setAddressOptionList] = useState([]);
  const [addressOptionStatus, setAddressOptionStatus] = useState(false);

  const [zekoPerFee, setZekoPerFee] = useState(TRANSACTION_FEE);
  const [isNewAccount, setIsNewAccount] = useState(false);

  const nextFee = useMemo(() => {
    if (isNumber(advanceInputFee) && advanceInputFee > 0) {
      return advanceInputFee;
    }
    if (isZeko) {
      return zekoPerFee;
    }
    if (isNumber(feeAmount) && feeAmount > 0) {
      // button fee
      return feeAmount;
    }
    if (netFeeList.length > 0) {
      return netFeeList[1].value;
    }
    return TRANSACTION_FEE;
  }, [advanceInputFee, isZeko, zekoPerFee, netFeeList, feeAmount]);

  const feeIntervalTime = useMemo(() => {
    if (!isZeko) {
      return 0;
    }
    if (isNumber(advanceInputFee) && advanceInputFee > 0) {
      return 0;
    }
    return ZEKO_FEE_INTERVAL_TIME;
  }, [isZeko, advanceInputFee]);

  useEffect(() => {
    const fetchFee = async () => {
      if (isZeko) {
        const fee = await getZekoNetFee();
        setZekoPerFee(parsedZekoFee(fee));
      }
    };
    fetchFee();
  }, [isZeko]);

  const onFeeTimerComplete = useCallback(async () => {
    if (isZeko) {
      const fee = await getZekoNetFee();
      setZekoPerFee(parsedZekoFee(fee));
    }
  }, [isZeko]);

  const onToAddressInput = useCallback((e) => {
    setToAddress(e.target.value);
    setToAddressName("");
    setIsNewAccount(false);
  }, []);

  const onAmountInput = useCallback(
    (e) => {
      let value = e.target.value;
      if (value.indexOf(".") !== -1) {
        let splitList = value.split(".");
        if (splitList[splitList.length - 1].length <= availableDecimals) {
          setAmount(e.target.value);
        }
      } else {
        setAmount(e.target.value);
      }
    },
    [availableDecimals]
  );
  const onMemoInput = useCallback((e) => {
    setMemo(e.target.value);
  }, []);

  const onClickAll = useCallback(() => {
    setAmount(availableBalance);
  }, [availableBalance]);

  const onClickFeeGroup = useCallback((item) => {
    setFeeAmount(item.fee);
  }, []);

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
      const trimmedAddress = trimSpace(toAddress);
      if (!addressValid(trimmedAddress)) {
        setIsNewAccount(false);
        return;
      }
      const tokenState = await getTokenState(
        trimmedAddress,
        token.tokenId
      ).catch(() => null);
      if (tokenState && !tokenState.err) {
        setIsNewAccount(tokenState.account == null);
      }
    };
    checkTokenAccountStatus();
  }, [toAddress, isSendMainToken, token]);

  const onClickAdvance = useCallback(() => {
    setIsOpenAdvance((state) => !state);
  }, []);

  const onFeeInput = useCallback(
    (e) => {
      setAdvanceInputFee(e.target.value);
      if (BigNumber(e.target.value).gt(10)) {
        setFeeErrorTip(i18n.t("feeTooHigh"));
      } else {
        setFeeErrorTip("");
      }
    },
    [i18n]
  );
  const onNonceInput = useCallback((e) => {
    setInputNonce(e.target.value);
  }, []);

  const isAllTransfer = useCallback(() => {
    return new BigNumber(amount).isEqualTo(availableBalance);
  }, [amount, availableBalance]);

  const getRealTransferAmount = useCallback(() => {
    let fee = trimSpace(nextFee);
    let realAmount = 0;
    if (isAllTransfer() && isSendMainToken) {
      realAmount = new BigNumber(amount).minus(fee).toNumber();
    } else {
      realAmount = new BigNumber(amount).toNumber();
    }
    return realAmount;
  }, [nextFee, amount, isSendMainToken]);

  const getDisplayTransferAmount = useCallback(() => {
    let fee = trimSpace(nextFee);
    let realAmount;
    if (isAllTransfer() && isSendMainToken) {
      realAmount = new BigNumber(amount).minus(fee);
    } else {
      realAmount = new BigNumber(amount);
    }
    return realAmount.toFixed();
  }, [nextFee, amount, isSendMainToken]);

  const onSubmitTx = useCallback(
    (data, type) => {
      if (data.error) {
        let errorMessage = i18n.t("postFailed");
        let realMsg = getRealErrorMsg(data.error);
        errorMessage = realMsg ? realMsg : errorMessage;
        Toast.info(errorMessage, 5 * 1000);
        return;
      }
      let detail = (data.sendPayment && data.sendPayment.payment) || {};
      dispatch(updateShouldRequest(true, true));
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
        navigate("/token_detail");
      } else {
        navigate(-1);
      }
    },
    [i18n, isFromModal]
  );

  useEffect(() => {
    if (!confirmModalStatus) {
      setWaitLedgerStatus(false);
    }
  }, [confirmModalStatus]);
  const ledgerTransfer = useCallback(
    async (params) => {
      if (!ledgerManager.app || ledgerManager.status !== LEDGER_STATUS.READY) {
        setLedgerModalStatus(true);
        return;
      }

      setWaitLedgerStatus(true);
      setConfirmBtnStatus(true);

      try {
        const result = await ledgerManager.signPayment(
          params,
          currentAccount.hdPath || 0
        );
        if (result.rejected) {
          Toast.info(i18n.t("ledgerRejected"));
          return;
        }
        if (result.error) {
          Toast.info(result.error.message || "Signature failed");
          return;
        }

        const postRes = await sendTx(result.payload, {
          rawSignature: result.signature,
        });

        onSubmitTx(postRes, "ledger");
      } catch (err) {
        Toast.info("Transaction failed", err);
      } finally {
        setWaitLedgerStatus(false);
        setConfirmBtnStatus(false);
        setConfirmModalStatus(false);
      }
    },
    [currentAccount, onSubmitTx]
  );
  const buildBodyInLocal = useCallback((buildTokenData) => {
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
  const getTokenBody = useCallback(
    (payload) => {
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
        navigate("/token_detail");
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
    let fromAddress = currentAddress;
    let toAddressValue = trimSpace(toAddress);
    let amount = getRealTransferAmount();
    let nonce = trimSpace(inputNonce) || mainTokenNetInfo?.inferredNonce;
    let realMemo = memo || "";
    let fee = trimSpace(nextFee);
    const payload = {
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
      if (!tokenBody) {
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
      (data) => {
        setConfirmBtnStatus(false);
        onSubmitTx(data);
      }
    );
  }, [
    getRealTransferAmount,
    onSubmitTx,
    ledgerTransfer,
    ledgerStatus,
    currentAccount,
    currentAddress,
    mainTokenNetInfo,
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
    let toAddressValue = trimSpace(toAddress);
    if (!addressValid(toAddressValue)) {
      Toast.info(i18n.t("sendAddressError"));
      return;
    }
    let amountValue = trimSpace(amount);
    if (!isNumber(amountValue) || !new BigNumber(amountValue).gte(0)) {
      Toast.info(i18n.t("amountError"));
      return;
    }
    let inputFee = trimSpace(nextFee);
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
    let nonce = trimSpace(inputNonce);
    if (nonce.length > 0 && !isNaturalNumber(nonce)) {
      Toast.info(i18n.t("inputNonceError", { nonce: "Nonce" }));
      return;
    }
    let list = [
      {
        label: i18n.t("to"),
        value: toAddress,
      },
      {
        label: i18n.t("from"),
        value: currentAddress,
      },
      {
        label: i18n.t("fee"),
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
      let fromAddress = currentAddress;
      let toAddressValue = trimSpace(toAddress);
      let amount = getRealTransferAmount();
      let nonce = trimSpace(inputNonce) || mainTokenNetInfo?.inferredNonce;
      let realMemo = memo || "";
      let fee = trimSpace(nextFee);
      let payload = {
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
    mainTokenNetInfo,
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
    if (trimSpace(toAddress).length > 0 && trimSpace(amount).length > 0) {
      setBtnDisableStatus(false);
    } else {
      setBtnDisableStatus(true);
    }
  }, [toAddress, amount]);

  useEffect(() => {
    let cacheList = [];
    sendMsg(
      {
        action: WALLET_GET_ALL_ACCOUNT,
      },
      async (account) => {
        let listData = account.accounts;
        let addressBookList = getLocal(ADDRESS_BOOK_CONFIG);
        if (addressBookList) {
          addressBookList = JSON.parse(addressBookList);
        } else {
          addressBookList = [];
        }

        cacheList.push(...addressBookList);
        cacheList.push(...listData.allList);
        cacheList = cacheList.filter((account) => {
          return account.address !== currentAddress;
        });
        setAddressOptionList(cacheList);
      }
    );
  }, [currentAddress]);
  const onShowAddressList = useCallback(() => {
    setAddressOptionStatus((state) => !state);
  }, []);
  const onClickRowAddress = useCallback((data) => {
    setToAddressName(data.accountName || data.name);
    setToAddress(data.address);
    setAddressOptionStatus(false);
  }, []);

  const onClickCloseMode = useCallback(() => {
    setAddressOptionStatus(false);
  }, []);

  return (
    <CustomView
      title={i18n.t("send") + " " + tokenSymbol}
      contentClassName={styles.container}
    >
      <TimerProvider
        intervalTime={feeIntervalTime}
        onTimerComplete={onFeeTimerComplete}
      >
        <div className={styles.contentContainer}>
          <div className={styles.inputContainer}>
            <Input
              label={i18n.t("to")}
              onChange={onToAddressInput}
              value={toAddress}
              inputType={"text"}
              subLabel={
                isNewAccount ? (
                  <>
                    {toAddressName}
                    <span className={styles.newBadge}>{i18n.t("newAccount")}</span>
                  </>
                ) : toAddressName
              }
              placeholder={i18n.t("address")}
              rightStableComponent={
                <div className={styles.addressCon}>
                  <div
                    className={styles.iconAddressCon}
                    onClick={onShowAddressList}
                  >
                    <img src="/img/icon_address.svg" />
                  </div>
                  {addressOptionStatus && (
                    <>
                      <div
                        className={styles.closeMode}
                        onClick={onClickCloseMode}
                      />
                      <div className={styles.optionOuter}>
                        <div className={styles.optionContainer}>
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
                            <div className={styles.emptyCon}>
                              {i18n.t("noAddressSaved")}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              }
            />
            <Input
              label={i18n.t("amount")}
              onChange={onAmountInput}
              value={amount}
              inputType={"numric"}
              placeholder={0}
              rightComponent={
                <div className={styles.balance}>
                  {availableBalance + " " + tokenSymbol}
                </div>
              }
              rightStableComponent={
                <div onClick={onClickAll} className={styles.max}>
                  {i18n.t("max")}
                </div>
              }
            />
            <Input
              label={i18n.t("memo")}
              onChange={onMemoInput}
              value={memo}
              inputType={"text"}
            />
          </div>
          <div className={styles.feeContainer}>
            <FeeGroup
              onClickFee={onClickFeeGroup}
              currentFee={nextFee}
              netFeeList={netFeeList}
              showFeeGroup={!isZeko}
              hideTimer={false}
            />
          </div>

          <div className={styles.dividedLine}>
            <p className={styles.dividedContent}>-</p>
          </div>

          <div>
            <AdvanceMode
              onClickAdvance={onClickAdvance}
              isOpenAdvance={isOpenAdvance}
              feeValue={advanceInputFee}
              feePlaceholder={nextFee}
              onFeeInput={onFeeInput}
              feeErrorTip={feeErrorTip}
              nonceValue={inputNonce}
              onNonceInput={onNonceInput}
            />
          </div>
          <div className={styles.hold} />
        </div>
        <div className={cls(styles.bottomContainer)}>
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
        </div>

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

const AddressRowItem = ({ data, onClickRowAddress }) => {
  const { ShowIcon, showName, showAddress } = useMemo(() => {
    const ShowIcon = data.type ? ICON_Wallet : ICON_Address;
    let showName = data.accountName || data.name;
    const showAddress = addressSlice(data.address, 6);
    return {
      ShowIcon,
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
    <div
      className={styles.addressRowCon}
      onClick={() => onClickRowAddress(data)}
      onMouseEnter={showWhiteIcon}
      onMouseLeave={showBlackIcon}
    >
      <div className={styles.addressRowLeft}>
        <div className={styles.rowIconContainer}>
          <ShowIcon stroke={iconColor} />
        </div>
        <span className={styles.addressName}>{showName}</span>
      </div>
      <div className={styles.addressRowRight}>{showAddress}</div>
    </div>
  );
};

export default SendPage;
