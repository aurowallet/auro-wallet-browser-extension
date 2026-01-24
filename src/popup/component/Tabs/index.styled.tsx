import styled, { css } from 'styled-components';

interface StyledStepProps {
  $isStep?: boolean;
}

interface StyledActiveProps {
  $active?: boolean;
}

export const StyledTabContainer = styled.div<StyledStepProps>`
  width: 100%;
  ${({ $isStep }) => $isStep && css`
    height: 100%;
  `}
`;

export const StyledTabBtnContainer = styled.div<StyledStepProps>`
  margin: 10px 0px;
  position: relative;
  z-index: 1;
  border-bottom: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  width: 100%;

  ${({ $isStep }) => $isStep && css`
    border-bottom: unset;
    margin: 0px 0px;
    background: rgb(174, 175, 176);
    height: 3px;
  `}
`;

export const StyledBtnRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const StyledTabIndicator = styled.span<StyledStepProps>`
  position: absolute;
  z-index: 1;
  bottom: 0;
  left: 0;
  height: 3px;
  transition: all 0.3s;
  background: ${({ theme }) => theme.colors.textBlack};

  ${({ $isStep }) => $isStep && css`
    background: ${({ theme }) => theme.colors.primary};
  `}
`;

export const StyledTabBtn = styled.button<StyledActiveProps>`
  font-weight: ${({ theme }) => theme.typography.fontWeightSemiBold};
  font-size: ${({ theme }) => theme.typography.fontSizeContent};
  color: ${({ theme }) => theme.colors.textSecondary};
  position: relative;
  cursor: pointer;
  transition: all 0.3s;
  border: 0;
  background: transparent;
  outline: 0;
  padding: 10px 0px 8px;
  margin-right: 16px;

  &:hover {
    color: ${({ theme }) => theme.colors.textBlack};
  }

  ${({ $active }) => $active && css`
    color: ${({ theme }) => theme.colors.textPrimary};
    &:hover {
      color: ${({ theme }) => theme.colors.textPrimary};
    }
  `}
`;

export const StyledTabPanel = styled.div<StyledActiveProps>`
  width: 100%;
  display: ${({ $active }) => $active ? 'flex' : 'none'};
  flex: 1;
  min-width: 0;
`;

export const StyledTabsPanels = styled.div<StyledStepProps>`
  overflow: hidden;
  width: 100%;
  background: ${({ theme }) => theme.colors.backgroundWhite};
  min-height: 50px;

  ${({ $isStep }) => $isStep && css`
    height: 100%;
    border-radius: 0 0 10px 10px;
  `}
`;

export const StyledTabTracker = styled.div`
  display: flex;
  transition: transform 0.3s;
  width: 100%;
`;
