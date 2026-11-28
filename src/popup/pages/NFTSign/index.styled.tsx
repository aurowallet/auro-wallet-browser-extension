import styled, { css } from "styled-components";

export const StyledSectionSign = styled.section`
  overflow: auto;
  height: 100%;
  padding-bottom: 88px;
  box-sizing: border-box;
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

export const StyledTitleRight = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const StyledTitle = styled.p`
  font-weight: 600;
  font-size: 18px;
  line-height: 21px;
  color: #000000;
  margin: 0;
`;

export const StyledContent = styled.div`
  margin-top: 20px;
  padding: 0px 20px;
`;

export const StyledWebsiteContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const StyledAccountRow = styled.div`
  margin-top: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
`;

export const StyledRowLeft = styled.div``;

export const StyledRowTitle = styled.p<{ $rightAlign?: boolean }>`
  font-weight: 500;
  font-size: 12px;
  line-height: 14px;
  color: rgba(0, 0, 0, 0.5);
  margin: 0 0 4px 0;

  ${({ $rightAlign }) => $rightAlign && css`
    text-align: right;
    white-space: pre;
  `}
`;

export const StyledRowContent = styled.p<{ $canCopy?: boolean }>`
  font-weight: 500;
  font-size: 16px;
  color: #000000;
  margin: 0;
  align-content: center;

  ${({ $canCopy }) => $canCopy && css`
    cursor: pointer;
  `}
`;

export const StyledRowDescContent = styled.span`
  font-size: 12px;
`;

export const StyledRowArrow = styled.div`
  height: 100%;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 10px;
  }
`;

export const StyledRowRight = styled.div``;

export const StyledRightWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
`;

export const StyledTypeRow = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 15px;
  padding: 2px 6px;
  border-radius: 8px;
  margin-right: 4px;
  border: 1px solid #594af1;
  color: #594af1;
  font-size: 10px;
  font-weight: 500;
`;

export const StyledHighFeeTip = styled.div`
  font-weight: 500;
  font-size: 12px;
  line-height: 17px;
  color: #e4b200;
`;

export const StyledBtnGroup = styled.div`
  position: absolute;
  bottom: 0;
  justify-content: center;
  align-items: center;
  width: 100%;
  display: flex;
  gap: 15px;
  padding: 12px 0px 20px;
  max-width: 375px;
`;

export const StyledNetworkFee = styled.div`
  margin-top: 20px;
`;

export const StyledFeeRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const StyledFeeLabel = styled.p`
  font-weight: 500;
  font-size: 12px;
  line-height: 14px;
  color: rgba(0, 0, 0, 0.5);
  margin: 0 0 4px 0;
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
