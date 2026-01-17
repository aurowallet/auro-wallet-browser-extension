import { useCallback, useEffect, useImperativeHandle, useRef } from "react";
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
}) => {
    const textAreaRef = useRef()

    const onKeyup = useCallback((e) => {
        if (e.keyCode === 13) {
            handleBtnClick()
        }
    }, [value])

    const getPositionForTextArea = useCallback(() => {
        let caretPos = textAreaRef.current?.selectionStart || textAreaRef.current?.selectionEnd
        return caretPos
    }, [textAreaRef])

    useImperativeHandle(childRef, () => ({
        setFocus: (focusTarget) => {
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
                $hasError={showBottomTip && bottomErrorTip}
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