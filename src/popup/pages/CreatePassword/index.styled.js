import styled, { css } from 'styled-components';

export const StyledInputContainer = styled.div`
  margin-top: 40px;

  > :not(:last-child) {
    margin-bottom: 20px;
  }
`;

export const StyledCheckSpan = styled.span`
  font-style: normal;
  font-weight: ${({ theme }) => theme.typography.fontWeightSemiBold};
  font-size: ${({ theme }) => theme.typography.fontSizeDesc};
  line-height: ${({ theme }) => theme.typography.lineHeightDesc};
  color: ${({ theme }) => theme.colors.error};

  ${({ $hidden }) => $hidden && css`
    display: none;
  `}
`;
