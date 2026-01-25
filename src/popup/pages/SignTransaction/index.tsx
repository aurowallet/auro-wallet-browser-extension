import {
  DAPP_ACTION_CANCEL_ALL,
  GET_SIGN_PARAMS,
  WALLET_GET_CURRENT_ACCOUNT,
} from "@/constant/msgTypes";
import useFetchAccountData from "@/hooks/useUpdateAccount";
import Loading from "@/popup/component/Loading";
import ICON_Arrow from "@/popup/component/SVG/ICON_Arrow";
import { updateShouldRequest } from "@/reducers/accountReducer";
import { sendMsg } from "@/utils/commonMsg";
import { DAppActions } from "@aurowallet/mina-provider";
import BigNumber from "bignumber.js";
import i18n from "i18next";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Trans } from "react-i18next";
import { useAppDispatch, useAppSelector } from "@/hooks/useStore";
import {
  refreshZkSignPopup,
  updateSignZkModalStatus,
} from "../../../reducers/popupReducer";
import SignView from "./SignView";
import ZkAppChainView from "./ZkAppChainView";
import { isNaturalNumber } from "@/utils/utils";
import {
  StyledContainer,
  StyledMultiTitleRow,
  StyledMultiTitle,
  StyledMultiTitleBold,
  StyledMultiTitleRowRight,
  StyledMultiRowArrow,
  StyledMultiBottomWrapper,
  StyledMultiBottom,
} from "./index.styled";

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
/** mina sign event */
const SIGN_EVENT_WITH_BROADCAST = [
  DAppActions.mina_sendTransaction,
  DAppActions.mina_sendPayment,
  DAppActions.mina_sendStakeDelegation,
];

const ZKAPP_CHAIN_ACTION = [
  DAppActions.mina_addChain,
  DAppActions.mina_switchChain,
];

interface SignItem {
  id: string;
  site?: { origin?: string; webIcon?: string };
  params?: { action?: string };
}

interface NotifyItem {
  id?: string;
  site?: { origin?: string; webIcon?: string };
  params?: unknown;
}

const SignTransaction = () => {

  const dispatch = useAppDispatch();
  const isFirstRequest = useRef(true);
  const isShowLoading = useRef(false);

  const [pendingSignList, setPendingSignList] = useState<SignItem[]>([]);
  const [currentSignIndex, setCurrentSignIndex] = useState(0);
  const [showMultiView, setShowMultiView] = useState(false);
  const [leftArrowStatus, setLeftArrowStatus] = useState(true);
  const [rightArrowStatus, setRightArrowStatus] = useState(false);
  const [advanceData, setAdvanceData] = useState<Record<string, { fee?: string; nonce?: string }>>({});
  const [notifyData, setNotifyData] = useState<NotifyItem>({});
  const [state, setState] = useState({
    signViewStatus: true,
    notifyViewStatus: false,
  });

  const inferredNonce = useAppSelector(
    (state) => state.accountInfo.mainTokenNetInfo?.inferredNonce
  );

  const popupLockStatus = useAppSelector((state) => state.cache.popupLockStatus);

  const signZkRefresh = useAppSelector(
    (state) => state.popupReducer.signZkRefresh
  );

  const [nextUseInferredNonce, setNextUseInferredNonce] = useState(
    inferredNonce
  );
  useEffect(() => {
    setNextUseInferredNonce(inferredNonce);
  }, [inferredNonce]);

  const currentAccount = useAppSelector(
    (state) => state.accountInfo.currentAccount
  );

  const { fetchAccountData } = useFetchAccountData(currentAccount as Parameters<typeof useFetchAccountData>[0]);

  const currentAddress = useAppSelector(
    (state) => state.accountInfo.currentAccount.address
  );

  const fetchAccountInfo = useCallback(async () => {
    if (isShowLoading.current) {
      Loading.show();
    }
    dispatch(updateShouldRequest(true, true));
    await fetchAccountData();
    isFirstRequest.current = false;
    Loading.hide();
  }, [dispatch, currentAddress]);

  const getSignParams = useCallback(() => {
    sendMsg(
      {
        action: GET_SIGN_PARAMS,
      },
      (res: { signRequests: SignItem[]; chainRequests: NotifyItem[]; topItem?: SignItem }) => {
        dispatch(refreshZkSignPopup(false));
        const { signRequests, chainRequests, topItem } = res;
        setPendingSignList(signRequests);

        if (chainRequests.length > 0 && chainRequests[0]) {
          // current support 1 event
          setNotifyData(chainRequests[0]);
        }

        if (
          topItem &&
          ZKAPP_CHAIN_ACTION.indexOf(topItem.params?.action || "") !== -1
        ) {
          setState({
            notifyViewStatus: true,
            signViewStatus: false,
          });
        } else {
          setState({
            notifyViewStatus: false,
            signViewStatus: true,
          });
          if (isFirstRequest.current) {
            const firstSignParams = signRequests[0];
            const sendAction = firstSignParams?.params?.action || "";
            if (SIGN_MESSAGE_EVENT.indexOf(sendAction) === -1) {
              isShowLoading.current = true;
            }
          }
          if (currentSignIndex < signRequests.length - 1) {
            setRightArrowStatus(false);
          }
        }
      }
    );
  }, [pendingSignList, currentSignIndex]);

  useEffect(() => {
    if (!popupLockStatus) {
      fetchAccountInfo();
    }
  }, [fetchAccountInfo, popupLockStatus]);

  useEffect(() => {
    if (signZkRefresh) {
      getSignParams();
    }
  }, [signZkRefresh]);

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

  const onRemoveNotify = useCallback(() => {
    setNotifyData({});
    if (pendingSignList.length > 0) {
      setState({
        signViewStatus: true,
        notifyViewStatus: false,
      });
    } else {
      dispatch(updateSignZkModalStatus(false));
    }
  }, [pendingSignList]);
  const onRemoveTx = useCallback(
    (openId?: string, type?: string, nonce?: string | number) => {
      if (!openId) return;
      let signList = [...pendingSignList];
      let tempSignParams: SignItem | undefined;
      signList = signList.filter((item: SignItem) => {
        let checkStatus = item.id !== openId;
        if (!checkStatus) {
          tempSignParams = item;
        }
        return checkStatus;
      });

      if (signList.length === 0) {
        if (notifyData.id) {
          setState({
            signViewStatus: false,
            notifyViewStatus: true,
          });
          setPendingSignList(signList);
          setCurrentSignIndex(0);
        } else {
          dispatch(updateSignZkModalStatus(false));
        }
        return;
      }
      setPendingSignList(signList);
      setCurrentSignIndex(0);
      // if the zk tx is confirmed and the nonce is same with nextUseInferredNonce , then + 1
      if (type === TX_CLICK_TYPE.CONFIRM) {
        const sendAction = tempSignParams?.params?.action || "";
        if (
          isNaturalNumber(nonce) && 
          SIGN_EVENT_WITH_BROADCAST.indexOf(sendAction) !== -1 &&
          nextUseInferredNonce === nonce
        ) {
          setNextUseInferredNonce((state) =>
            BigNumber(state || 0).plus(1).toNumber()
          );
        }
      }
    },
    [pendingSignList, nextUseInferredNonce, notifyData]
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
    if (notifyData.id) {
      setPendingSignList([]);
      setState({
        signViewStatus: false,
        notifyViewStatus: true,
      });
    } else {
      dispatch(updateSignZkModalStatus(false));
    }
  }, [pendingSignList, notifyData]);

  const onUpdateAdvance = useCallback(
    ({ id, fee, nonce }: { id: string; fee: string; nonce: string }) => {
      let preAdvanceData = { ...advanceData };
      preAdvanceData[id] = {
        fee,
        nonce,
      };
      setAdvanceData(preAdvanceData);
    },
    [advanceData]
  );

  return (
    <StyledContainer>
      {showMultiView && state.signViewStatus && (
        <StyledMultiTitleRow>
          <StyledMultiTitle>
            <Trans
              i18nKey={"pendingZkTx"}
              values={{
                current: currentSignIndex + 1,
                total: pendingSignList.length,
              }}
              components={{
                bold: <StyledMultiTitleBold />,
              }}
            />
          </StyledMultiTitle>
          <StyledMultiTitleRowRight>
            <StyledMultiRowArrow
              $disabled={leftArrowStatus}
              onClick={onClickLeftBtn}
            >
              <ICON_Arrow stroke={leftArrowColor} />
            </StyledMultiRowArrow>
            <StyledMultiRowArrow
              $disabled={rightArrowStatus}
              $isRight
              onClick={onClickRightBtn}
            >
              <ICON_Arrow stroke={rightArrowColor} />
            </StyledMultiRowArrow>
          </StyledMultiTitleRowRight>
        </StyledMultiTitleRow>
      )}
      {state.signViewStatus && (
        <SignView
          signParams={pendingSignList[currentSignIndex]}
          showMultiView={showMultiView}
          onRemoveTx={onRemoveTx}
          inferredNonce={nextUseInferredNonce}
          advanceData={advanceData}
          onUpdateAdvance={onUpdateAdvance}
          key={pendingSignList[currentSignIndex]?.id}
        />
      )}
      {state.notifyViewStatus && (
        <ZkAppChainView
          notifyParams={notifyData as Parameters<typeof ZkAppChainView>[0]["notifyParams"]}
          onRemoveNotify={onRemoveNotify}
        />
      )}
      {showMultiView && state.signViewStatus && (
        <StyledMultiBottomWrapper>
          <StyledMultiBottom onClick={onRejectAll}>
            {i18n.t("rejectAllTx", { total: pendingSignList.length })}
          </StyledMultiBottom>
        </StyledMultiBottomWrapper>
      )}
    </StyledContainer>
  );
};

export default SignTransaction;
