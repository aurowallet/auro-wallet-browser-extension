import { getBalance } from "@/background/api";
import {
  DAPP_ACTION_CANCEL_ALL,
  GET_SIGN_PARAMS,
  WALLET_GET_CURRENT_ACCOUNT,
} from "@/constant/msgTypes";
import Loading from "@/popup/component/Loading";
import ICON_Arrow from "@/popup/component/SVG/ICON_Arrow";
import { updateNetAccount } from "@/reducers/accountReducer";
import { updateDAppOpenWindow } from "@/reducers/cache";
import {
  ENTRY_WITCH_ROUTE,
  updateEntryWitchRoute,
} from "@/reducers/entryRouteReducer";
import { sendMsg } from "@/utils/commonMsg";
import { getQueryStringArgs } from "@/utils/utils";
import { DAppActions } from "@aurowallet/mina-provider";
import BigNumber from "bignumber.js";
import cls from "classnames";
import i18n from "i18next";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Trans } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import { LockPage } from "../Lock";
import SignView from "./SignView";
import styles from "./index.module.scss";
import SwitchChain from "./SwitchChain";

const ICON_COLOR = {
  black: "rgba(0, 0, 0, 1)",
  gray: "rgba(0, 0, 0, 0.5)",
};

/** page click event */
const TX_CLICK_TYPE = {
  CONFIRM: "TX_CLICK_TYPE_CONFIRM",
  CANCEL: "TX_CLICK_TYPE_CANCEL",
};

/** mina sign event */
const SIGN_MESSAGE_EVENT = [
  DAppActions.mina_signMessage,
  DAppActions.mina_signFields,
  DAppActions.mina_sign_JsonMessage,
];
/** mina sign event and broa */
const SIGN_EVENT_WITH_BROADCASE = [
  DAppActions.mina_sendTransaction,
  DAppActions.mina_sendPayment,
  DAppActions.mina_sendStakeDelegation,
];

const SignTransaction = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const isFirstRequest = useRef(true)

  const [pendingSignList, setPendingSignList] = useState([]);
  const [currentSignIndex, setCurrentSignIndex] = useState(0);
  const [showMultiView, setShowMultiView] = useState(false);
  const [leftArrowStatus, setLeftArrowStatus] = useState(true);
  const [rightArrowStatus, setRightArrowStatus] = useState(false);
  const [advanceData, setAdvanceData] = useState({});
  const [notifyData, setNotifyData] = useState({});
  const [state,setState]=useState({
    signViewStatus:true,
    notifyViewStatus:false
  })

  const dappWindow = useSelector((state) => state.cache.dappWindow);
  const inferredNonce = useSelector(
    (state) => state.accountInfo.netAccount.inferredNonce
  );
  const [nextUseInferredNonce, setNextUseInferredNonce] = useState(
    inferredNonce
  );
  useEffect(() => {
    if (inferredNonce) {
      setNextUseInferredNonce(inferredNonce);
    }
  }, [inferredNonce]);

  const currentAccount = useSelector(
    (state) => state.accountInfo.currentAccount
  );
  const currentAddress = useSelector(
    (state) => state.accountInfo.currentAccount.address
  );

  const [lockStatus, setLockStatus] = useState(false);

  const params = useMemo(() => {
    let url = dappWindow.url || window.location?.href || "";
    return getQueryStringArgs(url);
  }, [dappWindow]);

  const onClickUnLock = useCallback(() => {
    setLockStatus(true);
  }, [currentAccount, params]);

  const getSignParams = useCallback(() => {
    sendMsg(
      {
        action: GET_SIGN_PARAMS,
        payload: {
          openId: params.openId,
        },
      },
      (res) => {
        const {signRequests,notificationRequests,topItem} = res
        setPendingSignList(signRequests);

        if(notificationRequests.length>0){// current support 1 event
          setNotifyData(notificationRequests[0])
        }

        if(topItem && topItem.params?.action === DAppActions.mina_switchChain){
          setState({
            notifyViewStatus:true,
            signViewStatus:false
          })
        }else{
          setState({
            notifyViewStatus:false,
            signViewStatus:true
          })
          if(isFirstRequest.current){
            const firstSignParams = signRequests[0];
            const sendAction = firstSignParams?.params?.action || "";
            if (SIGN_MESSAGE_EVENT.indexOf(sendAction) === -1) {
              Loading.show();
            }
            fetchAccountInfo();
          }
        }
       
      }
    );
  }, [params, pendingSignList, fetchAccountInfo]);

  useEffect(() => {
    sendMsg(
      {
        action: WALLET_GET_CURRENT_ACCOUNT,
      },
      async (currentAccount) => {
        setLockStatus(currentAccount.isUnlocked);
      }
    );
  }, [dappWindow]);
  const fetchAccountInfo = useCallback(async () => {
    let account = await getBalance(currentAddress);
    if (account.publicKey) {
      dispatch(updateNetAccount(account));
    }
    isFirstRequest.current = false
    Loading.hide();
  }, [dispatch, currentAddress]);

  useEffect(() => {
    getSignParams();
  }, [window.location?.href]);

  const { leftArrowColor, rightArrowColor } = useMemo(() => {
    let leftArrowColor =
      currentSignIndex === 0 ? ICON_COLOR.gray : ICON_COLOR.black;
    const total = pendingSignList.length;
    let rightArrowColor =
      currentSignIndex === total - 1 ? ICON_COLOR.gray : ICON_COLOR.black;
    return {
      leftArrowColor,
      rightArrowColor,
    };
  }, [currentSignIndex, pendingSignList]);

  useEffect(() => {
    setShowMultiView(pendingSignList.length > 1);
  }, [pendingSignList]);

  const onClickLeftBtn = useCallback(() => {
    if (leftArrowStatus) {
      return;
    }
    setRightArrowStatus(false);
    let nextIndex = currentSignIndex - 1;
    if (nextIndex <= 0) {
      nextIndex = 0;
      setLeftArrowStatus(true);
    } else {
      setLeftArrowStatus(false);
    }
    setCurrentSignIndex(nextIndex);
  }, [currentSignIndex, leftArrowStatus, pendingSignList]);

  const onClickRightBtn = useCallback(() => {
    if (rightArrowStatus) {
      return;
    }
    setLeftArrowStatus(false);
    const total = pendingSignList.length;
    let nextIndex = currentSignIndex + 1;

    if (nextIndex >= total - 1) {
      nextIndex = total - 1;
      setRightArrowStatus(true);
    } else {
      setRightArrowStatus(false);
    }

    setCurrentSignIndex(nextIndex);
  }, [pendingSignList, rightArrowStatus, currentSignIndex]);

  const onRemoveNotify = useCallback(()=>{
    setNotifyData({})
    if(pendingSignList.length>0){
      setState({
        signViewStatus:true,
        notifyViewStatus:false
      })
    }else{
      goToHome();
    }
  },[pendingSignList])
  const onRemoveTx = useCallback(
    (openId, type, nonce) => {
      let signList = [...pendingSignList];
      let tempSignParams;
      signList = signList.filter((item) => {
        let checkStatus = item.id !== openId;
        if (!checkStatus) {
          tempSignParams = item;
        }
        return checkStatus;
      });
      
      if (signList.length === 0) { 
        if(notifyData.id){
          setState({
              signViewStatus:false,
              notifyViewStatus:true
            })
          setPendingSignList(signList);
          setCurrentSignIndex(0);
        }else{
          goToHome();
        }
        return;
      }
      setPendingSignList(signList);
      setCurrentSignIndex(0);
      // if the zk tx is confirmed and the nonce is same with nextUseInferredNonce , then + 1
      if (type === TX_CLICK_TYPE.CONFIRM) {
        const sendAction = tempSignParams?.params?.action || "";
        if (
          SIGN_EVENT_WITH_BROADCASE.indexOf(sendAction) !== -1 &&
          nextUseInferredNonce === nonce
        ) {
          setNextUseInferredNonce((state) =>
            BigNumber(state).plus(1).toNumber()
          );
        }
      }
    },
    [pendingSignList, nextUseInferredNonce, goToHome,notifyData]
  );
  const goToHome = useCallback(() => {
    let url = dappWindow?.url;
    if (url) {
      dispatch(updateEntryWitchRoute(ENTRY_WITCH_ROUTE.HOME_PAGE));
    }
    dispatch(updateDAppOpenWindow({}));
  }, [dappWindow, showMultiView]);
  /** reject all tx */
  const onRejectAll = useCallback(() => {
    sendMsg(
      {
        action: DAPP_ACTION_CANCEL_ALL,
        payload: {
          cancel: true,
        },
      },
      async (params) => {}
    );
    if(notifyData.id){
      setPendingSignList([])
      setState({
          signViewStatus:false,
          notifyViewStatus:true
        })
    }else{
      goToHome();
    }
    
  }, [pendingSignList,notifyData]);

  const onUpdateAdvance = useCallback(
    ({ id, fee, nonce }) => {
      let preAdvanceData = { ...advanceData };
      preAdvanceData[id] = {
        fee,
        nonce,
      };
      setAdvanceData(preAdvanceData);
    },
    [advanceData]
  );

  if (!lockStatus) {
    return (
      <LockPage
        onDappConfirm={true}
        onClickUnLock={onClickUnLock}
        history={history}
      />
    );
  }
  return (
    <div className={styles.conatiner}>
      {showMultiView && state.signViewStatus && (
        <div className={styles.multiTitleRow}>
          <div className={styles.multiTitle}>
            <Trans
              i18nKey={"pendingZkTx"}
              values={{
                current: currentSignIndex + 1,
                total: pendingSignList.length,
              }}
              components={{
                bold: <span className={styles.multiTitleBold} />,
              }}
            />
          </div>
          <div className={styles.multiTitleRowRight}>
            <div
              className={cls(styles.multiRowArrow, {
                [styles.multiRowArrowDisable]: leftArrowStatus,
              })}
              onClick={onClickLeftBtn}
            >
              <ICON_Arrow stroke={leftArrowColor} />
            </div>
            <div
              className={cls(styles.multiRowArrow, styles.rightArrow, {
                [styles.multiRowArrowDisable]: rightArrowStatus,
              })}
              onClick={onClickRightBtn}
            >
              <ICON_Arrow stroke={rightArrowColor} />
            </div>
          </div>
        </div>
      )}
      {state.signViewStatus && <SignView
        signParams={pendingSignList[currentSignIndex]}
        showMultiView={showMultiView}
        onRemoveTx={onRemoveTx}
        inferredNonce={nextUseInferredNonce}
        advanceData={advanceData}
        onUpdateAdvance={onUpdateAdvance}
        key={pendingSignList[currentSignIndex]?.id}
      />}
      {state.notifyViewStatus && <SwitchChain 
        notifyParams={notifyData}
        onRemoveNotify={onRemoveNotify}
      />}
      {showMultiView && state.signViewStatus && (
        <div className={styles.multiBottomWrapper}>
          <div className={styles.multiBottom} onClick={onRejectAll}>
            {i18n.t("rejectAllTx", { total: pendingSignList.length })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SignTransaction;
