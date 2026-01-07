import i18n from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import {
  DAPP_CHANGE_CONNECTING_ADDRESS,
  WALLET_IMPORT_KEY_STORE,
} from "../../../constant/msgTypes";
import { updateCurrentAccount } from "../../../reducers/accountReducer";
import { sendMsg } from "../../../utils/commonMsg";
import Toast from "../../component/Toast";
import Button from "../../component/Button";
import CustomView from "../../component/CustomView";
import Input from "../../component/Input";
import TextArea from "../../component/TextArea";
import styles from "./index.module.scss";

const ImportKeypair = ({}) => {
  const currentAddress = useSelector(
    (state) => state.accountInfo.currentAccount.address
  );

  const [keystoreValue, setKeystoreValue] = useState("");
  const [pwdValue, setPwdValue] = useState("");
  const [btnStatus, setBtnStatus] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const accountName = useMemo(() => {
    return location?.state?.accountName ?? "";
  }, [location]);

  useEffect(() => {
    if (keystoreValue.length > 0 && pwdValue.length > 0) {
      setBtnStatus(true);
    } else {
      setBtnStatus(false);
    }
  }, [pwdValue, keystoreValue]);

  const onInputKeystore = useCallback((e) => {
    setKeystoreValue(e.target.value);
  }, []);

  const onInputPwd = useCallback((e) => {
    setPwdValue(e.target.value);
  }, []);

  const onConfirm = useCallback(
    (e) => {
      setLoading(true);
      sendMsg(
        {
          action: WALLET_IMPORT_KEY_STORE,
          payload: {
            keypair: keystoreValue,
            password: pwdValue,
            accountName: accountName,
          },
        },
        async (account) => {
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
            }, 300);
          }
        }
      );
    },
    [keystoreValue, pwdValue, accountName, history]
  );
  return (
    <CustomView title={i18n.t("importKeystone")}>
      <p className={styles.title}>{i18n.t("pleaseInputKeyPair")}</p>
      <div className={styles.textAreaContainer}>
        <TextArea onChange={onInputKeystore} value={keystoreValue} />
      </div>
      <Input
        label={i18n.t("keystorePassword")}
        onChange={onInputPwd}
        value={pwdValue}
        inputType={"password"}
      />
      <div className={styles.descContainer}>
        <p className={styles.desc}>{i18n.t("importAccount_3")}</p>
        <p className={styles.desc}>{i18n.t("importAccount_2")}</p>
      </div>
      <div className={styles.hold} />
      <div className={styles.bottomContainer}>
        <Button disable={!btnStatus} loading={loading} onClick={onConfirm}>
          {i18n.t("confirm")}
        </Button>
      </div>
    </CustomView>
  );
};
export default ImportKeypair;
