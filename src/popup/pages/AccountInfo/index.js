import cls from "classnames";
import i18n from "i18next";
import { useCallback, useMemo, useState } from "react";
import {
  DAPP_DELETE_ACCOUNT_CONNECT_HIS,
  WALLET_CHANGE_ACCOUNT_NAME,
  WALLET_CHANGE_DELETE_ACCOUNT,
  WALLET_DELETE_WATCH_ACCOUNT,
} from "../../../constant/msgTypes";
import { ACCOUNT_TYPE, SEC_FROM_TYPE } from "../../../constant/commonType";
import { updateCurrentAccount } from "../../../reducers/accountReducer";
import { sendMsg } from "../../../utils/commonMsg";
import {
  amountDecimals,
  copyText,
  nameLengthCheck,
} from "../../../utils/utils";
import Loading from "../../component/Loading";
import SecurityPwd from "../../component/SecurityPwd";
import Toast from "../../component/Toast";

import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import CustomView from "../../component/CustomView";
import { PopupModal, PopupModal_type } from "../../component/PopupModal";
import styles from "./index.module.scss";

const AccountInfo = ({}) => {
  const cache = useSelector((state) => state.cache);
  const currentAccount = useSelector(
    (state) => state.accountInfo.currentAccount
  );

  const dispatch = useDispatch();
  const history = useHistory();
  const [account, setAccount] = useState(cache.accountInfo);
  const [popupModalStatus, setPopupModalStatus] = useState(false);

  const [currentModal, setCurrentModal] = useState({});
  const [showSecurity, setShowSecurity] = useState(false);
  const [resetModalBtnStatus,setResetModalBtnStatus] = useState(true)

  const onCloseModal = useCallback(() => {
    setPopupModalStatus(false);
  }, []);

  const onConfirmChange = useCallback(
    (data) => {
      let checkResult = nameLengthCheck(data.inputValue);
      if (checkResult) {
        sendMsg(
          {
            action: WALLET_CHANGE_ACCOUNT_NAME,
            payload: {
              address: account.address,
              accountName: data.inputValue.trim(),
            },
          },
          (account) => {
            setAccount(account.account);

            let address = currentAccount.address;
            if (account.account?.address === address) {
              dispatch(updateCurrentAccount(account.account));
            }
            setPopupModalStatus(false);
          }
        );
      } else {
      }
    },
    [account, currentAccount, i18n]
  );

  const onClickAccountName = useCallback(() => {
    setCurrentModal({
      title: i18n.t("changeAccountName"),
      leftBtnContent: i18n.t("cancel"),
      rightBtnContent: i18n.t("confirm"),
      type: PopupModal_type.input,
      onLeftBtnClick: onCloseModal,
      onRightBtnClick: onConfirmChange,
      content: "",
      inputPlaceholder: i18n.t("accountNameLimit"),
      maxInputLength: 16,
      rightBtnStyle:""
    });
    setPopupModalStatus(true);
  }, [i18n]);

  const showPrivateKey = useCallback(() => {
    history.push({
      pathname: "show_privatekey_page",
      params: { address: account.address },
    });
  }, []);

  const onConfirmDeleteLedger = useCallback(()=>{
    setPopupModalStatus(false);
    Loading.show();
    sendMsg(
      {
        action: WALLET_DELETE_WATCH_ACCOUNT,
        payload: {
          address: account.address,
        },
      },
      async (currentAccount) => {
        Loading.hide();
        if (currentAccount.error) {
          if (currentAccount.type === "local") {
            Toast.info(i18n.t(currentAccount.error));
          } else {
            Toast.info(currentAccount.error);
          }
        } else {
          dispatch(updateCurrentAccount(currentAccount));

          setTimeout(() => {
            history.goBack();
          }, 300);
        }
      }
    );
  },[account])
  const onClickDeleteLedger = useCallback(()=>{
    setResetModalBtnStatus(false)
    setCurrentModal({
      title: i18n.t('deleteAccount'),
      leftBtnContent: i18n.t("cancel"), 
      rightBtnContent: i18n.t("deleteTag"),
      type: PopupModal_type.common,
      onLeftBtnClick: onCloseModal,
      onRightBtnClick: onConfirmDeleteLedger,
      content: "",
      rightBtnStyle:styles.modalDelete
    });
    setPopupModalStatus(true);
  },[i18n])
  const deleteAccount = useCallback(() => {
    if (account.type === ACCOUNT_TYPE.WALLET_WATCH||account.type === ACCOUNT_TYPE.WALLET_LEDGER) {
      onClickDeleteLedger()
    } else {
      setShowSecurity(true);
    }
  }, [account]);

  const { hideDelete, isLedger, hideExport, hdPath } = useMemo(() => {
    const hideDelete = account.type === ACCOUNT_TYPE.WALLET_INSIDE;
    let isLedger = account.type === ACCOUNT_TYPE.WALLET_LEDGER;
    let hdPath = isLedger
      ? `m / 44' / 12586' / ${account.hdPath} ' / 0 / 0`
      : "";
    let hideExport = account.type === ACCOUNT_TYPE.WALLET_WATCH || isLedger;

    return {
      hideDelete,
      isLedger,
      hideExport,
      hdPath,
    };
  }, [account]);

  const onCopyAddress = useCallback(() => {
    copyText(account.address).then(() => {
      Toast.info(i18n.t("copySuccess"));
    });
  }, [account]);

  const onClickCheck = useCallback(
    (password) => {
      let address = currentAccount.address;
      sendMsg(
        {
          action: WALLET_CHANGE_DELETE_ACCOUNT,
          payload: {
            address: account.address,
            password: password,
          },
        },
        async (currentAccount) => {
          if (currentAccount.error) {
            if (currentAccount.type === "local") {
              if (currentAccount.error === "passwordError") {
                Toast.info(i18n.t("passwordError"));
              } else {
                Toast.info(i18n.t(currentAccount.error));
              }
            } else {
              Toast.info(currentAccount.error);
            }
          } else {
            sendMsg(
              {
                action: DAPP_DELETE_ACCOUNT_CONNECT_HIS,
                payload: {
                  address: account.address,
                  oldCurrentAddress: address,
                  currentAddress: currentAccount.address,
                },
              },
              (status) => {}
            );
            dispatch(updateCurrentAccount(currentAccount));
            history.goBack();
          }
        }
      );
    },
    [currentAccount, account, i18n]
  );

  const onResetModalInput = useCallback((e)=>{
    let checkStatus = e.target.value.length > 0 
    if (checkStatus) {
        setResetModalBtnStatus(false)
    }else{
        setResetModalBtnStatus(true)
    }
  },[i18n])

  if (showSecurity) {
    return (
      <SecurityPwd onClickCheck={onClickCheck} action={SEC_FROM_TYPE.SEC_DELETE_ACCOUNT} btnTxt={i18n.t("confirm")}/>
    );
  }
  return (
    <CustomView
      title={i18n.t("accountDetails")}
      contentClassName={styles.container}
    >
      <div className={styles.contentContainer}>
        <div className={styles.rowAddress} onClick={onCopyAddress}>
          <p className={styles.rowAddressTitle}>{i18n.t("accountAddress")}</p>
          <span className={styles.rowAddressContent}>{account.address}</span>
        </div>
        <div className={styles.rowInfoContainer}>
          <AccountInfoRow
            title={i18n.t("accountName")}
            desc={account.accountName}
            onClick={onClickAccountName}
          />
           {isLedger && (
            <AccountInfoRow
              title={i18n.t("hdDerivedPath")}
              desc={hdPath}
              noArrow={true}
            />
          )}
          {!hideExport && (
            <AccountInfoRow
              title={i18n.t("exportPrivateKey")}
              onClick={showPrivateKey}
            />
          )}
        </div>
        {!hideDelete && (
          <>
            <div className={styles.dividedLine} />
            <div className={styles.deleteRow}>
              <p
                className={cls(styles.rowTitle, styles.deleteTitle)}
                onClick={deleteAccount}
              >
                {i18n.t("deleteTag")} 
              </p>
            </div>
          </>
        )}
      </div>

      <PopupModal
        title={currentModal.title}
        leftBtnContent={currentModal.leftBtnContent}
        rightBtnContent={currentModal.rightBtnContent}
        rightBtnStyle={currentModal.rightBtnStyle || ""}
        type={currentModal.type}
        onLeftBtnClick={currentModal.onLeftBtnClick}
        onRightBtnClick={currentModal.onRightBtnClick}
        content={currentModal.content}
        modalVisible={popupModalStatus}
        onCloseModal={onCloseModal}
        inputPlaceholder={currentModal?.inputPlaceholder}
        bottomTipClass={styles.waringTip}
        maxInputLength={currentModal?.maxInputLength}
        onInputChange={onResetModalInput}
        rightBtnDisable={resetModalBtnStatus}
      />
    </CustomView>
  );
};

const AccountInfoRow = ({
  title = "",
  desc = "",
  onClick = () => {},
  noArrow = false,
}) => {
  return (
    <div
      className={cls(styles.rowContainer, {
        [styles.clickRow]: !noArrow,
      })}
      onClick={onClick}
    >
      <div>
        <p className={styles.rowTitle}>{title}</p>
        {desc && <p className={styles.rowDesc}>{desc}</p>}
      </div>
      {!noArrow && (
        <div>
          <img src="/img/icon_arrow.svg" />
        </div>
      )}
    </div>
  );
};
export default AccountInfo;
