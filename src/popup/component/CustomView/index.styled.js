import styled from 'styled-components';

export const StyledHeaderRow = styled.div`
  display: flex;
  align-items: center;
  height: 48px;
  padding: 10px 10px 0px;
  position: relative;
  justify-content: space-between;
  background-color: ${({ theme }) => theme.colors.backgroundWhite};
`;

export const StyledBackButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  cursor: pointer;
  z-index: 1;
`;

export const StyledTitle = styled.p`
  margin: 0;
  font-weight: ${({ theme }) => theme.typography.fontWeightSemiBold};
  font-size: ${({ theme }) => theme.typography.fontSizeTitle};
  line-height: 21px;
  text-align: center;
  color: ${({ theme }) => theme.colors.textBlack};
  position: absolute;
  left: 50%;
  transform: translate(-50%, 0%);
  white-space: nowrap;
`;

export const StyledContentContainer = styled.div`
  flex: 1;
  padding: 10px 20px 0px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  background-color: ${({ theme }) => theme.colors.backgroundWhite};
`;

export const StyledRightIconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
`;

export const StyledRightIcon = styled.img`
  &:hover + div {
    visibility: visible;
  }
`;

export const StyledTooltipContainer = styled.div`
  visibility: hidden;
  position: absolute;
  z-index: 1;
  bottom: -30px;
  right: 0;
  min-width: 56px;
  display: flex;
  align-items: flex-end;
  flex-direction: column;
`;

export const StyledTooltip = styled.span`
  background: rgba(0, 0, 0, 0.8);
  font-style: normal;
  font-weight: ${({ theme }) => theme.typography.fontWeightNormal};
  font-size: ${({ theme }) => theme.typography.fontSizeDesc};
  line-height: 14px;
  color: ${({ theme }) => theme.colors.textWhite};
  text-align: center;
  padding: 6px 10px;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  min-width: 56px;
  white-space: nowrap;
`;
