import styled, { css, keyframes } from 'styled-components';
import { StyledContentContainer as BaseContentContainer } from '../../component/CustomView/index.styled';

export const StyledContentClassName = styled(BaseContentContainer)`
  padding: 10px 20px 0px;
`;

export const StyledRowTitleContainer = styled.div`
  display: flex;
  align-items: center;
  position: relative;
`;

export const StyledRowIcon = styled.img`
  display: block;
`;

export const StyledRowTitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSizeTitleSmall};
  line-height: 19px;
  text-align: center;
  color: ${({ theme }) => theme.colors.textBlack};
  margin: 0px 0px 0px 8.5px;
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
`;

export const StyledCommonContent = styled.div`
  background: #f9fafc;
  border: 0.5px solid rgba(0, 0, 0, 0.05);
  border-radius: 12px;
`;

export const StyledEpochContent = styled(StyledCommonContent)`
  margin-top: 10px;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  position: relative;
  width: 100%;
  overflow-x: hidden;

  .CircularProgressbar-path {
    stroke: url(#circleGradient);
  }
  .CircularProgressbar-trail {
    stroke: #d3e1ed;
  }
`;

export const StyledHighlightContent = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
  font-size: ${({ theme }) => theme.typography.fontSizeTitleSmall};
  line-height: 19px;
  text-align: right;
  color: ${({ theme }) => theme.colors.primary};
`;

export const StyledContent = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
  font-size: ${({ theme }) => theme.typography.fontSizeDesc};
  line-height: 14px;
  text-align: right;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

export const StyledTimeValue = styled.div`
  display: flex;
  align-items: baseline;
  white-space: pre;
  margin-top: 2px;
`;

export const StyledTime = styled.p`
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
  font-size: ${({ theme }) => theme.typography.fontSizeTitleSmall};
  line-height: 19px;
  text-align: right;
  color: ${({ theme }) => theme.colors.textBlack};
  margin: 0;
`;

export const StyledTimeUnit = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeightNormal};
  font-size: ${({ theme }) => theme.typography.fontSizeDesc};
  line-height: 14px;
`;

export const StyledCircleContainer = styled.div`
  position: relative;
  display: flex;
`;

export const StyledCircleCon = styled.div`
  position: absolute;
  right: 0px;
  top: calc(50% - 50px);
  width: 80px;
  height: 80px;
`;

export const StyledPercentageContainer = styled.div`
  z-index: 1;
  position: absolute;
  right: 0px;
  top: calc(50% - 40px);
  left: 4px;
  width: 100%;
  height: 100%;
  padding-top: 40px;
  margin: 0px auto;
  display: flex;
  justify-content: center;
`;

export const StyledPercentage = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
  font-size: 24px;
  line-height: 28px;
  color: ${({ theme }) => theme.colors.textBlack};
`;

export const StyledPercentageUnit = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeightNormal};
  font-size: ${({ theme }) => theme.typography.fontSizeContent};
  line-height: 16px;
`;

interface StyledRowItemProps {
  $isMargin?: boolean;
}

export const StyledRowItem = styled.div<StyledRowItemProps>`
  ${({ $isMargin }) => $isMargin && css`
    margin-top: 10px;
  `}
`;

export const StyledLabelContent = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
  font-size: ${({ theme }) => theme.typography.fontSizeContent};
  line-height: ${({ theme }) => theme.typography.lineHeightDesc};
  text-align: right;
  color: ${({ theme }) => theme.colors.textBlack};
`;

interface StyledContentContainerProps {
  $canCopy?: boolean;
}

export const StyledContentContainer = styled.div<StyledContentContainerProps>`
  display: flex;
  align-items: center;
  margin-top: 2px;

  ${({ $canCopy }) => $canCopy && css`
    cursor: pointer;
  `}
`;

export const StyledCopy = styled.img`
  width: 24px;
  object-fit: scale-down;
  margin-left: 4px;
`;

const refreshAni = keyframes`
  0% {
    transform: rotate(0);
  }
  100% {
    transform: rotate(360deg);
  }
`;

export const StyledLoadingContainer = styled.div`
  margin-top: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
`;

export const StyledRefreshLoading = styled.img`
  animation: ${refreshAni} 0.8s infinite linear;
  transform-origin: center center;
`;

export const StyledLoadingTip = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSizeDesc};
  line-height: ${({ theme }) => theme.typography.lineHeightDesc};
  color: ${({ theme }) => theme.colors.textTertiary};
  margin: 10px 0px 0px;
`;

export const StyledLabel = styled.p`
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
  font-size: ${({ theme }) => theme.typography.fontSizeDesc};
  line-height: 15px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 2px 0 0;
`;

export const StyledEarnContainer = styled.div`
  margin-top: 16px;
`;

export const StyledEarnHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

export const StyledInfoIcon = styled.img`
  width: 30px;
  height: 30px;
  cursor: pointer;
  opacity: 0.5;
`;

export const StyledEarnContent = styled(StyledCommonContent)`
  padding: 14px 20px;
`;

export const StyledEarnRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  &:not(:first-child) {
    margin-top: 10px;
  }
`;

export const StyledEarnLabel = styled.span`
  font-size: 14px;
  line-height: 17px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

export const StyledEarnValue = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
  font-size: 14px;
  line-height: 17px;
  color: ${({ theme }) => theme.colors.textBlack};
  text-align: right;
`;

export const StyledActiveTitle = styled.p`
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
  font-size: 14px;
  line-height: 17px;
  color: rgba(0, 0, 0, 0.8);
  margin: 12px 0 12px;
`;

export const StyledValidatorCard = styled(StyledCommonContent)`
  padding: 14px;
`;

export const StyledValidatorInfo = styled.div`
  display: flex;
  align-items: center;
`;

export const StyledValidatorIconWrapper = styled.div`
  width: 36px;
  height: 36px;
  margin-right: 12px;
  flex-shrink: 0;
`;

export const StyledValidatorIconHolder = styled.div`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 16px;
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
`;

export const StyledValidatorIconImg = styled.img`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
`;

export const StyledValidatorName = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
  font-size: 14px;
  line-height: 17px;
  color: ${({ theme }) => theme.colors.textBlack};
`;

export const StyledStakedInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 0.5px solid rgba(0, 0, 0, 0.05);
`;

export const StyledStakedLabel = styled.span`
  font-size: 12px;
  line-height: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

export const StyledStakedValue = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
  font-size: 14px;
  line-height: 17px;
  color: ${({ theme }) => theme.colors.textBlack};
`;

interface StyledActionLinkProps {
  $bordered?: boolean;
}

export const StyledActionLink = styled.div<StyledActionLinkProps>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0px 4px 10px;
  cursor: pointer;
  ${({ $bordered }) => $bordered && css`
    border-bottom: 0.5px solid rgba(0, 0, 0, 0.05);
  `}
`;

export const StyledActionText = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
  font-size: 14px;
  line-height: 17px;
  color: ${({ theme }) => theme.colors.primary};
`;

export const StyledActionArrow = styled.img`
  width: 30px;
  height: 30px;
`;

export const StyledUnknownContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
`;

export const StyledUnknownIcon = styled.img`
  width: 100px;
  height: 100px;
  margin-bottom: 16px;
`;

export const StyledUnknownTip = styled.p`
  font-size: 14px;
  line-height: 17px;
  color: rgba(0,0,0, 0.3);
  
  text-align: center;
  margin: 0;
`;

