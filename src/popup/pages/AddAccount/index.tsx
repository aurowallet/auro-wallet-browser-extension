import { ACCOUNT_NAME_FROM_TYPE } from "@/constant/commonType";
import Toast from "@/popup/component/Toast";
import { updateAccountType } from "@/reducers/cache";
import browser from "webextension-polyfill";
import i18n from "i18next";
import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useStore";
import { useNavigate } from "react-router-dom";
import CustomView from "../../component/CustomView";
import { StyledContainer, StyledRowContainer, StyledRowTitle } from "./index.styled";

const AddAccount = () => {

  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const accountTypeCount = useAppSelector((state) => state.cache.accountTypeCount);
  const goToCreate = useCallback(() => {
    dispatch(updateAccountType(ACCOUNT_NAME_FROM_TYPE.INSIDE));
    navigate("/account_name");
  }, [accountTypeCount]);

  const goAddLedger = useCallback(() => {
    const isLedgerCapable = !window || (window && !(window as unknown as { USB?: unknown }).USB);
    if (isLedgerCapable) {
      Toast.info(i18n.t("ledgerNotSupport"));
      return;
    }
    dispatch(updateAccountType(ACCOUNT_NAME_FROM_TYPE.LEDGER));
    browser.tabs.create({
      url: "popup.html#/ledger_page",
    });
    window.close();
  }, [i18n]);

  const onPrivateKey = useCallback(() => {
    dispatch(updateAccountType(ACCOUNT_NAME_FROM_TYPE.OUTSIDE));
    navigate("/account_name");
  }, []);
  const onKeystore = useCallback(() => {
    dispatch(updateAccountType(ACCOUNT_NAME_FROM_TYPE.KEYPAIR));
    navigate("/account_name");
  }, []);

  return (
    <CustomView
      title={i18n.t("addAccount")}
      ContentWrapper={StyledContainer}
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
    <StyledRowContainer onClick={onClickItem}>
      <StyledRowTitle>{title}</StyledRowTitle>
      <img src="/img/icon_arrow.svg" />
    </StyledRowContainer>
  );
};

export default AddAccount;
