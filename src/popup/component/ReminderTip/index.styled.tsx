import styled, { css } from 'styled-components';

interface StyledTipContentProps {
  $type?: string;
}

export const StyledTipContent = styled.div<StyledTipContentProps>`
  border-radius: 10px;
  padding: 16px 24px 16px 16px;

  ${({ $type }) => $type === 'info' && css`
    background: rgba(89, 74, 241, 0.1);
    border: 0.5px solid rgba(89, 74, 241, 0.2);
    font-size: ${({ theme }) => theme.typography.fontSizeContent};
    line-height: ${({ theme }) => theme.typography.lineHeightDesc};
    color: ${({ theme }) => theme.colors.primary};
  `}
`;
