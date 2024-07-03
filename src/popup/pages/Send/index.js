import useFetchAccountData from "@/hooks/useUpdateAccount";
import { verifyTokenCommand } from "@/utils/zkUtils";
import { DAppActions } from "@aurowallet/mina-provider";
import BigNumber from "bignumber.js";
import cls from "classnames";
import i18n from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import { buildTokenBody, getTokenState, sendTx } from "../../../background/api";
import { getLocal } from "../../../background/localStorage";
import { MAIN_COIN_CONFIG } from "../../../constant";
import { ACCOUNT_TYPE, LEDGER_STATUS } from "../../../constant/commonType";
import {
  QA_SIGN_TRANSACTION,
  WALLET_CHECK_TX_STATUS,
  WALLET_GET_ALL_ACCOUNT,
} from "../../../constant/msgTypes";
import { ADDRESS_BOOK_CONFIG } from "../../../constant/storageKey";
import { updateShouldRequest } from "../../../reducers/accountReducer";
import { updateAddressDetail } from "../../../reducers/cache";
import { updateLedgerConnectStatus } from "../../../reducers/ledger";
import { sendMsg } from "../../../utils/commonMsg";
import { getLedgerStatus, requestSignPayment } from "../../../utils/ledger";
import {
  addressSlice,
  getRealErrorMsg,
  isNaturalNumber,
  isNumber,
  trimSpace,
} from "../../../utils/utils";
import { addressValid } from "../../../utils/validator";
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
import { decryptData, encryptData } from "@/utils/fore";
import { node_public_keys, react_private_keys } from "../../../../config";

const SendPage = ({}) => {
  const dispatch = useDispatch();
  const history = useHistory();

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

  const { fetchAccountData } = useFetchAccountData(currentAccount);

  const { isFromModal } = useMemo(() => {
    let params = history.location.params || {};
    let isFromModal = params?.isFromModal
    return {
      isFromModal,
    };
  }, [history]);
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
      tokenSymbol = token.tokenNetInfo.tokenSymbol ?? "UNKNOWN";
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
  }, [history]);

  const [toAddress, setToAddress] = useState("");
  const [toAddressName, setToAddressName] = useState("");

  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [feeAmount, setFeeAmount] = useState(0.1);
  const [advanceInputFee, setAdvanceInputFee] = useState("");
  const [inputNonce, setInputNonce] = useState("");
  const [feeErrorTip, setFeeErrorTip] = useState("");

  const [isOpenAdvance, setIsOpenAdvance] = useState(false);
  const [confirmModalStatus, setConfirmModalStatus] = useState(false);
  const [confirmBtnStatus, setConfirmBtnStatus] = useState(false);
  const [waitLedgerStatus, setWaitLedgerStatus] = useState(false);

  const [contentList, setContentList] = useState([]);
  const [btnDisableStatus, setBtnDisableStatus] = useState(true);
  const [ledgerApp, setLedgerApp] = useState();

  const [ledgerModalStatus, setLedgerModalStatus] = useState(false);

  const [addressOptionList, setAddressOptionList] = useState([]);
  const [addressOptionStatus, setAddressOptionStatus] = useState(false);

  const onToAddressInput = useCallback((e) => {
    setToAddress(e.target.value);
    setToAddressName("");
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

  useEffect(() => {
    if (feeAmount === 0.1) {
      if (netFeeList.length > 0) {
        setFeeAmount(netFeeList[1].value);
      }
    }
  }, [feeAmount, netFeeList]);

  const fetchAccountInfo = useCallback(async () => {
    dispatch(updateShouldRequest(true, true));
  }, []);

  useEffect(() => {
    fetchAccountInfo();
  }, []);

  const onClickAdvance = useCallback(() => {
    setIsOpenAdvance((state) => !state);
  }, []);

  const onFeeInput = useCallback(
    (e) => {
      setFeeAmount(e.target.value);
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
    let fee = trimSpace(feeAmount);
    let realAmount = 0;
    if (isAllTransfer() && isSendMainToken) {
      realAmount = new BigNumber(amount).minus(fee).toNumber();
    } else {
      realAmount = new BigNumber(amount).toNumber();
    }
    return realAmount;
  }, [feeAmount, amount, isSendMainToken]);

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
      if(isFromModal){
        history.replace({
          pathname: "token_detail",
        });
      }else{
        history.goBack();
      }
    },
    [i18n,isFromModal]
  );

  useEffect(() => {
    if (!confirmModalStatus) {
      setWaitLedgerStatus(false);
    }
  }, [confirmModalStatus]);
  const ledgerTransfer = useCallback(
    async (params, preLedgerApp) => {
      const nextLedgerApp = preLedgerApp || ledgerApp;
      if (nextLedgerApp) {
        setWaitLedgerStatus(true);
        const {
          signature,
          payload,
          error,
          rejected,
        } = await requestSignPayment(
          nextLedgerApp,
          params,
          currentAccount.hdPath
        );
        if (rejected) {
          setConfirmModalStatus(false);
        }
        if (error) {
          Toast.info(error.message);
          return;
        }
        let postRes = await sendTx(payload, { rawSignature: signature }).catch(
          (error) => error
        );
        setConfirmModalStatus(false);

        onSubmitTx(postRes, "ledger");
      }
    },
    [currentAccount, onSubmitTx, ledgerApp, fetchAccountData]
  );

  const getTokenBody = useCallback(
    async (payload) => {
      const tokenState = await getTokenState(
        payload.toAddress,
        token.tokenId
      ).catch((err) => err);
      if (tokenState.err) {
        Toast.info(String(tokenState.err));
        setConfirmBtnStatus(false);
        return;
      }
      let fundNewAccountStatus = tokenState.account == null;
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
        isNewAccount: fundNewAccountStatus,
        gqlUrl: currentNode.url,
        zkAppUri:token.zkappUri
      };
      const data = encryptData(JSON.stringify(buildTokenData),node_public_keys);
      const buildData = await buildTokenBody(data);
      if (buildData.unSignTx) {
        let realUnSignTxStr = decryptData(buildData.unSignTx.encryptedData,buildData.unSignTx.encryptedAESKey,buildData.unSignTx.iv,react_private_keys);
        let realUnSignTx = JSON.stringify(realUnSignTxStr)
        const checkChangeStatus = verifyTokenCommand(
          buildTokenData,
          token.tokenId,
          realUnSignTx
        );
        if (!checkChangeStatus) {
          setConfirmBtnStatus(false);
          Toast.info(i18n.t("buildFailed"));
          return;
        }
        return realUnSignTx;
      } else {
        setConfirmBtnStatus(false);
        Toast.info(buildData.error || String(buildData));
        return;
      }
    },
    [tokenPublicKey, availableDecimals, currentNode,token]
  );
  const clickNextStep = useCallback(
    async (ledgerReady = false, preLedgerApp) => {
      if (currentAccount.type === ACCOUNT_TYPE.WALLET_LEDGER) {
        if (!ledgerReady) {
          const ledger = await getLedgerStatus();
          dispatch(updateLedgerConnectStatus(ledger.status));
          if (ledger.status !== LEDGER_STATUS.READY) {
            setLedgerModalStatus(true);
            return;
          }
          setLedgerApp(ledger.app);
        }
      }
      let fromAddress = currentAddress;
      let toAddressValue = trimSpace(toAddress);
      let amount = getRealTransferAmount();
      let nonce = trimSpace(inputNonce) || mainTokenNetInfo?.inferredNonce;
      let realMemo = memo || "";
      let fee = trimSpace(feeAmount);
      let payload = {
        fromAddress,
        toAddress: toAddressValue,
        amount,
        fee,
        nonce,
        memo: realMemo,
      };
      if (currentAccount.type === ACCOUNT_TYPE.WALLET_LEDGER) {
        return ledgerTransfer(payload, preLedgerApp);
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
    },
    [
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
      feeAmount,
      isSendMainToken,
      getTokenBody,
    ]
  );

  const onClickClose = useCallback(() => {
    setConfirmModalStatus(false);
  }, []);

  useEffect(() => {
    if (!confirmModalStatus) {
      setConfirmBtnStatus(false);
    }
  }, [confirmModalStatus]);
  const onConfirm = useCallback(
    async (ledgerReady = false) => {
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
      let inputFee = trimSpace(feeAmount);
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
      if (currentAccount.type === ACCOUNT_TYPE.WALLET_LEDGER) {
        if (!isSendMainToken) {
          Toast.info(i18n.t("notSupportNow"));
          return;
        }

        if (!ledgerReady) {
          const ledger = await getLedgerStatus();
          setLedgerApp(ledger.app);
          dispatch(updateLedgerConnectStatus(ledger.status));
        }
        setConfirmModalStatus(true);
      } else {
        dispatch(updateLedgerConnectStatus(""));
        setConfirmModalStatus(true);
      }
    },
    [
      i18n,
      toAddress,
      amount,
      feeAmount,
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
    ]
  );

  const onLedgerInfoModalConfirm = useCallback(
    (ledger) => {
      setLedgerApp(ledger.app);
      setLedgerModalStatus(false);
      onConfirm(true);
    },
    [confirmModalStatus, clickNextStep, onConfirm]
  );

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
      <div className={styles.contentContainer}>
        <div className={styles.inputContainer}>
          <Input
            label={i18n.t("to")}
            onChange={onToAddressInput}
            value={toAddress}
            inputType={"text"}
            subLabel={toAddressName}
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
            currentFee={feeAmount}
            netFeeList={netFeeList}
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
            feePlaceholder={feeAmount}
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
          {i18n.t("next")}
        </Button>
      </div>

      <ConfirmModal
        modalVisible={confirmModalStatus}
        title={i18n.t("transactionDetails")}
        highlightTitle={i18n.t("amount")}
        highlightContent={getRealTransferAmount()}
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
