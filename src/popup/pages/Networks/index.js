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

  const { rightBtcContent } = useMemo(() => {
    let rightBtcContent = editMode ? i18n.t("done") : i18n.t("edit");
    return {
      rightBtcContent,
    };
  }, [i18n, editMode]);

  const onClickEdit = useCallback(() => {
    setEditMode((state) => !state);
  }, [editMode]);

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
          {rightBtcContent}
        </p>
      );
    }
    return <></>;
  }, [showEditBtn]);

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
                  <p className={styles.nodeListTitle}>{"Testnet"}</p>
                  <hr className={styles.hrDotted} />
                </div>
              )}
              {netNode.list.map((nodeItem, j) => {
                return (
                  <NodeItem
                    key={j}
                    nodeItem={nodeItem}
                    onClickRow={onClickRow}
                    onEditItem={onEditItem}
                    editMode={editMode}
                  />
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
const NodeItem = ({ nodeItem, onClickRow, onEditItem, editMode }) => {
  const currentConfig = useSelector((state) => state.network.currentConfig);

  const { showNetType, select } = useMemo(() => {
    let showNetType = nodeItem.type !== NET_CONFIG_DEFAULT;
    let select = currentConfig.url === nodeItem.url;
    return {
      showNetType,
      select,
    };
  }, [nodeItem, currentConfig]);
  return (
    <div className={styles.rowContainer}>
      <div
        className={cls(styles.nodeItemContainer, {
          [styles.editMode]: editMode,
        })}
        onClick={() => onClickRow(nodeItem)}
      >
        <div className={styles.rowleft}>
          <div className={styles.rowTopContainer}>
            <div className={styles.rowTopLeftContainer}>
              <p
                className={cls(styles.nodeName, {
                  [styles.disableEdit]: editMode && !showNetType,
                })}
              >
                {nodeItem.name}
              </p>
              {showNetType && (
                <div className={styles.nodeTypeContainer}>
                  <span className={styles.nodeType}>{nodeItem.netType}</span>
                </div>
              )}
            </div>
          </div>
          {nodeItem.chainId && (
            <p className={styles.chainId}>
              {addressSlice(nodeItem.chainId, 6)}
            </p>
          )}
        </div>
        {!editMode && (
          <div className={styles.rowRight}>
            {select && (
              <img src="/img/icon_checked.svg" className={styles.checkedIcon} />
            )}
          </div>
        )}
        {editMode && showNetType && (
          <div className={styles.rowRight} onClick={() => onEditItem(nodeItem)}>
            <img src="/img/icon_edit.svg" className={styles.editIcon} />
          </div>
        )}
      </div>
    </div>
  );
};

export default NetworkPage;
