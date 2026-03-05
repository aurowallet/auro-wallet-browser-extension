import { ChangeEvent, ReactNode, useCallback, useState, ElementType, createElement } from "react";
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

// Input change event type - modified object with only target.value (used when inputType="numric")
export interface InputChangeEvent {
    target: { value: string };
}

interface InputProps {
    // Note: Cannot use strict union type here because TypeScript function params are contravariant.
    // The Input component passes either ChangeEvent or InputChangeEvent based on inputType at runtime.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onChange?: (e: any) => void;
    handleBtnClick?: () => void;
    placeholder?: string;
    value?: string;
    className?: string;
    inputType?: string;
    label?: string;
    showBottomTip?: boolean;
    bottomTip?: string;
    bottomTipClass?: ElementType;
    rightComponent?: ReactNode;
    rightStableComponent?: ReactNode;
    subLabel?: string;
    showSearchIcon?: boolean;
    customInputContainer?: string;
    customInputCss?: string;
    transLabel?: string;
    inputDisable?: boolean;
}

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
    bottomTipClass,
    rightComponent,
    rightStableComponent,
    subLabel = "",

    showSearchIcon = false,
    customInputContainer = "",
    customInputCss = "",

    transLabel = "",
    inputDisable = false
}: InputProps) => {

    const [showPwd, setShowPwd] = useState(false)
    const [realType, setRealType] = useState(inputType)

    const onKeyup = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.keyCode === 13) {
            handleBtnClick()
        }
    }, [handleBtnClick])

    const onClickPwd = useCallback(() => {
        setRealType(showPwd ? "password" : "text")
        setShowPwd(!showPwd)
    }, [showPwd])

    const onChangeValue = useCallback((e: ChangeEvent<HTMLInputElement>) => {
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
                <StyledBottomTip>
                    {bottomTipClass ? createElement(bottomTipClass, null, bottomTip) : bottomTip}
                </StyledBottomTip>
            )}
        </StyledInputContainer>
    )
}

export default Input