import { useCallback, useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useStore";
import { useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import { getBaseInfo } from "../../background/api";
import { languageInit } from "../../i18n";
import { setLanguage } from "../../reducers/appReducer";
import {
  updateExtensionBaseInfo,
} from "../../reducers/cache";
import {
  ENTRY_WITCH_ROUTE,
} from "../../reducers/entryRouteReducer";
import { LockPage } from "./Lock";
import HomePage from "./Main";

const MainRouter = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [nextRoute, setNextRoute] = useState(<></>);

  const entryWitchRoute = useAppSelector(
    (state) => state.entryRouteReducer.entryWitchRoute
  );
  const popupLockStatus = useAppSelector((state) => state.cache.popupLockStatus);

  const initBaseInfo = useCallback(async () => {
    let baseInfo = await getBaseInfo().catch((err) => err);
    if (baseInfo) {
      dispatch(updateExtensionBaseInfo(baseInfo));
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      let lan = await languageInit();
      dispatch(setLanguage(lan));
      initBaseInfo();
    };
    init();
  }, []);


  useEffect(() => {
    switch (entryWitchRoute) {
      case ENTRY_WITCH_ROUTE.HOME_PAGE:
        setNextRoute(<HomePage />);
        return;
      case ENTRY_WITCH_ROUTE.LOCK_PAGE:
        setNextRoute(popupLockStatus ? <></> : <LockPage />);
        return;
      case ENTRY_WITCH_ROUTE.WELCOME:
        // Redirect to register page for new wallet setup
        navigate("/register_page");
        return;
      default:
        setNextRoute(<LoadingView />);
        return;
    }
  }, [entryWitchRoute, navigate, popupLockStatus]);

  return nextRoute;
};
export default MainRouter;

const rotate = keyframes`
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
`;
const StyledLoadingWrapper = styled.div`
  background: #ffffff;
  box-shadow: 0px 0px 1px #00000030;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
`;
const StyledLoadingImg = styled.img`
  animation: ${rotate} 0.5s linear infinite;
  height: 40px;
`;
const LoadingView = () => {
  return (
    <StyledLoadingWrapper>
      <StyledLoadingImg src={"/img/loading_purple.svg"} />
    </StyledLoadingWrapper>
  );
};
