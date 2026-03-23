import { clearLocalCache } from "@/background/localStorage";
import { NetworkID_MAP } from "@/constant/network";
import { sendNetworkChangeMsg } from "@/utils/commonMsg";
import i18n from "i18next";
import { useCallback, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useStore";
import { useNavigate } from "react-router-dom";
import { NET_CONFIG_VERSION } from "../../../../config";
import { extSaveLocal } from "../../../background/extensionStorage";
import { NET_WORK_CONFIG_V2 } from "../../../constant/storageKey";
import {
  updateShouldRequest,
  updateStakingRefresh,
  updateTokenAssets,
} from "../../../reducers/accountReducer";
import { updateCurrentNode, updateCustomNodeList } from "../../../reducers/network";
import Button from "../../component/Button";
import CustomView from "../../component/CustomView";
import NetworkItem from "./NetworkItem";
import {
  StyledContentClassName, 
  StyledEditBtn,
  StyledInnerContent,
  StyledBottomContainer,
  StyledNetworkTitleWrapper,
  StyledNodeListTitle,
  StyledHrDotted,
  StyledItemWrapper,
} from "./index.styled";

const NetworkPage = () => {
  const allNodeList = useAppSelector((state) => state.network.allNodeList);
  const customNodeList = useAppSelector((state) => state.network.customNodeList);
  const currentNode = useAppSelector((state) => state.network.currentNode);

  const [editMode, setEditMode] = useState(false);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  type NodeItem = typeof allNodeList[number] & { name: string; url: string; networkID: string; isDefaultNode?: boolean };
  const { nodeList, showEditBtn } = useMemo(() => {
    let defaultMainConfig: NodeItem | undefined;
    let topList: NodeItem[] = [];
    let bottomList: NodeItem[] = [];
    allNodeList.map((item) => {
        if (item.isDefaultNode) {
        if (item.networkID !== NetworkID_MAP.mainnet) {
          bottomList.push(item);
        } else {
          defaultMainConfig = item;
        }
      } else {
        topList.push(item);
      }
    });
    if (defaultMainConfig) {
      topList.unshift(defaultMainConfig);
    }

    let showEditBtn = topList.length > 1;
    let nodeList = [
      {
        list: topList,
      },
      {
        isDefaultNodeList: true,
        list: bottomList,
      },
    ];

    return {
      nodeList,
      showEditBtn,
    };
  }, [allNodeList, i18n]);


  const onClickEdit = useCallback(() => {
    setEditMode((state) => !state);
  }, []);

  const onAddNode = useCallback(() => {
    navigate("/node_editor");
  }, []);

  const onClickRow = useCallback(
    async (nodeItem: NodeItem) => {
      if (editMode) {
        return;
      }

      let config = { 
        currentNode: nodeItem,
        customNodeList: customNodeList,
        nodeConfigVersion:NET_CONFIG_VERSION
      };
      await extSaveLocal(NET_WORK_CONFIG_V2, config);
      clearLocalCache();


      dispatch(updateCurrentNode(config.currentNode));
      dispatch(updateCustomNodeList(config.customNodeList));
      
      if(nodeItem.networkID !== currentNode.networkID){
        dispatch(updateTokenAssets([]));
        dispatch(updateStakingRefresh(true));
        dispatch(updateShouldRequest(true));
      }

      sendNetworkChangeMsg(config.currentNode as unknown as Parameters<typeof sendNetworkChangeMsg>[0]);
      navigate(-1);
    },
    [customNodeList, editMode,currentNode]
  );

  const onEditItem = useCallback(
    (nodeItem: NodeItem) => {
      navigate("/node_editor", {
        state: {
          isEdit: true,
          editItem: nodeItem,
        },
      });
    },
    []
  );

  const rightComponent = useMemo(() => {
    if (showEditBtn) {
      return (
        <StyledEditBtn onClick={onClickEdit}>
          {editMode ? i18n.t("done") : i18n.t("edit")}
        </StyledEditBtn>
      );
    }
    return <></>;
  }, [showEditBtn, editMode]);

  return (
    <CustomView
      title={i18n.t("network")}
      ContentWrapper={StyledContentClassName}
      rightComponent={rightComponent}
    >
      <StyledInnerContent>
        {nodeList.map((netNode, index) => {
          if (netNode.list.length == 0) {
            return <div key={index} />;
          }
          let showNetTitle = netNode.isDefaultNodeList;
          return (
            <div key={index}>
              {showNetTitle && (
                <StyledNetworkTitleWrapper>
                  <StyledHrDotted />
                  <StyledNodeListTitle>{i18n.t("testnet")}</StyledNodeListTitle>
                  <StyledHrDotted />
                </StyledNetworkTitleWrapper>
              )}
              {netNode.list.map((nodeItem, j) => {
                return (
                  <StyledItemWrapper key={j}>
                    <NetworkItem
                      nodeItem={nodeItem}
                      onClickItem={onClickRow as unknown as Parameters<typeof NetworkItem>[0]["onClickItem"]}
                      onEditItem={onEditItem as unknown as Parameters<typeof NetworkItem>[0]["onEditItem"]}
                      editMode={editMode}
                    />
                  </StyledItemWrapper>
                );
              })}
            </div>
          );
        })}
      </StyledInnerContent>
      <StyledBottomContainer>
        <Button onClick={onAddNode}>{i18n.t("addNode")}</Button>
      </StyledBottomContainer>
    </CustomView>
  );
};

export default NetworkPage;
