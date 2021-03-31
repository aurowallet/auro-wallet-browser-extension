import React, { Component } from "react";
import "./index.scss";
import cx from "classnames"; 

export const BUTTON_TYPE_CANCEL ="BUTTON_TYPE_CANCEL"
export const BUTTON_TYPE_CONFIRM ="BUTTON_TYPE_CONFIRM"
export const BUTTON_TYPE_HOME_BUTTON ="BUTTON_TYPE_HOME_BUTTON"
export default class Button extends Component {
    constructor(props) {
        super(props);
        this.state = {
        };
    } 
 
    render() { 
        let {content,onClick,disabled,propsClass,buttonType } = this.props
        let currentClassName = ""
        switch (buttonType) {
            case BUTTON_TYPE_CANCEL:
                currentClassName =  cx({
                    "common-button": true,
                    "common-cancel-btn":true, 
                    [propsClass]:true,
                    "click-cursor":true,
                })
                break;
            case BUTTON_TYPE_HOME_BUTTON:
                currentClassName = cx({
                    "common-button": true,
                    [propsClass]:true,
                    "click-cursor":!disabled,
                    "click-cursor-disable":disabled,
                })
                break;
            default:
                currentClassName = cx({
                    "common-button": true,
                    "common-btn-disable": disabled, 
                    "common-btn-usable": !disabled, 
                    [propsClass]:true,
                    "click-cursor":!disabled,
                    "click-cursor-disable":disabled,
                })
                break;
        }
        return (
            <button
                disabled={disabled}
                className={currentClassName}
                onClick={onClick}>
                {content}
                {this.props.children}
            </button>
        );
    }
}