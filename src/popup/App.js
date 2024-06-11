import "./App.scss";
import { getAllRouter as AllRouter } from "./router";
import IdleTimer from "react-idle-timer";
import { sendMsg } from "../utils/commonMsg";
import { WALLET_RESET_LAST_ACTIVE_TIME } from "../constant/msgTypes";
import { useCallback, useEffect, useState } from "react";
import cls from "classnames";
import { getRecommendFee, getScamList } from "../background/api";
import { updateRecommendFee } from "../reducers/cache";
import { useDispatch, useSelector } from "react-redux";
import { getLocal } from "../background/localStorage";
import { RECOMMEND_FEE, SCAM_LIST } from "../constant/storageKey";
import { updateScamList } from "../reducers/accountReducer";
import { NetworkID_MAP } from "@/constant/network";

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
  const currentNode = useSelector((state) => state.network.currentNode);

  const [showFullStatus, setShowFullStatus] = useState(false);
  const [autoWidthStatus, setAutoWidthStatus] = useState(false);
  useEffect(() => {
    const url = new URL(window.location.href);
    const ledgerPageList = ["popup.html#/ledger_page"];
    const initPageList = [
      "popup.html#/register_page",
      "popup.html#/createprocess",
    ];
    const zkPage = ["popup.html#/approve_page", "popup.html#/request_sign"];

    zkPage.map((path) => {
      if (url.href.indexOf(path) !== -1) {
        setAutoWidthStatus(true);
      }
    });
    let findIndex = false;
    [...ledgerPageList, ...initPageList].map((path) => {
      if (url.href.indexOf(path) !== -1) {
        findIndex = true;
      }
    });
    if (
      (url.pathname.indexOf("popup.html") !== -1 && !findIndex) ||
      url.pathname.indexOf("notification.html") !== -1
    ) {
      setShowFullStatus(false);
    } else {
      setShowFullStatus(true);
    }
  }, [window.location.href]);

  const getLocalFeeList = useCallback(() => {
    let localFeeList = getLocal(RECOMMEND_FEE);
    if (localFeeList) {
      let feeList = JSON.parse(localFeeList);
      dispatch(updateRecommendFee(feeList));
    }
  }, []);

  const fetchFeeData = useCallback(async () => {
    getLocalFeeList();
    let feeRecommend = await getRecommendFee();
    if (feeRecommend.length > 0) {
      dispatch(updateRecommendFee(feeRecommend));
    }
  }, []);
  const getLocalScamList = useCallback(() => {
    let localScamList = getLocal(SCAM_LIST);
    if (localScamList) {
      let scamList = JSON.parse(localScamList);
      dispatch(updateScamList(scamList));
    }
  }, []);
  const fetchScamList = useCallback(async () => {
    let scamList = await getScamList();
    if (scamList.length > 0) {
      dispatch(updateScamList(scamList));
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

  return (
    <div className="App">
      <IdleTimer onAction={setLastActiveTime} throttle={1000}>
        <header
          className={cls("App-header", {
            "App-header-full": showFullStatus,
            AppAutoWidth: autoWidthStatus,
          })}
        >
          <AllRouter />
        </header>
      </IdleTimer>
    </div>
  );
}
export default App;
