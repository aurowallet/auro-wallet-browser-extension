import cls from "classnames";
import i18n from "i18next";
import { useCallback, useMemo, useState } from "react";
import { cointypes } from "../../../../config";
import { getTransactionList } from "../../../background/api";
import { SEC_DELETE_ACCOUNT } from "../../../constant/secTypes";
import {
  DAPP_DELETE_ACCOUNT_CONNECT_HIS,
  WALLET_CHANGE_ACCOUNT_NAME,
  WALLET_CHANGE_DELETE_ACCOUNT,
  WALLET_DELETE_WATCH_ACCOUNT,
} from "../../../constant/types";
import { ACCOUNT_TYPE } from "../../../constant/walletType";
import { updateCurrentAccount } from "../../../reducers/accountReducer";
import { sendMsg } from "../../../utils/commonMsg";
import { JSonToCSV } from "../../../utils/JsonToCSV";
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
    });
    setPopupModalStatus(true);
  }, [i18n]);

  const showPrivateKey = useCallback(() => {
    history.push({
      pathname: "show_privatekey_page",
      params: { address: account.address },
    });
  }, []);

  const exportCsvTransactions = useCallback(async () => {
    Loading.show();
    const { txList } = await getTransactionList(account.address, null);
    Loading.hide();
    const csvList = txList.map((tx) => {
      return {
        date: tx.time.replace(/T/, " ").replace(/Z/, " UTC"),
        amount: amountDecimals(tx.amount, cointypes.decimals),
        sender: tx.sender,
        receiver: tx.receiver,
        memo: tx.memo ? tx.memo : "",
        fee: amountDecimals(tx.fee, cointypes.decimals),
        nonce: tx.nonce,
        type: tx.type,
        hash: tx.hash,
        status: tx.status,
      };
    });
    JSonToCSV.setDataConver({
      data: csvList,
      fileName: account.address,
      columns: {
        title: [
          "Date",
          "Amount",
          "Sender",
          "Receiver",
          "Memo",
          "Fee",
          "Nonce",
          "Type",
          "TxHash",
          "Status",
        ],
        key: [
          "date",
          "amount",
          "sender",
          "receiver",
          "memo",
          "fee",
          "nonce",
          "type",
          "hash",
          "status",
        ],
      },
    });
  }, [account]);

  const deleteAccount = useCallback(() => {
    if (account.type === ACCOUNT_TYPE.WALLET_WATCH) {
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
                Toast.info(i18n.t("incorrectSecurityPassword"));
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

  if (showSecurity) {
    return (
      <SecurityPwd onClickCheck={onClickCheck} action={SEC_DELETE_ACCOUNT} />
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
          {isLedger && (
            <AccountInfoRow
              title={i18n.t("hdDerivedPath")}
              desc={hdPath}
              noArrow={true}
            />
          )}
          <AccountInfoRow
            title={i18n.t("accountName")}
            desc={account.accountName}
            onClick={onClickAccountName}
          />
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
                {i18n.t("delete")}
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
        modalVisable={popupModalStatus}
        onCloseModal={onCloseModal}
        inputPlaceholder={currentModal?.inputPlaceholder}
        bottomTipClass={styles.waringTip}
        onInputChange={currentModal?.onInputChange}
        maxInputLength={currentModal?.maxInputLength}
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
