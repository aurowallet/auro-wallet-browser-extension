import styled, { keyframes, css } from 'styled-components';

interface StyledOverlayProps {
    $show?: boolean;
}

interface StyledModalContentProps {
    $visible?: boolean;
}

interface StyledBottomContainerProps {
    $visible?: boolean;
}

interface StyledFeeButtonProps {
    $selected?: boolean;
}

const openModal = keyframes`
  from { bottom: -50%; }
  to { bottom: 0; }
`;

const closeModal = keyframes`
  from { bottom: 0; }
  to { bottom: -100%; }
`;

export const StyledOverlay = styled.div<StyledOverlayProps>`
  position: fixed;
  top: 0;
  left: 0;
  z-index: 10;
  background: rgba(0, 0, 0, 0.8);
  width: 100%;
  height: 100%;
  display: ${({ $show }) => $show ? 'flex' : 'none'};
  justify-content: end;
  flex-direction: column;
`;

export const StyledModalContent = styled.div<StyledModalContentProps>`
  background: ${({ theme }) => theme.colors.backgroundWhite};
  border-top-left-radius: ${({ theme }) => theme.borderRadius.medium};
  border-top-right-radius: ${({ theme }) => theme.borderRadius.medium};
  width: 100%;
  position: absolute;
  animation: ${({ $visible }) => $visible ? openModal : closeModal} 0.35s;
  animation-fill-mode: forwards;
`;

export const StyledTitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  padding: 8px 20px;
`;

export const StyledRowTitle = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeightSemiBold};
  font-size: ${({ theme }) => theme.typography.fontSizeTitleSmall};
  line-height: 16px;
  display: flex;
  align-items: center;
  color: #222222;
`;

export const StyledCloseButton = styled.img`
  display: block;
  cursor: pointer;
`;

export const StyledDivider = styled.div`
  width: 100%;
  height: 0.5px;
  background-color: #f2f2f2;
`;

export const StyledBottomContent = styled.div`
  padding: 20px 20px 0px;
  overflow-y: auto;
  background: ${({ theme }) => theme.colors.backgroundWhite};
  max-height: 350px;
  margin-bottom: 100px;

  > :not(:first-child) {
    margin-top: 20px;
  }
`;

export const StyledBottomContainer = styled.div<StyledBottomContainerProps>`
  padding: 12px 38px 20px;
  position: fixed;
  bottom: 0;
  width: 100%;
  background-color: ${({ theme }) => theme.colors.backgroundWhite};
  animation: ${({ $visible }) => $visible ? openModal : closeModal} 0.35s;
  animation-fill-mode: forwards;
`;

export const StyledWarningTip = styled.span`
  && {
    color: ${({ theme }) => theme.colors.warning};
  }
`;

export const StyledFeeBtnGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-right: 4px;
`;

const baseFeeButtonStyles = css`
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  font-size: 12px;
  white-space: nowrap;
  transition: all 0.15s ease;
  border: 1.5px solid transparent;
  color: white;
`;

export const StyledSlowButton = styled.div<StyledFeeButtonProps>`
  ${baseFeeButtonStyles}
  background: rgba(0, 0, 0, 0.3);
  
  ${({ $selected }) => $selected && css`
    border-color: #808080;
  `}

  &:hover {
    border-color: #808080;
  }
`;

export const StyledNormalButton = styled.div<StyledFeeButtonProps>`
  ${baseFeeButtonStyles}
  background: #0DB27C;
  
  ${({ $selected }) => $selected && css`
    border-color: #008056;
  `}

  &:hover {
    border-color: #008056;
  }
`;

export const StyledFastButton = styled.div<StyledFeeButtonProps>`
  ${baseFeeButtonStyles}
  background: #D65A5A;
  
  ${({ $selected }) => $selected && css`
    border-color: #963E3E;
  `}

  &:hover {
    border-color: #963E3E;
  }
`;
