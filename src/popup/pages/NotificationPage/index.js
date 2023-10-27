import cls from "classnames";
import i18n from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import { extSaveLocal } from "../../../background/extensionStorage";
import { NET_WORK_CONFIG } from "../../../constant/storageKey";
import {
  DAPP_ACTION_SWITCH_CHAIN,
  GET_SIGN_PARAMS,
  WALLET_GET_CURRENT_ACCOUNT,
} from "../../../constant/msgTypes";
import { NET_CONFIG_LIST } from "../../../constant/network";
import {
  updateShouldRequest,
  updateStakingRefresh,
} from "../../../reducers/accountReducer";
import { updateDAppOpenWindow } from "../../../reducers/cache";
import {
  ENTRY_WITCH_ROUTE,
  updateEntryWitchRoute,
} from "../../../reducers/entryRouteReducer";
import { updateNetConfig } from "../../../reducers/network";
import { sendMsg } from "../../../utils/commonMsg";
import { getQueryStringArgs, sendNetworkChangeMsg } from "../../../utils/utils";
import Button, { button_size, button_theme } from "../../component/Button";
import { LockPage } from "../Lock";
import styles from "./index.module.scss";
import DappWebsite from "../../component/DappWebsite";

const NotificationPage = () => {
  const dispatch = useDispatch();
  const history = useHistory();

  const dappWindow = useSelector((state) => state.cache.dappWindow);
  const currentAccount = useSelector(
    (state) => state.accountInfo.currentAccount
  );
  const currentConfig = useSelector((state) => state.network.currentConfig);
  const netConfig = useSelector((state) => state.network);

  const [lockStatus, setLockStatus] = useState(false);
  const [targetChainId, setTargetChainId] = useState("");

  const params = useMemo(() => {
    let url = dappWindow.url || window.location?.href || "";
    return getQueryStringArgs(url);
  });

  console.log('lsp==params=',params);
  const goToHome = useCallback(() => {
    let url = dappWindow?.url;
    if (url) {
      dispatch(updateEntryWitchRoute(ENTRY_WITCH_ROUTE.HOME_PAGE));
    }
    dispatch(updateDAppOpenWindow({}));
  }, [dappWindow]);

  const getSignParams = useCallback(() => {
    sendMsg(
      {
        action: GET_SIGN_PARAMS,
        payload: {
          openId: params.openId, 
        },
      },
      (res) => {
        const nextChainId = res.params?.chainId || "";
        setTargetChainId(nextChainId);
      }
    );
  }, [params]);

  useEffect(() => {
    sendMsg(
      {
        action: WALLET_GET_CURRENT_ACCOUNT,
      },
      async (currentAccount) => {
        setLockStatus(currentAccount.isUnlocked);
      }
    );
    getSignParams();
  }, []);

  const onCancel = useCallback(() => {
    sendMsg(
      {
        action: DAPP_ACTION_SWITCH_CHAIN,
        payload: {
          cancel: true,
          resultOrigin: params.siteUrl,
        },
      },
      async () => {
        goToHome();
      }
    );
  }, [goToHome, params]);

  const onConfirm = useCallback(async () => {
    const currentSupportChainList = Object.keys(NET_CONFIG_LIST);
    const nextChainIndex = currentSupportChainList.indexOf(targetChainId);
    let message = "";
    let status = false;
    if (nextChainIndex === -1) {
      message = "Unsupport chain"
    } else {
      if (targetChainId !== currentConfig.netType) {
        const { currentNetConfig } = netConfig;
        let config = {
          ...currentNetConfig,
          currentConfig: NET_CONFIG_LIST[targetChainId].config,
        };
        await extSaveLocal(NET_WORK_CONFIG, config);
        dispatch(updateNetConfig(config));
        dispatch(updateStakingRefresh(true));

        dispatch(updateShouldRequest(true));
        sendNetworkChangeMsg(config.currentConfig);
      }
      status = true;
    }
    sendMsg(
      {
        action: DAPP_ACTION_SWITCH_CHAIN,
        payload: {
          status,
          message,
          resultOrigin: params.siteUrl,
        },
      },
      () => {
        goToHome();
      }
    );
  }, [goToHome, params, targetChainId, currentConfig, netConfig]);

  const onClickUnLock = useCallback(() => {
    setLockStatus(true);
  }, [currentAccount, params]);

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
      <div className={styles.titleRow}>
        <p className={styles.title}>{i18n.t("switchNetwork")}</p>
        <div className={styles.netContainer}>
          <div className={styles.dot} />
          <p className={styles.netContent}>{currentConfig.name}</p>
        </div>
      </div>
      <div className={styles.content}>
      <div className={styles.websiteContainer}>
        <DappWebsite siteIcon={params.siteIcon} siteUrl={params.siteUrl} />
      </div>
        <p className={styles.accountTip}>{i18n.t("allowSwitch")}</p>
        <div className={styles.accountRow}>
          <div className={styles.rowLeft}>
            <p className={styles.rowTitle}>{i18n.t("current")}</p>
            <p className={styles.rowContent}>{currentConfig.netType}</p>
          </div>
          <div className={styles.rowArrow}>
            <img src="/img/icon_arrow_purple.svg" />
          </div>
          <div className={styles.rowRight}>
            <p className={cls(styles.rowTitle, styles.rightTitle)}>
              {i18n.t("target")}
            </p>
            <p className={styles.rowContent}>{targetChainId}</p>
          </div>
        </div>
      </div>
      <div className={styles.btnGroup}>
        <Button
          onClick={onCancel}
          theme={button_theme.BUTTON_THEME_LIGHT}
          size={button_size.middle}
        >
          {i18n.t("cancel")}
        </Button>
        <Button size={button_size.middle} onClick={onConfirm}>
          {i18n.t("switch")}
        </Button>
      </div>
    </div>
  );
};

export default NotificationPage;
