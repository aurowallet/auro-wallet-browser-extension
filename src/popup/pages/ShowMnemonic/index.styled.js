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

export const StyledMneItemContainer = styled.div`
  background: #594af1;
  border-radius: 20px;
  display: flex;
  align-items: center;
  padding-left: 12px;
  min-height: 30px;
  min-width: 100px;

  ${({ $clickable }) => $clickable && css`
    cursor: pointer;
  `}

  ${({ $colorStatus }) => $colorStatus && css`
    background: rgba(196, 196, 196, 0.2) !important;
  `}
`;

export const StyledMneIndex = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSizeContent};
  line-height: 100%;
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
  display: flex;
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};

  ${({ $small }) => $small && css`
    font-size: ${({ theme }) => theme.typography.fontSizeDesc};
  `}

  ${({ $colorStatus }) => $colorStatus && css`
    color: rgba(0, 0, 0, 0.5) !important;
  `}
`;

export const StyledMneItem = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
  font-size: ${({ theme }) => theme.typography.fontSizeContent};
  line-height: 100%;
  text-align: center;
  color: ${({ theme }) => theme.colors.white};
  color: white;
  ${({ $small }) => $small && css`
    font-size: ${({ theme }) => theme.typography.fontSizeDesc};
  `}
`;
