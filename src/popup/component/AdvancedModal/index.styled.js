import styled, { keyframes } from 'styled-components';

const openModal = keyframes`
  from {
    bottom: -50%;
  }
  to {
    bottom: 0;
  }
`;

export const StyledModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  z-index: 10;
  background: rgba(0, 0, 0, 0.8);
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: end;
  flex-direction: column;
`;

export const StyledModalContent = styled.div`
  background: ${({ theme }) => theme.colors.backgroundWhite};
  border-top-left-radius: ${({ theme }) => theme.borderRadius.medium};
  border-top-right-radius: ${({ theme }) => theme.borderRadius.medium};
  width: 100%;
  position: absolute;
  bottom: 0;
  animation: ${openModal} 0.35s;
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

export const StyledRightRow = styled.div`
  display: flex;
  align-items: center;
`;

export const StyledDivider = styled.div`
  width: 100%;
  height: 0.5px;
  background-color: #f2f2f2;
`;

export const StyledBottomContent = styled.div`
  padding: 0px 20px;
  overflow-y: auto;
  background: ${({ theme }) => theme.colors.backgroundWhite};
  max-height: 350px;
  margin-bottom: 100px;
`;

export const StyledBottomContainer = styled.div`
  padding: 12px 38px 20px;
  position: fixed;
  bottom: 0;
  width: 100%;
  background-color: ${({ theme }) => theme.colors.backgroundWhite};
  animation: ${openModal} 0.35s;
  animation-fill-mode: forwards;
`;
