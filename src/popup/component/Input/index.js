import { useCallback, useState } from "react";
import { Trans } from "react-i18next";
import i18n from "i18next";
import { numberFormat } from "../../../utils/utils";
import {
    StyledInputContainer,
    StyledLabelRow,
    StyledLabelContent,
    StyledSubLabel,
    StyledBoldLabel,
    StyledInputWrapper,
    StyledInput,
    StyledPasswordToggle,
    StyledBottomTip,
    StyledSearchIcon,
} from "./index.styled";

const Input = ({
    onChange = () => { },
    handleBtnClick = () => { },
    placeholder = "",
    value = "",
    className = "",

    inputType = "text",
    label = "",
    showBottomTip = false,
    bottomTip = "",
    bottomTipClass = "",
    rightComponent,
    rightStableComponent,
    subLabel = "",

    showSearchIcon = false,
    customInputContainer = "",
    customInputCss = "",

    transLabel = "",
    inputDisable = false
}) => {

    const [showPwd, setShowPwd] = useState(false)
    const [realType, setRealType] = useState(inputType)

    const onKeyup = useCallback((e) => {
        if (e.keyCode === 13) {
            handleBtnClick()
        }
    }, [value])

    const onClickPwd = useCallback(() => {
        setRealType(showPwd ? "password" : "text")
        setShowPwd(!showPwd)
    }, [showPwd])

    const onChangeValue = useCallback((e) => {
        if (onChange) {
            if (inputType === "numric") {
                onChange({
                    ...e,
                    target: {
                        value: numberFormat(e.target.value)
                    }
                })
            } else {
                onChange(e)
            }
        }
    }, [onChange, inputType])

    return (
        <StyledInputContainer>
            <StyledLabelRow>
                <StyledLabelContent>
                    {label && <span>{label}</span>}
                    {transLabel && (
                        <Trans
                            i18nKey={i18n.t(transLabel)}
                            components={{
                                b: <StyledBoldLabel />,
                                bold: <StyledBoldLabel />,
                            }}
                        />
                    )}
                    <StyledSubLabel>{subLabel}</StyledSubLabel>
                </StyledLabelContent>
                {rightComponent}
            </StyledLabelRow>
            <StyledInputWrapper
                $customCss={customInputContainer}
                $disabled={inputDisable}
            >
                {showSearchIcon && <StyledSearchIcon src="/img/icon_search.svg" />}
                <StyledInput
                    onChange={onChangeValue}
                    placeholder={placeholder}
                    value={value}
                    onKeyUp={onKeyup}
                    type={realType}
                    disabled={inputDisable}
                    $disabled={inputDisable}
                    $customCss={customInputCss}
                />
                {inputType === "password" && (
                    <StyledPasswordToggle onClick={onClickPwd}>
                        <img src={showPwd ? "/img/icon_input_show.svg" : "/img/icon_input_hide.svg"} />
                    </StyledPasswordToggle>
                )}
                {rightStableComponent}
            </StyledInputWrapper>
            {showBottomTip && (
                <StyledBottomTip className={bottomTipClass}>
                    {bottomTip}
                </StyledBottomTip>
            )}
        </StyledInputContainer>
    )
}

export default Input