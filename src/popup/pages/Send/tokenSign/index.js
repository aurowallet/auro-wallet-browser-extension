import {
  DAPP_ACTION_CANCEL_ALL,
  WALLET_GET_CURRENT_ACCOUNT,
} from "@/constant/msgTypes";
import useFetchAccountData from "@/hooks/useUpdateAccount";
import Loading from "@/popup/component/Loading";
import ICON_Arrow from "@/popup/component/SVG/ICON_Arrow";
import { updateShouldRequest } from "@/reducers/accountReducer";
import { updateDAppOpenWindow } from "@/reducers/cache";
import {
  ENTRY_WITCH_ROUTE,
  updateEntryWitchRoute,
} from "@/reducers/entryRouteReducer";
import { sendMsg } from "@/utils/commonMsg";
import { DAppActions } from "@aurowallet/mina-provider";
import BigNumber from "bignumber.js";
import cls from "classnames";
import i18n from "i18next";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Trans } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import { LockPage } from "../../Lock";
import { TOKEN_BUILD } from "@/constant/tokenMsgTypes";
import SignView from "../SignView";
import styles from "./index.module.scss";

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
const SIGN_EVENT_WITH_BROADCAST = [
  DAppActions.mina_sendTransaction,
  DAppActions.mina_sendPayment,
  DAppActions.mina_sendStakeDelegation,
];

const SignTransaction = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const isFirstRequest = useRef(true);
  const isShowLoading = useRef(false);

  const [pendingSignList, setPendingSignList] = useState([]);
  const [currentSignIndex, setCurrentSignIndex] = useState(0);
  const [showMultiView, setShowMultiView] = useState(false);
  const [leftArrowStatus, setLeftArrowStatus] = useState(true);
  const [rightArrowStatus, setRightArrowStatus] = useState(false);
  const [advanceData, setAdvanceData] = useState({});

  const dappWindow = useSelector((state) => state.cache.dappWindow);
  const inferredNonce = useSelector(
    (state) => state.accountInfo.mainTokenNetInfo?.inferredNonce
  );
  const [nextUseInferredNonce, setNextUseInferredNonce] = useState(
    inferredNonce
  );
  useEffect(() => {
    setNextUseInferredNonce(inferredNonce);
  }, [inferredNonce]);

  const currentAccount = useSelector(
    (state) => state.accountInfo.currentAccount
  );

  const { fetchAccountData } = useFetchAccountData(currentAccount);

  const currentAddress = useSelector(
    (state) => state.accountInfo.currentAccount.address
  );

  const [lockStatus, setLockStatus] = useState(false);

  const fetchAccountInfo = useCallback(async () => {
    if (isShowLoading.current) {
      Loading.show();
    }
    dispatch(updateShouldRequest(true, true));
    await fetchAccountData();
    isFirstRequest.current = false;
    Loading.hide();
  }, [dispatch, currentAddress]);

  const onClickUnLock = useCallback(() => {
    setLockStatus(true);
  }, [currentAccount]);

  const getSignParams = useCallback(() => {
    sendMsg(
      {
        action: TOKEN_BUILD.getAllTokenPendingSign,
      },
      (res) => {
        setPendingSignList(res);
        if (isFirstRequest.current) {
          isShowLoading.current = true;
        }
        if (currentSignIndex < res.length - 1) {
          setRightArrowStatus(false);
        }
      }
    );
  }, [pendingSignList, currentSignIndex]);

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

  useEffect(() => {
    if (lockStatus) {
      fetchAccountInfo();
    }
  }, [fetchAccountInfo, lockStatus]);

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

  const goToHome = useCallback(() => {
    let url = dappWindow?.url;
    if (url) {
      dispatch(updateEntryWitchRoute(ENTRY_WITCH_ROUTE.HOME_PAGE));
    }
    dispatch(updateDAppOpenWindow({}));
  }, [dappWindow, showMultiView]);

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
        goToHome();
        return;
      }
      setPendingSignList(signList);
      setCurrentSignIndex(0);
      // if the zk tx is confirmed and the nonce is same with nextUseInferredNonce , then + 1
      if (type === TX_CLICK_TYPE.CONFIRM) {
        if (nextUseInferredNonce === nonce) {
          setNextUseInferredNonce((state) =>
            BigNumber(state).plus(1).toNumber()
          );
        }
      }
    },
    [pendingSignList, nextUseInferredNonce, goToHome]
  );
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
    goToHome();
  }, [pendingSignList]);

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
    <div className={styles.container}>
      {showMultiView && (
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
      <SignView
        signParams={pendingSignList[currentSignIndex]}
        showMultiView={showMultiView}
        onRemoveTx={onRemoveTx}
        inferredNonce={nextUseInferredNonce}
        advanceData={advanceData}
        onUpdateAdvance={onUpdateAdvance}
        key={pendingSignList[currentSignIndex]?.id}
      />
      {showMultiView && (
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
