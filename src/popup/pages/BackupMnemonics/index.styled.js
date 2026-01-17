import styled, { css } from 'styled-components';

export const StyledBackTitle = styled.p`
  font-style: normal;
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
  font-size: ${({ theme }) => theme.typography.fontSizeContent};
  line-height: ${({ theme }) => theme.typography.lineHeightDesc};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 10px 0 0;
`;

export const StyledMneContainer = styled.div`
  margin-top: 20px;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-row-gap: 10px;
  grid-column-gap: 18px;
`;

export const StyledDividedLine = styled.div`
  margin-top: 20px;
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
`;

export const StyledMneItemSelectedContainer = styled.div`
  background: rgba(196, 196, 196, 0.2);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 30px;
  min-width: 100px;
  cursor: pointer;
`;

export const StyledMneItemSelected = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSizeContent};
  line-height: 100%;
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
  text-align: center;
  color: ${({ theme }) => theme.colors.textBlack};

  ${({ $small }) => $small && css`
    font-size: ${({ theme }) => theme.typography.fontSizeDesc};
  `}
`;
