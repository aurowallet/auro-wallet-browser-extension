import React, { Component } from 'react';
import ToastItem from './ToastItem';
import { StyledToastContainer, StyledMask, StyledToastWrap } from './index.styled';

const default_duration = 2000
class ToastContainer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isShowMask: false,
            toastList: [],
            currentToast: {}
        };
    }

    pushToast = (toastProps) => {
        const { text, duration, isShowMask = false } = toastProps;
        let lastDuration = duration || default_duration
        this.setState({
            currentToast: {
                text,
                duration: lastDuration,
            },
            isShowMask
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
        const { isShowMask, currentToast } = this.state;
        return (
            <StyledToastContainer>
                {isShowMask && <StyledMask />}
                <StyledToastWrap>
                    {currentToast.text && <ToastItem onClose={this.popToast} {...currentToast} />}
                </StyledToastWrap>
            </StyledToastContainer>
        );
    }
}

export default ToastContainer;