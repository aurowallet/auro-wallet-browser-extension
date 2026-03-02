import i18n from "i18next";
import { useCallback, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useStore";
import type { InputChangeEvent } from "../../types/common";
import { useNavigate } from "react-router-dom";
import {
  WALLET_RENAME_KEYRING,
  WALLET_DELETE_KEYRING,
} from "../../../constant/msgTypes";
import { SEC_FROM_TYPE } from "../../../constant/commonType";
import { setKeyringInfo } from "../../../reducers/cache";
import { updateCurrentAccount } from "../../../reducers/accountReducer";
import { sendMsg } from "../../../utils/commonMsg";
import { createOrActivateTab } from "../../../utils/popup";
import { nameLengthCheck } from "../../../utils/utils";
import CustomView from "../../component/CustomView";
import { PopupModal, PopupModal_type } from "../../component/PopupModal";
import SecurityPwd from "../../component/SecurityPwd";
import Toast from "../../component/Toast";
import Loading from "../../component/Loading";
import {
  StyledContainer,
  StyledContentContainer,
  StyledRowInfoContainer,
  StyledRowContainer,
  StyledRowTitle,
  StyledRowDesc,
  StyledDeleteRow,
  StyledDeleteTitle,
  StyledDividedLine,
} from "./index.styled";

const WalletDetails = () => {

  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const cache = useAppSelector((state) => state.cache);
  
  const keyringInfo = cache.keyringInfo || {} as { id?: string; name?: string; type?: string; vaultVersion?: number };
  const { id: keyringId, name: keyringName, type: keyringType, vaultVersion } = keyringInfo;

  const [walletName, setWalletName] = useState(keyringName || "");
  const [popupModalStatus, setPopupModalStatus] = useState(false);
  interface ModalConfig {
    title?: string;
    leftBtnContent?: string;
    rightBtnContent?: string;
    type?: string;
    onLeftBtnClick?: () => void;
    onRightBtnClick?: (data: { inputValue: string }) => void;
    content?: string;
    inputPlaceholder?: string;
    maxInputLength?: number;
    rightBtnStyle?: string;
  }
  const [currentModal, setCurrentModal] = useState<ModalConfig>({});
  const [showSecurity, setShowSecurity] = useState(false);
  const [resetModalBtnStatus, setResetModalBtnStatus] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);

  const isHDWallet = keyringType === "hd";
  // Check if V1 wallet by vault version (more reliable than keyringId prefix)
  const isV1Wallet = vaultVersion === "v1";

  const onCloseModal = useCallback(() => {
    setPopupModalStatus(false);
  }, []);

  const onConfirmRename = useCallback(
    (data: { inputValue: string }) => {
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
          (result: { error?: string }) => {
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
      return;
    }
    navigate("/reveal_seed_page", { state: isV1Wallet ? {} : { keyringId } });
  }, [isHDWallet, keyringId, isV1Wallet, navigate]);


  const onClickDelete = useCallback(() => { 
    setShowSecurity(true);
  }, []);

  const onClickCheck = useCallback(
    (password: string) => {
      setBtnLoading(true);
      sendMsg(
        {
          action: WALLET_DELETE_KEYRING,
          payload: {
            keyringId,
            password,
          },
        },
        (result: { error?: string; type?: string; isLastKeyring?: boolean; currentAccount?: any }) => {
          setBtnLoading(false);
          if (result.error) {
            if (result.type === "local") {
              Toast.info(i18n.t(result.error));
            } else {
              Toast.info(result.error);
            }
            return;
          }
          // If last keyring deleted, open welcome page in full tab and close popup
          if (result.isLastKeyring) {
            createOrActivateTab("popup.html#/register_page");
            window.close();
          } else {
            // Update Redux currentAccount so AccountManage shows the correct current account
            if (result.currentAccount?.address) {
              dispatch(updateCurrentAccount(result.currentAccount));
            }
            navigate(-1);
          }
        }
      );
    },
    [keyringId, navigate]
  );

  const onResetModalInput = useCallback((e: InputChangeEvent) => {
    let checkStatus = e.target.value.length > 0;
    setResetModalBtnStatus(!checkStatus);
  }, []);

  if (showSecurity) {
    return (
      <SecurityPwd
        onClickCheck={onClickCheck}
        action={SEC_FROM_TYPE.SEC_DELETE_ACCOUNT}
        btnTxt={i18n.t("confirm")}
        loading={btnLoading}
      />
    );
  }

  return (
    <CustomView
      title={i18n.t("walletDetails")}
      ContentWrapper={StyledContainer}
    >
      <StyledContentContainer>
        <StyledRowInfoContainer>
          <WalletInfoRow
            title={i18n.t("walletNameLabel")}
            desc={walletName as string}
            onClick={isV1Wallet ? undefined : onClickWalletName}
            noArrow={isV1Wallet}
          />
          {isHDWallet && (
            <WalletInfoRow
              title={i18n.t("seedPhrase")}
              onClick={onClickSeedPhrase}
            />
          )}
        </StyledRowInfoContainer>
        <StyledDividedLine />
        <StyledDeleteRow>
          <StyledDeleteTitle onClick={onClickDelete}>
            {i18n.t("deleteTag")}
          </StyledDeleteTitle>
        </StyledDeleteRow>
      </StyledContentContainer>

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

interface WalletInfoRowProps {
  title?: string;
  desc?: string;
  onClick?: () => void;
  noArrow?: boolean;
}

const WalletInfoRow = ({
  title = "",
  desc = "",
  onClick = () => {},
  noArrow = false,
}: WalletInfoRowProps) => {
  return (
    <StyledRowContainer $clickable={!noArrow} onClick={onClick}>
      <div>
        <StyledRowTitle>{title}</StyledRowTitle>
        {desc && <StyledRowDesc>{desc}</StyledRowDesc>}
      </div>
      {!noArrow && (
        <div>
          <img src="/img/icon_arrow.svg" />
        </div>
      )}
    </StyledRowContainer>
  );
};

export default WalletDetails;
