import styled from 'styled-components';

export const StyledContainer = styled.div`
  overflow: auto;
`;

export const StyledTitleRow = styled.div`
  display: flex;
  align-items: center;
  height: 48px;
  margin-top: 10px;
  padding: 0px 20px;
  position: relative;
  justify-content: space-between;
`;

export const StyledTitle = styled.p`
  font-weight: ${({ theme }) => theme.typography.fontWeightSemiBold};
  font-size: 18px;
  line-height: 21px;
  color: ${({ theme }) => theme.colors.textBlack};
  margin: 0;
`;

export const StyledContent = styled.div`
  margin-top: 20px;
  padding: 0px 20px;
`;

export const StyledAccountTip = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSizeContent};
  line-height: 20px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 20px 0px 0px;
`;

export const StyledAccountAddress = styled.p`
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
  font-size: ${({ theme }) => theme.typography.fontSizeContent};
  line-height: ${({ theme }) => theme.typography.lineHeightDesc};
  color: ${({ theme }) => theme.colors.textBlack};
  margin: 20px 0px;
  word-break: break-all;
`;

export const StyledWarningTip = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSizeContent};
  line-height: 20px;
  color: ${({ theme }) => theme.colors.textTertiary};
  padding: 0px 20px;
  text-align: center;
`;

export const StyledBtnGroup = styled.div`
  justify-content: center;
  align-items: center;
  width: calc(100% - 40px);
  display: flex;
  gap: 15px;
  padding: 12px 20px 20px;
`;

export const StyledBottomView = styled.div`
  position: absolute;
  bottom: 0;
`;
