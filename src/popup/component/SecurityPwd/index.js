import React from "react";
import { SEC_DELETE_ACCOUNT, SEC_SHOW_MNEMONIC, SEC_SHOW_PRIVATE_KEY } from "../../../constant/secTypes";
import { getLanguage } from "../../../i18n";
import Button from "../Button";
import ConfirmModal from "../ConfirmModal";
import TextInput from "../TextInput";

export default class SecurityPwd extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      pwd: "",
    };
    this.isUnMounted = false;
  }

  componentDidMount() {
    let action = this.props.action
    let title = getLanguage('prompt')
    let content = ""
    let confirmText = getLanguage('isee')
    switch (action) {
      case SEC_DELETE_ACCOUNT:
        content = getLanguage('deleteAccountTip')
        break
      case SEC_SHOW_PRIVATE_KEY:
        content = [
          getLanguage('privateKeyTip_1'),
          getLanguage('privateKeyTip_2')]
        break
      case SEC_SHOW_MNEMONIC:
        content = [
          getLanguage('backTips_1'),
          getLanguage('backTips_2'),
          getLanguage('backTips_3'),]
        break
    }
    ConfirmModal.show({
      title, content,
      confirmText,
      showClose: true,
      onConfirm: this.onModalConfirm,
    })

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

  onPwdInput = (e) => {
    let pwd = e.target.value;
    this.callSetState({
      pwd
    }, () => {
      if (this.state.pwd.trim().length > 0) {
        this.callSetState({
          btnClick: true
        })
      } else {
        this.callSetState({
          btnClick: false
        })
      }
    })
  }

  onConfirm = () => {
    const { onClickCheck } = this.props
    if (onClickCheck) {
      onClickCheck(this.state.pwd)
    }
  }
  renderBottomBtn = () => {
    return (
      <div className="bottom-container">
        <Button
          disabled={!this.state.btnClick}
          content={getLanguage('confirm_1')}
          onClick={this.onConfirm}
        />
      </div>
    )
  }
  renderInput = () => {
    return (
      <TextInput
        value={this.state.pwd}
        label={getLanguage('securityHolder')}
        onTextInput={this.onPwdInput}
      />
    )
  }
  onSubmit = (event) => {
    event.preventDefault();
  }
  render() {
    return (
      <form onSubmit={this.onSubmit}>
        <div className={'common-container'}>
          {this.renderInput()}
        </div>
        {this.renderBottomBtn()}
      </form>
    );
  }
}