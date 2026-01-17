import { useCallback } from "react";
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
}) => {
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