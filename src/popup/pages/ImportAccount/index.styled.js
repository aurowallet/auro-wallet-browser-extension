import styled from 'styled-components';

export const StyledTitle = styled.p`
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
  font-size: ${({ theme }) => theme.typography.fontSizeContent};
  line-height: ${({ theme }) => theme.typography.lineHeightDesc};
  margin: 0;
`;

export const StyledTextAreaContainer = styled.div`
  margin-top: 20px;
`;

export const StyledDesc = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeightNormal};
  font-size: ${({ theme }) => theme.typography.fontSizeDesc};
  color: #808080;
  margin-top: 10px;
  display: block;
`;

export const StyledPlaceholder = styled.div`
  flex: 1;
`;

export const StyledBottomContainer = styled.div`
  padding: 12px 18px 20px;
`;
