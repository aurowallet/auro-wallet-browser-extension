import cx from "classnames";
import React, { Component } from "react";
import eyeClose from "../../../assets/images/eyeClose.png";
import eyeOpen from "../../../assets/images/eyeOpen.png";
import pwd_error from "../../../assets/images/pwd_error.png";
import pwd_right from "../../../assets/images/pwd_right.png";
import { getLanguage } from "../../../i18n";
import "./index.scss";
import PropTypes from 'prop-types'


export default class TextInput extends Component {
    constructor(props) {
        super(props);
        this.state = {
            pwdHide: true,
            activeLine: false,
            inputValue: ""
        };
    }
    onClickEye = () => {
        this.setState({
            pwdHide: !this.state.pwdHide
        })
    }
    onFocus = () => {
        this.setState({
            activeLine: true
        })
    }
    onBlur = () => {
        this.setState({
            activeLine: false
        })
    }
    renderRuleTip = () => {
        let { showErrorTag, matchList } = this.props
        let rulesMatchList = matchList || []
        return (rulesMatchList.map((item, index) => {
            let imgSource = item.bool ? pwd_right : pwd_error
            return (
                <div key={index + ""} className={
                    cx({
                        "error-tip-container-none": !showErrorTag,
                        "error-tip-container-show": showErrorTag && (this.state.activeLine || this.state.inputValue.length > 0),
                        "error-tip-container-hide": showErrorTag && !this.state.activeLine && this.state.inputValue.length <= 0,
                    })
                }>
                    <img className={"error-tip-img"} src={imgSource} />
                    <p className={"error-tip"}>{getLanguage(item.text)}</p>
                </div>
            )

        }))
    }
    onInput = (e) => {
        if (this.props.onTextInput) {
            this.props.onTextInput(e)
        }
        this.setState({
            inputValue: e.target.value
        })
    }
    renderErrorTip = () => {
        let { errorTip } = this.props
        if (!errorTip) {
            return
        }
        return (
            <div className={
                cx({
                    "error-tip-container-show": errorTip
                })
            }>
                <img className={"error-tip-img"} src={pwd_error} />
                <p className={"error-tip"}>{errorTip}</p>
            </div>
        )
    }
    render() {
        let imgSrc = this.state.pwdHide ? eyeClose : eyeOpen
        return (
            <div className='input-wrapper'>
                <p className="pwd-lable">{this.props.label}</p>
                <div className="input-wrapper-row">
                    <input
                        className="create-input"
                        type={this.state.pwdHide ? "password" : "text"}
                        onChange={this.onInput}
                        placeholder={this.props.placeholder}
                        value={"" || this.props.value}
                        spellCheck={false}
                        onFocus={this.onFocus}
                        onBlur={this.onBlur}
                    />
                    <img className="pwd-show-status click-cursor" onClick={this.onClickEye} src={imgSrc}></img>
                </div>
                {this.renderRuleTip()}
                {this.renderErrorTip()}
            </div>
        );
    }
}