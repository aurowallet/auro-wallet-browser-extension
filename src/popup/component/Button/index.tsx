import { MouseEvent, ReactNode, useEffect, useState } from "react";
import {
    StyledButton,
    StyledIconContainer,
    StyledButtonIcon,
    StyledLoadingIcon,
} from "./index.styled";

export const button_theme = {
    BUTTON_THEME_COLOR: "BUTTON_THEME_COLOR",
    BUTTON_THEME_LIGHT: "BUTTON_THEME_LIGHT"
}

export const button_size = {
    large: "button_size_large",
    sub: "button_size_sub",
    middle: "button_size_middle",
    small: "button_size_small",
}

interface ButtonProps {
    disable?: boolean;
    leftIcon?: string;
    theme?: string;
    size?: string;
    onClick?: (e?: MouseEvent<HTMLButtonElement>) => void;
    loading?: boolean;
    children?: ReactNode;
    className?: string;
    withEvent?: boolean;
}

const Button = ({
    disable = false,
    leftIcon = "",
    theme = button_theme.BUTTON_THEME_COLOR,
    size = button_size.large,
    onClick = () => { },
    loading = false,
    children,
    className = "",
    withEvent = false
}: ButtonProps) => {
    const [btnDisable, setBtnDisable] = useState(disable)
    useEffect(() => {
        setBtnDisable(loading)
    }, [loading])

    const onRealClick = (e: MouseEvent<HTMLButtonElement>) => {
        if (!loading && !disable) {
            if (withEvent) {
                onClick(e)
            } else {
                onClick()
            }
        }
    }

    // Map size prop to internal size value
    const getSizeValue = () => {
        if (size === button_size.middle) return 'middle';
        if (size === button_size.small) return 'small';
        return 'large';
    };

    return (
        <StyledButton
            className={className}
            disabled={btnDisable || disable}
            onClick={onRealClick}
            $themeType={theme === button_theme.BUTTON_THEME_LIGHT ? 'light' : 'color'}
            $size={getSizeValue()}
            $noLeftIcon={!leftIcon}
            $isLoading={loading}
        >
            {leftIcon && !loading && (
                <StyledIconContainer>
                    <StyledButtonIcon src={leftIcon} />
                </StyledIconContainer>
            )}
            <StyledLoadingIcon
                src="/img/loading_light.svg"
                $isLoading={loading}
            />
            {!loading && children}
        </StyledButton>
    )
}

export default Button