import i18n from "i18next";
import { useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SEC_FROM_TYPE } from "../../../constant/commonType";
import { WALLET_GET_PRIVATE_KEY } from "../../../constant/msgTypes";
import { copyText } from "../../../utils/browserUtils";
import { sendMsg } from "../../../utils/commonMsg";
import Button from "../../component/Button";
import CustomView from "../../component/CustomView";
import { PopupModal } from "../../component/PopupModal";
import SecurityPwd from "../../component/SecurityPwd";
import Toast from "../../component/Toast";
import {
  StyledAddressContainer,
  StyledAddressContent,
  StyledAddressTitle,
  StyledBottomContainer,
  StyledCopyContainer,
  StyledCopyDesc,
  StyledPlaceholder,
  StyledPriContainer,
  StyledPrivateKey,
} from "./index.styled";

const ShowPrivateKeyPage = () => {

  const navigate = useNavigate()
  const location = useLocation()

  const [showSecurity, setShowSecurity] = useState(true)
  const [priKey, setPriKey] = useState('')
  const [confirmModalStatus, setConfirmModalStatus] = useState(false)

  const address = useMemo(()=>{
    return location.state?.address || ""
  },[location])

  const onClickCheck = useCallback((password: string) => {
    sendMsg({
      action: WALLET_GET_PRIVATE_KEY,
      payload: {
        password: password,
        address: address
      }
    },
      async (privateKey: string | { error?: string; type?: string }) => {
        if (typeof privateKey === "object" && privateKey.error) {
          if (privateKey.type === "local") {
            if(privateKey.error === "passwordError"){
              Toast.info(i18n.t("passwordError"))
            }else{
              Toast.info(i18n.t(privateKey.error))
            }
          } else {
            Toast.info(privateKey.error)
          }
        } else if (typeof privateKey === "string") {
          setPriKey(privateKey)
          setShowSecurity(false)
        }
      })
  }, [i18n])
  const onConfirm = useCallback(() => {
    navigate(-1)
  }, [])
  const onClickCopy = useCallback(() => {
    setConfirmModalStatus(true)
  }, [])

  const onConfirmCopy = useCallback(() => {
    setConfirmModalStatus(false)
    copyText(priKey).then(() => {
      Toast.info(i18n.t('copySuccess'))
    })
  }, [priKey,i18n])
  const onCloseModal = useCallback(() => {
    setConfirmModalStatus(false)
  }, [])
  if (showSecurity) {
    return (
      <SecurityPwd
        pageTitle={i18n.t("privateKey")}
        onClickCheck={onClickCheck}
        action={SEC_FROM_TYPE.SEC_SHOW_PRIVATE_KEY}
      />
    );
  }
  return (
    <CustomView title={i18n.t("privateKey")}>
      <StyledAddressContainer>
        <StyledAddressTitle>{i18n.t("walletAddress")}</StyledAddressTitle>
        <StyledAddressContent>{address}</StyledAddressContent>
      </StyledAddressContainer>
      <StyledPriContainer>
        <StyledPrivateKey>{priKey}</StyledPrivateKey>
        <StyledCopyContainer onClick={onClickCopy}>
          <img src="/img/icon_copy_purple.svg" />
          <StyledCopyDesc>{i18n.t("copyToClipboard")}</StyledCopyDesc>
        </StyledCopyContainer>
      </StyledPriContainer>
      <StyledPlaceholder />
      <StyledBottomContainer>
        <Button onClick={onConfirm}>{i18n.t("done")}</Button>
      </StyledBottomContainer>
      <PopupModal
        title={i18n.t("tips")}
        leftBtnContent={i18n.t("copyAnyway")}
        rightBtnContent={i18n.t("stopCopying")}
        onLeftBtnClick={onConfirmCopy}
        onRightBtnClick={onCloseModal}
        contentList={[i18n.t("copyTipContent"), i18n.t("confirmEnv")]}
        modalVisible={confirmModalStatus}
      />
    </CustomView>
  );
};

export default ShowPrivateKeyPage;