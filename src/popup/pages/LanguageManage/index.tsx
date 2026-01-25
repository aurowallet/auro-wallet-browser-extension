import i18n from "i18next";
import { useCallback, useState } from "react";
import { useAppDispatch } from "@/hooks/useStore";
import { useNavigate } from "react-router-dom";
import { changeLanguage, languageOption } from "../../../i18n";
import { setLanguage } from "../../../reducers/appReducer";
import CustomView from "../../component/CustomView";
import { ContributeMoreLanguage } from "../../../constant";
import {
  StyledContentContainer,
  StyledRowContainer,
  StyledBottomContainer,
  StyledTipLink,
} from "./index.styled";

const LanguageManagementPage = () => {

  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const onSelect = useCallback((item: { key: string; value: string }) => {
    setCurrentLanguage(item.key);
    if (item.key !== i18n.language) {
      changeLanguage(item.key);
      dispatch(setLanguage(item.key));
      navigate(-1);
    }
  }, []);

  return (
    <CustomView title={i18n.t("language")} ContentWrapper={StyledContentContainer}>
      {languageOption.map((item, index) => {
        let isChecked = currentLanguage === item.key;
        return (
          <StyledRowContainer key={index} onClick={() => onSelect(item)}>
            <span>{item.value}</span>
            {isChecked && <img src="/img/icon_checked.svg" />}
          </StyledRowContainer>
        );
      })}
      <StyledBottomContainer>
        <StyledTipLink href={ContributeMoreLanguage} target="_blank">
          {i18n.t("contributeLanguage")}
        </StyledTipLink>
      </StyledBottomContainer>
    </CustomView>
  );
};

export default LanguageManagementPage;