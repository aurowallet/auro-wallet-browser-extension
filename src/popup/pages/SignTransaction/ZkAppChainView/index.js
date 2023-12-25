import { getNetworkList, getNodeChainId } from "@/background/api";
import { extSaveLocal } from "@/background/extensionStorage";
import { getLocal } from "@/background/localStorage";
import { DAPP_ACTION_SWITCH_CHAIN } from "@/constant/msgTypes";
import { BASE_unknown_config, NET_CONFIG_MAP } from "@/constant/network";
import {
  NETWORK_ID_AND_TYPE,
  NET_WORK_CHANGE_FLAG,
  NET_WORK_CONFIG,
} from "@/constant/storageKey";
import Button, { button_size, button_theme } from "@/popup/component/Button";
import DappWebsite from "@/popup/component/DappWebsite";
import Toast from "@/popup/component/Toast";
import {
  updateShouldRequest,
  updateStakingRefresh,
} from "@/reducers/accountReducer";
import {
  NET_CONFIG_ADD,
  updateNetChainIdConfig,
  updateNetConfig,
} from "@/reducers/network";
import { sendMsg } from "@/utils/commonMsg";
import { clearLocalCache, sendNetworkChangeMsg } from "@/utils/utils";
import { DAppActions } from "@aurowallet/mina-provider";
import cls from "classnames";
import i18n from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { NET_CONFIG_VERSION } from "../../../../../config";
import styles from "./index.module.scss";

const ZkAppChainView = ({ notifyParams, onRemoveNotify }) => {
  const dispatch = useDispatch();
  const networkList = useSelector((state) => state.network.netList);
  const currentConfig = useSelector((state) => state.network.currentConfig);
  const currentNetConfig = useSelector(
    (state) => state.network.currentNetConfig
  );
  const networkData = useSelector((state) => state.network);
  const [state, setState] = useState({
    switchStatus: false,
    addStatus: false,
  });
  const [btnLoadingStatus, setBtnLoadingStatus] = useState(false);
  const [nextChainConfig, setNextChainConfig] = useState();

  const [networkApiConfig, setNetworkApiConfig] = useState([]);
  const [showTitle, setShowTitle] = useState("");
  const [showBtnTxt, setShowBtnTxt] = useState("");
  const { targetChainId, isSwitch, targetConfig } = useMemo(() => {
    const params = notifyParams.params || {};
    const targetChainId = params.chainId;
    const sendAction = params.action;
    const isSwitch = sendAction === DAppActions.mina_switchChain;
    const targetConfig = params.targetConfig;
    return {
      targetChainId,
      isSwitch,
      targetConfig,
    };
  }, [notifyParams]);

  useEffect(() => {
    if (state.addStatus) {
      setShowTitle("addNode");
      setShowBtnTxt("add");
    } else {
      setShowTitle("switchNetwork");
      setShowBtnTxt("switch");
    }
  }, [state]);

  const targetChainInfo = useMemo(() => {
    const config = networkList.filter((network) => {
      return network.netType === targetChainId;
    });
    return config[0] || {};
  }, [targetChainId, networkList]);

  const fetchData = useCallback(async () => {
    let network = await getNetworkList();
    if (
      !Array.isArray(network) ||
      (Array.isArray(network) && network.length == 0)
    ) {
      let listJson = getLocal(NETWORK_ID_AND_TYPE);
      let list = JSON.parse(listJson);
      if (list.length > 0) {
        network = list;
      }
    }
    dispatch(updateNetChainIdConfig(network));
    setNetworkApiConfig(network);
  }, []);

  useEffect(() => {
    if (notifyParams.params?.action === DAppActions.mina_addChain) {
      fetchData();
      setState({
        switchStatus: false,
        addStatus: true,
      });
    } else {
      setState({
        switchStatus: true,
        addStatus: false,
      });
    }
  }, [notifyParams]);

  const onCancel = useCallback(() => {
    sendMsg(
      {
        action: DAPP_ACTION_SWITCH_CHAIN,
        payload: {
          cancel: true,
          resultOrigin: notifyParams.site?.origin,
          id: notifyParams.id,
        },
      },
      async () => {}
    );
    onRemoveNotify(notifyParams.id);
  }, [notifyParams, onRemoveNotify]);

  const onSwitchChain = useCallback(async () => {
    let nextConfig = currentConfig;
    if (
      targetChainId !== currentConfig.netType ||
      targetConfig ||
      nextChainConfig
    ) {
      nextConfig = targetConfig || nextChainConfig;
      if (targetChainId) {
        nextConfig = NET_CONFIG_MAP[targetChainId].config;
      }
      let config = {
        ...currentNetConfig,
        currentConfig: nextConfig,
      };
      await extSaveLocal(NET_WORK_CONFIG, config);
      dispatch(updateNetConfig(config));

      await extSaveLocal(NET_WORK_CHANGE_FLAG, true);
      sendNetworkChangeMsg(config.currentConfig);
      clearLocalCache();
    }
    sendMsg(
      {
        action: DAPP_ACTION_SWITCH_CHAIN,
        payload: {
          nextConfig: {
            chainId: nextConfig.netType,
            name: nextConfig.name,
          },
          resultOrigin: notifyParams.site?.origin,
          id: notifyParams.id,
        },
      },
      async () => {}
    );
    onRemoveNotify(notifyParams.id);
  }, [
    notifyParams,
    targetChainId,
    currentConfig,
    onRemoveNotify,
    targetConfig,
    currentNetConfig,
    nextChainConfig,
  ]);
  const onAddChain = useCallback(async () => {
    setBtnLoadingStatus(true);
    const url = decodeURIComponent(notifyParams.params?.url);
    const name = notifyParams.params?.name;
    let chainData = await getNodeChainId(url);
    setBtnLoadingStatus(false);
    let chainId = chainData?.daemonStatus?.chainId || "";
    if (!chainId) {
      Toast.info(i18n.t("incorrectNodeAddress"));
      return;
    }

    let networkConfig = {};
    for (let index = 0; index < networkApiConfig.length; index++) {
      const network = networkApiConfig[index];
      if (network.chain_id === chainId) {
        networkConfig = network;
        break;
      }
    }
    let config;
    Object.keys(NET_CONFIG_MAP).forEach((key) => {
      const item = NET_CONFIG_MAP[key];
      if (item.type_id === networkConfig.type) {
        config = item.config;
      }
    });
    if (!config) {
      config = BASE_unknown_config;
    }
    let addItem = {
      ...config,
      name: name,
      url: url,
      id: url,
      type: NET_CONFIG_ADD,
      chainId,
    };
    let list = [...networkList];
    list.push(addItem);

    let newConfig = {
      netList: list,
      currentConfig: currentConfig,
      netConfigVersion: NET_CONFIG_VERSION,
    };
    await extSaveLocal(NET_WORK_CONFIG, newConfig);
    dispatch(updateNetConfig(newConfig));

    setNextChainConfig(addItem);
    setState({
      switchStatus: true,
      addStatus: false,
    });
  }, [
    notifyParams,
    networkList,
    nextChainConfig,
    networkApiConfig,
    currentConfig,
  ]);

  const onConfirm = useCallback(async () => {
    if (state.switchStatus) {
      onSwitchChain();
    } else {
      onAddChain();
    }
  }, [onSwitchChain, onAddChain, isSwitch, state]);

  const { showTagetName, showTargetId } = useMemo(() => {
    const showTagetName =
      targetConfig?.name || nextChainConfig?.name || targetChainInfo.name;
    const showTargetId =
      targetConfig?.netType || nextChainConfig?.netType || targetChainId;
    return {
      showTagetName,
      showTargetId,
    };
  }, [targetConfig, nextChainConfig, targetChainInfo, targetChainId]);

  return (
    <section className={styles.sectionSwitch}>
      <div className={styles.titleRow}>
        <p className={styles.title}>{i18n.t(showTitle)}</p>
        <div className={styles.netContainer}>
          <div className={styles.dot} />
          <p className={styles.netContent}>{currentConfig.name}</p>
        </div>
      </div>

      {state.switchStatus && (
        <SwitchChainView
          notifyParams={notifyParams}
          currentChainName={currentConfig.name}
          currentChainId={currentConfig.netType}
          targetChainName={showTagetName}
          targetChainId={showTargetId}
        />
      )}
      {state.addStatus && <AddChainView notifyParams={notifyParams} />}
      <div className={styles.btnGroup}>
        <Button
          onClick={onCancel}
          theme={button_theme.BUTTON_THEME_LIGHT}
          size={button_size.middle}
        >
          {i18n.t("cancel")}
        </Button>
        <Button
          size={button_size.middle}
          onClick={onConfirm}
          loading={btnLoadingStatus}
        >
          {i18n.t(showBtnTxt)}
        </Button>
      </div>
    </section>
  );
};

const AddChainView = ({ notifyParams }) => {
  const { url, name } = useMemo(() => {
    const url = decodeURIComponent(notifyParams.params?.url);
    const name = notifyParams.params?.name;
    return {
      url,
      name,
    };
  }, []);
  return (
    <div className={styles.content}>
      <div className={styles.addTipContainer}>
        <span className={styles.addTip}>{i18n.t("addNetworkTip")}</span>
      </div>
      <div className={styles.websiteContainer}>
        <DappWebsite
          siteIcon={notifyParams.site?.webIcon}
          siteUrl={notifyParams.site?.origin}
        />
      </div>
      <p className={styles.accountTip}>{i18n.t("allowAdd")}</p>
      <div className={styles.nodeWrapper}>
        <div className={styles.nodeTitle}>{i18n.t("nodeName")}</div>
        <div className={styles.nodeContent}>{name}</div>
        <div className={styles.nodeTitle}>{i18n.t("nodeAddress")}</div>
        <div className={styles.nodeContent}>{url}</div>
      </div>
    </div>
  );
};

const SwitchChainView = ({
  notifyParams,
  currentChainId,
  currentChainName,
  targetChainId,
  targetChainName,
}) => {
  return (
    <div className={cls(styles.content, styles.mt20)}>
      <div className={styles.websiteContainer}>
        <DappWebsite
          siteIcon={notifyParams.site?.webIcon}
          siteUrl={notifyParams.site?.origin}
        />
      </div>
      <p className={styles.accountTip}>{i18n.t("allowSwitch")}</p>
      <div className={styles.accountRow}>
        <div className={styles.rowLeft}>
          <p className={styles.rowTitle}>{i18n.t("current")}</p>
          <p className={styles.rowContent}>{currentChainName}</p>
          <p className={styles.rowDesc}>{currentChainId}</p>
        </div>
        <div className={styles.rowArrow}>
          <img src="/img/icon_arrow_purple.svg" />
        </div>
        <div className={styles.rowRight}>
          <p className={cls(styles.rowTitle, styles.rightTitle)}>
            {i18n.t("target")}
          </p>
          <p className={styles.rowContent}>{targetChainName}</p>
          <p className={styles.rowDesc}>{targetChainId}</p>
        </div>
      </div>
    </div>
  );
};
export default ZkAppChainView;
