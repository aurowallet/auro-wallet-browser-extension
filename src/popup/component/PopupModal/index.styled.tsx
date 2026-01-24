import styled, { css } from 'styled-components';

interface StyledModalOverlayProps {
  $zIndex?: number;
}

interface StyledRightButtonProps {
  $disabled?: boolean;
}

export const StyledModalOverlay = styled.div<StyledModalOverlayProps>`
  position: fixed;
  top: 0;
  left: 0;
  z-index: ${({ $zIndex }) => $zIndex || 10};
  background: rgba(0, 0, 0, 0.8);
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
`;

export const StyledModalContent = styled.div`
  background: ${({ theme }) => theme.colors.backgroundWhite};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  margin: 0 auto;
  width: 100%;
  max-width: calc(375px - 40px);

  @media (min-width: 750px) {
    max-width: calc(750px - 120px);
  }
`;

export const StyledTopContainer = styled.div`
  padding: 20px 20px 0;
`;

export const StyledIconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
`;

export const StyledModalTitle = styled.p`
  font-weight: ${({ theme }) => theme.typography.fontWeightSemiBold};
  font-size: ${({ theme }) => theme.typography.fontSizeTitle};
  line-height: 21px;
  text-align: center;
  color: ${({ theme }) => theme.colors.textBlack};
  margin: 0 0 20px;
`;

export const StyledContent = styled.p`
  margin: 0 0 30px;
  font-size: ${({ theme }) => theme.typography.fontSizeContent};
  line-height: ${({ theme }) => theme.typography.lineHeightDesc};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

export const StyledBottomContainer = styled.div`
  display: flex;
  border-top: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  transform: rotate(0.18deg);
  height: 48px;
`;

const baseBtnStyles = css`
  font-style: normal;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex: 1;
  text-align: center;
  font-size: ${({ theme }) => theme.typography.fontSizeTitleSmall};
  line-height: 19px;
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
`;

export const StyledLeftButton = styled.div`
  ${baseBtnStyles}
  color: ${({ theme }) => theme.colors.textBlack};
  border-bottom-left-radius: ${({ theme }) => theme.borderRadius.medium};

  &:hover {
    background: linear-gradient(0deg, rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.05)), rgba(0, 0, 0, 0.05);
  }
`;

export const StyledRightButton = styled.div<StyledRightButtonProps>`
  ${baseBtnStyles}
  color: ${({ theme }) => theme.colors.primary};
  border-bottom-right-radius: ${({ theme }) => theme.borderRadius.medium};
  text-transform: capitalize;

  &:hover {
    background: linear-gradient(0deg, rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.05)), rgba(0, 0, 0, 0.05);
  }

  ${({ $disabled }) => $disabled && css`
    color: ${({ theme }) => theme.colors.textTertiary} !important;
    cursor: not-allowed;
    &:hover {
      background: transparent;
    }
  `}
`;

export const StyledDivider = styled.div`
  border: 0.5px solid ${({ theme }) => theme.colors.borderLight};
`;

export const StyledComponentContent = styled.div`
  margin-bottom: 30px;
`;
