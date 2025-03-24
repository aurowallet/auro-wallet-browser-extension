import cls from "classnames";
import i18n from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Trans } from "react-i18next";
import { useDispatch } from "react-redux";
import { LEDGER_PAGE_TYPE } from "../../../constant/commonType";
import {
  ACCOUNT_ACTIONS,
    GET_LEDGER_ACCOUNT_NUMBER,
    GET_WALLET_LOCK_STATUS,
    WALLET_IMPORT_LEDGER
} from "../../../constant/msgTypes";
import { updateCurrentAccount } from "../../../reducers/accountReducer";
import { openTab, sendMsg } from "../../../utils/commonMsg";
import {
    checkLedgerConnect,
    LEDGER_CONNECT_TYPE,
    requestAccount
} from "../../../utils/ledger";
import { getQueryStringArgs } from "../../../utils/utils";
import Button from "../../component/Button";
import Input from "../../component/Input";
import Tabs, { TAB_TYPE } from "../../component/Tabs";
import styles from "./index.module.scss";
import { LedgerModal } from "./LedgerModal";

const Tip_Type = {
  init: "init",
  openLedger: "openLedger",
  openLedgerApp: "openLedgerApp",
  openLockStatus: "openLockStatus",

  grantSuccess:"grantSuccess"
};
export const LedgerPage = ({}) => { 
  const [tabIndex, setTabIndex] = useState(0);
  const [tipType, setTipType] = useState(Tip_Type.init);
  const [isShowSuccessTip,setIsShowSuccessTip] = useState(false)

  const {isLedgerPermission} = useMemo(() => {
    const url = window.location?.href || ""
    const params = getQueryStringArgs(url)
    const ledgerPageType = params.ledgerPageType||""
    const isLedgerPermission = ledgerPageType === LEDGER_PAGE_TYPE.permissionGrant
    return {
      isLedgerPermission
    }
  },[])
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

  const onClickConnect = useCallback(async (permissionsCheck = true) => {
    if(isShowSuccessTip){
      window.close();
      return 
    }
    setTipType(Tip_Type.init);
    const walletLockStatus = await getWalletLockStatus();
    if (!walletLockStatus) {
      setTipType(Tip_Type.openLockStatus);
      return false;
    }
    try {
      const {
        ledgerApp,
        manualConnected,
        error,
        openApp,
      } = await checkLedgerConnect(
        LEDGER_CONNECT_TYPE.isPage,
        permissionsCheck
      );
      if (error) {
        setTipType(Tip_Type.openLedger);
        return false;
      }
      if (ledgerApp) {
        const result = await ledgerApp.getAppName();
        if (result.name === "Mina") {
          if (permissionsCheck && !isLedgerPermission) {
            onClickNextTab();
          }
          if(isLedgerPermission){
            setIsShowSuccessTip(true)
            setTipType(Tip_Type.grantSuccess);
          }
          return ledgerApp;
        } else {
          setTipType(Tip_Type.openLedgerApp);
          return false;
        }
      }
      if (openApp) {
        setTipType(Tip_Type.openLedgerApp);
        return false;
      }

      if (manualConnected) {
        setTipType(Tip_Type.openLedger);
      }
      return false;
    } catch (error) {
      setTipType(Tip_Type.openLedger);
    }
  }, [isShowSuccessTip,isLedgerPermission]);
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
        <Tabs selected={tabIndex} tabType={TAB_TYPE.STEP}>
          <div className={styles.innerContent} id={1}>
            <LedgerConnectView
              isLedgerPermission={isLedgerPermission}
              onClickNext={onClickConnect}
              tipContent={tipContent}
              isShowSuccessTip={isShowSuccessTip}
            />
          </div>
          {!isLedgerPermission &&
          <div className={styles.innerContent} id={2}>
            <AccountNameView
              onClickNext={onClickImport}
              tipContent={tipContent}
              onClickConnect={onClickConnect}
            />
          </div>}
          {!isLedgerPermission &&
          <div className={styles.innerContent} id={3}>
            <SuccessView onClickNext={onClickDone} />
          </div>}
        </Tabs>
      </div>
    </div>
  );
};

const LedgerConnectView = ({ onClickNext, tipContent,isShowSuccessTip,isLedgerPermission }) => {
  const viewTitle = useMemo(()=>{
      const title = isLedgerPermission ?"grantLedger":"connectHardwareWallet"
      return i18n.t(title)
  },[isLedgerPermission,i18n])
  const btnTxt = useMemo(()=>{
    const txt = isShowSuccessTip ?"done":"next"
    return i18n.t(txt)
  },[isShowSuccessTip,i18n])
  return (
    <div className={styles.viewOuter}>
      <div className={styles.viewTitle}>{viewTitle}</div>
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
      <div className={cls(styles.bottomContainer)}>
        {tipContent && ( 
          <div className={cls(styles.accountWarningTip,{
            [styles.ledgerSuccessTip]:isShowSuccessTip
          })}>{tipContent}</div>
        )}
        <Button onClick={onClickNext}>{btnTxt}</Button>
      </div>
    </div>
  );
};
const AccountNameView = ({ onClickNext, tipContent, onClickConnect }) => {
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

  const [accountIndex, setAccountIndex] = useState(0);
  const placeholderText = useMemo(() => {
    return "Ledger " + nextAccountIndex;
  }, [accountIndex, nextAccountIndex]);
  const [accountName, setAccountName] = useState("");

  const [tipModalVisible, setTipModalVisible] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  useEffect(() => {
    setErrorMsg(tipContent);
  }, [tipContent]);

  const dispatch = useDispatch();

  const onConfirm = useCallback(async () => {
    const ledgerApp = await onClickConnect(false);
    if (typeof ledgerApp === "boolean") {
      return;
    }
    setTipModalVisible(true);
    if (ledgerApp) {
      const { publicKey, rejected } = await requestAccount(
        ledgerApp,
        accountIndex
      );
      setTipModalVisible(false);
      if (rejected) {
        setErrorMsg(i18n.t("ledgerRejected"));
      } else {
        sendMsg(
          {
            payload: {
              address: publicKey,
              accountIndex: accountIndex,
              accountName: accountName || placeholderText,
            },
            action: WALLET_IMPORT_LEDGER,
          },
          (account) => {
            if (account.error) {
              if (account.type === "local") {
                setErrorMsg(i18n.t(account.error));
              } else {
                setErrorMsg(account.error);
              }
            } else {
              dispatch(updateCurrentAccount(account));
              sendMsg({ action: ACCOUNT_ACTIONS.REFRESH_CURRENT_ACCOUNT,payload:account.address }); 
              onClickNext && onClickNext();
            }
          }
        );
      }
    }
  }, [onClickNext, accountIndex, placeholderText,accountName]);
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
    setAccountIndex(accountIndex + 1);
  }, [accountIndex]);
  const onMinus = useCallback(() => {
    if (accountIndex <= 0) {
      return;
    }
    setAccountIndex(accountIndex - 1);
  }, [accountIndex]);
  return (
    <div className={styles.viewOuter}>
      <div className={styles.viewTitle}>{i18n.t("accountName")}</div>
      <div className={styles.viewTip}>{i18n.t("inputAccountName")}</div>
      <div className={styles.inputContainer}>
        <Input
          onChange={onNameInput}
          value={accountName}
          inputType={"text"}
          placeholder={placeholderText}
        />
      </div>
      <div className={styles.viewTip}>{i18n.t("selectHDPath")}</div>
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
      <div className={cls(styles.bottomContainer)}>
        {errorMsg && <div className={styles.accountWarningTip}>{errorMsg}</div>}
        <Button onClick={onConfirm}>{i18n.t("import")}</Button>
      </div>
      <LedgerModal modalVisible={tipModalVisible} />
    </div>
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

const SuccessView = ({ onClickNext }) => {
  return (
    <div className={cls(styles.viewOuter, styles.innerContent)}>
      <img src="/img/backup_success.svg" />
      <p className={styles.importSuccess}>{i18n.t("success")}</p>
      <p className={styles.importContent}>{i18n.t("ledgerSuccess")}</p>
      <p className={styles.importContent}>{i18n.t("returnEx")}</p>
      <div className={cls(styles.bottomContainer)}>
        <Button onClick={onClickNext}>{i18n.t("done")}</Button>
      </div>
    </div>
  );
};
