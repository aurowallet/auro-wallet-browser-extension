import { ChangeEvent, KeyboardEvent, Ref, useCallback, useEffect, useImperativeHandle, useRef } from "react";

interface TextAreaProps {
  onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  handleBtnClick?: () => void;
  placeholder?: string;
  value?: string;
  className?: string;
  label?: string;
  showBottomTip?: boolean;
  bottomErrorTip?: string;
  childRef?: Ref<TextAreaHandle>;
}

interface TextAreaHandle {
  setFocus: () => void;
  getCurrentCaretPosition: () => number | undefined;
}
import {
    StyledContainer,
    StyledLabel,
    StyledTextArea,
    StyledBottomTip,
} from "./index.styled";

const TextArea = ({
    onChange = () => { },
    handleBtnClick = () => { },
    placeholder = "",
    value = "",
    className = "",

    label = "",
    showBottomTip = false,
    bottomErrorTip = "",
    childRef = null
}: TextAreaProps) => {
    const textAreaRef = useRef<HTMLTextAreaElement>(null)

    const onKeyup = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.keyCode === 13) {
            handleBtnClick()
        }
    }, [value])

    const getPositionForTextArea = useCallback(() => {
        let caretPos = textAreaRef.current?.selectionStart || textAreaRef.current?.selectionEnd
        return caretPos
    }, [textAreaRef])

    useImperativeHandle(childRef, () => ({
        setFocus: () => {
            textAreaRef.current?.focus()
        },
        getCurrentCaretPosition: () => {
            return getPositionForTextArea()
        }
    }));

    useEffect(() => {
        getPositionForTextArea()
    }, [value])

    return (
        <StyledContainer>
            <StyledLabel>{label}</StyledLabel>
            <StyledTextArea
                ref={textAreaRef}
                className={className}
                $hasError={showBottomTip && !!bottomErrorTip}
                value={value}
                onKeyUp={onKeyup}
                onChange={onChange}
                placeholder={placeholder}
            />
            {showBottomTip && bottomErrorTip && (
                <StyledBottomTip>{bottomErrorTip}</StyledBottomTip>
            )}
        </StyledContainer>
    )
}
export default TextArea