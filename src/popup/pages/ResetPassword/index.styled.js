import styled, { css } from 'styled-components';

export const StyledInputContainer = styled.div`
  > :not(:last-child) {
    margin-bottom: 20px;
  }
`;

export const StyledPlaceholder = styled.div`
  flex: 1;
`;

export const StyledBottomContainer = styled.div`
  padding: 12px 18px 20px;
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
