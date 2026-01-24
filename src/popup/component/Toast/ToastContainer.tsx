import { Component } from 'react';
import ToastItem from './ToastItem';
import { StyledToastContainer, StyledMask, StyledToastWrap } from './index.styled';

interface ToastProps {
  type?: string;
  text: string;
  duration?: number;
  isShowMask?: boolean;
}

interface ToastContainerState {
  isShowMask: boolean;
  toastList: ToastProps[];
  currentToast: Partial<ToastProps>;
}

const default_duration = 2000
class ToastContainer extends Component<object, ToastContainerState> {
    constructor(props: object) {
        super(props);
        this.state = {
            isShowMask: false,
            toastList: [],
            currentToast: {}
        };
    }

    pushToast = (toastProps: ToastProps) => {
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
                    {currentToast.text && currentToast.duration && (
                        <ToastItem 
                            text={currentToast.text} 
                            duration={currentToast.duration} 
                            onClose={this.popToast} 
                        />
                    )}
                </StyledToastWrap>
            </StyledToastContainer>
        );
    }
}

export default ToastContainer;