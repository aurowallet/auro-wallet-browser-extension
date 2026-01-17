import styled, { keyframes } from 'styled-components';

export const StyledHistoryContainer = styled.div`
  background: #ffffff;
  height: 100%;
`;

const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

export const StyledLoadingCon = styled.div`
  height: 100%;
  padding-top: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 255px;
  overflow: hidden;
`;

export const StyledRefreshLoading = styled.img`
  animation: ${spin} 0.5s linear infinite;
`;

export const StyledLoadingContent = styled.p`
  font-size: 12px;
  line-height: 17px;
  margin: 10px 0px 0px;
  color: rgba(0, 0, 0, 0.3);
`;

export const StyledEmptyIcon = styled.img`
  margin-bottom: 10px;
  width: 100px;
  height: 100px;
`;

export const StyledEmptyContent = styled.span`
  font-weight: 400;
  font-size: 12px;
  line-height: 17px;
  color: rgba(0, 0, 0, 0.3);
`;
