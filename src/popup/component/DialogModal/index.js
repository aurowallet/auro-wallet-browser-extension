import cx from "classnames";
import React, { Component } from "react";
import modalClose from "../../../assets/images/modalClose.png";
import "./index.scss";

export default class DialogModal extends Component {
    constructor(props) {
        super(props);
        this.state = {
            confirmModal: false
        };
    }

    setModalVisible = (visible) => {
        const { actionCallback } = this.props
        this.setState({
            confirmModal: visible
        }, () => {
            actionCallback && actionCallback(visible)
        })
    }
    onClickOuter = () => {
        let touchToClose = this.props.touchToClose
        if (touchToClose) {
            this.setModalVisible(false)
        }
    }
    onClickInner = (e) => {
        e.stopPropagation();
    }
    render() {
        return (
            <div className={
                cx({
                    "test-modal-container": true,
                    "test-modal-container-none": !this.state.confirmModal
                })
            }>
                <div onClick={this.onClickOuter} className={"test-modal-modal-inner"}>
                    <div onClick={this.onClickInner} className={cx({ "test-modal-modal": true })}>
                        {this.props.showClose && <img
                            onClick={() => { this.setModalVisible(false) }}
                            className="test-modal-close click-cursor"
                            src={modalClose} />}
                        {this.props.children}
                    </div>
                </div>

            </div>
        )
    }
}
