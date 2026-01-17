import styled, { css } from 'styled-components';

export const StyledInputContainer = styled.div``;

export const StyledLabelRow = styled.div`
  font-weight: ${({ theme }) => theme.typography.fontWeightSemiBold};
  font-size: ${({ theme }) => theme.typography.fontSizeDesc};
  line-height: ${({ theme }) => theme.typography.lineHeightDesc};
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  justify-content: space-between;
  white-space: pre;
`;

export const StyledLabelContent = styled.div`
  display: flex;
  align-items: center;
`;

export const StyledSubLabel = styled.div`
  background: ${({ theme }) => theme.colors.borderLight};
  border-radius: 2px;
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
  font-size: ${({ theme }) => theme.typography.fontSizeDesc};
  line-height: ${({ theme }) => theme.typography.lineHeightDesc};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-left: ${({ theme }) => theme.spacing.sm};
  padding: 0px 4px;
  max-width: 200px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

export const StyledBoldLabel = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeightBold} !important;
`;

export const StyledInputWrapper = styled.div`
  display: flex;
  align-items: center;
  position: relative;
  height: 44px;
  border: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  
  &:hover {
    border: 0.5px solid ${({ theme, $disabled }) => $disabled ? theme.colors.borderLight : theme.colors.borderFocus};
  }
  
  &:focus-within {
    border: 0.5px solid ${({ theme }) => theme.colors.borderFocus};
  }

  ${({ $customCss }) => $customCss}
`;

export const StyledInput = styled.input`
  background: ${({ theme, $disabled }) => $disabled ? theme.colors.backgroundDisabled : theme.colors.backgroundWhite};
  outline: none;
  border: none;
  padding: 0 ${({ theme }) => theme.spacing.md};
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
  font-size: ${({ theme }) => theme.typography.fontSizeTitleSmall};
  line-height: ${({ theme }) => theme.typography.lineHeightContent};
  color: ${({ theme, $disabled }) => $disabled ? theme.colors.textTertiary : theme.colors.textInput};
  flex: 1;
  caret-color: ${({ theme }) => theme.colors.inputCaret};
  height: 100%;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  width: 100%;
  letter-spacing: normal;

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    appearance: none;
    -webkit-appearance: none;
  }

  &[type="number"] {
    appearance: textfield;
    -moz-appearance: textfield;
  }

  &::placeholder {
    font-size: ${({ theme }) => theme.typography.fontSizeTitleSmall};
    line-height: 19px;
    font-weight: ${({ theme }) => theme.typography.fontWeightNormal};
    color: ${({ theme }) => theme.colors.inputPlaceholder};
    letter-spacing: normal;
  }

  ${({ $customCss }) => $customCss}
`;

export const StyledPasswordToggle = styled.div`
  display: flex;
  margin-right: ${({ theme }) => theme.spacing.md};
  width: 30px;
  cursor: pointer;
`;

export const StyledBottomTip = styled.div`
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

export const StyledSearchIcon = styled.img`
  margin-left: 10px;
  width: 26px;
  object-fit: scale-down;
  display: block;
`;
