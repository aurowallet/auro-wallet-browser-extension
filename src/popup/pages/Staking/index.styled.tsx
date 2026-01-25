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

export const StyledDelegationContainer = styled.div`
  margin-top: 20px;
`;

export const StyledDelegationRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 40px;
`;

export const StyledRowHelp = styled.p`
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
  font-size: ${({ theme }) => theme.typography.fontSizeDesc};
  line-height: 14px;
  color: ${({ theme }) => theme.colors.primary};
  margin: 0;
  cursor: pointer;
`;

export const StyledDelegationContent = styled(StyledCommonContent)`
  padding: 20px;
  display: flex;
`;

export const StyledRowRight = styled.div`
  flex: 1;
  display: flex;
  justify-content: flex-end;
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

export const StyledEmptyContainer = styled.div`
  margin-top: 40px;
`;

export const StyledEmptyTitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSizeTitleSmall};
  line-height: 19px;
  color: ${({ theme }) => theme.colors.textBlack};
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
  margin: 0;
  text-align: center;
`;

export const StyledEmptyTip = styled.p`
  margin-bottom: 12px;
`;

export const StyledEmptyContent = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSizeContent};
  line-height: 18px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 12px 0px 20px;
`;

export const StyledEmptyGuide = styled.span`
  color: ${({ theme }) => theme.colors.primary};
  cursor: pointer;
`;

export const StyledBtnContainer = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
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
  margin-top: 66px;
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
