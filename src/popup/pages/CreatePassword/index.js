import React from "react";
import { connect } from "react-redux";
import { MINA_CREATE_PWD } from "../../../constant/types";
import { getLanguage } from "../../../i18n";
import { setLanguage } from "../../../reducers/appReducer";
import { sendMsg } from "../../../utils/commonMsg";
import { matchList } from "../../../utils/validator";
import Button from "../../component/Button";
import CustomView from "../../component/CustomView";
import TextInput from "../../component/TextInput";
import "./index.scss";

class CreatePassword extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      inputPwd: "",
      confirmPwd: "",
      errorTip: "",
      btnClick: false,
      matchList: matchList
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
  setBtnStatus = () => {
    let errList = this.state.matchList.filter(v => {
      if (!v.bool) {
        return v
      }
    })
      if (errList.length <= 0 && this.state.confirmPwd.length > 0 && !this.state.errorTip) {
        this.callSetState({
          btnClick: true,
        })
      } else {
        this.callSetState({
          btnClick: false,
        })
        
      }
  };
  goToCreate = () => {
    let { welcomeNextRoute } = this.props.cache
    sendMsg({
      action: MINA_CREATE_PWD,
      payload: {
        pwd: this.state.confirmPwd,
      }
    }, (res) => { })
    let nextRoute = welcomeNextRoute
    this.props.history.push({
      pathname: nextRoute,
      params: {
        "pwd": this.state.confirmPwd,
      },
    })

  };
  onPwdInput = (e) => {
    const { value } = e.target;
    let { matchList } = this.state
    this.callSetState({
      inputPwd: value,
    },()=>{
      this.callSetState({
        matchList: matchList.map(v => {
          if (v.expression.test(value)) {
            v.bool = true;
          } else {
            v.bool = false;
          }
          return v;
        })
      },()=>{
        this.setBtnStatus()
      })
    })
  }
  onPwdConfirmInput = (e) => {
    const { value } = e.target;
      this.callSetState({
        confirmPwd: value,
      },()=>{
        if (this.state.confirmPwd.length > 0 && this.state.inputPwd !== this.state.confirmPwd) {
          this.callSetState({
            errorTip: getLanguage('passwordDifferent')
          },() => {
            this.setBtnStatus()
          })
        } else {
          this.callSetState({
            errorTip: ""
          },()=>{
            this.setBtnStatus()
          })
        }
      })
  }
  onSubmit = (event) => {
    event.preventDefault();
  }
  render() {
    return (
      <CustomView
        title={getLanguage('createPassword')}
        history={this.props.history}>
        <form onSubmit={this.onSubmit}>
          <div className="create_container">
            <TextInput
              value={this.state.inputPwd}
              label={getLanguage('inputPassword')}
              onTextInput={this.onPwdInput}
              showErrorTag={true}
              matchList={this.state.matchList}
            />
            <TextInput
              value={this.state.confirmPwd}
              label={getLanguage('confirmPassword')}
              onTextInput={this.onPwdConfirmInput}
              errorTip={this.state.errorTip}
            />
            <p className={"create-desc"}>{getLanguage('createPasswordTip')}</p>
          </div>
          <div className="bottom-container">
            <Button
              disabled={!this.state.btnClick}
              content={getLanguage('next')}
              onClick={this.goToCreate}
            />
          </div>
        </form>
      </CustomView>
    )
  }
}

const mapStateToProps = (state) => ({
  cache: state.cache
});

function mapDispatchToProps(dispatch) {
  return {
    setLanguage: (lan) => {
      dispatch(setLanguage(lan));
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(CreatePassword);
