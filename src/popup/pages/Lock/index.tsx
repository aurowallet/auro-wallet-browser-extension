import { DefaultMainnetConfig } from "@/constant/network";
import browser from 'webextension-polyfill';
import i18n from "i18next";
import { useCallback, useEffect, useState } from "react";
import { useAppDispatch } from "@/hooks/useStore";
import type { InputChangeEvent } from "../../types/common";
import { useNavigate } from "react-router-dom";
import { NET_CONFIG_VERSION } from "../../../../config";
import { extSaveLocal } from "../../../background/extensionStorage";
import {
  clearLocalExcept,
  getLocal,
  saveLocal,
} from "../../../background/localStorage";
import { clearStorage } from "../../../background/storageService";
import { CURRENCY_UNIT, POWER_BY } from "../../../constant";
import {
  RESET_WALLET,
  WALLET_APP_SUBMIT_PWD,
} from "../../../constant/msgTypes";
import {
  CURRENCY_UNIT_CONFIG,
  LOCAL_BASE_INFO,
  NET_WORK_CONFIG_V2,
  USER_AGREEMENT,
} from "../../../constant/storageKey";
import { resetWallet } from "../../../reducers";
import { initCurrentAccount } from "../../../reducers/accountReducer";
import { updateExtensionBaseInfo } from "../../../reducers/cache";
import { updateCurrencyConfig } from "../../../reducers/currency";
import {
  ENTRY_WITCH_ROUTE,
  updateEntryWitchRoute,
} from "../../../reducers/entryRouteReducer";
import {
  updateCurrentNode,
  updateCustomNodeList,
} from "../../../reducers/network";
import { sendMsg, sendNetworkChangeMsg } from "../../../utils/commonMsg";
import Button from "../../component/Button";
import Input from "../../component/Input";
import { PopupModal, PopupModal_type } from "../../component/PopupModal";
import Toast from "../../component/Toast";
import {
  StyledLockedPageWrapper,
  StyledLockContent,
  StyledResetEntryOuter,
  StyledResetEntryButton,
  StyledLogoContainer,
  StyledLogo,
  StyledWelcomeBack,
  StyledFormWrapper,
  StyledPwdInputContainer,
  StyledBtnContainer,
  StyledBottomUrl,
  dangerButtonClassName,
} from "./index.styled";

export const LockPage = () => {
  const [pwdValue, setPwdValue] = useState("");
  const [unLockBtnStatus, setUnLockBtnStatus] = useState(false);
  const [waringModalStatus, setWaringModalStatus] = useState(false);
  const [resetModalStatus, setResetModalStatus] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();


  const onPwdInput = useCallback((e: InputChangeEvent) => {
    let value = e.target.value;
    setPwdValue(value);
  }, []);

  useEffect(() => {
    if (pwdValue.length > 0) {
      setUnLockBtnStatus(true);
    } else {
      setUnLockBtnStatus(false);
    }
  }, [pwdValue]);

  const goToConfirm = useCallback(() => {
    setBtnLoading(true);
    sendMsg(
      {
        action: WALLET_APP_SUBMIT_PWD,
        payload: { password: pwdValue },
      },
      (account: { error?: string; type?: string; address?: string }) => {
        setBtnLoading(false);
        if (account.error) {
          if (account.type === "local") {
            Toast.info(i18n.t(account.error));
          } else {
            Toast.info(account.error);
          }
        } else {
          dispatch(updateEntryWitchRoute(ENTRY_WITCH_ROUTE.HOME_PAGE));
          dispatch(initCurrentAccount(account));
          navigate("/homepage");
        }
      }
    );
  }, [pwdValue]);

  const onShowResetModal = useCallback(() => {
    setWaringModalStatus(true);
  }, []);

  const onCloseWarningModal = useCallback(() => {
    setWaringModalStatus(false);
  }, []);

  const onCloseResetModal = useCallback(() => {
    setResetModalStatus(false);
  }, []);

  const onConfirmDeleteClick = useCallback(async ({ inputValue }: { inputValue?: string }) => {
    let deleteTag = i18n.t("deleteTag");
    let checkStatus = inputValue?.trim() === deleteTag;
    if (!checkStatus) {
      Toast.info(i18n.t("targetContent"));
      return;
    }
    sendMsg(
      {
        action: RESET_WALLET,
      },
      async () => {
        clearStorage();
        await extSaveLocal(NET_WORK_CONFIG_V2, {
          currentNode: DefaultMainnetConfig,
          customNodeList: [],
          nodeConfigVersion: NET_CONFIG_VERSION,
        });
        let baseInfo = getLocal(LOCAL_BASE_INFO);
        clearLocalExcept(USER_AGREEMENT);
        dispatch(resetWallet());
        dispatch(updateCurrentNode(DefaultMainnetConfig));
        dispatch(updateCustomNodeList([]));
        sendNetworkChangeMsg(DefaultMainnetConfig as unknown as Parameters<typeof sendNetworkChangeMsg>[0]);
        if (baseInfo) {
          const parsedBaseInfo = JSON.parse(baseInfo);
          if (parsedBaseInfo) {
            dispatch(updateExtensionBaseInfo(parsedBaseInfo as Parameters<typeof updateExtensionBaseInfo>[0]));
          }
        }

        const currencyList = CURRENCY_UNIT.map((item, index) => 
          index === 0 ? { ...item, isSelect: true } : item
        );
        dispatch(updateCurrencyConfig(currencyList as Parameters<typeof updateCurrencyConfig>[0]));
        saveLocal(CURRENCY_UNIT_CONFIG, JSON.stringify(currencyList[0]?.key));

        browser.tabs.create({
          url: "popup.html#/register_page",
        });
        setResetModalStatus(false);
        navigate("/register_page");
        window.close();
      }
    );
  }, []);

  const onConfirmResetClick = useCallback(() => {
    setWaringModalStatus(false);
    setResetModalStatus(true);
  }, [i18n]);

  const [resetModalBtnStatus, setResetModalBtnStatus] = useState(true);

  const onResetModalInput = useCallback(
    (e: InputChangeEvent) => {
      let deleteTag = i18n.t("deleteTag");
      let checkStatus = e.target.value.trim() === deleteTag;
      if (checkStatus) {
        setResetModalBtnStatus(false);
      } else {
        setResetModalBtnStatus(true);
      }
    },
    [i18n]
  );
  const onSubmit = useCallback((event: React.FormEvent) => {
    event.preventDefault();
  }, []);

  return (
    <>
      <StyledLockedPageWrapper>
        <StyledLockContent>
          <StyledResetEntryOuter>
            <StyledResetEntryButton onClick={onShowResetModal}>
              {i18n.t("resetWallet")}
            </StyledResetEntryButton>
          </StyledResetEntryOuter>
          <StyledLogoContainer>
            <StyledLogo src="/img/colorful_logo.svg" />
          </StyledLogoContainer>
          <StyledWelcomeBack>{i18n.t("welcomeBack")}</StyledWelcomeBack>
          <StyledFormWrapper onSubmit={onSubmit}>
            <StyledPwdInputContainer>
              <Input
                label={i18n.t("password")}
                placeholder={i18n.t("enterPwd")}
                onChange={onPwdInput}
                value={pwdValue}
                inputType={"password"}
              />
              <StyledBtnContainer>
                <Button
                  loading={btnLoading}
                  disable={!unLockBtnStatus}
                  onClick={goToConfirm}
                >
                  {i18n.t("unlock")}
                </Button>
                <StyledBottomUrl>{POWER_BY}</StyledBottomUrl>
              </StyledBtnContainer>
            </StyledPwdInputContainer>
          </StyledFormWrapper>
        </StyledLockContent>
      </StyledLockedPageWrapper>
      <PopupModal
        title={i18n.t("reset_tip_1")}
        leftBtnContent={i18n.t("cancel")}
        rightBtnContent={i18n.t("reset")}
        rightBtnStyle={dangerButtonClassName}
        type={PopupModal_type.warning}
        onLeftBtnClick={onCloseWarningModal}
        onRightBtnClick={onConfirmResetClick}
        content={i18n.t("reset_tip_2")}
        modalVisible={waringModalStatus}
        onCloseModal={onCloseWarningModal}
        zIndex={1001}
      />

      <PopupModal
        title={i18n.t("confirm_reset_tip", { deleteTag: i18n.t("deleteTag") })}
        leftBtnContent={i18n.t("cancel")}
        rightBtnContent={i18n.t("confirm")}
        type={PopupModal_type.input}
        onLeftBtnClick={onCloseResetModal}
        onRightBtnClick={onConfirmDeleteClick}
        modalVisible={resetModalStatus}
        onCloseModal={onCloseResetModal}
        rightBtnDisable={resetModalBtnStatus}
        onInputChange={onResetModalInput}
        inputPlaceholder={i18n.t("deleteTag")}
        clearWhenClose={true}
        zIndex={1001}
      />
    </>
  );
};
