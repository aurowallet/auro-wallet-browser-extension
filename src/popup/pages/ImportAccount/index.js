import i18n from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import {
  DAPP_CHANGE_CONNECTING_ADDRESS,
  WALLET_IMPORT_HD_ACCOUNT,
} from "../../../constant/msgTypes";
import { updateCurrentAccount } from "../../../reducers/accountReducer";
import { sendMsg } from "../../../utils/commonMsg";
import Button from "../../component/Button";
import CustomView from "../../component/CustomView";
import TextArea from "../../component/TextArea";
import Toast from "../../component/Toast";
import styles from "./index.module.scss";

const ImportAccount = ({}) => {
  const currentAddress = useSelector(
    (state) => state.accountInfo.currentAccount.address
  );

  const [inputValue, setInputValue] = useState("");
  const [btnStatus, setBtnStatus] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const dispatch = useDispatch();
  const accountName = useMemo(() => {
    return location?.state?.accountName ?? "";
  }, [location]);

  const onInput = useCallback((e) => {
    let privateKey = e.target.value;
    setInputValue(privateKey);
  }, []);
  useEffect(() => {
    if (inputValue.length > 0) {
      setBtnStatus(true);
    } else {
      setBtnStatus(false);
    }
  }, [inputValue]);
  const onConfirm = useCallback(() => {
    setLoading(true);

    sendMsg(
      {
        action: WALLET_IMPORT_HD_ACCOUNT,
        payload: {
          privateKey: inputValue.replace(/[\r\n]/g, ""),
          accountName: accountName,
        },
      },
      (account) => {
        setLoading(false);
        if (account.error) {
          if (account.type === "local") {
            Toast.info(i18n.t(account.error));
          } else {
            Toast.info(account.error);
          }
          return;
        } else {
          sendMsg(
            {
              action: DAPP_CHANGE_CONNECTING_ADDRESS,
              payload: {
                address: currentAddress,
                currentAddress: account.address,
              },
            },
            (status) => {}
          );
          dispatch(updateCurrentAccount(account));
          setTimeout(() => {
            if (window.history.length >= 5) {
              navigate(-4);
            } else {
              navigate("/");
            }
          }, 50);
        }
      }
    );
  }, [inputValue, accountName, history, currentAddress]);
  return (
    <CustomView title={i18n.t("importPrivateKey")}>
      <p className={styles.title}>{i18n.t("pleaseInputPriKey")}</p>

      <div className={styles.imTextAreaContainer}>
        <TextArea onChange={onInput} value={inputValue} />
      </div>
      <span className={styles.desc}>{i18n.t("importAccount_3")}</span>
      <span className={styles.desc}>{i18n.t("importAccount_2")}</span>

      <div className={styles.hold} />
      <div className={styles.bottomContainer}>
        <Button disable={!btnStatus} loading={loading} onClick={onConfirm}>
          {i18n.t("confirm")}
        </Button>
      </div>
    </CustomView>
  );
};

export default ImportAccount;
