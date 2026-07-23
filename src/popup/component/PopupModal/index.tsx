import { ChangeEvent, ElementType, ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { getCharLength, isTrueNumber, nameLengthCheck, truncateByCharLength } from "../../../utils/utils";
import Input from "../Input";
import { RuleSet } from "styled-components";

interface PopupModalProps {
  title?: string;
  content?: string;
  componentContent?: ReactNode;
  leftBtnContent?: string;
  rightBtnContent?: string;
  rightBtnStyle?: string | RuleSet<object>;
  type?: string;
  onLeftBtnClick?: () => void;
  onRightBtnClick?: (data: { inputValue: string }) => void;
  onCloseModal?: () => void;
  modalVisible?: boolean;
  inputType?: string;
  inputPlaceholder?: string;
  inputValue?: string;
  showBottomTip?: boolean;
  bottomTip?: string;
  bottomTipClass?: ElementType;
  onInputChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  contentList?: string[];
  maxInputLength?: number;
  rightBtnDisable?: boolean;
  clearWhenClose?: boolean;
  zIndex?: number;
}
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
    inputValue: initialInputValue = "",
    showBottomTip = false,
    bottomTip = "",
    bottomTipClass,
    onInputChange = () => { },
    contentList = [],
    maxInputLength = -1,

    rightBtnDisable = false,
    clearWhenClose = true,
    zIndex
}: PopupModalProps) => {

    const [inputValue, setInputValue] = useState(initialInputValue)

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

    const onInput = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        if (maxInputLength !== -1 && isTrueNumber(maxInputLength)) {
            const nextValue = e.target.value
            const inputType = (e.nativeEvent as InputEvent | undefined)?.inputType || ""
            const isDeleteOrUndo = inputType.startsWith("delete") || inputType === "historyUndo"
            const isInsert = inputType.startsWith("insert")
            const isShortening = getCharLength(nextValue) < getCharLength(inputValue)
            const shouldKeepOverLimitValue = isDeleteOrUndo || (!isInsert && isShortening)
            const normalizedValue = nameLengthCheck(nextValue, maxInputLength) || shouldKeepOverLimitValue
                ? nextValue
                : truncateByCharLength(nextValue, maxInputLength)

            if (normalizedValue !== nextValue) {
                e.target.value = normalizedValue
                e.currentTarget.value = normalizedValue
            }
            onInputChange(e)
            setInputValue(normalizedValue)
        } else {
            onInputChange(e)
            setInputValue(e.target.value)
        }
    }, [onInputChange, maxInputLength, inputValue])

    useEffect(() => {
        if (modalVisible) {
            setInputValue(initialInputValue)
        } else if (clearWhenClose) {
            setInputValue("")
        }
    }, [modalVisible, clearWhenClose, initialInputValue])

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
                                        className={typeof rightBtnStyle === 'string' ? rightBtnStyle : undefined}
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