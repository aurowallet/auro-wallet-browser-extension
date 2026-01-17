import styled, { css, keyframes } from 'styled-components';

// Keyframe animation for loading spinner
const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

// Base button styles
const baseButtonStyles = css`
  margin: 0;
  padding: 0;
  border: 1px solid transparent;
  outline: none;
  display: flex;
  flex-direction: row;
  align-items: center;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  cursor: pointer;
  transition: background 0.2s ease;
`;

// Size variants
const sizeStyles = {
  large: css`
    width: 100%;
    height: 48px;
    padding: 9px 18px;
    font-weight: ${({ theme }) => theme.typography.fontWeightSemiBold};
    font-size: ${({ theme }) => theme.typography.fontSizeTitleSmall};
    line-height: 20px;
  `,
  middle: css`
    width: 160px;
    height: 48px;
    padding: 9px 12px;
    font-weight: ${({ theme }) => theme.typography.fontWeightSemiBold};
    font-size: ${({ theme }) => theme.typography.fontSizeContent};
    line-height: 18px;
  `,
  small: css`
    min-width: 90px;
    height: 32px;
    padding: 0px 10px;
    text-align: center;
    font-style: normal;
    font-weight: ${({ theme }) => theme.typography.fontWeightSemiBold};
    font-size: ${({ theme }) => theme.typography.fontSizeContent};
    line-height: 17px;
  `,
};

// Theme variants
const themeStyles = {
  color: css`
    background: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.textWhite};
    
    &:hover:not(:disabled) {
      background: ${({ theme }) => theme.colors.primaryHover};
    }
  `,
  light: css`
    border: 1px solid ${({ theme }) => theme.colors.borderMedium};
    background-color: ${({ theme }) => theme.colors.backgroundWhite};
    color: ${({ theme }) => theme.colors.primary};
    
    &:hover:not(:disabled) {
      background: linear-gradient(0deg, rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.05)), ${({ theme }) => theme.colors.backgroundWhite};
      border: 1px solid ${({ theme }) => theme.colors.borderMedium};
    }
  `,
};

export const StyledButton = styled.button`
  ${baseButtonStyles}
  gap: 8px;
  
  /* Apply theme variant */
  ${({ $themeType }) => $themeType === 'light' ? themeStyles.light : themeStyles.color}
  
  /* Apply size variant */
  ${({ $size }) => {
    if ($size === 'middle') return sizeStyles.middle;
    if ($size === 'small') return sizeStyles.small;
    return sizeStyles.large;
  }}
  
  /* Center content when no left icon */
  ${({ $noLeftIcon }) => $noLeftIcon && css`
    justify-content: center;
  `}
  
  /* Disabled state */
  ${({ disabled, $isLoading }) => disabled && !$isLoading && css`
    background: ${({ theme }) => theme.colors.buttonDisabled};
    cursor: default;
    
    &:hover {
      background: ${({ theme }) => theme.colors.buttonDisabled};
    }
  `}
  
  /* Loading state */
  ${({ $isLoading }) => $isLoading && css`
    justify-content: center;
    background: ${({ theme }) => theme.colors.primary};
    opacity: 0.8;
    cursor: default;
  `}
`;

export const StyledIconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const StyledButtonIcon = styled.img``;

export const StyledLoadingIcon = styled.img`
  display: ${({ $isLoading }) => $isLoading ? 'flex' : 'none'};
  animation: ${spin} 0.5s linear infinite;
`;
