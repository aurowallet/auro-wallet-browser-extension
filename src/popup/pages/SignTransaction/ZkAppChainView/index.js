import { getNetworkList, getNodeNetworkID } from "@/background/api";
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
import { useDispatch, useSelector } from "react-redux";
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

const ZkAppChainView = ({ notifyParams, onRemoveNotify }) => {
  const dispatch = useDispatch();
  const allNodeList = useSelector((state) => state.network.allNodeList);
  const currentNode = useSelector((state) => state.network.currentNode);
  const customNodeList = useSelector((state) => state.network.customNodeList);
  
  
  const [state, setState] = useState({
    switchStatus: false,
    addStatus: false,
  });
  const [btnLoadingStatus, setBtnLoadingStatus] = useState(false);
  const [nextChainConfig, setNextChainConfig] = useState();

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
    const config = allNodeList.filter((network) => {
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
    let nextConfig = currentNode;
    if (
      targetNetworkID !== currentNode.networkID ||
      targetConfig ||
      nextChainConfig
    ) {
      nextConfig = targetConfig || nextChainConfig;
      if (targetNetworkID) {
        for (let index = 0; index < allNodeList.length; index++) {
          const nodeItem = allNodeList[index];
          if(nodeItem.networkID === targetNetworkID){
            nextConfig = nodeItem
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
      sendNetworkChangeMsg(config.currentNode);
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
    const url = decodeURIComponent(notifyParams.params?.url);
    const name = notifyParams.params?.name;
    let chainData = await getNodeNetworkID(url)
    setBtnLoadingStatus(false);
    let networkID = chainData?.networkID || "";
    if (!networkID) {
      Toast.info(i18n.t("incorrectNodeAddress"));
      return;
    }

    let networkConfig = {};
    for (let index = 0; index < Default_Network_List.length; index++) {
      const network = Default_Network_List[index];
      if (network.networkID === networkID) {
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
    };
    let list = [...customNodeList];
    list.push(addItem);

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

const SwitchChainView = ({
  notifyParams,
  currentNetworkID,
  currentChainName,
  targetNetworkID,
  targetChainName,
}) => {
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
