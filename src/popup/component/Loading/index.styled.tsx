import styled, { keyframes } from 'styled-components';

interface StyledOverlayProps {
    $show?: boolean;
}

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

export const StyledOverlay = styled.div<StyledOverlayProps>`
  background-color: rgba(0, 0, 0, 0.8);
  position: fixed;
  z-index: 10;
  top: 0;
  width: 100%;
  height: 100%;
  display: ${({ $show }) => $show ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
`;

export const StyledInnerContainer = styled.div`
  background: ${({ theme }) => theme.colors.backgroundWhite};
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.19);
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  min-width: 150px;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
`;

export const StyledSpinner = styled.img`
  animation: ${spin} 0.5s linear infinite;
`;

export const StyledLoadingText = styled.p`
  font-weight: ${({ theme }) => theme.typography.fontWeightSemiBold};
  font-size: ${({ theme }) => theme.typography.fontSizeTitle};
  line-height: 21px;
  text-align: center;
  color: ${({ theme }) => theme.colors.textBlack};
  margin: 20px auto 0px;
`;
