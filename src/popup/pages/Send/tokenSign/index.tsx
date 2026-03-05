import { DAPP_ACTION_CANCEL_ALL } from "@/constant/msgTypes";
import { TOKEN_BUILD } from "@/constant/tokenMsgTypes";
import useFetchAccountData from "@/hooks/useUpdateAccount";
import Loading from "@/popup/component/Loading";
import SvgIcon from "@/popup/component/SvgIcon";
import { updateShouldRequest } from "@/reducers/accountReducer";
import {
  refreshTokenSignPopup,
  updateTokenSignStatus,
} from "@/reducers/popupReducer";
import { sendMsg } from "@/utils/commonMsg";
import BigNumber from "bignumber.js";
import i18n from "i18next";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Trans } from "react-i18next";
import { useAppDispatch, useAppSelector } from "@/hooks/useStore";
import SignView from "../SignView";
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

interface SignItem {
  id: string;
  site?: { origin?: string; webIcon?: string };
  params?: unknown;
}

const TokenSignPage = () => {
  const dispatch = useAppDispatch();
  const isFirstRequest = useRef(true);
  const isShowLoading = useRef(false);

  const [pendingSignList, setPendingSignList] = useState<SignItem[]>([]);
  const [currentSignIndex, setCurrentSignIndex] = useState(0);
  const [showMultiView, setShowMultiView] = useState(false);
  const [leftArrowStatus, setLeftArrowStatus] = useState(true);
  const [rightArrowStatus, setRightArrowStatus] = useState(false);
  const [advanceData, setAdvanceData] = useState<Record<string, { fee?: string; nonce?: string }>>({});

  const inferredNonce = useAppSelector(
    (state) => state.accountInfo.mainTokenNetInfo?.inferredNonce
  );

  const popupLockStatus = useAppSelector((state) => state.cache.popupLockStatus);

  const [nextUseInferredNonce, setNextUseInferredNonce] =
    useState(inferredNonce);

  const tokenSignRefresh = useAppSelector(
    (state) => state.popupReducer.tokenSignRefresh
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
        action: TOKEN_BUILD.getAllTokenPendingSign,
      },
      (res: SignItem[]) => {
        dispatch(refreshTokenSignPopup(false));
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
    if (!popupLockStatus) {
      fetchAccountInfo();
    }
  }, [fetchAccountInfo, popupLockStatus]);

  useEffect(() => {
    if (tokenSignRefresh) {
      getSignParams();
    }
  }, [tokenSignRefresh]);

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

  const onRemoveTx = useCallback(
    (openId: string, type?: string, nonce?: string) => {
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
        dispatch(updateTokenSignStatus(false));
        return;
      }
      setPendingSignList(signList);
      setCurrentSignIndex(0);
      // if the zk tx is confirmed and the nonce is same with nextUseInferredNonce , then + 1
      if (type === TX_CLICK_TYPE.CONFIRM) {
        if (nonce !== undefined && nextUseInferredNonce === Number(nonce)) {
          setNextUseInferredNonce((state) =>
            new BigNumber(state || 0).plus(1).toNumber()
          );
        }
      }
    },
    [pendingSignList, nextUseInferredNonce]
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
    dispatch(updateTokenSignStatus(false));
  }, [pendingSignList]);

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
      {showMultiView && (
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
              <SvgIcon src="/img/icon_chevron_left.svg" color={leftArrowColor} />
            </StyledMultiRowArrow>
            <StyledMultiRowArrow
              $disabled={rightArrowStatus}
              $isRight
              onClick={onClickRightBtn}
            >
              <SvgIcon src="/img/icon_chevron_left.svg" color={rightArrowColor} />
            </StyledMultiRowArrow>
          </StyledMultiTitleRowRight>
        </StyledMultiTitleRow>
      )}
      <SignView
        signParams={pendingSignList[currentSignIndex] as Parameters<typeof SignView>[0]["signParams"]}
        showMultiView={showMultiView}
        onRemoveTx={onRemoveTx}
        inferredNonce={nextUseInferredNonce}
        advanceData={advanceData}
        onUpdateAdvance={onUpdateAdvance}
        key={pendingSignList[currentSignIndex]?.id}
      />
      {showMultiView && (
        <StyledMultiBottomWrapper>
          <StyledMultiBottom onClick={onRejectAll}>
            {i18n.t("rejectAllTx", { total: pendingSignList.length })}
          </StyledMultiBottom>
        </StyledMultiBottomWrapper>
      )}
    </StyledContainer>
  );
};

export default TokenSignPage;
