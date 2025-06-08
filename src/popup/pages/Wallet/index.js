import FooterPopup from "@/popup/component/FooterPopup";
import { PopupModalV2 } from "@/popup/component/PopupModalV2";
import i18n from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Trans } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import { getCurrencyPrice } from "../../../background/api";

import { saveLocal } from "@/background/localStorage";
import { NetworkID_MAP } from "@/constant/network";
import { LOCAL_CACHE_KEYS } from "@/constant/storageKey";
import useFetchAccountData from "@/hooks/useUpdateAccount";
import Clock from "@/popup/component/Clock";
import styled, { css } from "styled-components";
import {
  DAPP_DISCONNECT_SITE,
  DAPP_GET_CONNECT_STATUS,
  WALLET_GET_ALL_ACCOUNT,
} from "../../../constant/msgTypes";
import {
  ACCOUNT_BALANCE_CACHE_STATE,
  updateCurrentPrice,
  updateShouldRequest,
} from "../../../reducers/accountReducer";
import { setAccountInfo } from "../../../reducers/cache";
import { sendMsg } from "../../../utils/commonMsg";
import {
  addressSlice,
  copyText,
  getAmountForUI,
  getOriginFromUrl,
} from "../../../utils/utils";
import { PopupModal } from "../../component/PopupModal";
import Toast from "../../component/Toast";
import NetworkSelect from "../Networks/NetworkSelect";
import TokenListView from "./component/TokenListView";

const StyledPageWrapper = styled.div`
  background: white;
  height: 100vh;
  display: flex;
  flex-direction: column;
`;
const StyledHeaderBarWrapper = styled.div`
  position: fixed;
  width: 100%;
  max-width: 375px;
  z-index: 3;
  background: #edeff2;
`;
const StyledHeaderBarContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 58px;

  padding: 10px 20px 0px;
`;
const StyledHeaderBarIcon = styled.img`
  cursor: pointer;
  width: 36px;
  height: 36px;
  padding: 3px;

  &:hover {
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.05);
  }
`;

const StyledPageContent = styled.div`
  margin-top: 58px;
  overflow-y: auto;
  background: #edeff2;
`;
const rightBtnStyle = css`
  color: #d65a5a;
`;
const StyledConfirmContent = styled.div`
  font-size: 14px;
  line-height: 22px;
  color: rgba(0, 0, 0, 0.5);
  margin: 0;
`;
const StyledTipsSpecial = styled.span`
  color: #d65a5a;
`;
const Wallet = ({}) => {
  const history = useHistory();

  const [watchModalStatus, setWatchModalStatus] = useState(false);

  const toSetting = useCallback(() => {
    history.push("setting");
  }, []);

  const toManagePage = useCallback(() => {
    history.push("account_manage");
  }, []);

  const onCloseWatchModal = useCallback(() => {
    setWatchModalStatus(false);
  }, []);
  const onWatchModalConfirm = useCallback(() => {
    onCloseWatchModal();
    toManagePage();
  }, []);

  const checkLocalWatchWallet = useCallback(() => {
    sendMsg(
      {
        action: WALLET_GET_ALL_ACCOUNT,
      },
      (account) => {
        let watchList = account.accounts.watchList;
        if (watchList.length > 0) {
          setWatchModalStatus(true);
        }
      }
    );
  }, []);

  useEffect(() => {
    checkLocalWatchWallet();
  }, []);

  return (
    <StyledPageWrapper>
      <StyledHeaderBarWrapper>
        <StyledHeaderBarContent>
          <StyledHeaderBarIcon src="/img/menu.svg" onClick={toSetting} />
          <NetworkSelect />
          <StyledHeaderBarIcon src="/img/wallet.svg" onClick={toManagePage} />
        </StyledHeaderBarContent>
      </StyledHeaderBarWrapper>
      <StyledPageContent>
        <WalletInfo />
        <TokenListView />
      </StyledPageContent>

      <PopupModalV2
        title={i18n.t("watchModeDeleteBtn")}
        leftBtnContent={i18n.t("cancel")}
        rightBtnContent={i18n.t("deleteTag")}
        onLeftBtnClick={onCloseWatchModal}
        onRightBtnClick={onWatchModalConfirm}
        rightBtnStyle={rightBtnStyle}
        componentContent={
          <StyledConfirmContent>
            <Trans
              i18nKey={i18n.t("watchModeDeleteTip")}
              components={{
                red: <StyledTipsSpecial />,
              }}
            />
          </StyledConfirmContent>
        }
        modalVisible={watchModalStatus}
      />
    </StyledPageWrapper>
  );
};
export default Wallet;

const StyledWalletInfoWrapper = styled.div`
  border-radius: 20px;
  background: ${(props) =>
    props.netcolor ? props.netcolor : "rgba(0, 0, 0, 0.30)"};
  margin: 10px 20px 20px;
  padding: 20px;
  position: relative;
`;
const StyledWalletBaseRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;
const StyledWalletBaseLeft = styled.div`
  display: flex;
  align-items: center;
`;
const StyledWalletName = styled.div`
  font-size: 16px;
  line-height: 18px;
  color: #ffffff;
  font-weight: 600;
`;

const StyledWalletMore = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;

  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  cursor: pointer;
`;
const StyledWalletAddress = styled.div`
  font-weight: 500;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0px;
  cursor: pointer;

  &:hover {
    color: linear-gradient(0deg, rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.05));
  }
`;

const cacheCss = css`
  color: rgba(255, 255, 255, 0.6) !important;
`;
const StyledCurrencyRow = styled.div`
  font-weight: 700;
  font-size: 32px;
  color: #ffffff;
  margin-top: 20px;
  ${(props) => props.$isCache && cacheCss}
`;

const StyledWalletBaseAction = styled.div`
  box-sizing: border-box;
  margin-top: 20px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  background: #ffffff;
  border-radius: 10px;
  z-index: 1;
`;
const StyledBaseBtn = styled.div`
  font-weight: 500;
  font-size: 14px;
  text-align: center;
  color: ${(props) =>
    props.netcolor ? props.netcolor : "rgba(0, 0, 0, 0.30)"};
  display: flex;
  align-items: center;
  justify-content: center;

  margin: 0;
  padding: 10px 0px;
  flex: 1;
  cursor: pointer;
`;
const StyledSendBtn = styled(StyledBaseBtn)`
  &:hover {
    background: #f2f2f2;
    border-top-left-radius: 10px;
    border-bottom-left-radius: 10px;
  }
`;

const borderCss = css`
    border-top-right-radius: 10px;
    border-bottom-right-radius: 10px;
`
const StyledReceiveBtn = styled(StyledBaseBtn)`
  &:hover {
    background: #f2f2f2;
    ${(props) => (props.$showStaking ? "" : borderCss)};
  }
`;

const StyledStakeBtn = styled(StyledBaseBtn)`
  &:hover {
    background: #f2f2f2;
    ${borderCss};
  }
`;
const StyledDivideColumnWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 0px;
`;
const StyledDivideColumn = styled.div`
  border: 0.5px solid #f2f2f2;
  height: 24px;
`;

const StyledIconBackground = styled.div`
  position: absolute;
  width: 100px;
  object-fit: scale-down;
  z-index: 1;
  right: 20px;
  top: 50px;
`;
const StyledZkConnectWrapper = styled.div`
  margin-left: 6px;
  display: flex;
`;
const StyledZkConnectStatus = styled.img`
  cursor: pointer;
  height: 20px;
`;
const WalletInfo = () => {
  const accountInfo = useSelector((state) => state.accountInfo);
  const tokenTotalAmount = useSelector(
    (state) => state.accountInfo.tokenTotalAmount
  );
  const currencyConfig = useSelector((state) => state.currencyConfig);
  const netConfig = useSelector((state) => state.network);
  const shouldRefresh = useSelector((state) => state.accountInfo.shouldRefresh);

  const dispatch = useDispatch();
  const history = useHistory();

  const [currentAccount, setCurrentAccount] = useState(
    accountInfo.currentAccount
  );

  const { fetchAccountData } = useFetchAccountData(currentAccount);
  const [dappConnectStatus, setDappConnectStatus] = useState(false);
  const [dappIcon, setDappIcon] = useState("/img/dappUnConnect.svg");

  const [dappModalStatus, setDappModalStatus] = useState(false);
  const [siteUrl, setSiteUrl] = useState("");
  const [tokenModalStatus, setTokenModalStatus] = useState(false);
  let isRequest = false;

  const { dappModalContent, leftBtnContent, rightBtnContent } = useMemo(() => {
    let dappModalContent = dappConnectStatus
      ? i18n.t("walletConnected")
      : i18n.t("noAccountConnect");
    let leftBtnContent = dappConnectStatus ? i18n.t("cancel") : "";
    let rightBtnContent = dappConnectStatus
      ? i18n.t("disconnect")
      : i18n.t("ok");

    return {
      dappModalContent,
      leftBtnContent,
      rightBtnContent,
    };
  }, [dappConnectStatus]);

  const {
    accountName,
    showAddress,
    unitBalance,
    isCache,
    showTip,
  } = useMemo(() => {
    let accountName = currentAccount?.accountName;

    let showAddress = addressSlice(currentAccount.address);
    let currency = currencyConfig.currentCurrency.symbol;
    let unitBalance = currency + " 0.00";
    if (tokenTotalAmount) {
      unitBalance = currency + " " + getAmountForUI(tokenTotalAmount, 0, 2);
    }

    let isCache =
      accountInfo.isAccountCache === ACCOUNT_BALANCE_CACHE_STATE.USING_CACHE;

    let showTip = dappConnectStatus
      ? i18n.t("dappConnect")
      : i18n.t("dappDisconnect");
    return {
      accountName,
      showAddress,
      unitBalance,
      isCache,
      showTip,
    };
  }, [
    currentAccount,
    i18n,
    tokenTotalAmount,
    currencyConfig,
    netConfig,
    accountInfo,
    dappConnectStatus,
  ]);

  const onCopyAddress = useCallback(() => {
    copyText(currentAccount.address).then(() => {
      Toast.info(i18n.t("copySuccess"));
    });
  }, [currentAccount]);

  const toAccountInfo = useCallback(() => {
    dispatch(setAccountInfo(currentAccount));
    history.push("account_info");
  }, [currentAccount]);

  const toSend = useCallback(() => {
    setTokenModalStatus(true);
  }, []);
  const toReceive = useCallback(() => {
    history.push("receive_page");
  }, []);
  const toStaking = useCallback(() => {
    history.push("staking");
  }, []);


  const setDappDisconnect = useCallback(() => {
    sendMsg(
      {
        action: DAPP_DISCONNECT_SITE,
        payload: {
          siteUrl: siteUrl,
          address: currentAccount.address,
        },
      },
      (status) => {
        if (status) {
          setDappConnectStatus(false);
          onCloseDappModal();
          Toast.info(i18n.t("disconnectSuccess"));
        } else {
          Toast.info(i18n.t("disconnectFailed"));
        }
      }
    );
  }, [currentAccount, siteUrl]);

  const onShowDappModal = useCallback(() => {
    setDappModalStatus(true);
  }, []);
  const onCloseDappModal = useCallback(() => {
    setDappModalStatus(false);
  }, []);

  const onClickDappConfirm = useCallback(() => {
    if (!dappConnectStatus) {
      onCloseDappModal();
    } else {
      setDappDisconnect();
    }
  }, [dappConnectStatus]);

  useEffect(() => {
    setDappIcon(
      dappConnectStatus ? "/img/dappConnected.svg" : "/img/dappUnConnect.svg"
    );
  }, [dappConnectStatus]);
  useEffect(() => {
    setCurrentAccount(accountInfo.currentAccount);
  }, [accountInfo.currentAccount]);

  const fetchPrice = useCallback(
    async (currency) => {
      let lastCurrency = currencyConfig.currentCurrency;
      if (currency) {
        lastCurrency = currency;
      }
      let tokenPrice = await getCurrencyPrice(lastCurrency.key);
      dispatch(updateCurrentPrice(tokenPrice));
    },
    [netConfig, currencyConfig]
  );

  useEffect(() => {
    if (shouldRefresh) {
      fetchAccountData();
    }
  }, [shouldRefresh, fetchAccountData]);

  useEffect(() => {
    fetchPrice();
  }, [currencyConfig.currentCurrency, netConfig.currentNode.networkID]);

  const { netcolor, showStaking, nextChainIcon } = useMemo(() => {
    const networkID = netConfig.currentNode.networkID;
    let netcolor = "rgba(0, 0, 0, 0.30)";
    if (networkID === NetworkID_MAP.mainnet) {
      netcolor = "#594AF1";
    }
    let showStaking = networkID?.startsWith("mina");
    let isZeko = networkID?.startsWith("zeko");
    let nextChainIcon = isZeko ? "/img/icon_zeko.svg" : "/img/icon_mina.svg";
    return {
      netcolor,
      showStaking,
      nextChainIcon,
    };
  }, [netConfig.currentNode.networkID]);
  return (
    <>
      <StyledWalletInfoWrapper netcolor={netcolor}>
        <StyledWalletBaseRow>
          <StyledWalletBaseLeft>
            <StyledWalletName>{accountName}</StyledWalletName>
          </StyledWalletBaseLeft>
          <StyledWalletMore onClick={toAccountInfo}>
            <img src="/img/pointMenu.svg" />
          </StyledWalletMore>
        </StyledWalletBaseRow>
        <StyledWalletAddress onClick={onCopyAddress}>
          {showAddress}
        </StyledWalletAddress>
        <StyledCurrencyRow $isCache={isCache}>{unitBalance}</StyledCurrencyRow>
        <StyledWalletBaseAction>
          <StyledSendBtn netcolor={netcolor} onClick={toSend}>
            {i18n.t("send")}
          </StyledSendBtn>
          <StyledDivideColumnWrapper>
            <StyledDivideColumn />
          </StyledDivideColumnWrapper>
          <StyledReceiveBtn
            netcolor={netcolor}
            onClick={toReceive}
            $showStaking={showStaking}
          >
            {i18n.t("receive")}
          </StyledReceiveBtn>
          {showStaking && (
            <>
              <StyledDivideColumnWrapper>
                <StyledDivideColumn />
              </StyledDivideColumnWrapper>
              <StyledStakeBtn netcolor={netcolor} onClick={toStaking}>
                {i18n.t("staking")}
              </StyledStakeBtn>
            </>
          )}
        </StyledWalletBaseAction>
        <StyledIconBackground>
          <img src={nextChainIcon} />
        </StyledIconBackground>
      </StyledWalletInfoWrapper>
      <FooterPopup
        isOpen={tokenModalStatus}
        onClose={() => setTokenModalStatus(false)}
        title={i18n.t("selectAsset")}
      >
        <TokenListView isInModal={true} />
      </FooterPopup>
      <PopupModal
        title={siteUrl}
        leftBtnContent={leftBtnContent}
        rightBtnContent={rightBtnContent}
        onLeftBtnClick={onCloseDappModal}
        onRightBtnClick={onClickDappConfirm}
        content={dappModalContent}
        modalVisible={dappModalStatus}
      />
      <Clock schemeEvent={() => dispatch(updateShouldRequest(true, true))} />
    </>
  );
};
