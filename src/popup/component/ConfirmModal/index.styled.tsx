import styled, { keyframes } from 'styled-components';

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

export const StyledRowClose = styled.img`
  display: block;
  cursor: pointer;
`;

export const StyledRightRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
`;

export const StyledDividedLine = styled.div`
  width: 100%;
  height: 0.5px;
  background-color: #f2f2f2;
`;

export const StyledBottomContent = styled.div`
  padding: 0px 20px 0px;
  overflow-y: auto;
  background: #ffffff;
  max-height: 350px;
  margin-bottom: 100px;
`;

export const StyledHighlightContainer = styled.div`
  margin-top: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
`;

export const StyledHighlightTitle = styled.span`
  font-size: 12px;
  line-height: 17px;
  color: rgba(0, 0, 0, 0.5);
`;

export const StyledHighlightCon = styled.div`
  display: flex;
  align-items: baseline;
  margin: 8px 0px 30px;
`;

export const StyledHighlightContent = styled.span`
  font-size: 24px;
  line-height: 16px;
  display: flex;
  align-items: center;
  color: #000000;
  font-weight: 600;
`;

export const StyledSubHighlightContent = styled.p`
  font-weight: 600;
  font-size: 16px;
  line-height: 16px;
  margin-left: 4px;
`;

export const StyledContentItemContainer = styled.div`
  margin-bottom: 10px;
`;

export const StyledContentTitle = styled.p`
  font-weight: 500;
  font-size: 12px;
  line-height: 17px;
  display: flex;
  align-items: center;
  color: rgba(0, 0, 0, 0.5);
  margin: 0;
`;

export const StyledContentValue = styled.p`
  font-weight: 500;
  font-size: 14px;
  line-height: 16px;
  display: flex;
  align-items: center;
  color: #000000;
  word-break: break-all;
  margin: 0;
`;

export const StyledLedgerContent = styled.div`
  padding: 40px 20px 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

export const StyledWaitingIcon = styled.img`
  width: 58px;
`;

export const StyledLoadingSpinner = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 5px solid #E8E4F6;
  border-top-color: #594AF1;
  animation: ${spin} 1s linear infinite;
`;

export const StyledWaitingTitle = styled.p`
  font-size: 20px;
  line-height: 16px;
  color: #000000;
  margin: 30px 0 10px;
  font-weight: 700;
`;

export const StyledYellowFont = styled.span`
  color: #E4B200;
`;

export const StyledWaitingContent = styled.p`
  font-size: 14px;
  line-height: 20px;
  text-align: center;
  color: rgba(0, 0, 0, 0.5);
  margin: 20px 0px 0;
  font-weight: 500;
`;

export const StyledWaitingTip = styled.p`
  font-size: 14px;
  line-height: 20px;
  text-align: center;
  font-weight: 400;
  color: rgba(0, 0, 0, 0.5);
  margin: 16px 10px 0;
`;

export const StyledAccountRepeatName = styled.span`
  font-weight: 700;
`;

export const StyledRedFont = styled.span`
  color: #E4B200;
  font-weight: 700;
`;

export const StyledBottomContainer = styled.div`
  padding: 12px 20px 20px;
  position: fixed;
  bottom: 0;
  width: calc(100%);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ${openModal} 0.35s;
  animation-fill-mode: forwards;

  > :not(:first-of-type) {
    margin-left: 15px;
  }
`;
