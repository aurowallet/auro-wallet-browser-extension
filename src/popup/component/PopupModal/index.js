import { useCallback, useEffect, useMemo, useState } from "react";
import { isTrueNumber, nameLengthCheck } from "../../../utils/utils";
import Input from "../Input";
import {
    StyledModalOverlay,
    StyledModalContent,
    StyledTopContainer,
    StyledIconContainer,
    StyledModalTitle,
    StyledContent,
    StyledBottomContainer,
    StyledLeftButton,
    StyledRightButton,
    StyledDivider,
    StyledComponentContent,
} from "./index.styled";

export const PopupModal_type = {
    common: "popup_common",
    warning: "popup_warning",
    input: "popup_input"
}

export const PopupModal = ({
    title = "",
    content = "",
    componentContent = <></>,
    leftBtnContent = "",
    rightBtnContent = "",
    rightBtnStyle = "",

    type = PopupModal_type.common,
    onLeftBtnClick = () => { },
    onRightBtnClick = () => { },
    modalVisible,

    inputType = "text",
    inputPlaceholder = "",
    showBottomTip = false,
    bottomTip = "",
    bottomTipClass = "",
    onInputChange = () => { },
    contentList = [],
    maxInputLength = -1,

    rightBtnDisable = false,
    clearWhenClose = true,
    zIndex
}) => {

    const [inputValue, setInputValue] = useState("")

    const {
        modalTopIcon
    } = useMemo(() => {
        let modalTopIcon = ""
        if (type === PopupModal_type.warning) {
            modalTopIcon = "/img/unusual.svg"
        }
        return {
            modalTopIcon,
        }
    }, [type])

    const onLeftClick = useCallback(() => {
        onLeftBtnClick()
    }, [onLeftBtnClick])

    const onRightClick = useCallback(() => {
        if (rightBtnDisable) {
            return
        }
        onRightBtnClick({ inputValue })
    }, [onRightBtnClick, inputValue, rightBtnDisable])

    const onInput = useCallback((e) => {
        if (maxInputLength !== -1 && isTrueNumber(maxInputLength)) {
            let checkResult = nameLengthCheck(e.target.value, maxInputLength)
            if (checkResult) {
                onInputChange(e)
                setInputValue(e.target.value)
            }
        } else {
            onInputChange(e)
            setInputValue(e.target.value)
        }
    }, [onInputChange, maxInputLength])

    useEffect(() => {
        if (!modalVisible && clearWhenClose) {
            setInputValue("")
        }
    }, [modalVisible, clearWhenClose])

    return (
        <>
            {modalVisible && (
                <StyledModalOverlay $zIndex={zIndex}>
                    <StyledModalContent>
                        <StyledTopContainer>
                            {modalTopIcon && (
                                <StyledIconContainer>
                                    <img src={modalTopIcon} />
                                </StyledIconContainer>
                            )}
                            <StyledModalTitle>{title}</StyledModalTitle>
                            {content && <StyledContent>{content}</StyledContent>}
                            {contentList.length > 0 &&
                                contentList.map((contentItem, index) => {
                                    return <StyledContent key={index}>{contentItem}</StyledContent>
                                })
                            }
                            {type === PopupModal_type.input && (
                                <Input
                                    placeholder={inputPlaceholder || ""}
                                    onChange={onInput}
                                    value={inputValue}
                                    inputType={inputType}
                                    showBottomTip={showBottomTip}
                                    bottomTip={bottomTip}
                                    bottomTipClass={bottomTipClass}
                                />
                            )}
                            {componentContent && (
                                <StyledComponentContent>
                                    {componentContent}
                                </StyledComponentContent>
                            )}
                        </StyledTopContainer>
                        {(leftBtnContent || rightBtnContent) && (
                            <StyledBottomContainer>
                                {leftBtnContent && (
                                    <StyledLeftButton onClick={onLeftClick}>
                                        {leftBtnContent}
                                    </StyledLeftButton>
                                )}
                                {leftBtnContent && rightBtnContent && <StyledDivider />}
                                {rightBtnContent && (
                                    <StyledRightButton
                                        className={rightBtnStyle}
                                        $disabled={rightBtnDisable}
                                        onClick={onRightClick}
                                    >
                                        {rightBtnContent}
                                    </StyledRightButton>
                                )}
                            </StyledBottomContainer>
                        )}
                    </StyledModalContent>
                </StyledModalOverlay>
            )}
        </>
    )
} 