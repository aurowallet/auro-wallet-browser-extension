import i18n from "i18next";
import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { SEC_FROM_TYPE } from "../../../constant/commonType";

interface SecurityPwdProps {
  onClickCheck?: (password: string) => void;
  action?: string;
  pageTitle?: string;
  btnTxt?: string;
  loading?: boolean;
}
import Button from "../../component/Button";
import CustomView from "../../component/CustomView";
import Input from "../../component/Input";
import { PopupModal } from "../../component/PopupModal";
import {
    StyledContainer,
    StyledPlaceholder,
    StyledBottomContainer,
} from "./index.styled";

const SecurityPwd = ({
  onClickCheck = () => { },
  action = "",
  pageTitle = "",
  btnTxt = "",
  loading = false
}: SecurityPwdProps) => {

  const [inputValue, setInputValue] = useState("")
  const [btnClick, setBtnClick] = useState(false)
  const [reminderModalStatus, setReminderModalStatus] = useState(true)

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  }

  const onPwdInput = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }, [])

  useEffect(() => {
    if (inputValue.trim().length > 0) {
      setBtnClick(true)
    } else {
      setBtnClick(false)
    }
  }, [inputValue])

  const onConfirm = useCallback(() => {
    onClickCheck(inputValue)
  }, [inputValue])

  const onCloseModal = useCallback(() => {
    setReminderModalStatus(false)
  }, [])

  const { modalContent } = useMemo(() => {
    let modalContent: string[] = []
    switch (action) {
      case SEC_FROM_TYPE.SEC_DELETE_ACCOUNT:
        modalContent = [i18n.t('deleteAccountTip')]
        break
      case SEC_FROM_TYPE.SEC_SHOW_PRIVATE_KEY:
        modalContent = [
          i18n.t('privateKeyTip_1'),
          i18n.t('privateKeyTip_2')]
        break
      case SEC_FROM_TYPE.SEC_SHOW_MNEMONIC:
        modalContent = [
          i18n.t('backTips_1'),
          i18n.t('backTips_2'),
          i18n.t('backTips_3'),]
        break
    }
    return {
      modalContent
    }
  }, [action])

  const showBtnTxt = useMemo(() => {
    return btnTxt || i18n.t('next')
  }, [btnTxt, i18n])

  return (
    <>
      <CustomView title={pageTitle || i18n.t('security')}>
        <StyledContainer onSubmit={onSubmit}>
          <div>
            <Input
              label={i18n.t('password')}
              onChange={onPwdInput}
              value={inputValue}
              inputType={'password'}
            />
          </div>
          <StyledPlaceholder />
          <StyledBottomContainer>
            <Button
              loading={loading}
              disable={!btnClick}
              onClick={onConfirm}>
              {showBtnTxt}
            </Button>
          </StyledBottomContainer>
        </StyledContainer>
      </CustomView>
      <PopupModal
        title={i18n.t('tips')}
        rightBtnContent={i18n.t('ok')}
        onRightBtnClick={onCloseModal}
        contentList={modalContent}
        modalVisible={reminderModalStatus} />
    </>
  )
}

export default SecurityPwd