import i18n from "i18next";
import { useCallback, useEffect, useState } from "react";
import { Trans } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import { getLocal, saveLocal } from "../../../background/localStorage";
import { POWER_BY } from "../../../constant";
import { USER_AGREEMENT } from "../../../constant/storageKey";
import { LANG_SUPPORT_LIST } from "../../../i18n";
import { setWelcomeNextType } from "../../../reducers/cache";
import { openTab } from "../../../utils/commonMsg";
import Button, { button_theme } from "../../component/Button";
import styled from "styled-components";
import { PopupModalV2 } from "@/popup/component/PopupModalV2";
import {
  StyledPageInnerContent,
  StyledPageOuterWrapper,
} from "@/popup/style/common";
import { WALLET_CREATE_TYPE } from "@/constant/commonType";
import { CreateProcessPage } from "../CreateProcessPage";

const type_conditions = "conditions";
const type_policy = "policy";

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
const StyledBottomContainer = styled.div`
  position: absolute;
  width: 600px;
  bottom: 20px;
  left: 50%;
  transform: translate(-50%);
  width: 100%;
`;

const StyledPowerBy = styled.p`
  font-size: 12px;
  line-height: 18px;
  color: var(--nobelGray);
  text-align: center;
  margin: 0 auto;
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

const RegisterStep = {
  welcome: "welcome",
  process: "process",
};
const Welcome = () => {
  const cache = useSelector((state) => state.cache);
  const dispatch = useDispatch();
  const history = useHistory();

  const [isGotoProtocol, setIsGotoProtocol] = useState(true);
  const [popupModalStatus, setPopupModalStatus] = useState(false);

  const [nextRoute, setNextRoute] = useState("");
  const [registerStep, setRegisterStep] = useState(RegisterStep.welcome);

  const onClickGuide = useCallback(
    (type) => {
      const {
        terms_and_contions,
        terms_and_contions_cn,
        privacy_policy,
        privacy_policy_cn,
      } = cache;
      let lan = i18n.language;
      let url =
        lan === LANG_SUPPORT_LIST.zh_CN
          ? type === type_conditions
            ? terms_and_contions_cn
            : privacy_policy_cn
          : type === type_conditions
          ? terms_and_contions
          : privacy_policy;

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
    dispatch(setWelcomeNextType(route));
    setRegisterStep(RegisterStep.process);
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
  const onClickPre = useCallback(() => {
    setRegisterStep(RegisterStep.welcome);
  }, []);

  return (
    <StyledPageOuterWrapper>
      {registerStep === RegisterStep.welcome && (
        <StyledPageInnerContent>
          <StyledTopContainer>
            <StyledLogoContainer>
              <img src="/img/colorful_logo.svg" />
            </StyledLogoContainer>

            <StyledBtnContainer>
              <Button
                leftIcon={"/img/icon_add.svg"}
                onClick={() => {
                  goNextRoute(WALLET_CREATE_TYPE.create);
                }}
              >
                {i18n.t("createWallet")}
              </Button>

              <Button
                theme={button_theme.BUTTON_THEME_LIGHT}
                leftIcon={"/img/icon_download.svg"}
                onClick={() => {
                  goNextRoute(WALLET_CREATE_TYPE.restore);
                }}
              >
                {i18n.t("restoreWallet")}
              </Button>
            </StyledBtnContainer>
          </StyledTopContainer>
          <StyledBottomContainer>
            <StyledLedgerTip>{i18n.t("ledgerUserTip")}</StyledLedgerTip>
            <StyledPowerBy>{POWER_BY}</StyledPowerBy>
          </StyledBottomContainer>
          <PopupModalV2
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
            modalVisible={popupModalStatus}
            onCloseModal={onCloseModal}
          />
        </StyledPageInnerContent>
      )}
      {registerStep === RegisterStep.process && (
        <CreateProcessPage onClickPre={onClickPre} />
      )}
    </StyledPageOuterWrapper>
  );
};
export default Welcome;
