import extension from "extensionizer";
import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import { getBaseInfo } from "../../background/api";
import { FROM_BACK_TO_RECORD, SET_LOCK } from "../../constant/msgTypes";
import { languageInit } from "../../i18n";
import { setLanguage } from "../../reducers/appReducer";
import { updateExtensionBaseInfo } from "../../reducers/cache";
import {
  ENTRY_WITCH_ROUTE,
  updateEntryWitchRoute,
} from "../../reducers/entryRouteReducer";
import ApprovePage from "./ApprovePage";
import { LockPage } from "./Lock";
import HomePage from "./Main";
import SignTransaction from "./SignTransaction";
import Welcome from "./Welcome";
import styled, { keyframes } from "styled-components";

const MainRouter = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const [nextRoute, setNextRoute] = useState(<></>);

  const entryWitchRoute = useSelector(
    (state) => state.entryRouteReducer.entryWitchRoute
  );


  useEffect(async () => {
    let lan = await languageInit();
    dispatch(setLanguage(lan));
  }, []);

  useEffect(() => {
    let lockEvent = (message, sender, sendResponse) => {
      const { type, action } = message;
      if (type === FROM_BACK_TO_RECORD && action === SET_LOCK) {
        dispatch(updateEntryWitchRoute(ENTRY_WITCH_ROUTE.LOCK_PAGE));
        history.push("/");
      }
      return true;
    };
    extension.runtime.onMessage.addListener(lockEvent);
  }, []);

  useEffect(() => {
    switch (entryWitchRoute) {
      case ENTRY_WITCH_ROUTE.WELCOME:
        extension.tabs.create({
          url: "popup.html#/welcome_page",
        });
        return;
      case ENTRY_WITCH_ROUTE.HOME_PAGE:
        setNextRoute(<HomePage />);
        return;
      case ENTRY_WITCH_ROUTE.LOCK_PAGE:
        setNextRoute(<LockPage />);
        return;
      case ENTRY_WITCH_ROUTE.DAPP_APPROVE_PAGE:
        setNextRoute(<ApprovePage />);
        return;
      case ENTRY_WITCH_ROUTE.DAPP_SIGN_PAGE:
        setNextRoute(<SignTransaction />);
        return;
      default:
        setNextRoute(<LoadingView />);
        return;
    }
  }, [entryWitchRoute]);

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
