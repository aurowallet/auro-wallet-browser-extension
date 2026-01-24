import styled, { css } from 'styled-components';

interface StyledTextAreaProps {
  $hasError?: boolean;
}

export const StyledContainer = styled.div``;

export const StyledLabel = styled.div`
  font-weight: ${({ theme }) => theme.typography.fontWeightSemiBold};
  font-size: ${({ theme }) => theme.typography.fontSizeDesc};
  line-height: ${({ theme }) => theme.typography.lineHeightDesc};
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

export const StyledTextArea = styled.textarea<StyledTextAreaProps>`
  margin: 0;
  width: 100%;
  resize: none;
  font-size: ${({ theme }) => theme.typography.fontSizeTitleSmall};
  color: #333333;
  min-height: 150px;
  border: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: 8px;
  padding: 14px 12px;
  outline: none;
  caret-color: ${({ theme }) => theme.colors.inputCaret};

  &:active,
  &:hover,
  &:focus {
    border: 0.5px solid ${({ theme }) => theme.colors.borderFocus};
  }

  &::placeholder {
    font-size: ${({ theme }) => theme.typography.fontSizeContent};
    line-height: ${({ theme }) => theme.typography.lineHeightDesc};
    color: ${({ theme }) => theme.colors.inputPlaceholder};
  }

  ${({ $hasError }) => $hasError && css`
    border: 0.5px solid ${({ theme }) => theme.colors.error};
    &:active,
    &:hover,
    &:focus {
      border: 0.5px solid ${({ theme }) => theme.colors.error};
    }
  `}
`;

export const StyledBottomTip = styled.div`
  margin-top: ${({ theme }) => theme.spacing.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
  font-size: ${({ theme }) => theme.typography.fontSizeDesc};
  line-height: ${({ theme }) => theme.typography.lineHeightDesc};
  color: ${({ theme }) => theme.colors.error};
  max-height: 100px;
  overflow-y: auto;
`;
