import cx from "classnames";
import React, { Component } from "react";
import pwd_error from "../../../assets/images/pwd_error.png";
import pwd_right from "../../../assets/images/pwd_right.png";
import "./index.scss";
import PropTypes from 'prop-types'
export default class CustomInput extends Component {
    constructor(props) {
        super(props);
        this.state = {
            activeLine: false
        };
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
    renderErrorTip = () => {
        let { errorTipShow, showTip } = this.props
        if (!showTip) {
            return
        }
        let imgSource = !errorTipShow ? pwd_right : pwd_error
        return (
            <div className={
                cx({
                    "error-tip-container-show": showTip
                })
            }>
                <img className={"error-tip-img"} src={imgSource} />
                <p className={"error-tip"}>{showTip}</p>
            </div>
        )
    }
    render() {
        return (
            <div className={
                cx({
                    'input-wrapper-1': true,
                })
            }>
                <div className={"lable-container"}>
                    <p className="pwd-lable-1">{this.props.label}</p>
                    <p className="pwd-lable-desc-1">{this.props.descLabel}</p>
                </div>
                <div className={
                    cx({
                        "input-wrapper-row-1": true,
                    })
                }>
                    <input
                        className="create-input-1"
                        onChange={this.props.onTextInput}
                        placeholder={this.props.placeholder}
                        value={"" || this.props.value}
                        spellCheck={false}
                        onFocus={this.onFocus}
                        onBlur={this.onBlur}
                    />
                </div>
                {this.renderErrorTip()}
            </div>
        );
    }
}

CustomInput.defaultProps = { 
    label: "",
    descLabel: "",
    onTextInput: () => { },
    placeholder: "",
    value: "",
    errorTipShow: false,
    showTip: "",
}
CustomInput.propTypes = {
    /**
     * 主标题
     */
    label: PropTypes.string,
    /**
    * 副标题
    */
    descLabel: PropTypes.string,
    /**
     * 输入时的回调
     */
    onTextInput: PropTypes.func,
    /**
   * 默认输入
   */
    placeholder: PropTypes.string,
    /**
    * 当前输入
    */
    value: PropTypes.string,
    /**
     * 是否展示错误数据
     */
    errorTipShow: PropTypes.bool,
    /**
    * 展示的提示
    */
    showTip: PropTypes.string,
}