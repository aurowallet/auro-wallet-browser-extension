import BigNumber from "bignumber.js";
import cls from "classnames";
import i18n from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import { sendStakeTx } from "../../../background/api";
import {
  addressSlice,
  addressValid,
  getRealErrorMsg,
  isNaturalNumber,
  isNumber,
  trimSpace,
} from "../../../utils/utils";
import Button from "../../component/Button";
import { ConfirmModal } from "../../component/ConfirmModal";
import CustomView from "../../component/CustomView";
import Input from "../../component/Input";
import styles from "./index.module.scss";

import { MAIN_COIN_CONFIG, ZK_DEFAULT_TOKEN_ID } from "../../../constant";
import { NetworkID_MAP } from "../../../constant/network";
import {
  QA_SIGN_TRANSACTION,
  WALLET_CHECK_TX_STATUS,
} from "../../../constant/msgTypes";
import { sendMsg } from "../../../utils/commonMsg";
import { getLedgerStatus, requestSignDelegation } from "../../../utils/ledger";
import Toast from "../../component/Toast";
import FeeGroup from "../../component/FeeGroup";
import AdvanceMode from "../../component/AdvanceMode";

import useFetchAccountData from "@/hooks/useUpdateAccount";
import { DAppActions } from "@aurowallet/mina-provider";
import { ACCOUNT_TYPE, LEDGER_STATUS } from "../../../constant/commonType";
import { updateLedgerConnectStatus } from "../../../reducers/ledger";
import { updateNextTokenDetail } from "../../../reducers/cache";
import { LedgerInfoModal } from "../../component/LedgerInfoModal";

const StakingTransfer = () => {
  const dispatch = useDispatch();
  const history = useHistory();

  const currentAccount = useSelector(
    (state) => state.accountInfo.currentAccount
  );
  const mainTokenNetInfo = useSelector(
    (state) => state.accountInfo.mainTokenNetInfo
  );
  const netFeeList = useSelector((state) => state.cache.feeRecommend);
  const ledgerStatus = useSelector((state) => state.ledger.ledgerConnectStatus);
  const { fetchAccountData } = useFetchAccountData(currentAccount);

  const stakingList = useSelector((state) => state.staking.stakingList);
  const delegationKey = useSelector((state) => state.staking.delegationKey);
  const stakingAPY = useSelector((state) => state.staking.stakingAPY);
  const networkID = useSelector((state) => state.network.currentNode.networkID);

  const [routeParams] = useState(() => {
    let params = history.location?.params || {};
    return {
      menuAdd: !!params.menuAdd,
      nodeName: params.nodeName,
      nodeAddress: params.nodeAddress,
      icon: params.icon,
      isRedelegate: !!params.isRedelegate,
    };
  });

  const { menuAdd, nodeAddress, showNodeName, nodeIcon, isRedelegate, currentValidatorName, currentValidatorIcon, hasToValidator, isActiveValidator } = useMemo(() => {
    let menuAdd = routeParams.menuAdd;
    let nodeName = routeParams.nodeName;
    let nodeAddress = routeParams.nodeAddress;
    let nodeIcon = routeParams.icon;
    let isRedelegate = routeParams.isRedelegate;

    if (isRedelegate && !nodeAddress && !menuAdd && networkID === NetworkID_MAP.mainnet) {
      const defaultNode = stakingList.active[0];
      if (defaultNode) {
        nodeAddress = defaultNode.nodeAddress;
        nodeName = defaultNode.nodeName;
        nodeIcon = defaultNode.icon;
      }
    }

    let showNodeName = nodeName || (nodeAddress ? addressSlice(nodeAddress, 8) : "");
    let hasToValidator = !!nodeAddress;
    let isActiveValidator = nodeAddress ? stakingList.active.some(n => n.nodeAddress === nodeAddress) : false;
    
    if (nodeAddress && !nodeIcon) {
      const node = stakingList.active.find(n => n.nodeAddress === nodeAddress) || stakingList.inactive.find(n => n.nodeAddress === nodeAddress);
      if (node) {
        nodeIcon = node.icon;
        if (!nodeName) {
          showNodeName = node.nodeName || addressSlice(nodeAddress, 8);
        }
      }
    }

    let currentValidatorName = delegationKey ? addressSlice(delegationKey, 8) : i18n.t('currentValidator');
    let currentValidatorIcon = null;
    if (isRedelegate && delegationKey) {
      const currentNode = stakingList.active.find(n => n.nodeAddress === delegationKey) || stakingList.inactive.find(n => n.nodeAddress === delegationKey);
      if (currentNode) {
        currentValidatorName = currentNode.nodeName || addressSlice(delegationKey, 8);
        currentValidatorIcon = currentNode.icon;
      }
    }

    return {
      menuAdd,
      nodeAddress,
      showNodeName,
      nodeIcon,
      isRedelegate,
      currentValidatorName,
      currentValidatorIcon,
      hasToValidator,
      isActiveValidator,
    };
  }, [routeParams, stakingList, delegationKey, networkID]);

  const [blockAddress, setBlockAddress] = useState("");

  const [memo, setMemo] = useState("");
  const [feeAmount, setFeeAmount] = useState(() => {
    return netFeeList.length > 1 ? String(netFeeList[1].value) : "0.1";
  });
  const [advanceInputFee, setAdvanceInputFee] = useState("");
  const [feeErrorTip, setFeeErrorTip] = useState("");
  const [inputNonce, setInputNonce] = useState("");
  const [isOpenAdvance, setIsOpenAdvance] = useState(false);
  const [confirmModalStatus, setConfirmModalStatus] = useState(false);
  const [confirmBtnStatus, setConfirmBtnStatus] = useState(false);
  const [contentList, setContentList] = useState([]);

  const [waitLedgerStatus, setWaitLedgerStatus] = useState(false);
  const [btnDisableStatus, setBtnDisableStatus] = useState(() => {
    if (routeParams.menuAdd) {
      return true;
    }
    if (routeParams.isRedelegate && !routeParams.nodeAddress && !routeParams.menuAdd) {
      return true;
    }
    return false;
  });

  const [ledgerApp, setLedgerApp] = useState();

  const [ledgerModalStatus, setLedgerModalStatus] = useState(false);

  const onBlockAddressInput = useCallback((e) => {
    setBlockAddress(e.target.value);
  }, []);

  const onMemoInput = useCallback((e) => {
    setMemo(e.target.value);
  }, []);

  const onFeeInput = useCallback((e) => {
    setAdvanceInputFee(e.target.value);
    if (BigNumber(e.target.value).gt(10)) {
      setFeeErrorTip(i18n.t("feeTooHigh"));
    } else {
      setFeeErrorTip("");
    }
  }, []);

  const nextFee = useMemo(() => {
    if (isNumber(advanceInputFee) && advanceInputFee > 0) {
      return advanceInputFee;
    }
    return feeAmount;
  }, [advanceInputFee, feeAmount]);

  const onNonceInput = useCallback((e) => {
    setInputNonce(e.target.value);
  }, []);

  const onClickAdvance = useCallback(() => {
    setIsOpenAdvance(prev => {
      if (prev) {
        setAdvanceInputFee("");
        setFeeErrorTip("");
      }
      return !prev;
    });
  }, []);

  const onClickFeeGroup = useCallback((item) => {
    setFeeAmount(item.fee);
    setAdvanceInputFee("");
    setFeeErrorTip("");
  }, []);

  const onClickClose = useCallback(() => {
    setConfirmModalStatus(false);
  }, []);

  const onSubmitSuccess = useCallback(
    (data, type) => {
      if (data.error) {
        let errorMessage = i18n.t("postFailed");
        let realMsg = getRealErrorMsg(data.error);
        errorMessage = realMsg ? realMsg : errorMessage;
        Toast.info(errorMessage, 5 * 1000);
        return;
      }
      let detail =
        (data.sendDelegation && data.sendDelegation.delegation) || {};
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
      const tokenDetail = mainTokenNetInfo?.tokenId
        ? mainTokenNetInfo
        : {
            ...mainTokenNetInfo,
            tokenId: ZK_DEFAULT_TOKEN_ID,
            tokenBaseInfo: mainTokenNetInfo?.tokenBaseInfo || {
              isMainToken: true,
              decimals: MAIN_COIN_CONFIG.decimals,
              showBalance: "0",
              iconUrl: "img/mina_color.svg",
            },
          };
      dispatch(updateNextTokenDetail(tokenDetail));
      history.replace("/");
      history.push("/token_detail");
    },
    [history, dispatch, mainTokenNetInfo]
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
        const { signature, payload, error, rejected } =
          await requestSignDelegation(
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
        let postRes = await sendStakeTx(payload, {
          rawSignature: signature,
        }).catch((error) => error);
        onSubmitSuccess(postRes, "ledger");
      }
    },
    [currentAccount, onSubmitSuccess, ledgerApp]
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
      let fromAddress = currentAccount.address;
      let toAddress = nodeAddress || trimSpace(blockAddress);
      let nonce = trimSpace(inputNonce) || mainTokenNetInfo.inferredNonce;
      let realMemo = memo || "";
      let fee = trimSpace(String(nextFee));
      let payload = {
        fromAddress,
        toAddress,
        fee,
        nonce,
        memo: realMemo,
      };
      if (currentAccount.type === ACCOUNT_TYPE.WALLET_LEDGER) {
        return ledgerTransfer(payload, preLedgerApp);
      }
      setConfirmBtnStatus(true);
      payload.sendAction = DAppActions.mina_sendStakeDelegation;
      sendMsg(
        {
          action: QA_SIGN_TRANSACTION,
          payload,
        },
        (data) => {
          setConfirmBtnStatus(false);
          onSubmitSuccess(data);
        }
      );
    },
    [
      currentAccount,
      mainTokenNetInfo,
      nextFee,
      blockAddress,
      nodeAddress,
      memo,
      inputNonce,
      onSubmitSuccess,
      ledgerTransfer,
      ledgerStatus,
    ]
  );

  const onConfirm = useCallback(
    async (ledgerReady = false) => {
      let realBlockAddress = nodeAddress || blockAddress;
      if (!addressValid(realBlockAddress)) {
        Toast.info(i18n.t("sendAddressError"));
        return;
      }
      let inputFee = trimSpace(String(nextFee));
      if (inputFee.length > 0 && !isNumber(inputFee)) {
        Toast.info(i18n.t("inputFeeError"));
        return;
      }

      if (
        new BigNumber(inputFee).gt(mainTokenNetInfo.tokenBaseInfo.showBalance)
      ) {
        Toast.info(i18n.t("balanceNotEnough"));
        return;
      }
      let nonce = trimSpace(inputNonce);
      if (nonce.length > 0 && !isNaturalNumber(nonce)) {
        Toast.info(i18n.t("inputNonceError", { nonce: "Nonce" }));
        return;
      }

      let list = [
        {
          label: i18n.t("blockProducerAddress"),
          value: nodeAddress || blockAddress,
        },
        {
          label: i18n.t("from"),
          value: currentAccount.address,
        },
        {
          label: i18n.t("fee"),
          value: trimSpace(String(nextFee)) + " " + MAIN_COIN_CONFIG.symbol,
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
        let nextLedgerStatus = ledgerStatus;
        if (!ledgerReady) {
          const ledger = await getLedgerStatus();
          setLedgerApp(ledger.app);
          dispatch(updateLedgerConnectStatus(ledger.status));
          nextLedgerStatus = ledger.status;
        }
        setConfirmModalStatus(true);
      } else {
        dispatch(updateLedgerConnectStatus(""));
        setConfirmModalStatus(true);
      }
    },
    [
      nodeAddress,
      mainTokenNetInfo,
      nextFee,
      currentAccount,
      blockAddress,
      memo,
      inputNonce,
      ledgerStatus,
    ]
  );

  const onLedgerInfoModalConfirm = useCallback(
    (ledger) => {
      setLedgerApp(ledger.app);
      setLedgerModalStatus(false);
      onConfirm(true);
    },
    [onConfirm]
  );

  const onClickBlockProducer = useCallback(() => {
    history.replace({
      pathname: "/staking_list",
      params: {
        nodeAddress: nodeAddress,
        fromPage: "stakingTransfer",
        ...(isRedelegate ? { isRedelegate: true } : {}),
      },
    });
  }, [nodeAddress, isRedelegate]);

  useEffect(() => {
    if (feeAmount === "0.1") {
      if (netFeeList.length > 1) {
        setFeeAmount(String(netFeeList[1].value));
      }
    }
  }, [feeAmount, netFeeList]);

  useEffect(() => {
    fetchAccountData();
  }, []);

  useEffect(() => {
    if (menuAdd && trimSpace(blockAddress).length === 0) {
      setBtnDisableStatus(true);
    } else if (isRedelegate && !nodeAddress && !menuAdd) {
      setBtnDisableStatus(true);
    } else {
      setBtnDisableStatus(false);
    }
  }, [menuAdd, blockAddress, isRedelegate, nodeAddress]);

  const pageTitle = isRedelegate ? i18n.t("redelegate") : i18n.t("stake");

  return (
    <CustomView title={pageTitle} contentClassName={styles.container}>
      <div className={styles.contentContainer}>
        {!menuAdd && (
          <div className={styles.infoBanner}>
            <p className={styles.infoBannerText}>{i18n.t("stakeInfoBanner")}</p>
          </div>
        )}

        {menuAdd ? (
          <div>
            <div className={styles.inputContainer}>
              <Input
                label={i18n.t("blockProducer")}
                onChange={onBlockAddressInput}
                value={blockAddress}
                inputType={"text"}
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
                showFeeGroup={true}
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
                feePlaceholder={String(feeAmount)}
                onFeeInput={onFeeInput}
                feeErrorTip={feeErrorTip}
                nonceValue={inputNonce}
                onNonceInput={onNonceInput}
              />
            </div>
          </div>
        ) : isRedelegate ? (
          <div className={styles.validatorSection}>
            <p className={styles.validatorLabel}>{i18n.t("fromValidator")}</p>
            <div className={styles.validatorCard}>
              <ValidatorIcon icon={currentValidatorIcon} name={currentValidatorName} />
              <span className={styles.validatorName}>{currentValidatorName}</span>
            </div>

            <p className={styles.validatorLabel}>{i18n.t("toValidator")}</p>
            {hasToValidator ? (
              <ValidatorSelector
                showNodeName={showNodeName}
                nodeIcon={nodeIcon}
                onClickBlockProducer={onClickBlockProducer}
              />
            ) : (
              <ValidatorSelector
                showNodeName={i18n.t("selectValidator")}
                nodeIcon={null}
                showIcon={false}
                onClickBlockProducer={onClickBlockProducer}
              />
            )}
          </div>
        ) : (
          <div className={styles.validatorSection}>
            <p className={styles.validatorLabel}>{i18n.t("validator")}</p>
            <ValidatorSelector
              showNodeName={showNodeName}
              nodeIcon={nodeIcon}
              onClickBlockProducer={onClickBlockProducer}
            />

            <EarningsEstimate balanceTotal={mainTokenNetInfo?.balance?.total || "0"} decimals={mainTokenNetInfo?.tokenBaseInfo?.decimals || 9} stakingAPY={isActiveValidator ? stakingAPY : 0} />
          </div>
        )}
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
        highlightTitle={i18n.t("blockProducer")}
        highlightContent={showNodeName || addressSlice(blockAddress, 8)}
        onConfirm={clickNextStep}
        loadingStatus={confirmBtnStatus}
        onClickClose={onClickClose}
        contentList={contentList}
        waitingLedger={waitLedgerStatus}
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

const ValidatorSelector = ({ showNodeName, nodeIcon, onClickBlockProducer, showIcon = true }) => {
  return (
    <div className={styles.validatorSelectorCard} onClick={onClickBlockProducer}>
      <div className={styles.validatorSelectorInfo}>
        {showIcon && <ValidatorIcon icon={nodeIcon} name={showNodeName} />}
        <span className={styles.validatorSelectorName}>{showNodeName}</span>
      </div>
      <img className={styles.arrow} src="/img/icon_arrow.svg" />
    </div>
  );
};

const ValidatorIcon = ({ icon, name }) => {
  const [showHolder, setShowHolder] = useState(!icon);
  const holderName = useMemo(() => {
    return (name?.slice(0, 1) || "").toUpperCase();
  }, [name]);

  useEffect(() => {
    if (icon) setShowHolder(false);
  }, [icon]);

  const onLoadError = useCallback(() => {
    setShowHolder(true);
  }, []);

  return (
    <div className={styles.validatorIconWrapper}>
      {showHolder ? (
        <div className={styles.validatorIconHolder}>{holderName}</div>
      ) : (
        <img src={icon} className={styles.validatorIconImg} onError={onLoadError} />
      )}
    </div>
  );
};

const EPOCH_DAYS = 15;
const THREE_MONTHS_DAYS = 90;
const SIX_MONTHS_DAYS = 180;
const ESTIMATE_DECIMALS = 4;

const EarningsEstimate = ({ balanceTotal, decimals = 9, stakingAPY = 0 }) => {
  const balance = useMemo(() => {
    return new BigNumber(balanceTotal).dividedBy(new BigNumber(10).pow(decimals));
  }, [balanceTotal, decimals]);
  
  const estimates = useMemo(() => {
    if (!stakingAPY || balance.isZero() || balance.isNaN()) return { epoch: '--', threeMonths: '--', sixMonths: '--' };
    const dailyRate = new BigNumber(stakingAPY).dividedBy(100).dividedBy(365);
    
    return {
      epoch: balance.multipliedBy(dailyRate).multipliedBy(EPOCH_DAYS).toFixed(ESTIMATE_DECIMALS, BigNumber.ROUND_DOWN),
      threeMonths: balance.multipliedBy(dailyRate).multipliedBy(THREE_MONTHS_DAYS).toFixed(ESTIMATE_DECIMALS, BigNumber.ROUND_DOWN),
      sixMonths: balance.multipliedBy(dailyRate).multipliedBy(SIX_MONTHS_DAYS).toFixed(ESTIMATE_DECIMALS, BigNumber.ROUND_DOWN),
    };
  }, [balance, stakingAPY]);

  const formatValue = (val) => val === '--' ? '--' : `${val} ${MAIN_COIN_CONFIG.symbol}`;

  return (
    <div className={styles.earningsCard}>
      <div className={styles.earningsRow}>
        <span className={styles.earningsLabel}>{i18n.t("epochEstimate")}</span>
        <span className={styles.earningsValue}>{formatValue(estimates.epoch)}</span>
      </div>
      <div className={styles.earningsRow}>
        <span className={styles.earningsLabel}>{i18n.t("threeMonthsEstimate")}</span>
        <span className={styles.earningsValue}>{formatValue(estimates.threeMonths)}</span>
      </div>
      <div className={styles.earningsRow}>
        <span className={styles.earningsLabel}>{i18n.t("sixMonthsEstimate")}</span>
        <span className={styles.earningsValue}>{formatValue(estimates.sixMonths)}</span>
      </div>
    </div>
  );
};

export default StakingTransfer;
