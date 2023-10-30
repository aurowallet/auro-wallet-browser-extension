import { extSaveLocal } from "@/background/extensionStorage";
import { DAPP_ACTION_SWITCH_CHAIN } from "@/constant/msgTypes";
import { NET_CONFIG_MAP } from "@/constant/network";
import { NET_WORK_CONFIG } from "@/constant/storageKey";
import Button, { button_size, button_theme } from "@/popup/component/Button";
import DappWebsite from "@/popup/component/DappWebsite";
import {
  updateShouldRequest,
  updateStakingRefresh,
} from "@/reducers/accountReducer";
import { updateNetConfig } from "@/reducers/network";
import { sendMsg } from "@/utils/commonMsg";
import { clearLocalCache, sendNetworkChangeMsg } from "@/utils/utils";
import cls from "classnames";
import i18n from "i18next";
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import styles from "./index.module.scss";

const SwitchChain = ({ notifyParams, onRemoveNotify }) => {
  const dispatch = useDispatch();
  const currentConfig = useSelector((state) => state.network.currentConfig);
  const netConfig = useSelector((state) => state.network);
  const [targetChainId, setTargetChainId] = useState("");

  useEffect(() => {
    const nextChainId = notifyParams.params?.chainId || "";
    setTargetChainId(nextChainId);
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

  const onConfirm = useCallback(async () => {
    if (targetChainId !== currentConfig.netType) {
      const { currentNetConfig } = netConfig;
      let config = {
        ...currentNetConfig,
        currentConfig: NET_CONFIG_MAP[targetChainId].config,
      };
      await extSaveLocal(NET_WORK_CONFIG, config);
      dispatch(updateNetConfig(config));
      dispatch(updateStakingRefresh(true));

      dispatch(updateShouldRequest(true));
      sendNetworkChangeMsg(config.currentConfig);
      clearLocalCache();
    }
    sendMsg(
      {
        action: DAPP_ACTION_SWITCH_CHAIN,
        payload: {
          status: true,
          resultOrigin: notifyParams.site?.origin,
          id: notifyParams.id,
        },
      },
      async () => {}
    );

    onRemoveNotify(notifyParams.id);
  }, [notifyParams, targetChainId, currentConfig, netConfig, onRemoveNotify]);

  return (
    <section className={styles.sectionSwitch}>
      <div className={styles.titleRow}>
        <p className={styles.title}>{i18n.t("switchNetwork")}</p>
        <div className={styles.netContainer}>
          <div className={styles.dot} />
          <p className={styles.netContent}>{currentConfig.name}</p>
        </div>
      </div>
      <div className={styles.content}>
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
    </section>
  );
};

export default SwitchChain;
