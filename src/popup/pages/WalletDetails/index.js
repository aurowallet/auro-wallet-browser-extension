import cls from "classnames";
import i18n from "i18next";
import { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  WALLET_RENAME_KEYRING,
  WALLET_DELETE_KEYRING,
} from "../../../constant/msgTypes";
import { SEC_FROM_TYPE } from "../../../constant/commonType";
import { setKeyringInfo } from "../../../reducers/cache";
import { sendMsg } from "../../../utils/commonMsg";
import { createOrActivateTab } from "../../../utils/popup";
import { nameLengthCheck } from "../../../utils/utils";
import CustomView from "../../component/CustomView";
import { PopupModal, PopupModal_type } from "../../component/PopupModal";
import SecurityPwd from "../../component/SecurityPwd";
import Toast from "../../component/Toast";
import Loading from "../../component/Loading";
import styles from "./index.module.scss";

const WalletDetails = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cache = useSelector((state) => state.cache);
  
  const keyringInfo = cache.keyringInfo || {};
  const { id: keyringId, name: keyringName, type: keyringType, vaultVersion } = keyringInfo;

  const [walletName, setWalletName] = useState(keyringName || "");
  const [popupModalStatus, setPopupModalStatus] = useState(false);
  const [currentModal, setCurrentModal] = useState({});
  const [showSecurity, setShowSecurity] = useState(false);
  const [resetModalBtnStatus, setResetModalBtnStatus] = useState(true);

  const isHDWallet = keyringType === "hd";
  // Check if V1 wallet by vault version (more reliable than keyringId prefix)
  const isV1Wallet = vaultVersion === "v1";

  const onCloseModal = useCallback(() => {
    setPopupModalStatus(false);
  }, []);

  const onConfirmRename = useCallback(
    (data) => {
      let checkResult = nameLengthCheck(data.inputValue);
      if (checkResult) {
        Loading.show();
        sendMsg(
          {
            action: WALLET_RENAME_KEYRING,
            payload: {
              keyringId,
              name: data.inputValue.trim(),
            },
          },
          (result) => {
            Loading.hide();
            if (result.error) {
              Toast.info(result.error);
              return;
            }
            const newName = data.inputValue.trim();
            setWalletName(newName);
            // Update redux cache so AccountManage reflects the new name
            dispatch(setKeyringInfo({ ...keyringInfo, name: newName }));
            setPopupModalStatus(false);
            Toast.info(i18n.t("updateSuccess"));
          }
        );
      }
    },
    [keyringId]
  );

  const onClickWalletName = useCallback(() => {
    setCurrentModal({
      title: i18n.t("changeWalletName"),
      leftBtnContent: i18n.t("cancel"),
      rightBtnContent: i18n.t("confirm"),
      type: PopupModal_type.input,
      onLeftBtnClick: onCloseModal,
      onRightBtnClick: onConfirmRename,
      content: "",
      inputPlaceholder: i18n.t("accountNameLimit"),
      maxInputLength: 16,
      rightBtnStyle: "",
    });
    setPopupModalStatus(true);
  }, [onConfirmRename]);

  const onClickSeedPhrase = useCallback(() => {
    if (!isHDWallet) {
      Toast.info(i18n.t("noSeedPhraseForImported"));
      return;
    }
    navigate("/reveal_seed_page", { state: isV1Wallet ? {} : { keyringId } });
  }, [isHDWallet, keyringId, isV1Wallet, navigate]);

  const onConfirmDeleteWallet = useCallback(() => {
    setPopupModalStatus(false);
    setShowSecurity(true);
  }, []);

  const onClickDelete = useCallback(() => {
    setResetModalBtnStatus(false);
    setCurrentModal({
      title: i18n.t("deleteWallet"),
      leftBtnContent: i18n.t("cancel"),
      rightBtnContent: i18n.t("deleteTag"),
      type: PopupModal_type.common,
      onLeftBtnClick: onCloseModal,
      onRightBtnClick: onConfirmDeleteWallet,
      content: i18n.t("deleteWalletTip"),
      rightBtnStyle: styles.modalDelete,
    });
    setPopupModalStatus(true);
  }, [onConfirmDeleteWallet]);

  const onClickCheck = useCallback(
    (password) => {
      Loading.show();
      sendMsg(
        {
          action: WALLET_DELETE_KEYRING,
          payload: {
            keyringId,
            password,
          },
        },
        (result) => {
          Loading.hide();
          if (result.error) {
            if (result.type === "local") {
              Toast.info(i18n.t(result.error));
            } else {
              Toast.info(result.error);
            }
            return;
          }
          Toast.info(i18n.t("deleteSuccess"));
          
          // If last keyring deleted, open welcome page in full tab and close popup
          if (result.isLastKeyring) {
            createOrActivateTab("popup.html#/register_page");
            window.close();
          } else {
            navigate(-1);
          }
        }
      );
    },
    [keyringId, navigate]
  );

  const onResetModalInput = useCallback((e) => {
    let checkStatus = e.target.value.length > 0;
    setResetModalBtnStatus(!checkStatus);
  }, []);

  if (showSecurity) {
    return (
      <SecurityPwd
        onClickCheck={onClickCheck}
        action={SEC_FROM_TYPE.SEC_DELETE_ACCOUNT}
        btnTxt={i18n.t("confirm")}
      />
    );
  }

  return (
    <CustomView
      title={i18n.t("walletDetails")}
      contentClassName={styles.container}
    >
      <div className={styles.contentContainer}>
        <div className={styles.rowInfoContainer}>
          <WalletInfoRow
            title={i18n.t("walletNameLabel")}
            desc={walletName}
            onClick={isV1Wallet ? undefined : onClickWalletName}
            noArrow={isV1Wallet}
          />
          {isHDWallet && (
            <WalletInfoRow
              title={i18n.t("seedPhrase")}
              onClick={onClickSeedPhrase}
            />
          )}
        </div>
        <div className={styles.dividedLine} />
        <div className={styles.deleteRow}>
          <p
            className={cls(styles.rowTitle, styles.deleteTitle)}
            onClick={onClickDelete}
          >
            {i18n.t("deleteWallet")}
          </p>
        </div>
      </div>

      <PopupModal
        title={currentModal.title}
        leftBtnContent={currentModal.leftBtnContent}
        rightBtnContent={currentModal.rightBtnContent}
        rightBtnStyle={currentModal.rightBtnStyle || ""}
        type={currentModal.type}
        onLeftBtnClick={currentModal.onLeftBtnClick}
        onRightBtnClick={currentModal.onRightBtnClick}
        content={currentModal.content}
        modalVisible={popupModalStatus}
        onCloseModal={onCloseModal}
        inputPlaceholder={currentModal?.inputPlaceholder}
        maxInputLength={currentModal?.maxInputLength}
        onInputChange={onResetModalInput}
        rightBtnDisable={resetModalBtnStatus}
      />
    </CustomView>
  );
};

const WalletInfoRow = ({
  title = "",
  desc = "",
  onClick = () => {},
  noArrow = false,
}) => {
  return (
    <div
      className={cls(styles.rowContainer, {
        [styles.clickRow]: !noArrow,
      })}
      onClick={onClick}
    >
      <div>
        <p className={styles.rowTitle}>{title}</p>
        {desc && <p className={styles.rowDesc}>{desc}</p>}
      </div>
      {!noArrow && (
        <div>
          <img src="/img/icon_arrow.svg" />
        </div>
      )}
    </div>
  );
};

export default WalletDetails;
