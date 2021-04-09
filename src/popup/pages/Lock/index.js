import React from "react";
import { connect } from "react-redux";
import home_logo from "../../../assets/images/home_logo.png";
import { WALLET_APP_SUBMIT_PWD } from "../../../constant/types";
import { getLanguage } from "../../../i18n";
import { updateCurrentAccount } from "../../../reducers/accountReducer";
import { sendMsg } from "../../../utils/commonMsg";
import Button from "../../component/Button";
import CustomView from "../../component/CustomView";
import TextInput from "../../component/TextInput";
import Toast from "../../component/Toast";
import "./index.scss";
class LockPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            password: "",
            btnClick: true,
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
    goToConfirm = async () => {
        sendMsg({
            action: WALLET_APP_SUBMIT_PWD,
            payload: this.state.password
        },
            (account) => {
                if (account.error) {
                    if(account.type === "local"){
                        Toast.info(getLanguage(account.error))
                    }else{
                        Toast.info(account.error)
                    }
                } else {
                    this.props.updateCurrentAccount(account)
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
        },()=>{
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
    render() {
        return (
            <CustomView
                title={getLanguage('minaWallet')}
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
                </div>
                <div className={"lock-bottom"}>
                    <p className="lock-bottom" >Powered by Bit Cat</p>
                </div>
            </CustomView>)
    }
}

const mapStateToProps = (state) => ({});

function mapDispatchToProps(dispatch) {
    return {
        updateCurrentAccount: (account) => {
            dispatch(updateCurrentAccount(account))
        },
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(LockPage);
