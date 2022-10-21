import i18n from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useHistory } from 'react-router-dom';
import { clearLocalExcept, getLocal, saveLocal } from "../../../background/localStorage";
import { clearStorage } from "../../../background/storageService";
import { POWER_BY } from "../../../constant";
import { CURRENCY_UNIT } from "../../../constant/pageType";
import { CURRENCY_UNIT_CONFIG, LOCAL_BASE_INFO, NET_WORK_CONFIG } from "../../../constant/storageKey";
import { RESET_WALLET, WALLET_APP_SUBMIT_PWD } from "../../../constant/types";
import { resetWallet } from "../../../reducers";
import { initCurrentAccount } from "../../../reducers/accountReducer";
import { updateExtensionBaseInfo } from "../../../reducers/cache";
import { updateCurrencyConfig } from "../../../reducers/currency";
import { updateNetConfig } from "../../../reducers/network";
import { sendMsg } from "../../../utils/commonMsg";
import { sendNetworkChangeMsg } from "../../../utils/utils";
import Button from "../../component/Button";
import FormView from "../../component/FormView";
import Input from "../../component/Input";
import { PopupModal, PopupModal_type } from "../../component/PopupModal";
import Toast from "../../component/Toast";
import styles from "./index.module.scss";

export const LockPage = ({
    onClickUnLock = () => { },
    onDappConfirm = false
}) => {

    const [pwdValue, setPwdValue] = useState('')
    const [unLockBtnStatus, setUnLockBtnStatus] = useState(false)
    const [waringModalStatus, setWaringModalStatus] = useState(false)
    const [resetModalStatus, setResetModalStatus] = useState(false)
    
    const dispatch = useDispatch()
    const history = useHistory()

    const onPwdInput = useCallback((e) => {
        let value = e.target.value
        value = value.trim()
        setPwdValue(value)
    }, [])

    useEffect(() => {
        if (pwdValue.length > 0) {
            setUnLockBtnStatus(true)
        } else {
            setUnLockBtnStatus(false)
        }
    }, [pwdValue])


    const goToConfirm = useCallback(() => {
        sendMsg({
            action: WALLET_APP_SUBMIT_PWD,
            payload: pwdValue
        },
            (account) => {
                if (account.error) {
                    if (account.type === "local") {
                        Toast.info(i18n.t(account.error))
                    } else {
                        Toast.info(account.error)
                    }
                } else {
                    dispatch(initCurrentAccount(account))
                    onClickUnLock()
                    if (!onDappConfirm) {
                        history.push("/homepage")
                    }
                }
            })
    }, [pwdValue])


    const onShowResetModal = useCallback(() => {
        setWaringModalStatus(true)
    }, [])


    const onCloseWarningModal = useCallback(()=>{
        setWaringModalStatus(false)
    },[])

    const onCloseResetModal = useCallback(()=>{
        setResetModalStatus(false)
    },[])
 
   
    const onConfirmDeleteClick = useCallback(({ inputValue }) => {
        let deleteTag = i18n.t("deleteTag")
        let checkStatus = inputValue.trim() === deleteTag
        if (!checkStatus) {
            Toast.info(i18n.t('targetContent'))
            return
        }
        sendMsg({
            action: RESET_WALLET,
        }, () => {
            clearStorage()
            let baseInfo = getLocal(LOCAL_BASE_INFO)
            clearLocalExcept(NET_WORK_CONFIG)
            dispatch(resetWallet())
            let netConfig = getLocal(NET_WORK_CONFIG)
            if (netConfig) {
                netConfig = JSON.parse(netConfig)
                dispatch(updateNetConfig(netConfig))
                sendNetworkChangeMsg(netConfig.currentConfig)
            }
            if (baseInfo) {
                baseInfo = JSON.parse(baseInfo)
                dispatch(updateExtensionBaseInfo(baseInfo))
            }

            let currencyList = CURRENCY_UNIT
            currencyList[0].isSelect = true
            dispatch(updateCurrencyConfig(currencyList))
            saveLocal(CURRENCY_UNIT_CONFIG, JSON.stringify(currencyList[0].key))

            history.push("/welcome_page")
        })
    }, [])


    const onConfirmResetClick = useCallback(() => {
        setWaringModalStatus(false)
        setResetModalStatus(true)
    }, [i18n])

    const [resetModalBtnStatus,setResetModalBtnStatus] = useState(true)
    
    const onResetModalInput = useCallback((e)=>{
        let deleteTag = i18n.t("deleteTag")
        let checkStatus = e.target.value.trim() === deleteTag
        if (checkStatus) {
            setResetModalBtnStatus(false)
        }else{
            setResetModalBtnStatus(true)
        }
    },[i18n])

    return (
        <>
            <div className={styles.container}>
                <div className={styles.resetEntryOuter}>
                    <div className={styles.resetEntryContainer} onClick={onShowResetModal}>
                        {i18n.t('resetWallet')}
                    </div>
                </div>
                <div className={styles.logoContainer}>
                    <img src="/img/colorful_logo.svg" className={styles.logo} />
                </div>
                <p className={styles.welcomBack}>
                    {i18n.t('welcomeBack')}
                </p>
                <FormView >
                    <div className={styles.pwdInputContainer}>
                        <Input
                            label={i18n.t('password')}
                            placeholder={i18n.t('enterSecurityPwd')}
                            onChange={onPwdInput}
                            value={pwdValue}
                            inputType={'password'}
                        />
                        <div className={styles.btnContainer}>
                            <Button
                                disable={!unLockBtnStatus}
                                onClick={goToConfirm}
                            >
                                {i18n.t('unlock')}
                            </Button>
                            <p className={styles.bottomUrl}>{POWER_BY}</p>
                        </div>
                    </div>
                </FormView>
            </div>
            <PopupModal
                title={i18n.t('reset_tip_1')}
                leftBtnContent={i18n.t('cancel')}
                rightBtnContent={i18n.t("reset")}
                rightBtnStyle={styles.rigntBtn}
                type={PopupModal_type.warning}
                onLeftBtnClick={onCloseWarningModal}
                onRightBtnClick={onConfirmResetClick}
                content={i18n.t('reset_tip_2')}
                modalVisable={waringModalStatus}
                onCloseModal={onCloseWarningModal}
            />

            <PopupModal
                title={i18n.t('confirm_reset_tip')}
                leftBtnContent={i18n.t('cancel')}
                rightBtnContent={i18n.t("confirm")}
                type={PopupModal_type.input}
                onLeftBtnClick={onCloseResetModal}
                onRightBtnClick={onConfirmDeleteClick}
                modalVisable={resetModalStatus}
                onCloseModal={onCloseResetModal}
                rightBtnDisable={resetModalBtnStatus}
                onInputChange={onResetModalInput}
                inputPlaceholder={i18n.t("deleteTag")}
                clearWhenClose={true}
            />
        </>)
}