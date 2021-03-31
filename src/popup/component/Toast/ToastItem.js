import React, { Component } from 'react';
import "./ToastItem.scss";

class ToastItem extends Component {
    componentDidMount() {
        const { id, duration, onClose, isShowMask } = this.props;
        this.timer = setTimeout(() => {
            if (onClose) {
                onClose(id, isShowMask);
            }
        }, duration)
    }
    componentWillUnmount() {
        clearTimeout(this.timer)
    }
    render() {
        const { text } = this.props;

        if (!text || (text && text.length <= 0)) {
            return <></>
        }
        return (
            <div className="toast-item">
                {text}
            </div>
        );
    }
}

export default ToastItem;