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
import { ACCOUNT_ACTIONS, POPUP_ACTIONS, WALLET_GET_CURRENT_ACCOUNT, WORKER_ACTIONS } from "../constant/msgTypes";
import { updateSignZkModalStatus } from "../reducers/popupReducer";
import SignTransaction from "../popup/pages/SignTransaction";
import browser from 'webextension-polyfill';
import { updateCurrentAccount } from "@/reducers/accountReducer";
// Styled-component for the popup
const FullScreenPopup = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #edeff2;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 200;
  visibility: ${({ isVisible }) => (isVisible ? "visible" : "hidden")};
  opacity: ${({ isVisible }) => (isVisible ? 1 : 0)};
  transition: visibility 0.3s, opacity 0.3s;
`;

const StyledContentWrapper = styled.div`
  width: 100%;
  max-width: 375px;
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
  const signZkModalStatus = useSelector(
    (state) => state.popupReducer.signZkModalStatus
  );
  
  useEffect(() => {
    sendMsg(
      {
        action: POPUP_ACTIONS.GET_ALL_PENDING_ZK,
      },
      async (task) => {
        const {
          signRequests,
          chainRequests,
          approveRequests,
          tokenSigneRequests,
        } = task;
        if (approveRequests.length > 0) {
          dispatch(updateApproveStatus(true));
        }
        if (tokenSigneRequests.length > 0) {
          dispatch(updateTokenSignStatus(true));
        }
        let list = [...signRequests,...chainRequests]
        if (list.length > 0) {
          dispatch(updateSignZkModalStatus(true));
        }
      }
    );
  }, []);

  useEffect(() => {
    const messageListener = (message, sender, sendResponse) => {
      const { action,payload } = message;
      switch (action) {
        case WORKER_ACTIONS.BUILD_TOKEN_SEND:
          dispatch(updateTokenSignStatus(true));
          sendResponse();
          break;
        case WORKER_ACTIONS.APPROVE:
          dispatch(updateApproveStatus(true));
          sendResponse();
          break;
        case WORKER_ACTIONS.SIGN_ZK:
          dispatch(updateSignZkModalStatus(true));
          sendResponse();
          break;
        case ACCOUNT_ACTIONS.REFRESH_CURRENT_ACCOUNT:
          if(payload){
            sendMsg(
              {
                action: WALLET_GET_CURRENT_ACCOUNT,
              },
              async (currentAccount) => {
                dispatch(updateCurrentAccount(currentAccount));
              }
            );
          }
          sendResponse();
          break;
        default:
          break;
      }
      return true;
    };

    browser.runtime.onMessage.addListener(messageListener);
    sendMsg({ action: POPUP_ACTIONS.POPUP_NOTIFACATION });

    return () => {
      browser.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  return (
    <>
      <ChildView status={signZkModalStatus} nextView={<SignTransaction />} />
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
