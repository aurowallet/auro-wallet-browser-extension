import cx from "classnames";
import React, { Component } from "react";
import Button, { BUTTON_TYPE_CANCEL } from "../Button";
import "./index.scss";
export default class ConfirmModalContainer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showModal: false
        };
        this.title = ""
        this.content = ""
        this.cancelText = ""
        this.confirmText = ""
        this.elementContent = ""

        this.onCancel = () => { }
        this.onConfirm = () => { }
        this.touchToClose = false
        this.tipImgSrc = ""
        this.widthAuto = false
    }

    show = (params) => {
        let { title, content, onCancel, onConfirm, cancelText, confirmText, touchToClose, elementContent,tipImgSrc,widthAuto } = params
        this.title = title
        this.content = content
        this.cancelText = cancelText
        this.confirmText = confirmText

        this.onCancel = onCancel
        this.onConfirm = onConfirm
        this.touchToClose = touchToClose
        this.tipImgSrc = tipImgSrc
        this.elementContent = elementContent

        this.widthAuto = widthAuto
        this.setState({ showModal: true })
    }
    hide = () => {
        this.setState({ showModal: false })
    }
    renderCancelButton = () => {
        return (
            <Button
                buttonType={BUTTON_TYPE_CANCEL}
                content={this.cancelText}
                propsClass={this.widthAuto ? "":'modal-button-width'}
                onClick={() => {
                    this.hide()
                    this.onCancel && this.onCancel()
                }}
            />
        )
    }

    renderConfirmButton = () => {
        return (
            <Button
                content={this.confirmText}
                propsClass={this.widthAuto ? "":'modal-button-width'}
                onClick={() => {
                    this.hide()
                    this.onConfirm && this.onConfirm()
                }}
            />
        )
    }
    renderModalContent=()=>{
        if(this.elementContent){
            return this.elementContent()
        }else{
            return <>{Array.isArray(this.content) ?
                this.content.map((item, index) => {
                    return <p key={index + ""} className={'confirm-content'}>{item}</p>
                }) : <p className={'confirm-content'}>{this.content}</p>}</>
        }
       
    }
    render() {
        return (
            <div className={
                cx({
                    "confirm-container": this.state.showModal,
                    "confirm-container-hide": !this.state.showModal,
                })
            }>
                <div className={"confirm-content-container"}>
                {this.tipImgSrc&& <div className={"confirm-img-container"}>
                    <img className={"confirm-img"} src={this.tipImgSrc} />
                </div>}
                    <p className={"confirm-title"}>{this.title}</p>
                    {this.renderModalContent()}
                    <div className={
                        cx({
                            "confirm-button-container": this.cancelText,
                            "confirm-button-container-nocancel": !this.cancelText
                        })}>
                        {this.cancelText && this.renderCancelButton()}
                        {this.renderConfirmButton()}
                    </div>
                </div>
            </div>
        );
    }
}