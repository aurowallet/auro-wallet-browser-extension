import styled from 'styled-components';

export const StyledContainer = styled.div`
  > :not(:first-child) {
    margin-top: 10px;
  }
`;

export const StyledRowTitle2 = styled.p`
  color: rgba(0, 0, 0, 0.8);
  font-weight: 700;
  margin: 0;
`;

export const StyledRowContent = styled.p`
  font-weight: 400;
  color: rgba(0, 0, 0, 0.8);
  margin: 0;
`;

export const StyledLoopWrapper = styled.div`
  > :not(:first-child) {
    margin-top: 6px;
  }
`;

export const StyledViewRow = styled.div`
  display: flex;
`;

export const StyledRowContentContainer = styled.div`
  white-space: pre;
`;

export const StyledWarningRowTitle = styled.p`
  color: #e4b200;
  font-weight: 700;
  margin: 0;
`;

export const StyledWarningRowContent = styled.p`
  font-weight: 400;
  color: #e4b200;
  margin: 0;
`;
