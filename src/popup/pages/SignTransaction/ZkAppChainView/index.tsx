import { getNodeNetworkID } from "@/background/api";
import { extSaveLocal } from "@/background/extensionStorage";
import { getLocal } from "@/background/localStorage";
import { DAPP_ACTION_SWITCH_CHAIN } from "@/constant/msgTypes";
import {
  NET_WORK_CHANGE_FLAG,
  NET_WORK_CONFIG_V2,
} from "@/constant/storageKey";
import Button, { button_size, button_theme } from "@/popup/component/Button";
import DappWebsite from "@/popup/component/DappWebsite";
import Toast from "@/popup/component/Toast";
import {
  updateShouldRequest,
  updateStakingRefresh,
} from "@/reducers/accountReducer";
import {
  updateCurrentNode,
  updateCustomNodeList,
} from "@/reducers/network";
import { sendMsg } from "@/utils/commonMsg";
import { DAppActions } from "@aurowallet/mina-provider";
import i18n from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useStore";
import { NET_CONFIG_VERSION } from "../../../../../config";
import { Default_Network_List } from "@/constant/network";
import { clearLocalCache } from "../../../../background/localStorage";
import { sendNetworkChangeMsg } from "../../../../utils/commonMsg";
import {
  StyledSectionSwitch,
  StyledTitleRow,
  StyledTitle,
  StyledContent,
  StyledAccountTip,
  StyledBtnGroup,
  StyledAccountRow,
  StyledRowTitle,
  StyledRowContent,
  StyledRowLeft,
  StyledRowRight,
  StyledRowArrow,
  StyledAddTipContainer,
  StyledAddTip,
  StyledNodeWrapper,
  StyledNodeTitle,
  StyledNodeContent,
  StyledMt20,
} from "./index.styled";

interface NotifyParams {
  id?: string;
  site?: { origin?: string; webIcon?: string };
  params?: {
    action?: string;
    networkID?: string;
    targetConfig?: NetworkNode;
    url?: string;
    name?: string;
  };
}

interface NetworkNode {
  url?: string;
  name?: string;
  networkID?: string;
  isDefaultNode?: boolean;
  explorer?: string;
}

interface ZkAppChainViewProps {
  notifyParams: NotifyParams;
  onRemoveNotify: (id?: string) => void;
}

const ZkAppChainView = ({ notifyParams, onRemoveNotify }: ZkAppChainViewProps) => {
  const dispatch = useAppDispatch();
  const allNodeList = useAppSelector((state) => state.network.allNodeList);
  const currentNode = useAppSelector((state) => state.network.currentNode);
  const customNodeList = useAppSelector((state) => state.network.customNodeList);
  
  
  const [state, setState] = useState({
    switchStatus: false,
    addStatus: false,
  });
  const [btnLoadingStatus, setBtnLoadingStatus] = useState(false);
  const [nextChainConfig, setNextChainConfig] = useState<NetworkNode | undefined>();

  const [showTitle, setShowTitle] = useState("");
  const [showBtnTxt, setShowBtnTxt] = useState("");
  const { targetNetworkID, isSwitch, targetConfig } = useMemo(() => {
    const params = notifyParams.params || {};
    const targetNetworkID = params.networkID;
    const sendAction = params.action;
    const isSwitch = sendAction === DAppActions.mina_switchChain;
    const targetConfig = params.targetConfig;
    return {
      targetNetworkID,
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
    const config = (allNodeList as NetworkNode[]).filter((network: NetworkNode) => {
      return network.networkID === targetNetworkID;
    });
    return config[0] || {};
  }, [targetNetworkID, allNodeList]);


  useEffect(() => {
    if (notifyParams.params?.action === DAppActions.mina_addChain) {
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
    let nextConfig = currentNode as Parameters<typeof updateCurrentNode>[0];
    if (
      targetNetworkID !== currentNode.networkID ||
      targetConfig ||
      nextChainConfig
    ) {
      nextConfig = (targetConfig || nextChainConfig || currentNode) as Parameters<typeof updateCurrentNode>[0];
      if (targetNetworkID) {
        for (let index = 0; index < allNodeList.length; index++) {
          const nodeItem = allNodeList[index];
          if(nodeItem && nodeItem.networkID === targetNetworkID){
            nextConfig = nodeItem as Parameters<typeof updateCurrentNode>[0];
            break;
          }
        }
      }
      let config = {
        currentNode: nextConfig,
        customNodeList: customNodeList,
        nodeConfigVersion:NET_CONFIG_VERSION
      };
      await extSaveLocal(NET_WORK_CONFIG_V2, config);
      dispatch(updateCurrentNode(config.currentNode));
      dispatch(updateCustomNodeList(config.customNodeList));
      
      if(config.currentNode.networkID !== currentNode.networkID){
        dispatch(updateStakingRefresh(true));
        dispatch(updateShouldRequest(true));
      }

      await extSaveLocal(NET_WORK_CHANGE_FLAG, true);
      sendNetworkChangeMsg(config.currentNode as unknown as Parameters<typeof sendNetworkChangeMsg>[0]);
      clearLocalCache();
    }
    sendMsg(
      {
        action: DAPP_ACTION_SWITCH_CHAIN,
        payload: {
          nextConfig: {
            networkID: nextConfig.networkID,
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
    targetNetworkID,
    currentNode,
    onRemoveNotify,
    targetConfig,
    nextChainConfig,
    customNodeList
  ]);
  const onAddChain = useCallback(async () => {
    setBtnLoadingStatus(true);
    const url = decodeURIComponent(notifyParams.params?.url || "");
    const name = notifyParams.params?.name || "";
    let chainData = await getNodeNetworkID(url)
    setBtnLoadingStatus(false);
    let networkID = (chainData as { networkID?: string })?.networkID || "";
    if (!networkID) {
      Toast.info(i18n.t("incorrectNodeAddress"));
      return;
    }

    let networkConfig: Partial<NetworkNode> = {};
    for (let index = 0; index < Default_Network_List.length; index++) {
      const network = Default_Network_List[index];
      if (network?.networkID === networkID) {
        networkConfig = network;
        break;
      } 
    }
    let addItem = {
      ...networkConfig,
      url: url,
      name: name,
      networkID: networkID,
      isDefaultNode: false,
      gqlTxUrl: (networkConfig as { gqlTxUrl?: string }).gqlTxUrl || "",
      explorer: networkConfig.explorer || "",
    };
    let list = [...customNodeList];
    list.push(addItem as Parameters<typeof updateCustomNodeList>[0][number]);

    let newConfig = {
      customNodeList: list,
      currentNode: currentNode,
      netConfigVersion: NET_CONFIG_VERSION,
    };
    await extSaveLocal(NET_WORK_CONFIG_V2, newConfig);
    dispatch(updateCustomNodeList(newConfig.customNodeList));
    setNextChainConfig(addItem);
    setState({
      switchStatus: true,
      addStatus: false,
    });
  }, [
    notifyParams,
    allNodeList,
    nextChainConfig,
    currentNode,
  ]);

  const onConfirm = useCallback(async () => {
    if (state.switchStatus) {
      onSwitchChain();
    } else {
      onAddChain();
    }
  }, [onSwitchChain, onAddChain, isSwitch, state]);

  const { showTargetName, showTargetId } = useMemo(() => {
    const showTargetName =
      targetConfig?.name || nextChainConfig?.name || targetChainInfo.name;
    const showTargetId =
      targetConfig?.networkID || nextChainConfig?.networkID || targetNetworkID;
    return {
      showTargetName,
      showTargetId,
    };
  }, [targetConfig, nextChainConfig, targetChainInfo, targetNetworkID]);

  return (
    <StyledSectionSwitch>
      <StyledTitleRow>
        <StyledTitle>{i18n.t(showTitle)}</StyledTitle>
      </StyledTitleRow>
      {state.switchStatus && (
        <SwitchChainView
          notifyParams={notifyParams}
          currentChainName={currentNode.name}
          currentNetworkID={currentNode.networkID}
          targetChainName={showTargetName}
          targetNetworkID={showTargetId}
        />
      )}
      {state.addStatus && <AddChainView notifyParams={notifyParams} />}
      <StyledBtnGroup>
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
      </StyledBtnGroup>
    </StyledSectionSwitch>
  );
};

const AddChainView = ({ notifyParams }: { notifyParams: NotifyParams }) => {
  const { url, name } = useMemo(() => {
    const url = decodeURIComponent(notifyParams.params?.url || "");
    const name = notifyParams.params?.name || "";
    return {
      url,
      name,
    };
  }, []);
  return (
    <StyledContent>
      <StyledAddTipContainer>
        <StyledAddTip>{i18n.t("addNetworkTip")}</StyledAddTip>
      </StyledAddTipContainer>
      <div>
        <DappWebsite
          siteIcon={notifyParams.site?.webIcon}
          siteUrl={notifyParams.site?.origin}
        />
      </div>
      <StyledAccountTip>{i18n.t("allowAdd")}</StyledAccountTip>
      <StyledNodeWrapper>
        <StyledNodeTitle>{i18n.t("nodeName")}</StyledNodeTitle>
        <StyledNodeContent>{name}</StyledNodeContent>
        <StyledNodeTitle>{i18n.t("nodeAddress")}</StyledNodeTitle>
        <StyledNodeContent>{url}</StyledNodeContent>
      </StyledNodeWrapper>
    </StyledContent>
  );
};

interface SwitchChainViewProps {
  notifyParams: NotifyParams;
  currentNetworkID?: string;
  currentChainName?: string;
  targetNetworkID?: string;
  targetChainName?: string;
}

const SwitchChainView = ({
  notifyParams,
  currentNetworkID,
  currentChainName,
  targetNetworkID,
  targetChainName,
}: SwitchChainViewProps) => {
  return (
    <StyledContent style={{ marginTop: "20px" }}>
      <div>
        <DappWebsite
          siteIcon={notifyParams.site?.webIcon}
          siteUrl={notifyParams.site?.origin}
        />
      </div>
      <StyledAccountTip>{i18n.t("allowSwitch")}</StyledAccountTip>
      <StyledAccountRow>
        <StyledRowLeft>
          <StyledRowTitle>{i18n.t("current")}</StyledRowTitle>
          <StyledRowContent>{currentChainName}</StyledRowContent>
          <StyledRowContent style={{ fontSize: "14px" }}>{currentNetworkID}</StyledRowContent>
        </StyledRowLeft>
        <StyledRowArrow>
          <img src="/img/icon_arrow_purple.svg" />
        </StyledRowArrow>
        <StyledRowRight>
          <StyledRowTitle $rightAlign>{i18n.t("target")}</StyledRowTitle>
          <StyledRowContent>{targetChainName}</StyledRowContent>
          <StyledRowContent style={{ fontSize: "14px" }}>{targetNetworkID}</StyledRowContent>
        </StyledRowRight>
      </StyledAccountRow>
    </StyledContent>
  );
};
export default ZkAppChainView;
