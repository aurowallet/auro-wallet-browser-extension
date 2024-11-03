import { DefaultMainnetConfig } from "@/constant/network";
import extension from "extensionizer";
import i18n from "i18next";
import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useHistory } from "react-router-dom";
import styled from "styled-components";
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
import { sendMsg } from "../../../utils/commonMsg";
import { sendNetworkChangeMsg } from "../../../utils/utils";
import Button from "../../component/Button";
import Input from "../../component/Input";
import { PopupModal, PopupModal_type } from "../../component/PopupModal";
import Toast from "../../component/Toast";
import styles from "./index.module.scss";

const StyledFormWrapp = styled.form`
  width: calc(100% - 40px);
`;
const LockedPageWrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 200;
  background-color: #edeff2;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StyledLockContent = styled.div`
  display: flex;
  align-items: center;
  font-size: 24px;
  flex-direction: column;
  background-color: white;
  height: 100vh;
  min-width: 375px;
`;

export const LockPage = ({}) => {
  const [pwdValue, setPwdValue] = useState("");
  const [unLockBtnStatus, setUnLockBtnStatus] = useState(false);
  const [waringModalStatus, setWaringModalStatus] = useState(false);
  const [resetModalStatus, setResetModalStatus] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);

  const dispatch = useDispatch();
  const history = useHistory();

  const onPwdInput = useCallback((e) => {
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
        payload: pwdValue,
      },
      (account) => {
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
          history.push("/homepage");
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

  const onConfirmDeleteClick = useCallback(async ({ inputValue }) => {
    let deleteTag = i18n.t("deleteTag");
    let checkStatus = inputValue.trim() === deleteTag;
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
        clearLocalExcept();
        dispatch(resetWallet());
        dispatch(updateCurrentNode(DefaultMainnetConfig));
        dispatch(updateCustomNodeList([]));
        sendNetworkChangeMsg(DefaultMainnetConfig);
        if (baseInfo) {
          baseInfo = JSON.parse(baseInfo);
          dispatch(updateExtensionBaseInfo(baseInfo));
        }

        let currencyList = CURRENCY_UNIT;
        currencyList[0].isSelect = true;
        dispatch(updateCurrencyConfig(currencyList));
        saveLocal(CURRENCY_UNIT_CONFIG, JSON.stringify(currencyList[0].key));

        extension.tabs.create({
          url: "popup.html#/register_page",
        });
        setResetModalStatus(false);
        history.replace({ pathname: "register_page" });
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
    (e) => {
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
  const onSubmit = useCallback((event) => {
    event.preventDefault();
  }, []);

  return (
    <>
      <LockedPageWrapper>
        <StyledLockContent>
          <div className={styles.resetEntryOuter}>
            <div
              className={styles.resetEntryContainer}
              onClick={onShowResetModal}
            >
              {i18n.t("resetWallet")}
            </div>
          </div>
          <div className={styles.logoContainer}>
            <img src="/img/colorful_logo.svg" className={styles.logo} />
          </div>
          <p className={styles.welcomeBack}>{i18n.t("welcomeBack")}</p>
          <StyledFormWrapp onSubmit={onSubmit}>
            <div className={styles.pwdInputContainer}>
              <Input
                label={i18n.t("password")}
                placeholder={i18n.t("enterPwd")}
                onChange={onPwdInput}
                value={pwdValue}
                inputType={"password"}
              />
              <div className={styles.btnContainer}>
                <Button
                  loading={btnLoading}
                  disable={!unLockBtnStatus}
                  onClick={goToConfirm}
                >
                  {i18n.t("unlock")}
                </Button>
                <p className={styles.bottomUrl}>{POWER_BY}</p>
              </div>
            </div>
          </StyledFormWrapp>
        </StyledLockContent>
      </LockedPageWrapper>
      <PopupModal
        title={i18n.t("reset_tip_1")}
        leftBtnContent={i18n.t("cancel")}
        rightBtnContent={i18n.t("reset")}
        rightBtnStyle={styles.rightBtn}
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
