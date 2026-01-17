import styled, { css } from 'styled-components';

export const StyledContainer = styled.form`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

export const StyledBottomContainer = styled.div`
  padding: 12px 18px 20px;
`;

export const StyledPlaceholder = styled.div`
  flex: 1;
`;

export const StyledTipContainer = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSizeContent};
  line-height: 18px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

export const StyledTip = styled.p`
  margin: 0;
`;

export const StyledAddress = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.primary};
  word-break: break-all;
  margin-bottom: 20px;
`;

export const StyledAccountRepeatName = styled.span`
  margin: 0;
`;

export const StyledAccountRepeatClick = styled.span`
  margin: 0;
  color: ${({ theme }) => theme.colors.primary};
  word-break: break-all;
`;

export const StyledLedgerContainer = styled.div`
  margin-top: 20px;
`;

export const StyledLedgerTitle = styled.p`
  font-weight: ${({ theme }) => theme.typography.fontWeightSemiBold};
  font-size: ${({ theme }) => theme.typography.fontSizeDesc};
  line-height: ${({ theme }) => theme.typography.lineHeightDesc};
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0;
`;

export const StyledLedgerPath = styled.div`
  font-weight: ${({ theme }) => theme.typography.fontWeightNormal};
  font-size: ${({ theme }) => theme.typography.fontSizeTitleSmall};
  color: #666666;
  margin: 4px 0 0;
  display: flex;
  align-items: center;
`;

export const StyledInputNumberContainer = styled.div`
  width: fit-content;
  position: relative;
  display: flex;
  align-items: center;
  height: 44px;
  border: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: 6px;
  margin: 0 20px;

  &:hover {
    border: 0.5px solid ${({ theme }) => theme.colors.borderFocus};
  }
`;

export const StyledCustomInput = styled.input`
  display: inline-block;
  outline: none;
  background: ${({ theme }) => theme.colors.backgroundWhite};
  border: none;
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
  font-size: ${({ theme }) => theme.typography.fontSizeTitleSmall};
  line-height: 24px;
  color: #00142a;
  flex: 1;
  caret-color: ${({ theme }) => theme.colors.inputCaret};
  width: 72px;
  text-align: center;
  padding-right: 26px;

  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    -webkit-appearance: none;
    appearance: none;
    margin: 0;
  }
`;

export const StyledImgContainer = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding-right: 12px;
  justify-content: center;
`;

export const StyledArrow = styled.img`
  width: 15px;
  height: 15px;
  cursor: pointer;

  &:hover {
    background: rgba(0, 0, 0, 0.15);
  }

  ${({ $rotate }) => $rotate && css`
    transform: rotate(180deg);
  `}
`;

export const StyledAdvanceEntry = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
  width: fit-content;
  margin-top: 20px;
`;

export const StyledAdvanceTitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSizeDesc};
  line-height: 14px;
  color: ${({ theme }) => theme.colors.primary};
  margin: 0 5px 0px 0px;
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
`;

export const StyledAdvanceIcon = styled.img`
  transform: ${({ $open }) => $open ? 'rotate(180deg)' : 'rotate(0)'};
  transition: 0.35s;
`;
