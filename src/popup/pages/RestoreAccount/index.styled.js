import styled from 'styled-components';

export const StyledRestoreTip = styled.p`
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
  font-size: ${({ theme }) => theme.typography.fontSizeContent};
  line-height: ${({ theme }) => theme.typography.lineHeightDesc};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 10px 0 0;
`;

export const StyledTextAreaContainer = styled.div`
  margin-top: 20px;
`;

export const StyledSimilarWordOuter = styled.div`
  flex: 1;
`;

export const StyledSimilarWordContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
  overflow-y: auto;
  max-height: 210px;
`;

export const StyledSimilarWordItem = styled.div`
  padding: 5px 8px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
  font-size: ${({ theme }) => theme.typography.fontSizeContent};
  line-height: ${({ theme }) => theme.typography.lineHeightDesc};
  display: flex;
  align-items: center;
  text-align: center;
  color: ${({ theme }) => theme.colors.textBlack};
  cursor: pointer;

  &:hover {
    opacity: 0.8;
  }
`;

export const StyledBottomContainer = styled.div`
  padding: 12px 18px 20px;
`;
