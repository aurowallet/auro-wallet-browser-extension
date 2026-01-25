import i18n from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DAPP_DELETE_ACCOUNT_CONNECT_HIS,
  WALLET_CHANGE_ACCOUNT_NAME,
  WALLET_CHANGE_DELETE_ACCOUNT,
  WALLET_DELETE_WATCH_ACCOUNT,
} from "../../../constant/msgTypes";
import { ACCOUNT_TYPE, SEC_FROM_TYPE } from "../../../constant/commonType";
import { updateCurrentAccount } from "../../../reducers/accountReducer";
import { sendMsg } from "../../../utils/commonMsg";
import { nameLengthCheck } from "../../../utils/utils";
import { copyText } from "../../../utils/browserUtils";
import Loading from "../../component/Loading";
import SecurityPwd from "../../component/SecurityPwd";
import Toast from "../../component/Toast";
import { useAppDispatch, useAppSelector } from "@/hooks/useStore";
import type { AccountInfo as AccountInfoType } from "../../types/account";
import { useNavigate } from "react-router-dom";
import CustomView from "../../component/CustomView";
import { PopupModal, PopupModal_type } from "../../component/PopupModal";
import {
  StyledContainer,
  StyledContentContainer,
  StyledRowAddress,
  StyledRowAddressTitle,
  StyledRowAddressContent,
  StyledRowInfoContainer,
  StyledRowContainer,
  StyledRowTitle,
  StyledRowDesc,
  StyledDeleteRow,
  StyledDeleteTitle,
  StyledDividedLine,
  StyledWarningTip,
  StyledModalDelete,
} from "./index.styled";

const AccountInfo = () => {
  const cache = useAppSelector((state) => state.cache);
  const currentAccount = useAppSelector(
    (state) => state.accountInfo.currentAccount
  );

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [account, setAccount] = useState<AccountInfoType>(cache.accountInfo as AccountInfoType);
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
    rightBtnStyle?: string | typeof StyledModalDelete;
  }
  const [currentModal, setCurrentModal] = useState<ModalConfig>({});
  const [showSecurity, setShowSecurity] = useState(false);
  const [resetModalBtnStatus,setResetModalBtnStatus] = useState(true)

  const onCloseModal = useCallback(() => {
    setPopupModalStatus(false);
  }, []);

  const onConfirmChange = useCallback(
    (data: { inputValue: string }) => {
      let checkResult = nameLengthCheck(data.inputValue);
      if (checkResult) {
        sendMsg(
          {
            action: WALLET_CHANGE_ACCOUNT_NAME,
            payload: {
              address: account.address,
              accountName: data.inputValue.trim(),
            },
          },
          (account: { account: AccountInfoType }) => {
            setAccount(account.account);

            let address = currentAccount?.address;
            if (account.account?.address === address) {
              dispatch(updateCurrentAccount(account.account));
            }
            setPopupModalStatus(false);
          }
        );
      } else {
      }
    },
    [account, currentAccount, i18n]
  );

  const onClickAccountName = useCallback(() => {
    setCurrentModal({
      title: i18n.t("changeAccountName"),
      leftBtnContent: i18n.t("cancel"),
      rightBtnContent: i18n.t("confirm"),
      type: PopupModal_type.input,
      onLeftBtnClick: onCloseModal,
      onRightBtnClick: onConfirmChange,
      content: "",
      inputPlaceholder: i18n.t("accountNameLimit"),
      maxInputLength: 16,
      rightBtnStyle:""
    });
    setPopupModalStatus(true);
  }, [i18n]);

  const showPrivateKey = useCallback(() => {
    navigate("/show_privatekey_page", { state: { address: account.address } });
  }, []);

  const onConfirmDeleteLedger = useCallback(()=>{
    setPopupModalStatus(false);
    Loading.show();
    sendMsg(
      {
        action: WALLET_DELETE_WATCH_ACCOUNT,
        payload: {
          address: account.address,
        },
      },
      async (currentAccount: AccountInfoType & { error?: string; type?: string }) => {
        Loading.hide();
        if (currentAccount.error) {
          if (currentAccount.type === "local") {
            Toast.info(i18n.t(currentAccount.error));
          } else {
            Toast.info(currentAccount.error);
          }
        } else {
          dispatch(updateCurrentAccount(currentAccount));

          setTimeout(() => {
            navigate(-1);
          }, 300);
        }
      }
    );
  },[account])
  const onClickDeleteLedger = useCallback(()=>{
    setResetModalBtnStatus(false)
    setCurrentModal({
      title: i18n.t('deleteAccount'),
      leftBtnContent: i18n.t("cancel"), 
      rightBtnContent: i18n.t("deleteTag"),
      type: PopupModal_type.common,
      onLeftBtnClick: onCloseModal,
      onRightBtnClick: onConfirmDeleteLedger,
      content: "",
      rightBtnStyle:StyledModalDelete
    });
    setPopupModalStatus(true);
  },[i18n])
  const deleteAccount = useCallback(() => {
    if (account.type === ACCOUNT_TYPE.WALLET_WATCH||account.type === ACCOUNT_TYPE.WALLET_LEDGER) {
      onClickDeleteLedger()
    } else {
      setShowSecurity(true);
    }
  }, [account]);

  const { hideDelete, isLedger, hideExport, hdPath } = useMemo(() => {
    const hideDelete = account.type === ACCOUNT_TYPE.WALLET_INSIDE;
    let isLedger = account.type === ACCOUNT_TYPE.WALLET_LEDGER;
    let hdPath = isLedger
      ? `m / 44' / 12586' / ${account.hdPath} ' / 0 / 0`
      : "";
    let hideExport = account.type === ACCOUNT_TYPE.WALLET_WATCH || isLedger;

    return {
      hideDelete,
      isLedger,
      hideExport,
      hdPath,
    };
  }, [account]);

  const onCopyAddress = useCallback(() => {
    copyText(account.address as string).then(() => {
      Toast.info(i18n.t("copySuccess"));
    });
  }, [account]);

  const onClickCheck = useCallback(
    (password: string) => {
      let address = currentAccount?.address;
      sendMsg(
        {
          action: WALLET_CHANGE_DELETE_ACCOUNT,
          payload: {
            address: account.address,
            password: password,
          },
        },
        async (currentAccount: AccountInfoType & { error?: string; type?: string }) => {
          if (currentAccount.error) {
            if (currentAccount.type === "local") {
              if (currentAccount.error === "passwordError") {
                Toast.info(i18n.t("passwordError"));
              } else {
                Toast.info(i18n.t(currentAccount.error));
              }
            } else {
              Toast.info(currentAccount.error);
            }
          } else {
            sendMsg(
              {
                action: DAPP_DELETE_ACCOUNT_CONNECT_HIS,
                payload: {
                  address: account.address,
                  oldCurrentAddress: address,
                  currentAddress: currentAccount.address,
                },
              },
              () => {}
            );
            dispatch(updateCurrentAccount(currentAccount));
            navigate(-1);
          }
        }
      );
    },
    [currentAccount, account, i18n]
  );

  const onResetModalInput = useCallback((e: React.ChangeEvent<HTMLInputElement>)=>{
    let checkStatus = e.target.value.length > 0 
    if (checkStatus) {
        setResetModalBtnStatus(false)
    }else{
        setResetModalBtnStatus(true)
    }
  },[i18n])

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
      title={i18n.t("accountDetails")}
      ContentWrapper={StyledContainer}
    >
      <StyledContentContainer>
        <StyledRowAddress onClick={onCopyAddress}>
          <StyledRowAddressTitle>{i18n.t("accountAddress")}</StyledRowAddressTitle>
          <StyledRowAddressContent>{account.address as string}</StyledRowAddressContent>
        </StyledRowAddress>
        <StyledRowInfoContainer>
          <AccountInfoRow
            title={i18n.t("accountName")}
            desc={account.accountName as string}
            onClick={onClickAccountName}
          />
          {isLedger && (
            <AccountInfoRow
              title={i18n.t("hdDerivedPath")}
              desc={hdPath}
              noArrow={true}
            />
          )}
          {!hideExport && (
            <AccountInfoRow
              title={i18n.t("exportPrivateKey")}
              onClick={showPrivateKey}
            />
          )}
        </StyledRowInfoContainer>
        {!hideDelete && (
          <>
            <StyledDividedLine />
            <StyledDeleteRow>
              <StyledDeleteTitle onClick={deleteAccount}>
                {i18n.t("deleteTag")}
              </StyledDeleteTitle>
            </StyledDeleteRow>
          </>
        )}
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
        bottomTipClass={StyledWarningTip}
        maxInputLength={currentModal?.maxInputLength}
        onInputChange={onResetModalInput}
        rightBtnDisable={resetModalBtnStatus}
      />
    </CustomView>
  );
};

const AccountInfoRow = ({
  title = "",
  desc = "",
  onClick = () => {},
  noArrow = false,
}) => {
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

export default AccountInfo;
