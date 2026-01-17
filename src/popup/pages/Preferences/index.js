import i18n from "i18next";
import { useCallback, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { languageOption } from "../../../i18n";
import CustomView from "../../component/CustomView";
import {
  StyledContainer,
  StyledRowContainer,
  StyledRowTitle,
  StyledRowLeft,
  StyledRowContent,
} from "./index.styled";

const Preferences = ({}) => {

  const navigate = useNavigate();
  const currency = useSelector((state) => state.currencyConfig.currentCurrency);

  const { displayLanguage, displayCurrency } = useMemo(() => {
    let currentLanguage = languageOption.filter((language) => {
      return language.key === i18n.language;
    });
    let displayLanguage =
      currentLanguage.length > 0 ? currentLanguage[0].value : "";
    let displayCurrency = currency.value;

    return {
      displayLanguage,
      displayCurrency,
    };
  }, [i18n, currency]);

  const goToPage = useCallback((nextRoute) => {
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
