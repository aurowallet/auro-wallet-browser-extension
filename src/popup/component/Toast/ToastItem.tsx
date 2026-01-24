import { Component } from 'react';
import { StyledToastItem } from './index.styled';

interface ToastItemProps {
  text: string;
  duration: number;
  onClose?: () => void;
}

class ToastItem extends Component<ToastItemProps> {
    timer: ReturnType<typeof setTimeout> | null = null;
    
    componentDidMount() {
        const { duration, onClose } = this.props;
        this.timer = setTimeout(() => {
            if (onClose) {
                onClose();
            }
        }, duration)
    }
    componentWillUnmount() {
        if (this.timer) clearTimeout(this.timer)
    }
    render() {
        const { text } = this.props;

        if (!text || (text && text.length <= 0)) {
            return <></>
        }
        return (
            <StyledToastItem>
                {text}
            </StyledToastItem>
        );
    }
}

export default ToastItem;