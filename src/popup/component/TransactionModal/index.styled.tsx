import styled, { css, keyframes } from 'styled-components';

interface StyledAlignProps {
  $rightAlign?: boolean;
}

const openModal = keyframes`
  from {
    bottom: -50%;
  }
  to {
    bottom: 0;
  }
`;

export const StyledOuterContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  z-index: 10;
  background: rgba(0, 0, 0, 0.8);
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: end;
  flex-direction: column;
`;

export const StyledInnerContent = styled.div`
  background: #ffffff;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  width: 100%;
  position: absolute;
  bottom: 0;
  animation: ${openModal} 0.35s;
  animation-fill-mode: forwards;
`;

export const StyledTitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  padding: 8px 20px;
`;

export const StyledRowTitle = styled.span`
  font-weight: 600;
  font-size: 16px;
  line-height: 16px;
  display: flex;
  align-items: center;
  color: #222222;
`;

export const StyledRightRow = styled.div`
  display: flex;
  align-items: center;
`;

export const StyledDividedLine = styled.div`
  width: 100%;
  height: 0.5px;
  background-color: #f2f2f2;
`;

export const StyledBottomContent = styled.div`
  overflow-y: auto;
  background: #ffffff;
  max-height: 350px;
  margin-bottom: 20px;
`;

export const StyledBottomContainer = styled.div`
  padding: 12px 20px 20px;
  width: calc(100%);
  display: flex;
  align-items: center;
  justify-content: center;

  > :not(:first-of-type) {
    margin-left: 15px;
  }
`;

export const StyledModalContent = styled.div`
  color: rgba(0, 0, 0, 0.5);
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
  margin: 20px 20px;
`;

export const StyledLightFont = styled.span`
  color: rgba(0, 0, 0, 0.8);
`;

export const StyledFeeContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0px 20px;
`;

export const StyledFeeItem = styled.div`
  flex: 1;
`;

export const StyledFeeTitle = styled.div<StyledAlignProps>`
  color: rgba(0, 0, 0, 0.5);
  font-size: 12px;
  font-weight: 500;

  ${({ $rightAlign }) => $rightAlign && css`
    text-align: right;
  `}
`;

export const StyledFeeContent = styled.div<StyledAlignProps>`
  color: rgba(0, 0, 0, 0.8);
  font-size: 16px;
  font-weight: 500;
  margin-top: 4px;

  ${({ $rightAlign }) => $rightAlign && css`
    text-align: right;
  `}
`;

export const StyledFeeArrow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;

  img {
    width: 10px;
  }
`;

export const StyledChangeWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
`;

export const StyledChangeCls = styled.div`
  margin-right: 20px;
  color: #594af1;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  text-align: right;
`;

export const StyledLedgerContent = styled.div`
  padding: 48px 20px 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
`;

export const StyledWaitingIcon = styled.img`
  width: 58px;
`;

export const StyledWaitingTitle = styled.p`
  font-size: 20px;
  line-height: 16px;
  color: #000000;
  margin: 30px 0 10px;
  font-weight: 700;
`;

export const StyledWaitingContent = styled.p`
  font-size: 14px;
  line-height: 16px;
  text-align: center;
  color: rgba(0, 0, 0, 0.5);
  margin: 0;
  font-weight: 500;
`;

export const StyledWaitingTip = styled.p`
  font-size: 14px;
  line-height: 16px;
  text-align: center;
  font-weight: 400;
  color: rgba(0, 0, 0, 0.5);
  margin: 20px 10px;
`;

export const StyledAccountRepeatName = styled.span`
  font-weight: 700;
`;

export const StyledRedFont = styled.span`
  color: #d65a5a;
`;
