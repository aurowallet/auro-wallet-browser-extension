import i18n from "i18next";
import { useCallback, useEffect, useState } from "react";
import { Trans } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import { getLocal, saveLocal } from "../../../background/localStorage";
import { POWER_BY } from "../../../constant";
import { USER_AGREEMENT } from "../../../constant/storageKey";
import { LANG_SUPPORT_LIST } from "../../../i18n";
import { setWelcomeNextRoute } from "../../../reducers/cache";
import { openTab } from "../../../utils/commonMsg";
import Button, { button_theme } from "../../component/Button";
import { PopupModal } from "../../component/PopupModal";
import extension from "extensionizer";
import styled from "styled-components";

const type_conditions = "conditions";
const type_policy = "policy";

const StyledOuterWrapper = styled.div`
  height: 100vh;
  min-width: 750px;
  min-height: 600px;
  background-color: rgb(249, 250, 252);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StyledInnerContent = styled.div`
  background-color: white;
  max-width: 750px;
  max-height: 600px;
`;
const StyledTopContainer = styled.div`
  width: 375px;
  margin: 0 auto;
`;
const StyledLogoContainer = styled.div`
  margin: 89px auto 57px;
  display: flex;
  justify-content: center;
  position: relative;
`;

const StyledBtnContainer = styled.div`
  padding: 0px 38px;
  > :not(:last-child) {
    margin-bottom: 20px;
  }
`;
const StyledLedgerTip = styled.p`
  margin: 30px auto 16px;
  font-size: 12px;
  text-align: center;

  color: #cccccc;
  padding: 0px 20px;
`;

const StyledPowerBy = styled.p`
  font-size: 12px;
  line-height: 18px;
  color: var(--nobelGray);
  text-align: center;
  margin: 0 auto 20px;
`;
const StyledModalWrapper = styled.div`
  > :not(:last-child) {
    margin-bottom: 16px;
  }
`;
const StyledModalContent = styled.p`
  font-size: 14px;
  line-height: 17px;
  color: var(--mediumBlack);
`;

const StyledModalTip = styled.span`
  color: var(--mainBlue);
  &:hover {
    color: linear-gradient(0deg, rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.05)),
      var(--mainBlue);
  }
  cursor: pointer;
`;

const Welcome = () => {
  const cache = useSelector((state) => state.cache);
  const dispatch = useDispatch();
  const history = useHistory();

  const [isGotoProtocol, setIsGotoProtocol] = useState(true);
  const [popupModalStatus, setPopupModalStatus] = useState(false);

  const [nextRoute, setNextRoute] = useState("");

  const onClickGuide = useCallback(
    (type) => {
      const {
        terms_and_contions,
        terms_and_contions_cn,
        privacy_policy,
        privacy_policy_cn,
      } = cache;
      let lan = i18n.language;
      let url = "";
      if (lan === LANG_SUPPORT_LIST.zh_CN) {
        url =
          type === type_conditions ? terms_and_contions_cn : privacy_policy_cn;
      } else {
        url = type === type_conditions ? terms_and_contions : privacy_policy;
      }
      if (url) {
        openTab(url);
      }
    },
    [cache, i18n]
  );

  const onConfirmProtocol = useCallback((route) => {
    setPopupModalStatus(true);
    setNextRoute(route);
  }, []);

  const goPage = useCallback((route, type) => {
    if (type === "saveProtocol") {
      saveLocal(USER_AGREEMENT, "true");
    }
    dispatch(setWelcomeNextRoute(route));
    history.push("/createpassword");
  }, []);

  const goNextRoute = useCallback(
    (route) => {
      if (isGotoProtocol) {
        onConfirmProtocol(route);
      } else {
        goPage(route);
      }
    },
    [isGotoProtocol, nextRoute]
  );

  const openFullClick = useCallback(() => {
    extension.tabs.create({
      url: "popup.html#/welcome_page",
    });
  });

  const onCloseModal = useCallback(() => {
    setPopupModalStatus(false);
  }, []);

  const initLocal = useCallback(() => {
    let agreeStatus = getLocal(USER_AGREEMENT);
    if (agreeStatus) {
      setIsGotoProtocol(false);
    }
  }, []);

  useEffect(() => {
    initLocal();
  }, []);

  return (
    <StyledOuterWrapper>
      <StyledInnerContent>
        <StyledTopContainer>
          <StyledLogoContainer>
            <img src="/img/colorful_logo.svg" />
          </StyledLogoContainer>

          <StyledBtnContainer>
            <Button
              leftIcon={"/img/icon_add.svg"}
              onClick={() => {
                // goNextRoute("/backup_tips")
                openFullClick();
              }}
            >
              {i18n.t("createWallet")}
            </Button>

            <Button
              theme={button_theme.BUTTON_THEME_LIGHT}
              leftIcon={"/img/icon_download.svg"}
              onClick={() => {
                goNextRoute("/restore_account");
              }}
            >
              {i18n.t("restoreWallet")}
            </Button>
          </StyledBtnContainer>
        </StyledTopContainer>
        <StyledLedgerTip>{i18n.t("ledgerUserTip")}</StyledLedgerTip>
        <StyledPowerBy>{POWER_BY}</StyledPowerBy>

        <PopupModal
          title={i18n.t("termsAndPrivacy")}
          leftBtnContent={i18n.t("refuse")}
          rightBtnContent={i18n.t("agree")}
          onLeftBtnClick={onCloseModal}
          onRightBtnClick={() => {
            onCloseModal();
            goPage(nextRoute, "saveProtocol");
          }}
          componentContent={
            <StyledModalWrapper>
              <StyledModalContent>
                {i18n.t("termsAndPrivacy_line1")}
              </StyledModalContent>
              <StyledModalContent>
                <Trans
                  i18nKey={i18n.t("termsAndPrivacy_line2")}
                  components={{
                    conditions: (
                      <StyledModalTip
                        onClick={() => onClickGuide(type_conditions)}
                      />
                    ),
                    policy: (
                      <StyledModalTip
                        onClick={() => onClickGuide(type_policy)}
                      />
                    ),
                  }}
                />
              </StyledModalContent>
            </StyledModalWrapper>
          }
          modalVisable={popupModalStatus}
          onCloseModal={onCloseModal}
        />
      </StyledInnerContent>
    </StyledOuterWrapper>
  );
};
export default Welcome;
