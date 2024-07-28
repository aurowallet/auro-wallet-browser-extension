import { useCallback, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { NET_CONFIG_VERSION } from "../../../../config";
import { NET_WORK_CONFIG_V2 } from "../../../constant/storageKey";
import {
  updateShouldRequest,
  updateStakingRefresh,
} from "../../../reducers/accountReducer";
import { updateCurrentNode, updateCustomNodeList } from "../../../reducers/network";
import {
  addressSlice,
  clearLocalCache,
  sendNetworkChangeMsg,
} from "../../../utils/utils";
import i18n from "i18next";
import { useHistory } from "react-router-dom";
import { extSaveLocal } from "../../../background/extensionStorage";
import Button from "../../component/Button";
import CustomView from "../../component/CustomView";
import styles from "./index.module.scss";
import NetworkItem from "./NetworkItem";
import styled from "styled-components";
import { NetworkID_MAP } from "@/constant/network";

const StyledItemWrapper = styled.div`
  margin-top: 10px;
`;

const NetworkPage = ({}) => {
  const allNodeList = useSelector((state) => state.network.allNodeList);
  const customNodeList = useSelector((state) => state.network.customNodeList);
  const currentNode = useSelector((state) => state.network.currentNode);

  const [editMode, setEditMode] = useState(false);

  const dispatch = useDispatch();
  const history = useHistory();

  const { nodeList, showEditBtn } = useMemo(() => {
    let defaultMainConfig;
    let topList = [];
    let bottomList = [];
    
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
    history.push({
      pathname: "node_editor",
    });
  }, []);

  const onClickRow = useCallback(
    async (nodeItem) => {
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
        dispatch(updateStakingRefresh(true));
        dispatch(updateShouldRequest(true));
      }

      sendNetworkChangeMsg(config.currentNode);
      history.goBack();
    },
    [customNodeList, editMode,currentNode]
  );

  const onEditItem = useCallback(
    (nodeItem) => {
      history.push({
        pathname: "node_editor",
        params: {
          isEdit:true,
          editItem: nodeItem,
        },
      });
    },
    []
  );

  const rightComponent = useMemo(() => {
    if (showEditBtn) {
      return (
        <p className={styles.editBtn} onClick={onClickEdit}>
          {editMode ? i18n.t("done") : i18n.t("edit")}
        </p>
      );
    }
    return <></>;
  }, [showEditBtn, editMode]);

  return (
    <CustomView
      title={i18n.t("network")}
      contentClassName={styles.contentClassName}
      rightComponent={rightComponent}
    >
      <div className={styles.innerContent}>
        {nodeList.map((netNode, index) => {
          if (netNode.list.length == 0) {
            return <div key={index} />;
          }
          let showNetTitle = netNode.isDefaultNodeList;
          return (
            <div key={index}>
              {showNetTitle && (
                <div className={styles.networkTitleWrapper}>
                  <hr className={styles.hrDotted} />
                  <p className={styles.nodeListTitle}>{i18n.t("testnet")}</p>
                  <hr className={styles.hrDotted} />
                </div>
              )}
              {netNode.list.map((nodeItem, j) => {
                return (
                  <StyledItemWrapper key={j}>
                    <NetworkItem
                      nodeItem={nodeItem}
                      onClickItem={onClickRow}
                        onEditItem={onEditItem}
                      editMode={editMode}
                    />
                  </StyledItemWrapper>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className={styles.bottomContainer}>
        <Button onClick={onAddNode}>{i18n.t("addNode")}</Button>
      </div>
    </CustomView>
  );
};

export default NetworkPage;
