import React, { Component } from 'react';
import "./ToastContainer.scss";
import ToastItem from './ToastItem';


const default_duration = 2000
class ToastContainer extends Component {
    state = {
        isShowMask: false, 
        toastList: [], 
        currentToast: {}
    }

    pushToast = (toastProps) => {
        const { type, text, duration, isShowMask = false } = toastProps;
        let lastDuration = duration || default_duration
        this.setState({
            currentToast: {
                id: getUuid(),
                type,
                text,
                duration: lastDuration,
                isShowMask
            }
        });
    }

    popToast = () => {
        this.setState({
            currentToast: {},
            isShowMask: false
        }, () => {
        });
    }

    render() {
        const { toastList, isShowMask, currentToast } = this.state;
        return (
            <div className="toast-container">
                {isShowMask && <div className="mask" />}
                <div className="toast-wrap">
                    {currentToast.text && <ToastItem onClose={this.popToast} {...currentToast} />}
                </div>
            </div>
        );
    }
}

let toastCount = 0;


const getUuid = () => {
    return 'toast-container' + new Date().getTime() + '-' + toastCount++;
};

export default ToastContainer;