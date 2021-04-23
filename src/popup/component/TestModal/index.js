import cx from "classnames";
import React, { Component } from "react";
import "./index.scss";
import PropTypes from 'prop-types'
export default class TestModal extends Component {
    constructor(props) {
        super(props);
        this.state = {
            confirmModal: false
        };
    }

    setModalVisable = (visable) => {
        this.setState({
            confirmModal: visable
        })
    }
    onClickOuter = () => {
        let touchToClose = this.props.touchToClose
        if (touchToClose) {
            this.setModalVisable(false)
        }
    }
    onClickInner = (e) => {
        e.stopPropagation();
    }
    render() {
        let title = this.props.title || " "
        return (
            <div className={
                cx({
                    "testmodal-container": true,
                    "testmodal-container-none": !this.state.confirmModal
                })
            }>
                <div onClick={this.onClickOuter} className={"testmodal-modal-inner"}>
                    <div onClick={this.onClickInner} className={cx({ "testmodal-modal": true })}>
                        <p className={
                            cx({ "testmodal-title": true })
                        }>{title}</p>
                        {this.props.children}
                    </div>
                </div>
            </div>
        )
    }
}

TestModal.defaultProps = {
    title: "",
    touchToClose:false,
    children:""
}
TestModal.propTypes = {
    title: PropTypes.string,
    touchToClose:PropTypes.bool,
    children:PropTypes.element
}