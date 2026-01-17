import styled from 'styled-components';

export const StyledPlaceholder = styled.div`
  flex: 1;
`;

export const StyledBottomContainer = styled.div`
  padding: 12px 18px 20px;
`;

export const StyledAddressContainer = styled.div`
  padding: 10px 0;
`;

export const StyledAddressTitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSizeTitleSmall};
  line-height: 100%;
  color: ${({ theme }) => theme.colors.textBlack};
  margin: 0;
  font-weight: ${({ theme }) => theme.typography.fontWeightSemiBold};
`;

export const StyledAddressContent = styled.p`
  font-style: normal;
  font-weight: ${({ theme }) => theme.typography.fontWeightNormal};
  font-size: ${({ theme }) => theme.typography.fontSizeContent};
  line-height: ${({ theme }) => theme.typography.lineHeightDesc};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 4px 0 0;
  word-break: break-all;
`;

export const StyledPriContainer = styled.div`
  background: #f9fafc;
  border: 0.5px solid rgba(0, 0, 0, 0.05);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 20px;
  gap: 20px;
  margin-top: 10px;
`;

export const StyledPrivateKey = styled.p`
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
  font-size: ${({ theme }) => theme.typography.fontSizeTitleSmall};
  line-height: 19px;
  color: #333333;
  margin: 0;
  word-break: break-all;
`;

export const StyledCopyContainer = styled.div`
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.colors.primary};
  cursor: pointer;

  &:hover {
    opacity: 0.8;
  }
`;

export const StyledCopyDesc = styled.p`
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
  font-size: ${({ theme }) => theme.typography.fontSizeContent};
  line-height: ${({ theme }) => theme.typography.lineHeightDesc};
  margin: 0;
`;
