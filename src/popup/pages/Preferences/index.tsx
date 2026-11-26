import i18n from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppSelector } from "@/hooks/useStore";
import { useNavigate } from "react-router-dom";
import { languageOption } from "../../../i18n";
import ledgerManager from "../../../utils/ledger";
import { getLedgerTransportModeLabel } from "../../../utils/ledgerTransport";
import CustomView from "../../component/CustomView";
import {
  StyledContainer,
  StyledRowContainer,
  StyledRowTitle,
  StyledRowLeft,
  StyledRowContent,
} from "./index.styled";

const Preferences = () => {

  const navigate = useNavigate();
  const currency = useAppSelector((state) => state.currencyConfig.currentCurrency);
  const [ledgerTransportMode, setLedgerTransportMode] =
    useState(ledgerManager.getTransportMode());

  useEffect(() => {
    ledgerManager.getStoredTransportMode().then(setLedgerTransportMode);
  }, []);

  const { displayLanguage, displayCurrency, displayLedgerTransportMode } = useMemo(() => {
    let currentLanguage = languageOption.filter((language) => {
      return language.key === i18n.language;
    });
    let displayLanguage =
      currentLanguage.length > 0 ? currentLanguage[0]?.value : "";
    let displayCurrency = currency.value;

    return {
      displayLanguage,
      displayCurrency,
      displayLedgerTransportMode: getLedgerTransportModeLabel(
        ledgerTransportMode
      ),
    };
  }, [i18n, currency, ledgerTransportMode]);

  const goToPage = useCallback((nextRoute: string) => {
    navigate(nextRoute);
  }, []);

  return (
    <CustomView
      title={i18n.t("preferences")}
      ContentWrapper={StyledContainer}
    >
      <RowItem
        title={i18n.t("language")}
        content={displayLanguage}
        onClickItem={() => {
          goToPage("/language_management_page");
        }}
      />
      <RowItem
        title={i18n.t("currency")}
        content={displayCurrency}
        onClickItem={() => {
          goToPage("/currency_unit");
        }}
      />
      <RowItem
        title={i18n.t("ledgerMode")}
        content={displayLedgerTransportMode}
        onClickItem={() => {
          goToPage("/ledger_connection_mode");
        }}
      />
    </CustomView>
  );
};

const RowItem = ({ title = "", content = "", onClickItem = () => {} }) => {
  return (
    <StyledRowContainer onClick={onClickItem}>
      <div>
        <StyledRowTitle>{title}</StyledRowTitle>
      </div>
      <StyledRowLeft>
        <StyledRowContent>{content}</StyledRowContent>
        <img src="/img/icon_arrow.svg" />
      </StyledRowLeft>
    </StyledRowContainer>
  );
};

export default Preferences;
