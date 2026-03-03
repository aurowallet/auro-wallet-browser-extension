import styled from 'styled-components';

export const StyledNetworkFeeContainer = styled.div`
  margin-top: 20px;
`;

export const StyledFeeRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const StyledFeeLabel = styled.p`
  font-weight: ${({ theme }) => theme.typography.fontWeightSemiBold};
  font-size: ${({ theme }) => theme.typography.fontSizeDesc};
  line-height: ${({ theme }) => theme.typography.lineHeightDesc};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0;
`;

export const StyledFeeValue = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSizeDesc};
  line-height: ${({ theme }) => theme.typography.lineHeightDesc};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
`;

export const StyledDividedLine = styled.div`
  height: 0.5px;
  background-color: ${({ theme }) => theme.colors.borderLight};
  width: 100%;
  margin: 10px 0;
`;

export const StyledAdvanceLink = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSizeDesc};
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
  color: ${({ theme }) => theme.colors.primary};
  margin: 0;
  text-align: right;
  cursor: pointer;
`;

export const StyledAdvanceInputGroup = styled.div`
  margin-top: 10px;
  > :not(:first-child) {
    margin-top: 20px;
  }
`;

export const StyledWarningTip = styled.span`
  color: ${({ theme }) => theme.colors.warning};
`;
