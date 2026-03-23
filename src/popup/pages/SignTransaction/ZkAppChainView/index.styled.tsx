import styled, { css } from 'styled-components';

export const StyledSectionSwitch = styled.section``;

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
  font-weight: 600;
  font-size: 18px;
  line-height: 21px;
  color: #000000;
  margin: 0;
`;

export const StyledContent = styled.div`
  padding: 0px 20px;
`;

export const StyledAccountTip = styled.p`
  font-size: 14px;
  line-height: 20px;
  color: rgba(0, 0, 0, 0.5);
  margin: 20px 0px 0px;
`;

export const StyledAccountAddress = styled.p`
  font-weight: 500;
  font-size: 14px;
  line-height: 17px;
  color: #000000;
  margin: 20px 0px;
  word-break: break-all;
`;

export const StyledWarningTip = styled.p`
  font-size: 14px;
  line-height: 20px;
  color: rgba(0, 0, 0, 0.3);
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

export const StyledAccountRow = styled.div`
  margin-top: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
`;

interface StyledRowTitleProps {
  $rightAlign?: boolean;
}

export const StyledRowTitle = styled.p<StyledRowTitleProps>`
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

export const StyledRowContent = styled.p`
  font-weight: 500;
  font-size: 16px;
  color: #000000;
  margin: 0;
  white-space: pre;
`;

export const StyledRowLeft = styled.div`
  text-align: left;
`;

export const StyledRowRight = styled.div`
  text-align: right;
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

export const StyledAddTipContainer = styled.div`
  margin-bottom: 20px;
  padding: 10px 20px;
  background: rgba(214, 90, 90, 0.1);
  width: 100%;
  margin-left: -20px;
`;

export const StyledAddTip = styled.p`
  font-size: 14px;
  line-height: 20px;
  color: #d65a5a;
  margin: 0;
`;

export const StyledNodeWrapper = styled.div`
  margin-top: 20px;
  border-radius: 4px;
  border: 0.5px solid rgba(0, 0, 0, 0.1);
  display: flex;
  padding: 10px;
  flex-direction: column;

  > :not(:first-child) {
    margin-top: 10px;
  }
`;

export const StyledNodeTitle = styled.p`
  color: rgba(0, 0, 0, 0.8);
  font-size: 14px;
  font-weight: 700;
  margin: 0;
`;

export const StyledNodeContent = styled.p`
  color: rgba(0, 0, 0, 0.8);
  font-size: 14px;
  font-weight: 400;
  margin: 0;
`;

export const StyledMt20 = styled.div`
  margin-top: 20px;
`;
