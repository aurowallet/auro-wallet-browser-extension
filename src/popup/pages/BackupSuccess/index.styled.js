import styled from 'styled-components';

export const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  width: 100%;
  padding-top: 72px;
`;

export const StyledBackupTitle = styled.p`
  font-size: 20px;
  line-height: 23px;
  color: ${({ theme }) => theme.colors.textBlack};
  margin: 20px 0px;
`;

export const StyledBackupContent = styled.p`
  font-style: normal;
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
  font-size: ${({ theme }) => theme.typography.fontSizeTitleSmall};
  line-height: 20px;
  text-align: center;
  color: ${({ theme }) => theme.colors.textMedium};
  margin: 0;
  padding: 0 20px;
`;

export const StyledBottomContainer = styled.div`
  padding: 12px 38px 20px;
  width: 100%;
`;
