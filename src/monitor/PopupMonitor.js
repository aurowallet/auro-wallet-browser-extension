import ApprovePage from "@/popup/pages/ApprovePage";
import TokenSignPage from "@/popup/pages/Send/tokenSign";
import {
  updateApproveStatus,
  updateTokenSignStatus,
} from "@/reducers/popupReducer";
import { sendMsg } from "@/utils/commonMsg";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { POPUP_ACTIONS, WORKER_ACTIONS } from "../constant/msgTypes";
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
  const tokenModalStatus = useSelector(
    (state) => state.popupReducer.tokenModalStatus
  );
  const approveModalStatus = useSelector(
    (state) => state.popupReducer.approveModalStatus
  );
  useEffect(() => {
    sendMsg(
      {
        action: POPUP_ACTIONS.GET_ALL_PENDING_ZK,
      },
      async (task) => {
        const {
          signRequests,
          notificationRequests,
          approveRequests,
          tokenSigneRequests,
        } = task;
        if (approveRequests.length > 0) {
          dispatch(updateApproveStatus(true));
        }
        if (tokenSigneRequests.length > 0) {
          dispatch(updateTokenSignStatus(true));
        }
      }
    );
  }, []);

  useEffect(() => {
    const messageListener = (message, sender, sendResponse) => {
      const { action } = message;
      switch (action) {
        case WORKER_ACTIONS.BUILD_TOKEN_SEND:
          dispatch(updateTokenSignStatus(true));
          sendResponse();
          break;
        case WORKER_ACTIONS.APPROVE:
          dispatch(updateApproveStatus(true));
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
    <>
      <ChildView status={approveModalStatus} nextView={<ApprovePage />} />
      <ChildView status={tokenModalStatus} nextView={<TokenSignPage />} />
    </>
  );
}
const ChildView = ({ status, nextView }) => {
  return (
    <>
      {status && (
        <FullScreenPopup isVisible={status}>
          <StyledContentWrapper>{status && nextView}</StyledContentWrapper>
        </FullScreenPopup>
      )}
    </>
  );
};

export default PopupMonitor;
