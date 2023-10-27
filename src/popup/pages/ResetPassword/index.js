import cls from "classnames";
import i18n from "i18next";
import { useCallback, useEffect, useState } from "react";
import { useHistory } from 'react-router-dom';
import { WALLET_CHANGE_SEC_PASSWORD } from "../../../constant/msgTypes";
import { sendMsg } from "../../../utils/commonMsg";
import { matchList } from "../../../utils/validator";
import Button from "../../component/Button";
import CustomView from "../../component/CustomView";
import Input from "../../component/Input";
import Toast from "../../component/Toast";
import styles from "./index.module.scss";

const Reset = ({ }) => {

    const history = useHistory()
    const [oldPassword, setOldPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [pwdMatchList, setPwdMatchList] = useState(matchList)
    const [matchRenderList, setMatchRenderList] = useState([])
    const [errorTip, setErrorTip] = useState(false)
    const [btnClick, setBtnClick] = useState(false)

    const [btnLoading, setBtnLoading] = useState(false)




    const onOldPasswordInput = useCallback((e) => {
        setOldPassword(e.target.value)
    }, [])
    const onNewPwdInput = useCallback((e) => {
        setNewPassword(e.target.value)
    }, [])
    const onPwdConfirmInput = useCallback((e) => {
        setConfirmPassword(e.target.value)
    }, [])

    useEffect(() => {
        let renderList = []
        let newMatchList = pwdMatchList.map(v => {
            if (v.expression.test(newPassword)) {
                v.bool = true;
            } else {
                v.bool = false;
                renderList.push(v)
            }
            return v;
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
        }, (res) => {
            if (res.code === 0) {
                setTimeout(() => {
                    history.goBack()
                    Toast.info(i18n.t('passwordChangedSuccessful')) 
                }, 500);
            } else {
                setBtnLoading(false)
                Toast.info(i18n.t('passwordError'))
            }
        })
    }, [oldPassword, confirmPassword, newPassword, history, i18n])

    return (<CustomView title={i18n.t('changeSecurityPassword')} >
        <div className={cls(styles.inputContainer, {
        })}>
            <Input
                transLabel={('inputOldPwd')}
                onChange={onOldPasswordInput}
                value={oldPassword}
                inputType={'password'}
            />

            <Input
                transLabel={('inputNewPwd')}
                onChange={onNewPwdInput}
                value={newPassword}
                inputType={'password'}
                showBottomTip={newPassword.length > 0}
                bottomTip={<div className={styles.checkSpanCon}>
                    {matchRenderList.map((item, index) => {
                        let extraStr = ""
                        if (index !== matchRenderList.length - 1) {
                            extraStr = " / "
                        }
                        return <span className={cls(styles.checkSpan, {
                            [styles.checkSpanSuc]: item.bool
                        })} key={index}>{i18n.t(item.text) + extraStr}</span>
                    })}
                </div>}
            />
 
            <Input
                transLabel={('inputNewPwdRepeat')}
                onChange={onPwdConfirmInput}
                value={confirmPassword}
                inputType={'password'}
                showBottomTip={errorTip}
                bottomTip={<>
                    <span className={cls(styles.checkSpan, {
                        [styles.checkSpanSuc]: !errorTip
                    })} >{i18n.t("passwordDifferent")}</span>
                </>}
            />
        </div>
        <div className={styles.hold} />
        <div className={styles.bottomCon}>
            <Button
                loading={btnLoading}
                disable={!btnClick}
                onClick={onConfirm}>
                {i18n.t('confirm')}
            </Button>
        </div>

    </CustomView>)
}
export default Reset