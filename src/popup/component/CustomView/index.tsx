import { ComponentType, ReactNode, useCallback } from "react";
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import {
    StyledHeaderRow,
    StyledBackButton,
    StyledTitle,
    StyledContentContainer,
    StyledRightIconContainer,
    StyledRightIcon,
    StyledTooltipContainer,
    StyledTooltip,
} from "./index.styled";

interface CustomViewProps {
    children?: ReactNode;
    title?: string;
    backRoute?: string;
    onGoBack?: () => void;
    ContentWrapper?: ComponentType<{ children?: ReactNode }>;
    rightComponent?: ReactNode;
    HeaderWrapper?: ComponentType<{ children?: ReactNode }>;
    noBack?: boolean;
    TitleWrapper?: ComponentType<{ children?: ReactNode; onClick?: () => void }>;
    onClickTitle?: () => void;
    rightIcon?: string;
    onClickRightIcon?: () => void;
    rightHoverContent?: string;
}

const CustomView = ({
    children,
    title = "",
    backRoute = "",
    onGoBack,
    ContentWrapper,
    rightComponent = "",
    HeaderWrapper,
    noBack = false,
    TitleWrapper,
    onClickTitle = () => { },
    rightIcon = '',
    onClickRightIcon = () => { },
    rightHoverContent = ""
}: CustomViewProps) => {
    const navigate = useNavigate();
    const goBack = useCallback(() => {
        if (onGoBack) {
            onGoBack()
            return
        }
        if (backRoute) {
            navigate(backRoute)
        } else {
            navigate(-1)
        }
    }, [backRoute, onGoBack])

    const HeaderComponent = HeaderWrapper || StyledHeaderRow;
    const TitleComponent = TitleWrapper || StyledTitle;
    const ContentComponent = ContentWrapper || StyledContentContainer;

    return (
        <>
            <HeaderComponent>
                {!noBack && (
                    <StyledBackButton onClick={goBack}>
                        <img src={"/img/icon_back.svg"} />
                    </StyledBackButton>
                )}
                <TitleComponent onClick={onClickTitle}>
                    {title}
                </TitleComponent>
                {rightComponent}
                {rightIcon && (
                    <StyledRightIconContainer>
                        <StyledRightIcon
                            src={rightIcon}
                            onClick={onClickRightIcon}
                        />
                        {rightHoverContent && (
                            <StyledTooltipContainer>
                                <StyledTooltip>{rightHoverContent}</StyledTooltip>
                            </StyledTooltipContainer>
                        )}
                    </StyledRightIconContainer>
                )}
            </HeaderComponent>
            <ContentComponent>
                {children}
            </ContentComponent>
        </>
    )
}
export default CustomView