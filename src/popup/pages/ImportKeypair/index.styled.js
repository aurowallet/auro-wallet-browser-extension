import styled from 'styled-components';

export const StyledTitle = styled.p`
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
  font-size: ${({ theme }) => theme.typography.fontSizeContent};
  line-height: ${({ theme }) => theme.typography.lineHeightDesc};
  margin: 0;
`;

export const StyledTextAreaContainer = styled.div`
  margin-top: 20px;
  margin-bottom: 20px;
`;

export const StyledDescContainer = styled.div``;

export const StyledDesc = styled.p`
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
  font-size: ${({ theme }) => theme.typography.fontSizeDesc};
  line-height: ${({ theme }) => theme.typography.lineHeightDesc};
  color: ${({ theme }) => theme.colors.textTertiary};
  margin-top: 10px;
`;

export const StyledPlaceholder = styled.div`
  flex: 1;
`;

export const StyledBottomContainer = styled.div`
  padding: 12px 18px 20px;
`;
