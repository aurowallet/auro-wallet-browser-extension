import styled from 'styled-components';

export const StyledLockedPageWrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 200;
  background-color: ${({ theme }) => theme.colors.background};
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const StyledLockContent = styled.div`
  display: flex;
  align-items: center;
  font-size: ${({ theme }) => theme.typography.fontSizeTitleBig};
  flex-direction: column;
  background-color: ${({ theme }) => theme.colors.backgroundWhite};
  height: 100vh;
  min-width: ${({ theme }) => theme.dimensions.appWidth};
`;

export const StyledResetEntryOuter = styled.div`
  width: 100%;
  display: flex;
  justify-content: flex-end;
`;

export const StyledResetEntryButton = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  font-weight: ${({ theme }) => theme.typography.fontWeightSemiBold};
  font-size: ${({ theme }) => theme.typography.fontSizeDesc};
  line-height: 14px;
  display: flex;
  align-items: center;
  text-align: center;
  color: ${({ theme }) => theme.colors.textBlack};
  padding: 6px 12px;
  margin: 20px 10px 42px 0;
  cursor: pointer;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.backgroundDisabled};
  }
`;

export const StyledLogoContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

export const StyledLogo = styled.img`
`;

export const StyledWelcomeBack = styled.p`
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
  font-size: ${({ theme }) => theme.typography.fontSizeTitleBig};
  line-height: ${({ theme }) => theme.typography.lineHeightTitle};
  text-align: center;
  color: ${({ theme }) => theme.colors.textBlack};
  margin: 0;
`;

export const StyledFormWrapper = styled.form`
  width: calc(100% - 40px);
`;

export const StyledPwdInputContainer = styled.div`
  width: 100%;
  padding: 40px 0px 0px;
`;

export const StyledBtnContainer = styled.div`
  margin: 63px 18px 0px;
`;

export const StyledBottomUrl = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSizeDesc};
  line-height: 18px;
  color: ${({ theme }) => theme.colors.textTertiary};
  text-align: center;
  margin: 12px auto 0px;
`;

// Note: For rightBtnStyle in PopupModal, we need to use CSS class approach
// until PopupModal is converted to styled-components
// This is a temporary export - the actual danger styling is handled via
// the dangerButtonClass constant below

// CSS class name to apply danger color - used with PopupModal's rightBtnStyle
export const dangerButtonClassName = 'danger-btn-text';
