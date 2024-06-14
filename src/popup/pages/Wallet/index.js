import FooterPopup from "@/popup/component/FooterPopup";
import { PopupModalV2 } from "@/popup/component/PopupModalV2";
import Tooltip from "@/popup/component/ToolTip/Tooltip";
import BigNumber from "bignumber.js";
import extensionizer from "extensionizer";
import i18n from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Trans } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import styled, { css } from "styled-components";
import { getBalance, getCurrencyPrice } from "../../../background/api";
import {
  DAPP_DISCONNECT_SITE,
  DAPP_GET_CONNECT_STATUS,
  WALLET_GET_ALL_ACCOUNT,
} from "../../../constant/msgTypes";
import { NetworkID_MAP } from "../../../constant/network";
import {
  ACCOUNT_BALANCE_CACHE_STATE,
  updateNetAccount,
  updateShouldRequest,
} from "../../../reducers/accountReducer";
import { setAccountInfo, updateCurrentPrice } from "../../../reducers/cache";
import { sendMsg } from "../../../utils/commonMsg";
import {
  addressSlice,
  copyText,
  getAmountForUI,
  getDisplayAmount,
  getOriginFromUrl,
  isNumber,
} from "../../../utils/utils";
import { PopupModal } from "../../component/PopupModal";
import Toast from "../../component/Toast";
import NetworkSelect from "../Networks/NetworkSelect";
import TokenListView from "./component/TokenListView";
 
const StyledPageWrapper = styled.div`
  background: #edeff2;
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
  background: #594af1;
  margin: 0px 20px 20px;
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
  color: #594af1;
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

const StyledReceiveBtn = styled(StyledBaseBtn)`
  &:hover {
    background: #f2f2f2;
  }
`;

const StyledStakeBtn = styled(StyledBaseBtn)`
  &:hover {
    background: #f2f2f2;
    border-top-right-radius: 10px;
    border-bottom-right-radius: 10px;
  }
`;
const StyledDivideColumnWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 1px;
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
  const cache = useSelector((state) => state.cache);
  const currencyConfig = useSelector((state) => state.currencyConfig);
  const netConfig = useSelector((state) => state.network);
  const shouldRefresh = useSelector((state) => state.accountInfo.shouldRefresh);

  const dispatch = useDispatch();
  const history = useHistory();

  const [currentAccount, setCurrentAccount] = useState(
    accountInfo.currentAccount
  );
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
    let balance = accountInfo.balance || "0.00";
    balance = getDisplayAmount(balance);

    let accountName = currentAccount?.accountName;

    let showAddress = addressSlice(currentAccount.address);
    let currency = currencyConfig.currentCurrency.symbol;
    let unitBalance = currency + " 0.00";

    if (cache.currentPrice) {
      // todo
      unitBalance = new BigNumber(cache.currentPrice)
        .multipliedBy(balance)
        .toString();
      unitBalance = currency + " " + getAmountForUI(unitBalance, 0, 2);
    }
    balance = new BigNumber(balance).toFormat();

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
    cache,
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

  const getDappConnect = useCallback(() => {
    extensionizer.tabs.query(
      { active: true, currentWindow: true },
      function (tabs) {
        let url = tabs[0]?.url || "";
        let origin = getOriginFromUrl(url);
        setSiteUrl(origin);
        sendMsg(
          {
            action: DAPP_GET_CONNECT_STATUS,
            payload: {
              siteUrl: origin,
              address: currentAccount.address,
            },
          },
          (isConnected) => {
            setDappConnectStatus(isConnected);
          }
        );
      }
    );
  }, [currentAccount]);

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
    getDappConnect();
  }, [accountInfo.currentAccount]);

  const fetchPrice = useCallback(
    async (currency) => {
      let currentNode = netConfig.currentNode;
      if (currentNode.networkID == NetworkID_MAP.mainnet) {
        let lastCurrency = currencyConfig.currentCurrency;
        if (currency) {
          lastCurrency = currency;
        }
        let price = await getCurrencyPrice(lastCurrency.key);
        if (isNumber(price)) {
          dispatch(updateCurrentPrice(price));
        }
      }
    },
    [netConfig, currencyConfig]
  );

  const fetchAccountData = useCallback(() => {
    if (isRequest) {
      return;
    }
    isRequest = true;
    let address = currentAccount.address;
    getBalance(address)
      .then((account) => {
        if (account.publicKey) {
          dispatch(updateNetAccount(account));
        } else if (account.error) {
          Toast.info(i18n.t("nodeError"));
        }
      })
      .finally(() => {
        isRequest = false;
        // dispatch(updateShouldRequest(false)); // need add
      });
  }, [i18n, currentAccount]);

  useEffect(() => {
    if(shouldRefresh){
      fetchAccountData();
    }
  }, [shouldRefresh,fetchAccountData]);

  useEffect(() => {
    fetchPrice();
  }, [currencyConfig.currentCurrency, netConfig.currentNode.networkID]);
  return (
    <>
      <StyledWalletInfoWrapper>
        <StyledWalletBaseRow>
          <StyledWalletBaseLeft>
            <StyledWalletName>{accountName}</StyledWalletName>
            <StyledZkConnectWrapper>
              <Tooltip text={showTip}>
                <StyledZkConnectStatus
                  src={dappIcon}
                  onClick={onShowDappModal}
                />
              </Tooltip>
            </StyledZkConnectWrapper>
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
          <StyledSendBtn onClick={toSend}>{i18n.t("send")}</StyledSendBtn>
          <StyledDivideColumnWrapper>
            <StyledDivideColumn />
          </StyledDivideColumnWrapper>
          <StyledReceiveBtn onClick={toReceive}>
            {i18n.t("receive")}
          </StyledReceiveBtn>
          <StyledDivideColumnWrapper>
            <StyledDivideColumn />
          </StyledDivideColumnWrapper>
          <StyledStakeBtn onClick={toStaking}>
            {i18n.t("staking")}
          </StyledStakeBtn>
        </StyledWalletBaseAction>
        <StyledIconBackground>
          <img src="/img/icon_mina.svg" />
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
    </>
  );
};
