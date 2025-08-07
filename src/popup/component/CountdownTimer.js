import styled, { css } from "styled-components";
import { useTimer } from "../../hooks/TimerContext";

const animationCss = css`
  transform-origin: center;
  animation: refreshAni 0.8s infinite linear;

  @keyframes refreshAni {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const StyledRefreshWrapper = styled.div`
  width: 22px;
  height: 22px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  ${animationCss}

  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
`;

const StyledRefreshIcon = styled.img`
  width: 100%;
  height: 100%;
  padding: 4px;
  object-fit: contain;
`;

const StyledIntervalWrapper = styled.div`
  display: flex;
  align-items: center;
  width: 30px;
  height: 24px;
  justify-content: flex-end;
`;

const CountdownTimer = () => {
  const { countdown, isRefreshing, intervalTime } = useTimer();

  return <></>;
  // return intervalTime > 0 ? (
  //   <StyledIntervalWrapper>
  //     {isRefreshing ? (
  //       <StyledRefreshWrapper>
  //         <StyledRefreshIcon src="/img/loading_purple.svg" />
  //       </StyledRefreshWrapper>
  //     ) : (
  //       ` (${countdown})`
  //     )}
  //   </StyledIntervalWrapper>
  // ) : (
  //   <></>
  // );
};

export default CountdownTimer;
