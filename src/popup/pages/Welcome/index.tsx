import { WALLET_CREATE_TYPE } from "@/constant/commonType";
import { PopupModalV2 } from "@/popup/component/PopupModalV2";
import {
  StyledPageInnerContent,
  StyledPageOuterWrapper,
} from "@/popup/style/common";
import i18n from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Trans } from "react-i18next";
import { useAppDispatch, useAppSelector } from "@/hooks/useStore";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { getLocal, saveLocal } from "../../../background/localStorage";
import { POWER_BY } from "../../../constant";
import { WALLET_GET_CURRENT_ACCOUNT } from "../../../constant/msgTypes";
import { USER_AGREEMENT } from "../../../constant/storageKey";
import { LANG_SUPPORT_LIST } from "../../../i18n";
import { setWelcomeNextType } from "../../../reducers/cache";
import { openTab, sendMsg } from "../../../utils/commonMsg";
import Button, { button_theme } from "../../component/Button";
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
const StyledLedgerLink = styled.p`
  margin: 20px auto 16px;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  color: var(--mineBlack);
  cursor: pointer;

  &:hover {
    color: var(--mainBlue);
  }
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
  const cache = useAppSelector((state) => state.cache);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [isGotoProtocol, setIsGotoProtocol] = useState(true);
  const [popupModalStatus, setPopupModalStatus] = useState(false);
  const [isCheckingWallet, setIsCheckingWallet] = useState(true);

  const [nextRoute, setNextRoute] = useState("");
  const [registerStep, setRegisterStep] = useState(RegisterStep.welcome);

  // Check if this is an "add wallet" flow from AccountManage
  const isAddWalletFlow = useMemo(() => {
    const url = window.location?.href || "";
    const searchParams = new URLSearchParams(
      url.split("?")[1]?.split("#")[0] || ""
    );
    return searchParams.get("addWallet") === "true";
  }, []);

  // Check if wallet already exists on mount
  // If wallet exists and NOT in addWallet flow, redirect to home page or lock page
  useEffect(() => {
    // Skip wallet check if this is an "add wallet" flow
    if (isAddWalletFlow) {
      setIsCheckingWallet(false);
      return;
    }

    sendMsg({ action: WALLET_GET_CURRENT_ACCOUNT }, (currentAccount: { localAccount?: { keyringData?: unknown }; isUnlocked?: boolean; address?: string }) => {
      const hasValidWallet = currentAccount?.localAccount?.keyringData && currentAccount?.address;
      if (hasValidWallet) {
        // Wallet exists, redirect based on lock status
        if (currentAccount.isUnlocked) {
          navigate("/homepage");
        } else {
          navigate("/lock_page");
        }
      } else {
        // No wallet, show welcome page
        setIsCheckingWallet(false);
      }
    });
  }, [navigate, isAddWalletFlow]);

  const onClickGuide = useCallback(
    (type: typeof type_conditions | typeof type_policy) => {
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

  const onConfirmProtocol = useCallback((route: string) => {
    setPopupModalStatus(true);
    setNextRoute(route);
  }, []);

  const goPage = useCallback((route: string, type?: string) => {
    if (type === "saveProtocol") {
      saveLocal(USER_AGREEMENT, "true");
      setIsGotoProtocol(false);
    }

    dispatch(setWelcomeNextType(route));
    // Ledger also goes through CreateProcessPage for password creation first
    setRegisterStep(RegisterStep.process);
  }, []);

  const goNextRoute = useCallback(
    (route: string) => {
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

  if (isCheckingWallet) {
    return (
      <StyledPageOuterWrapper>
        <StyledPageInnerContent>
          <StyledLogoContainer>
            <img src="/img/colorful_logo.svg" />
          </StyledLogoContainer>
        </StyledPageInnerContent>
      </StyledPageOuterWrapper>
    );
  }

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
              <StyledLedgerLink
                onClick={() => goNextRoute(WALLET_CREATE_TYPE.ledger)}
              >
                {i18n.t("connectHardwareWallet")}
              </StyledLedgerLink>
            </StyledBtnContainer>
          </StyledTopContainer>
          <StyledBottomContainer>
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
