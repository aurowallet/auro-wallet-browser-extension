import styled from 'styled-components';

const ProcessHeight = '3px';

export const StyledOuterContainer = styled.div`
  position: absolute;
  top: ${ProcessHeight};
  left: 0;
  z-index: 10;
  background: rgba(0, 0, 0, 0.8);
  width: 750px;
  height: calc(600px - ${ProcessHeight});
  display: flex;
  align-items: center;
`;

export const StyledContentContainer = styled.div`
  background: #ffffff;
  border-radius: 12px;
  margin: 0 60px;
  width: 100%;
  min-height: 350px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const StyledTipTitle = styled.div`
  font-weight: 700;
  font-size: 22px;
  line-height: 26px;
  text-align: center;
  color: #000000;
  margin-bottom: 20px;
`;

export const StyledTipContent = styled.div`
  font-weight: 400;
  font-size: 16px;
  line-height: 19px;
  text-align: center;
`;

export const StyledRedFont = styled.span`
  color: #d65a5a;
`;

export const StyledLedgerStep = styled(StyledTipTitle)`
  font-size: 16px;
  margin: 40px 0;
`;

export const StyledDividedLine = styled.div`
  border: 0.5px solid rgba(0, 0, 0, 0.1);
  transform: rotate(0.18deg);
  margin: 30px auto 20px;
  width: 335px;
`;

export const StyledLedgerLoading = styled.img`
  margin: 0 auto;
`;
