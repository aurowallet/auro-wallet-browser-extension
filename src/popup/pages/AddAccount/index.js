import { ACCOUNT_NAME_FROM_TYPE } from "@/constant/commonType";
import Toast from "@/popup/component/Toast";
import { updateAccoutType } from "@/reducers/cache";
import extension from "extensionizer";
import i18n from "i18next";
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import CustomView from "../../component/CustomView";
import styles from "./index.module.scss";

const AddAccount = ({}) => {
  const history = useHistory();
  const dispatch = useDispatch();

  const accountTypeCount = useSelector((state) => state.cache.accountTypeCount);
  const goToCreate = useCallback(() => {
    dispatch(updateAccoutType(ACCOUNT_NAME_FROM_TYPE.INSIDE));
    history.push("/account_name");
  }, [accountTypeCount]);

  const goAddLedger = useCallback(() => {
    const isLedgerCapable = !window || (window && !window.USB);
    if (isLedgerCapable) {
      Toast.info(i18n.t("ledgerNotSupport"));
      return;
    }
    dispatch(updateAccoutType(ACCOUNT_NAME_FROM_TYPE.LEDGER));
    extension.tabs.create({
      url: "popup.html#/ledger_page",
    });
  }, [i18n]);

  const goImport = useCallback(() => {
    dispatch(updateAccoutType(ACCOUNT_NAME_FROM_TYPE.INSIDE));
  }, []);

  const onPrivateKey = useCallback(() => {
    goImport();
    dispatch(updateAccoutType(ACCOUNT_NAME_FROM_TYPE.OUTSIDE));
    history.push("account_name");
  }, []);
  const onKeystore = useCallback(() => {
    goImport();
    dispatch(updateAccoutType(ACCOUNT_NAME_FROM_TYPE.KEYPAIR));
    history.push("account_name");
  }, []);

  return (
    <CustomView
      title={i18n.t("addAccount")}
      contentClassName={styles.container}
    >
      <RowItem title={i18n.t("createAccount")} onClickItem={goToCreate} />
      <RowItem title={i18n.t("privateKey")} onClickItem={onPrivateKey} />
      <RowItem title={"Keystore"} onClickItem={onKeystore} />
      <RowItem title={i18n.t("hardwareWallet")} onClickItem={goAddLedger} />
    </CustomView>
  );
};

const RowItem = ({ title = "", onClickItem = () => {} }) => {
  return (
    <div className={styles.rowContainer} onClick={onClickItem}>
      <p className={styles.rowTitle}>{title}</p>
      <img src="/img/icon_arrow.svg" />
    </div>
  );
};
export default AddAccount;
