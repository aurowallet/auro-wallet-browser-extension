import React from "react";
import { connect } from "react-redux";
import { MINA_CHANGE_SEC_PASSWORD } from "../../../constant/types";
import { getLanguage } from "../../../i18n";
import { sendMsg } from "../../../utils/commonMsg";
import { matchList, pwdValidate } from "../../../utils/validator";
import Button from "../../component/Button";
import CustomView from "../../component/CustomView";
import TextInput from "../../component/TextInput";
import Toast from "../../component/Toast";
import "./index.scss";
class Reset extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            oldPassword: "",
            newPassword: "",
            confirmPassword: "",
            errorTip: "",
            matchList: matchList,
            btnClick: false,
        };
        this.isUnMounted = false;
    }
    componentWillUnmount(){
        this.isUnMounted = true;
      }
      callSetState=(data,callback)=>{
        if(!this.isUnMounted){
          this.setState({
            ...data
          },()=>{
            callback&&callback()
          })
        }
      }
    onOldPasswordInput = (e) => {
        let pwd = e.target.value
        this.callSetState({
            oldPassword: pwd
        })
    }
    onNewPasswordInput = (e) => {
        let pwd = e.target.value
        let { matchList } = this.state
        this.callSetState({
            newPassword: pwd
        }, () => {
            this.callSetState({
                matchList: matchList.map(v => {
                    if (v.expression.test(pwd)) {
                        v.bool = true;
                    } else {
                        v.bool = false;
                    }
                    return v;
                })
            })
        })
    }
    setBtnStatus = () => {
        let errList = this.state.matchList.filter(v => {
            if (!v.bool) {
                return v
            }
        })
        if (this.state.oldPassword.length > 0
            && errList.length <= 0
            && this.state.confirmPassword.length > 0
            && !this.state.errorTip) {
            this.callSetState({
                btnClick: true,
            })
        } else {
            this.callSetState({
                btnClick: false,
            })
        }
    };
    onConfirmPasswordInput = (e) => {
        let pwd = e.target.value
        this.callSetState({
            confirmPassword: pwd
        },
            () => {
                if ((this.state.newPassword.length > 0 && this.state.confirmPassword.length > 0) && this.state.confirmPassword !== this.state.newPassword) {
                    this.callSetState({
                        errorTip: getLanguage('passwordDifferent')
                    }, () => {
                        this.setBtnStatus()
                    })
                } else {
                    this.callSetState({
                        errorTip: ""
                    }, () => {
                        this.setBtnStatus()
                    })
                }

            })
    }
    onSubmit = (event) => {
        event.preventDefault();
    }
    renderPasswardContent = () => {
        return (
            <div>
                <TextInput
                    value={this.state.oldPassword}
                    label={getLanguage('inputOldPwd')}
                    onTextInput={this.onOldPasswordInput}
                />
                <TextInput
                    value={this.state.newPassword}
                    label={getLanguage('inputNewPwd')}
                    onTextInput={this.onNewPasswordInput}
                    showErrorTag={true}
                    matchList={this.state.matchList}
                />
                <TextInput
                    value={this.state.confirmPassword}
                    label={getLanguage('inputNewPwdRepeat')}
                    onTextInput={this.onConfirmPasswordInput}
                    errorTip={this.state.errorTip}
                />
            </div>
        )
    }
    onConfirm = () => {
        if (this.state.oldPassword.trim().length <= 0) {
            Toast.info(getLanguage('inputOldPwd'))
            return
        }
        if (this.state.newPassword.trim().length <= 0) {
            Toast.info(getLanguage('inputNewPwd'))
            return
        }
        let ruleResult = pwdValidate(this.state.newPassword)
        for (let index = 0; index < ruleResult.length; index++) {
            const ruleItem = ruleResult[index];
            if (!ruleItem.bool) {
                Toast.info(ruleItem.text)
                return
            }
        }
        if (this.state.newPassword !== this.state.confirmPassword) {
            Toast.info(getLanguage('passwordDifferent'))
            return
        }
        this.resetPwd()
    }
    resetPwd = () => {
        sendMsg({
            action: MINA_CHANGE_SEC_PASSWORD,
            payload: {
                oldPassword: this.state.oldPassword,
                password: this.state.newPassword
            }
        }, (res) => {
            if (res.code === 0) {
                Toast.info(getLanguage('pwdChangeSuccess'))
                setTimeout(() => {
                    this.props.history.goBack()
                }, 500);
            } else {
                Toast.info(getLanguage('passwordError'))
            }
        })
    }
    renderBottomBtn = () => {
        return (
            <div className="reset-bottom-container">
                <Button
                    disabled={!this.state.btnClick}
                    content={getLanguage('confirm_1')}
                    onClick={this.onConfirm}
                />
            </div>
        )
    }
    render() { 
        return (
            <CustomView
                title={getLanguage('changeSecPassword')}
                history={this.props.history}>
                <form onSubmit={this.onSubmit}>
                    <div className="reset-container">
                        {this.renderPasswardContent()}
                    </div>
                    {this.renderBottomBtn()}
                </form>
            </CustomView>)
    }
}

const mapStateToProps = (state) => ({});

function mapDispatchToProps(dispatch) {
    return {};
}

export default connect(mapStateToProps, mapDispatchToProps)(Reset);
