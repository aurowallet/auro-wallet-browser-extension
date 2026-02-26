import { getAllRouter as AllRouter } from "./router";
import { useIdleTimer } from "react-idle-timer";
import { sendMsg } from "../utils/commonMsg";
import { WALLET_RESET_LAST_ACTIVE_TIME } from "../constant/msgTypes";
import { useCallback, useEffect, useState } from "react";
import {
  fetchSupportTokenInfo,
  getRecommendFee,
  getScamList,
} from "../background/api";
import { GlobalStyles } from "./GlobalStyles";
import { StyledApp, StyledAppHeader } from "./App.styled";
import { updateRecommendFee } from "../reducers/cache";
import { useDispatch, useSelector } from "react-redux";
import { getLocal } from "../background/localStorage";
import {
  SCAM_LIST,
  SUPPORT_TOKEN_LIST,
} from "../constant/storageKey";
import {
  updateScamList,
  updateSupportTokenList,
} from "../reducers/accountReducer";
import { NetworkID_MAP } from "@/constant/network";
import { getReadableNetworkId } from "@/utils/utils";
import LedgerStatusSyncer from "./component/LedgerStatusSyncer";
import { RootState } from "@/reducers";

function setLastActiveTime() {
  sendMsg(
    {
      action: WALLET_RESET_LAST_ACTIVE_TIME,
    },
    () => {}
  );
}

function App() {
  const dispatch = useDispatch();
  const currentNode = useSelector((state: RootState) => state.network.currentNode);
  const shouldRefresh = useSelector((state: RootState) => state.accountInfo.shouldRefresh);

  const [showFullStatus, setShowFullStatus] = useState(false);
  const [autoWidthStatus, setAutoWidthStatus] = useState(false);
  useEffect(() => {
    const url = new URL(window.location.href);
    // Extract hash path without query parameters (e.g., "#/register_page?addWallet=true" -> "/register_page")
    const hashPath = url.hash.split("?")[0]?.replace("#", "") ?? "";

    const fullPageRoutes = ["/ledger_page", "/register_page", "/createprocess"];
    const zkPageRoutes = ["/approve_page", "/request_sign", "/token_sign"];

    const isZkPage = zkPageRoutes.some((route) => hashPath.startsWith(route));
    const isFullPage = fullPageRoutes.some((route) =>
      hashPath.startsWith(route)
    );

    if (isZkPage) {
      setAutoWidthStatus(true);
    }

    if (
      (url.pathname.indexOf("popup.html") !== -1 && !isFullPage) ||
      url.pathname.indexOf("notification.html") !== -1
    ) {
      setShowFullStatus(false);
    } else {
      setShowFullStatus(true);
    }
  }, [window.location.href]);

  const fetchFeeData = useCallback(async () => {
    const feeConfig = await getRecommendFee();
    dispatch(updateRecommendFee(feeConfig));
  }, []);
  const getLocalScamList = useCallback(() => {
    let localScamList = getLocal(SCAM_LIST);
    if (localScamList) {
      let scamList = JSON.parse(localScamList);
      dispatch(updateScamList(scamList));
    }
  }, []);
  const fetchScamList = useCallback(async () => {
    const scamList = await getScamList();
    if (Array.isArray(scamList) && scamList.length > 0) {
      dispatch(updateScamList(scamList as Parameters<typeof updateScamList>[0]));
    }
  }, []);

  const initTokenNetInfo = useCallback(async () => {
    const tokenInfoList = await fetchSupportTokenInfo();
    if (Array.isArray(tokenInfoList) && tokenInfoList.length > 0) {
      dispatch(updateSupportTokenList(tokenInfoList as Parameters<typeof updateSupportTokenList>[0]));
    }
  }, []);

  const initNetData = useCallback(() => {
    fetchFeeData();
    fetchScamList();
  }, [currentNode]);

  useEffect(() => {
    if (currentNode?.networkID) {
      if (currentNode?.networkID !== NetworkID_MAP.mainnet) {
        dispatch(updateScamList([]));
      } else {
        getLocalScamList();
      }
    }
  }, [currentNode]);

  useEffect(() => {
    initNetData();
  }, []);

  const loadLocalSupportToken = useCallback(() => {
    const readableNetworkId = getReadableNetworkId(currentNode.networkID);
    let supportList = getLocal(SUPPORT_TOKEN_LIST + "_" + readableNetworkId);
    if (supportList) {
      let supportListJson = JSON.parse(supportList);
      if (supportListJson) {
        dispatch(updateSupportTokenList(supportListJson));
      }
    }
  }, [currentNode]);

  useEffect(() => {
    if (shouldRefresh && currentNode?.networkID) {
      loadLocalSupportToken();
      initTokenNetInfo();
    }
  }, [shouldRefresh, currentNode]);

  useIdleTimer({
    onAction: setLastActiveTime,
    throttle: 1000,
    timeout: 1000 * 60 * 30,
  });

  return (
    <StyledApp>
      <GlobalStyles />
      <LedgerStatusSyncer />
      <StyledAppHeader $showFull={showFullStatus} $autoWidth={autoWidthStatus}>
        <AllRouter />
      </StyledAppHeader>
    </StyledApp>
  );
}
export default App;
