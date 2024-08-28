import TokenSignPage from "@/popup/pages/Send/tokenSign";
import { updateTokenSignStatus } from "@/reducers/popupReducer";
import { sendMsg } from "@/utils/commonMsg";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { DAPP_ACTIONS, POPUP_ACTIONS } from "../constant/msgTypes";

// Styled-component for the popup
const FullScreenPopup = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  visibility: ${({ isVisible }) => (isVisible ? "visible" : "hidden")};
  opacity: ${({ isVisible }) => (isVisible ? 1 : 0)};
  transition: visibility 0.3s, opacity 0.3s;
`;

const StyledContentWrapper = styled.div`
  width: 100%;
  height: 100%;
  background-color: white;
`;

function PopupMonitor() {
  const dispatch = useDispatch();
  const tokenSignStatus = useSelector(
    (state) => state.popupReducer.tokenSignStatus
  );
  useEffect(() => {
    const messageListener = (message, sender, sendResponse) => {
      const { action } = message;
      switch (action) {
        case DAPP_ACTIONS.BUILD_TOKEN_SEND:
          dispatch(updateTokenSignStatus(true));
          sendResponse();
          break;
        default:
          break;
      }
      return true;
    };

    chrome.runtime.onMessage.addListener(messageListener);
    sendMsg({ action: POPUP_ACTIONS.POPUP_NOTIFACATION });

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  return (
    <FullScreenPopup isVisible={tokenSignStatus}>
      <StyledContentWrapper>
        {tokenSignStatus && <TokenSignPage />}
      </StyledContentWrapper>
    </FullScreenPopup>
  );
}

export default PopupMonitor;
