import i18n from "i18next";
import { useCallback, useEffect, useState } from "react";
import type { InputChangeEvent } from "../../types/common";
import { useNavigate } from "react-router-dom";
import { WALLET_CHANGE_SEC_PASSWORD } from "../../../constant/msgTypes";
import { sendMsg } from "../../../utils/commonMsg";
import Button from "../../component/Button";
import CustomView from "../../component/CustomView";
import Input from "../../component/Input";
import Toast from "../../component/Toast";
import { PasswordValidationList } from "../../../utils/utils";
import {
  StyledInputContainer,
  StyledPlaceholder,
  StyledBottomContainer,
  StyledCheckSpan,
} from "./index.styled";

const Reset = () => {

    const navigate = useNavigate()
    const [oldPassword, setOldPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [pwdMatchList, setPwdMatchList] = useState(PasswordValidationList)
    const [matchRenderList, setMatchRenderList] = useState<typeof PasswordValidationList>([])
    const [errorTip, setErrorTip] = useState(false)
    const [btnClick, setBtnClick] = useState(false)

    const [btnLoading, setBtnLoading] = useState(false)




    const onOldPasswordInput = useCallback((e: InputChangeEvent) => {
        setOldPassword(e.target.value)
    }, [])
    const onNewPwdInput = useCallback((e: InputChangeEvent) => {
        setNewPassword(e.target.value)
    }, [])
    const onPwdConfirmInput = useCallback((e: InputChangeEvent) => {
        setConfirmPassword(e.target.value)
    }, [])

    useEffect(() => {
        let renderList: typeof PasswordValidationList = []
        let newMatchList = pwdMatchList.map(v => {
            const matched = v.expression.test(newPassword);
            const updated = { ...v, bool: matched };
            if (!matched) {
                renderList.push(updated)
            }
            return updated;
        })
        setPwdMatchList(newMatchList)
        setMatchRenderList(renderList)

        let errorTip
        if (confirmPassword.length > 0 && newPassword !== confirmPassword) {
            setErrorTip(true)
            errorTip = true
        } else {
            setErrorTip(false)
            errorTip = false
        }

        if (renderList.length <= 0 && confirmPassword.length > 0 && !errorTip) {
            setBtnClick(true)
        } else {
            setBtnClick(false)
        }
    }, [newPassword, confirmPassword])

    const onConfirm = useCallback(() => {
        setBtnLoading(true)
        sendMsg({
            action: WALLET_CHANGE_SEC_PASSWORD,
            payload: {
                oldPassword: oldPassword,
                password: newPassword.trim()
            }
        }, (res: { code: number }) => {
            if (res.code === 0) {
                setTimeout(() => {
                    navigate(-1)
                    Toast.info(i18n.t('passwordChangedSuccessful')) 
                }, 500);
            } else {
                setBtnLoading(false)
                Toast.info(i18n.t('passwordError'))
            }
        })
    }, [oldPassword, newPassword, navigate])

    return (
        <CustomView title={i18n.t("changePassword")}>
            <StyledInputContainer>
                <Input
                    transLabel={"inputOldPwd"}
                    onChange={onOldPasswordInput}
                    value={oldPassword}
                    inputType={"password"}
                />
                <Input
                    transLabel={"inputNewPwd"}
                    onChange={onNewPwdInput}
                    value={newPassword}
                    inputType={"password"}
                    showBottomTip={newPassword.length > 0}
                    bottomTip={
                        matchRenderList.map((item, index) => {
                            let extraStr = "";
                            if (index !== matchRenderList.length - 1) {
                                extraStr = " / ";
                            }
                            return i18n.t(item.text) + extraStr;
                        }).join('')
                    }
                />
                <Input
                    transLabel={"inputNewPwdRepeat"}
                    onChange={onPwdConfirmInput}
                    value={confirmPassword}
                    inputType={"password"}
                    showBottomTip={errorTip}
                    bottomTip={errorTip ? i18n.t("passwordDifferent") : ""}
                />
            </StyledInputContainer>
            <StyledPlaceholder />
            <StyledBottomContainer>
                <Button loading={btnLoading} disable={!btnClick} onClick={onConfirm}>
                    {i18n.t("confirm")}
                </Button>
            </StyledBottomContainer>
        </CustomView>
    );
};

export default Reset;