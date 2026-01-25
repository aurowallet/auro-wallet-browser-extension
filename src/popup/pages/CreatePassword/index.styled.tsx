import styled, { css } from 'styled-components';

interface StyledHiddenProps {
  $hidden?: boolean;
}

export const StyledInputContainer = styled.div`
  margin-top: 40px;

  > :not(:last-child) {
    margin-bottom: 20px;
  }
`;

export const StyledCheckSpan = styled.span<StyledHiddenProps>`
  font-style: normal;
  font-weight: ${({ theme }) => theme.typography.fontWeightSemiBold};
  font-size: ${({ theme }) => theme.typography.fontSizeDesc};
  line-height: ${({ theme }) => theme.typography.lineHeightDesc};
  color: ${({ theme }) => theme.colors.error};

  ${({ $hidden }) => $hidden && css`
    display: none;
  `}
`;
