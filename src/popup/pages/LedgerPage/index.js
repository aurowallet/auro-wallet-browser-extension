import cls from "classnames";
import i18n from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Trans } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { LEDGER_PAGE_TYPE, LEDGER_STATUS } from "../../../constant/commonType";
import {
  ACCOUNT_ACTIONS,
  DAPP_CHANGE_CONNECTING_ADDRESS,
  GET_LEDGER_ACCOUNT_NUMBER,
  GET_WALLET_LOCK_STATUS,
  WALLET_IMPORT_LEDGER,
} from "../../../constant/msgTypes";
import { updateCurrentAccount } from "../../../reducers/accountReducer";
import { openTab, sendMsg } from "../../../utils/commonMsg";
import ledgerManager from "../../../utils/ledger";
import { getQueryStringArgs } from "../../../utils/utils";
import Button from "../../component/Button";
import Input from "../../component/Input";
import ProcessLayout from "../../component/ProcessLayout";
import StepTabs from "../../component/StepTabs";
import { CreateResultView } from "../CreateProcessPage/CreateResultView";
import styles from "./index.module.scss";
import { LedgerModal } from "./LedgerModal";

const Tip_Type = {
  init: "init",
  openLedger: "openLedger",
  openLedgerApp: "openLedgerApp",
  openLockStatus: "openLockStatus",

  grantSuccess: "grantSuccess",
};
export const LedgerPage = ({ onClickPre }) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [tipType, setTipType] = useState(Tip_Type.init);
  const [isShowSuccessTip, setIsShowSuccessTip] = useState(false);

  const { isLedgerPermission } = useMemo(() => {
    const url = window.location?.href || "";
    const params = getQueryStringArgs(url);
    const ledgerPageType = params.ledgerPageType || "";
    const isLedgerPermission =
      ledgerPageType === LEDGER_PAGE_TYPE.permissionGrant;
    return {
      isLedgerPermission,
    };
  }, []);
  const onClickNextTab = useCallback(() => {
    setTabIndex((state) => state + 1);
  }, []);

  const getWalletLockStatus = useCallback(() => {
    return new Promise((resolve) => {
      sendMsg(
        {
          action: GET_WALLET_LOCK_STATUS,
        },
        (lockStatus) => {
          resolve(lockStatus);
        }
      );
    });
  }, []);

  const onClickConnect = useCallback(() => {
    if (isShowSuccessTip) {
      window.close();
      return;
    }
    setTipType(Tip_Type.init);
    getWalletLockStatus().then((ok) => {
      if (!ok) {
        setTipType(Tip_Type.openLockStatus);
        return;
      }

      ledgerManager.requestConnect().then(({ status }) => {
        if (status === LEDGER_STATUS.READY) {
          if (!isLedgerPermission) onClickNextTab();
          if (isLedgerPermission) {
            setIsShowSuccessTip(true);
            setTipType(Tip_Type.grantSuccess);
          }
        } else if (status === LEDGER_STATUS.LEDGER_CONNECT_APP_NOT_OPEN) {
          setTipType(Tip_Type.openLedgerApp);
        } else {
          setTipType(Tip_Type.openLedger);
        }
      });
    });
  }, [isShowSuccessTip, isLedgerPermission, onClickNextTab]);
  const onClickImport = useCallback(() => {
    onClickNextTab();
  }, []);
  const onClickDone = useCallback(() => {
    window.close();
  }, []);
  const tipContent = useMemo(() => {
    let msg = "";
    switch (tipType) {
      case Tip_Type.openLedger:
        msg = i18n.t("ledgerConnectTip");
        break;
      case Tip_Type.openLedgerApp:
        msg = i18n.t("ledgerConnectOpenTip");
        break;
      case Tip_Type.openLockStatus:
        msg = i18n.t("auroLocked");
        break;
      case Tip_Type.grantSuccess:
        msg = i18n.t("grantSuccess");
        break;
      default:
        break;
    }
    return msg;
  }, [tipType, i18n]);
 
  return (
    <div className={styles.outerContainer}>
      <div className={styles.innerContainer}>
        <StepTabs selected={tabIndex}>
          <div className={styles.innerContent} id={1}>
            <LedgerConnectView
              isLedgerPermission={isLedgerPermission}
              onClickNext={onClickConnect}
              onClickPre={onClickPre}
              tipContent={tipContent}
              isShowSuccessTip={isShowSuccessTip}
            />
          </div>
          {!isLedgerPermission && (
            <div className={styles.innerContent} id={2}>
              <AccountNameView
                onClickNext={onClickImport}
                onClickPre={onClickPre}
                tipContent={tipContent}
                onClickConnect={onClickConnect}
              />
            </div>
          )}
          {!isLedgerPermission && (
            <div className={styles.innerContent} id={3}>
              <CreateResultView
                onClickDone={onClickDone}
                contents={[i18n.t("ledgerSuccess"), i18n.t("returnEx")]}
                showFollowUs={false}
                showExtTip={false}
              />
            </div>
          )}
        </StepTabs>
      </div>
    </div>
  );
};

const LedgerConnectView = ({
  onClickNext,
  onClickPre,
  tipContent,
  isShowSuccessTip,
  isLedgerPermission,
}) => {
  const viewTitle = useMemo(() => {
    const title = isLedgerPermission ? "grantLedger" : "connectHardwareWallet";
    return i18n.t(title);
  }, [isLedgerPermission, i18n]);
  const btnTxt = useMemo(() => {
    const txt = isShowSuccessTip ? "done" : "next";
    return i18n.t(txt);
  }, [isShowSuccessTip, i18n]);
  return (
    <ProcessLayout
      onClickBack={onClickPre}
      title={viewTitle}
      bottomContent={
        <>
          {tipContent && (
            <div
              className={cls(styles.accountWarningTip, {
                [styles.ledgerSuccessTip]: isShowSuccessTip,
              })}
            >
              {tipContent}
            </div>
          )}
          <Button onClick={onClickNext}>{btnTxt}</Button>
        </>
      }
    >
      <div className={styles.viewTip}>{i18n.t("selectHardware")}</div>
      <img src="/img/ledgerBorderLogo.svg" className={styles.ledgerIcon} />
      <div className={styles.viewTip}>{i18n.t("getStarted")}</div>
      <div className={styles.startDesc}>{i18n.t("ledgerStartDesc")}</div>

      <div className={styles.stepContainer}>
        <span className={styles.stepNumber}>1</span>
        <span className={styles.stepContent}>{i18n.t("ledgerConnect_1")}</span>
      </div>
      <div className={styles.stepContainer}>
        <span className={styles.stepNumber}>2</span>
        <span className={styles.stepContent}>
          <Trans
            i18nKey={"ledgerConnect_2"}
            components={{
              b: <span className={styles.stepContentLight} />,
            }}
          />
        </span>
      </div>
    </ProcessLayout>
  );
};
const AccountNameView = ({
  onClickNext,
  onClickPre,
  tipContent,
  onClickConnect,
}) => {
  const currentAddress = useSelector(
    (state) => state.accountInfo.currentAccount.address
  );

  const [nextAccountIndex, setNextAccountIndex] = useState(0);
  const getLedgerAccountNumber = useCallback(() => {
    sendMsg(
      {
        action: GET_LEDGER_ACCOUNT_NUMBER,
      },
      (count) => {
        setNextAccountIndex(count + 1);
      }
    );
  }, []);
  useEffect(() => {
    getLedgerAccountNumber();
  }, []);

  const [accountIndex, setAccountIndex] = useState("");
  const placeholderText = useMemo(() => {
    return "Ledger " + nextAccountIndex;
  }, [nextAccountIndex]);
  const [accountName, setAccountName] = useState("");

  const [tipModalVisible, setTipModalVisible] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  useEffect(() => {
    setErrorMsg(tipContent);
  }, [tipContent]);

  const dispatch = useDispatch();

  const onConfirm = useCallback(async () => {
    let nextIndex = accountIndex;
    if (nextIndex <= 0) {
      nextIndex = 0;
    }
    const { status } = await ledgerManager.ensureConnect();

    if (status !== LEDGER_STATUS.READY) {
      setErrorMsg(i18n.t("pleaseOpenInLedger"));
      return;
    }
    setTipModalVisible(true);
    try {
      const { publicKey, rejected } = await ledgerManager.getAddress(nextIndex);
      setTipModalVisible(false);
      if (rejected || !publicKey) {
        setErrorMsg(
          rejected ? i18n.t("ledgerRejected") : "Failed to get address"
        );
        return;
      }
      sendMsg(
        {
          action: WALLET_IMPORT_LEDGER,
          payload: {
            address: publicKey,
            accountIndex: nextIndex,
            accountName: accountName || placeholderText,
          },
        },
        (res) => {
          if (res.error) {
            if (res.error) {
              if (res.type === "local") {
                setErrorMsg(i18n.t(res.error));
              } else {
                setErrorMsg(res.error);
              }
            }
          } else {
            sendMsg(
              {
                action: DAPP_CHANGE_CONNECTING_ADDRESS,
                payload: {
                  address: currentAddress,
                  currentAddress: res.address,
                },
              },
              (status) => {}
            );
            dispatch(updateCurrentAccount(res));
            sendMsg({
              action: ACCOUNT_ACTIONS.REFRESH_CURRENT_ACCOUNT,
              payload: res.address,
            });
            onClickNext && onClickNext();
          }
        }
      );
    } catch (err) {
      setErrorMsg("Connection lost", err);
    }
  }, [accountIndex, accountName, placeholderText, onClickNext, currentAddress]);
  const onNameInput = useCallback((e) => {
    let value = e.target.value;
    if (value.length <= 16) {
      setAccountName(e.target.value);
    }
  }, []);

  const onAccountIndexChange = useCallback((e) => {
    let value = e.target.value;
    value = value.replace(/[^\d]/g, "");
    let accountIndex = parseFloat(value);
    if (accountIndex < 0 || !value) {
      accountIndex = 0;
    }
    setAccountIndex(accountIndex);
  }, []);

  const onAdd = useCallback(() => {
    let nextIndex = accountIndex;
    if (nextIndex <= 0) {
      nextIndex = 0;
    }
    setAccountIndex(nextIndex + 1);
  }, [accountIndex]);
  const onMinus = useCallback(() => {
    if (accountIndex <= 0) {
      setAccountIndex(0);
      return;
    }
    setAccountIndex(accountIndex - 1);
  }, [accountIndex]);
  return (
    <ProcessLayout
      onClickBack={onClickPre}
      title={i18n.t("accountName")}
      bottomContent={
        <>
          {errorMsg && <div className={styles.accountWarningTip}>{errorMsg}</div>}
          <Button onClick={onConfirm}>{i18n.t("import")}</Button>
        </>
      }
    >
      <div className={styles.viewTip}>{i18n.t("inputAccountName")}</div>
      <div className={styles.inputContainer}>
        <Input
          onChange={onNameInput}
          value={accountName}
          inputType={"text"}
          placeholder={placeholderText}
        />
      </div>
      <div className={styles.viewTip} style={{ marginTop: "20px" }}>{i18n.t("selectHDPath")}</div>
      <div className={styles.accountNameTip}>
        <Trans
          i18nKey={"ledgerSelectPathTip"}
          components={{
            click: (
              <span
                className={styles.clickIntro}
                onClick={() =>
                  openTab(
                    "https://www.ledger.com/academy/crypto/what-are-hierarchical-deterministic-hd-wallets"
                  )
                }
              />
            ),
          }}
        />
      </div>
      <LedgerAdvance
        value={accountIndex}
        onChange={onAccountIndexChange}
        onAdd={onAdd}
        onMinus={onMinus}
      />
      <LedgerModal modalVisible={tipModalVisible} />
    </ProcessLayout>
  );
};

const LedgerAdvance = ({
  value,
  onChange = () => {},
  onAdd = () => {},
  onMinus = () => {},
}) => {
  return (
    <div className={styles.ledgerContainer}>
      <div className={styles.ledgerPath}>
        m / 44' / 12586' /
        <InputNumber
          value={value}
          onChange={onChange}
          onAdd={onAdd}
          onMinus={onMinus}
        />
        ' / 0 / 0
      </div>
    </div>
  );
};
const InputNumber = ({
  value,
  onChange = () => {},
  onAdd = () => {},
  onMinus = () => {},
}) => {
  return (
    <div className={styles.inputNumberContainer}>
      <input
        type="number"
        min="0"
        step="1"
        onChange={onChange}
        value={value}
        placeholder="0"
        className={styles.customInput}
      />
      <div className={styles.imgContainer}>
        <img
          src="/img/icon_fold_Default.svg"
          className={styles.topArrow}
          onClick={onAdd}
        />
        <img
          src="/img/icon_fold_Default.svg"
          className={styles.bottomArrow}
          onClick={onMinus}
        />
      </div>
    </div>
  );
};

