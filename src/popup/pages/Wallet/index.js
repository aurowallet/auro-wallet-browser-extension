import BigNumber from "bignumber.js";
import cls from "classnames";
import extensionizer from "extensionizer";
import i18n from "i18next";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Trans } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import { MAIN_COIN_CONFIG } from "../../../constant";
import {
  getBalance,
  getCurrencyPrice,
  getGqlTxHistory,
  getPendingTxList,
  getZkAppPendingTx,
  getZkAppTxHistory,
} from "../../../background/api";
import { extSaveLocal } from "../../../background/extensionStorage";
import {
  DAPP_DISCONNECT_SITE,
  DAPP_GET_CONNECT_STATUS,
  WALLET_GET_ALL_ACCOUNT,
} from "../../../constant/msgTypes";
import { NetworkID_MAP } from "../../../constant/network";
import {
  ACCOUNT_BALANCE_CACHE_STATE,
  updateAccountTx,
  updateNetAccount,
  updateShouldRequest,
  updateStakingRefresh,
} from "../../../reducers/accountReducer";
import { setAccountInfo, updateCurrentPrice } from "../../../reducers/cache";
import { sendMsg } from "../../../utils/commonMsg";
import {
  addressSlice,
  clearLocalCache,
  copyText,
  getAmountForUI,
  getDisplayAmount,
  getOriginFromUrl,
  isNaturalNumber,
  isNumber,
  sendNetworkChangeMsg,
} from "../../../utils/utils";
import Clock from "../../component/Clock";
import { PopupModal } from "../../component/PopupModal";
import Toast from "../../component/Toast";
import {
  LoadingView,
  NoBalanceDetail,
  UnknownInfoView,
} from "./component/StatusView";
import TxListView from "./component/TxListView";
import styles from "./index.module.scss";
import NetworkSelect from "../Networks/NetworkSelect";

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
    <div className={styles.container}>
      <div className={styles.toolbarContainer}>
        <div className={styles.toolBar}>
          <img
            src="/img/menu.svg"
            className={styles.menuIcon}
            onClick={toSetting}
          />
          <NetworkSelect />
          <img
            src="/img/wallet.svg"
            className={styles.walletIcon}
            onClick={toManagePage}
          />
        </div>
      </div>
      <div className={styles.walletContent}>
        <WalletInfo />
        <WalletDetail />
      </div>
      <PopupModal
        title={i18n.t("watchModeDeleteBtn")}
        leftBtnContent={i18n.t("cancel")}
        rightBtnContent={i18n.t("deleteTag")}
        onLeftBtnClick={onCloseWatchModal}
        onRightBtnClick={onWatchModalConfirm}
        rightBtnStyle={styles.watchModalRightBtn}
        componentContent={
          <p className={styles.confirmContent}>
            <Trans
              i18nKey={i18n.t("watchModeDeleteTip")}
              components={{
                red: <span className={styles.tipsSpecial} />,
              }}
            />
          </p>
        }
        modalVisible={watchModalStatus}
      />
    </div>
  );
};
export default Wallet;

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
    deleText,
    showAddress,
    balance,
    showSmallBalanceClass,
    unitBalance,
    showCurrency,
    isCache,
    showTip,
  } = useMemo(() => {
    let netAccount = accountInfo.netAccount;
    let balance = accountInfo.balance || "0.00";
    balance = getDisplayAmount(balance);

    let showSmallBalanceClass = (balance + "").length >= 14;

    let accountName = currentAccount?.accountName;

    let delegateState =
      netAccount?.delegate && netAccount?.delegate !== currentAccount.address;
    let deleText = delegateState ? i18n.t("delegated") : i18n.t("undelegated");

    let showAddress = addressSlice(currentAccount.address);

    let unitBalance = "--";
    if (cache.currentPrice) {
      unitBalance = new BigNumber(cache.currentPrice)
        .multipliedBy(balance)
        .toString();
      unitBalance =
        currencyConfig.currentCurrency.symbol +
        " " +
        getAmountForUI(unitBalance, 0, 2);
    }
    // format
    balance = new BigNumber(balance).toFormat();

    const networkID = netConfig.currentNode?.networkID;
    let showCurrency = networkID == NetworkID_MAP.mainnet;

    let isCache =
      accountInfo.isAccountCache === ACCOUNT_BALANCE_CACHE_STATE.USING_CACHE;

    let showTip = dappConnectStatus
      ? i18n.t("dappConnect")
      : i18n.t("dappDisconnect");
    return {
      accountName,
      deleText,
      showAddress,
      balance,
      showSmallBalanceClass,
      unitBalance,
      showCurrency,
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
    history.push("send_page");
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
      });
  }, [i18n, currentAccount]);

  useEffect(() => {
    fetchAccountData();
  }, [
    netConfig.currentNode.networkID,
    fetchAccountData,
    currentAccount.address,
  ]);

  useEffect(() => {
    fetchAccountData();
  }, [shouldRefresh]);

  useEffect(() => {
    fetchPrice();
  }, [currencyConfig.currentCurrency, netConfig.currentNode.networkID]);
  return (
    <>
      <div className={styles.walletInfoContainer}>
        <img src="/img/walletBg.svg" className={styles.walletBg} />
        <div className={styles.walletInfoTopContainer}>
          <div className={styles.walletInfoTopLeftContainer}>
            <div className={styles.walletInfoLeftTop}>
              <p className={styles.accountName}>{accountName}</p>
              <div className={styles.accountStatus}>{deleText}</div>
              <div className={styles.dappContainer}>
                <img
                  src={dappIcon}
                  className={styles.dappConnectIcon}
                  onClick={onShowDappModal}
                />
                <div className={styles.baseTipContainer}>
                  <span className={styles.baseTip}>{showTip}</span>
                </div>
              </div>
            </div>
            <div
              className={styles.walletInfoLeftBottom}
              onClick={onCopyAddress}
            >
              <p className={styles.accountAddress}>{showAddress}</p>
            </div>
          </div>
          <div className={styles.dappConnectContainer} onClick={toAccountInfo}>
            <img src="/img/pointMenu.svg" />
          </div>
        </div>
        <div className={styles.assetsContainer}>
          <div className={styles.amountNumberContainer}>
            <p
              className={cls(styles.amountNumber, {
                [styles.balanceSizeMine]: showSmallBalanceClass,
                [styles.cacheBalance]: isCache,
              })}
            >
              {balance}
            </p>
            <span
              className={cls(styles.amountSymbol, {
                [styles.cacheBalance]: isCache,
              })}
            >
              {MAIN_COIN_CONFIG.symbol}
            </span>
          </div>
          <p
            className={cls(styles.amountValue, {
              [styles.fontHolder]: !showCurrency,
            })}
          >
            {unitBalance}
          </p>
        </div>

        <div className={styles.btnGroup}>
          <p className={cls(styles.btn, styles.sendBtn)} onClick={toSend}>
            {i18n.t("send")}
          </p>
          <div className={cls(styles.hr, styles.sendBtnLine)} />
          <p className={cls(styles.btn, styles.receiveBtn)} onClick={toReceive}>
            {i18n.t("receive")}
          </p>
          <div className={cls(styles.hr, styles.receiveBtnLine)} />
          <p className={cls(styles.btn, styles.stakingBtn)} onClick={toStaking}>
            {i18n.t("staking")}
          </p>
        </div>
      </div>
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

const WalletDetail = () => {
  const dispatch = useDispatch();
  const isMounted = useRef(true);

  const currentNode = useSelector((state) => state.network.currentNode);
  const accountInfo = useSelector((state) => state.accountInfo);
  const shouldRefresh = useSelector((state) => state.accountInfo.shouldRefresh);
  const isSilentRefresh = useSelector(
    (state) => state.accountInfo.isSilentRefresh
  );
  const inferredNonce = useSelector(
    (state) => state.accountInfo.netAccount.inferredNonce
  );

  const requestHistory = useCallback(
    async (address = accountInfo.currentAccount.address) => {
      if (currentNode.gqlTxUrl) {
        let pendingTxList = getPendingTxList(address);
        let gqlTxList = getGqlTxHistory(address);
        let zkAppTxList = getZkAppTxHistory(address);
        let getZkAppPending = getZkAppPendingTx(address);
        await Promise.all([
          gqlTxList,
          pendingTxList,
          zkAppTxList,
          getZkAppPending,
        ])
          .then((data) => {
            let newList = data[0];
            let txPendingData = data[1];
            let zkApp = data[2];
            let txPendingList = txPendingData.txList;
            let zkPendingList = data[3];
            dispatch(
              updateAccountTx(newList, txPendingList, zkApp, zkPendingList)
            );
          })
          .finally(() => {
            if (isMounted.current) {
              dispatch(updateShouldRequest(false));
            }
          });
      } else {
        console.log("can not find graphql url");
      }
    },
    [accountInfo.currentAccount, currentNode]
  );

  const onClickRefresh = useCallback(() => {
    dispatch(updateShouldRequest(true, true));
    requestHistory();
  }, [requestHistory]);

  useEffect(() => {
    if (shouldRefresh) {
      requestHistory();
    }
  }, [shouldRefresh, requestHistory]);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  let childView = <></>;
  if (shouldRefresh && !isSilentRefresh) {
    childView = <LoadingView />;
  } else {
    if (accountInfo.txList.length !== 0) {
      childView = (
        <TxListView
          history={accountInfo.txList}
          onClickRefresh={onClickRefresh}
          showHistoryStatus={true}
        />
      );
    } else {
      if (isNaturalNumber(inferredNonce)) {
        childView = <UnknownInfoView />;
      } else {
        childView = <NoBalanceDetail />;
      }
    }
  }
  return (
    <div className={styles.walletDetail}>
      {childView}
      <Clock
        schemeEvent={() => {
          dispatch(updateShouldRequest(true, true));
        }}
      />
    </div>
  );
};
