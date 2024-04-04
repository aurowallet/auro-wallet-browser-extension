import cls from "classnames";
import { useCallback, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { NET_CONFIG_VERSION } from "../../../../config";
import { NET_WORK_CONFIG } from "../../../constant/storageKey";
import {
  updateShouldRequest,
  updateStakingRefresh,
} from "../../../reducers/accountReducer";
import { NET_CONFIG_DEFAULT, updateNetConfig } from "../../../reducers/network";
import {
  addressSlice,
  clearLocalCache,
  sendNetworkChangeMsg,
} from "../../../utils/utils";

import { NET_CONFIG_TYPE } from "@/constant/network";
import i18n from "i18next";
import { useHistory } from "react-router-dom";
import { extSaveLocal } from "../../../background/extensionStorage";
import Button from "../../component/Button";
import CustomView from "../../component/CustomView";
import { NodeEditorType } from "./NodeEditor";
import styles from "./index.module.scss";
import NetworkItem from "./NetworkItem";
import styled from "styled-components";

const StyledItemWrapper = styled.div`
  margin-top: 10px;
`;

const NetworkPage = ({}) => {
  const netConfigList = useSelector((state) => state.network.netList);

  const [editMode, setEditMode] = useState(false);

  const dispatch = useDispatch();
  const history = useHistory();

  const { nodeList, showEditBtn } = useMemo(() => {
    let defaultMainConfig;
    let topList = [];
    let bottomList = [];
    netConfigList.map((item) => {
      if (item.type === NET_CONFIG_DEFAULT) {
        if (item.netType !== NET_CONFIG_TYPE.Mainnet) {
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
        type: NET_CONFIG_DEFAULT,
        list: bottomList,
      },
    ];

    return {
      nodeList,
      showEditBtn,
    };
  }, [netConfigList, i18n]);


  const onClickEdit = useCallback(() => {
    setEditMode((state) => !state);
  }, []);

  const onAddNode = useCallback(() => {
    history.push({
      pathname: "node_editor",
      params: { editorType: NodeEditorType.add },
    });
  }, []);

  const onClickRow = useCallback(
    async (nodeItem) => {
      if (editMode) {
        return;
      }
      let config = {
        netList: netConfigList,
        currentConfig: nodeItem,
        netConfigVersion: NET_CONFIG_VERSION,
      };
      await extSaveLocal(NET_WORK_CONFIG, config);
      clearLocalCache();

      dispatch(updateNetConfig(config));
      dispatch(updateShouldRequest(true));
      dispatch(updateStakingRefresh(true));

      sendNetworkChangeMsg(config.currentConfig);
      history.goBack();
    },
    [netConfigList, editMode]
  );

  const onEditItem = useCallback(
    (nodeItem) => {
      history.push({
        pathname: "node_editor",
        params: {
          editorType: NodeEditorType.edit,
          editItem: nodeItem,
        },
      });
    },
    [netConfigList]
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
          let showNetTitle = netNode.type === NET_CONFIG_DEFAULT;
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
