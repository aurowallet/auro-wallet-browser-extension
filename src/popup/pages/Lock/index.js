import cx from "classnames";
import React from "react";
import { connect } from "react-redux";
import home_logo from "../../../assets/images/home_logo.png";
import reminderRed from "../../../assets/images/reminderRed.svg";
import { clearLocalExcept, getLocal, saveLocal } from "../../../background/localStorage";
import { clearStorage } from "../../../background/storageService";
import { CURRENCY_UNIT } from "../../../constant/pageType";
import { CURRENCY_UNIT_CONFIG, NET_WORK_CONFIG } from "../../../constant/storageKey";
import { RESET_WALLET, WALLET_APP_SUBMIT_PWD } from "../../../constant/types";
import { getLanguage } from "../../../i18n";
import { resetWallet } from "../../../reducers";
import { initCurrentAccount } from "../../../reducers/accountReducer";
import { updateCurrencyConfig } from "../../../reducers/currency";
import { updateNetConfig } from "../../../reducers/network";
import { sendMsg } from "../../../utils/commonMsg";
import { trimSpace } from "../../../utils/utils";
import Button from "../../component/Button";
import ConfirmModal from "../../component/ConfirmModal";
import CustomInput from "../../component/CustomInput";
import CustomView from "../../component/CustomView";
import TestModal from "../../component/TestModal";
import TextInput from "../../component/TextInput";
import Toast from "../../component/Toast";
import "./index.scss";
class LockPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            password: "",
            btnClick: false,
            confirmText: "",
            deleteTagStatus: false
        };
        this.isUnMounted = false;
        this.modal = React.createRef();
    }
    componentWillUnmount() {
        this.isUnMounted = true;
    }
    callSetState = (data, callback) => {
        if (!this.isUnMounted) {
            this.setState({
                ...data
            }, () => {
                callback && callback()
            })
        }
    }
    goToConfirm = async () => {
        sendMsg({
            action: WALLET_APP_SUBMIT_PWD,
            payload: this.state.password
        },
            (account) => {
                if (account.error) {
                    if (account.type === "local") {
                        Toast.info(getLanguage(account.error))
                    } else {
                        Toast.info(account.error)
                    }
                } else {
                    this.props.initCurrentAccount(account)
                    this.props.history.push({
                        pathname: "/homepage",
                    })
                }
            })
    }

    onPwdInput = (e) => {
        let value = e.target.value
        value = value.trim()
        this.callSetState({
            password: value
        }, () => {
            if (this.state.password.length > 0) {
                this.callSetState({
                    btnClick: true,
                })
            } else {
                this.callSetState({
                    btnClick: false,
                })
            }
        })
    }
    onSubmit = (event) => {
        event.preventDefault();
    }
    renderPwdInput = () => {
        return (
            <form onSubmit={this.onSubmit}>
                <div className={"lock-inner-container"}>
                    {this.renderWelcome()}
                    <TextInput
                        value={this.state.password}
                        label={getLanguage("inputPassword")}
                        onTextInput={this.onPwdInput}
                    />
                    {this.renderConfirm()}
                </div>
            </form>
        )
    }
    renderConfirm = () => {
        return (
            <div className="lock-button-container">
                <Button
                    disabled={!this.state.btnClick}
                    content={getLanguage('lockButton')}
                    onClick={this.goToConfirm}
                />
            </div>
        )
    }
    renderWelcome = () => {
        return (
            <p className={'lock-welcome-content'}>{getLanguage("welcomeBack")}</p>
        )
    }
    onTextInput = (e) => {
        if (!this.isUnMounted) {
            this.callSetState({
                confirmText: e.target.value,
            }, () => {
                this.checkDeleteTagStatus()
            })
        }
    }
    renderInput = () => {
        return (
            <div className="lock-input-wrapper">
                <CustomInput
                    wrapPropClass={"lock-input"}
                    value={this.state.confirmText}
                    onTextInput={this.onTextInput}
                />
            </div>)
    }
    renderActionBtn = () => {
        return (
            <div className={"lock-info-btn-container"}>
                <Button
                    content={getLanguage('confirm')}
                    onClick={this.onConfirmReset}
                    propsClass={"account-common-btn"}
                    disabled={!this.state.deleteTagStatus}
                />
                <Button
                    content={getLanguage('cancel')}
                    propsClass={"account-common-btn"}
                    onClick={this.onCloseModal}
                />
            </div>
        )
    }
    renderChangeModal = () => {
        return (<TestModal
            ref={this.modal}>
            <div className={'account-change-name-container'}>
                <div className={"account-change-title-container"}>
                    <p className={
                        cx({ "account-change-name-title": true })
                    }>{getLanguage('confirm_reset_tip')}</p>
                </div>
                {this.renderInput()}
                {this.renderActionBtn()}
            </div>
        </TestModal>)
    }
    checkDeleteTagStatus = () => {
        let realText = trimSpace(this.state.confirmText)
        let deleteTag = getLanguage("deleteTag")
        let checkStatus = realText === deleteTag
        this.callSetState({
            deleteTagStatus: checkStatus
        })
    }
    onConfirmReset = () => {
        if (this.state.deleteTagStatus) {
            sendMsg({
                action: RESET_WALLET,
            }, () => {
                clearStorage()
                clearLocalExcept(NET_WORK_CONFIG)
                this.props.resetWallet()
                let netConfig = getLocal(NET_WORK_CONFIG)
                if (netConfig) {
                    netConfig = JSON.parse(netConfig)
                    this.props.updateNetConfig(netConfig)
                }

                let currencyList = CURRENCY_UNIT
                currencyList[0].isSelect = true
                this.props.updateCurrencyConfig(currencyList)
                saveLocal(CURRENCY_UNIT_CONFIG, JSON.stringify(currencyList[0].key))

                this.props.history.push("welcome_page"); // Reload
            })
        }
    }
    showConfirmModal = () => {
        this.modal.current.setModalVisable(true)
    }
    onCloseModal = () => {
        this.modal.current.setModalVisable(false)
    }
    onClickRestore = () => {
        let title = getLanguage('prompt')
        let content = ""
        let cancelText = getLanguage('confirmReset')
        let confirmText = getLanguage('cancelReset')
        let tipImgSrc = reminderRed
        content = [
            getLanguage('reset_tip_1'),
            getLanguage('reset_tip_2'),]
        ConfirmModal.show({
            title,
            content,
            cancelText,
            confirmText,
            showClose: true,
            tipImgSrc,
            onCancel: this.showConfirmModal,
        })
    }
    render() {
        return (
            <CustomView
                title={getLanguage('walletName')}
                noBack={true}
                isReceive={true}
                history={this.props.history}>
                <div className={"lock-container"}>
                    <div className={"lock-logo-container"}>
                        <img className={"lock-home-logo"} src={home_logo} />
                    </div>
                    <div className={"lock-content-container"}>

                        {this.renderPwdInput()}
                    </div>
                    <div className={"restore-bottom-container"}>
                        <p className="restore-bottom" onClick={this.onClickRestore}>{getLanguage('resetWallet')}</p>
                    </div>
                </div>

                <div className={"lock-bottom"}>
                    <p className="lock-bottom" >Powered by Bit Cat</p>
                </div>
                <form onSubmit={this.onSubmit}>
                    {this.renderChangeModal()}
                </form>
            </CustomView>)
    }
}

const mapStateToProps = (state) => ({
});

function mapDispatchToProps(dispatch) {
    return {
        resetWallet: () => {
            dispatch(resetWallet())
        },
        updateNetConfig: (config) => {
            dispatch(updateNetConfig(config))
        },
        updateCurrencyConfig: (config) => {
            dispatch(updateCurrencyConfig(config))
        },
        initCurrentAccount: (account) => {
            dispatch(initCurrentAccount(account))
        },

    };
}

export default connect(mapStateToProps, mapDispatchToProps)(LockPage);
