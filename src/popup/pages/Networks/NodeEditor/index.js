import { Default_Network_List } from "@/constant/network";
import i18n from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import { NET_CONFIG_VERSION } from "../../../../../config";
import { getNodeNetworkID } from "../../../../background/api";
import { extSaveLocal } from "../../../../background/extensionStorage";
import { removeLocal } from "../../../../background/localStorage";
import {
  LOCAL_CACHE_KEYS,
  NET_WORK_CONFIG_V2,
} from "../../../../constant/storageKey";
import {
  updateShouldRequest,
  updateStakingRefresh,
} from "../../../../reducers/accountReducer";
import {
  updateCurrentNode,
  updateCustomNodeList,
} from "../../../../reducers/network";
import {
  checkNodeExist,
  sendNetworkChangeMsg,
  trimSpace,
  urlValid,
} from "../../../../utils/utils";
import Button from "../../../component/Button";
import CustomView from "../../../component/CustomView";
import Input from "../../../component/Input";
import { PopupModal } from "../../../component/PopupModal";
import TextArea from "../../../component/TextArea";
import styles from "./index.module.scss";

const NodeEditor = () => {
  const history = useHistory();
  const dispatch = useDispatch();
  const currentNode = useSelector((state) => state.network.currentNode);
  const allNodeList = useSelector((state) => state.network.allNodeList);
  const customNodeList = useSelector((state) => state.network.customNodeList);

  const [btnStatus, setBtnStatus] = useState(false);
  const [btnLoadingStatus, setBtnLoadingStatus] = useState(false);
  const [errorTip, setErrorTip] = useState("");

  const { editItem, isEdit } = useMemo(() => {
    let isEdit = history.location?.params?.isEdit;
    let editItem = history.location?.params?.editItem ?? "";
    return {
      editItem,
      isEdit,
    };
  }, [history]);

  const [nodeName, setNodeName] = useState(() => {
    if (isEdit) {
      return editItem.name || "";
    } else {
      return "";
    }
  });
  const [nodeAddressValue, setNodeAddressValue] = useState(() => {
    if (isEdit) {
      return editItem.url || "";
    } else {
      return "";
    }
  });

  const { title, showDeleteBtn } = useMemo(() => {

    let showDeleteBtn = true;
    let title = i18n.t("editNode");
    if (!isEdit) {
      title = i18n.t("addNode");
      showDeleteBtn = false;
    }

    return {
      title,
      showDeleteBtn,
    };
  }, [isEdit, i18n]);

  const baseConfigCheck = useCallback(async () => {
    let urlInput = trimSpace(nodeAddressValue);
    let nameInput = trimSpace(nodeName);
    if (!urlValid(urlInput)) {
      setErrorTip(i18n.t("incorrectNodeAddress"));
      return {};
    }
    let exist = checkNodeExist(allNodeList, urlInput);
    if (!isEdit) {
      if (exist.index !== -1) {
        setErrorTip(i18n.t("nodeAddressExists"));
        return {};
      }
    } else {
      if (exist.index !== -1 && urlInput !== editItem.url) {
        setErrorTip(i18n.t("nodeAddressExists"));
        return {};
      }
    }
    setBtnLoadingStatus(true);
    let networkData = await getNodeNetworkID(urlInput);
    let networkID = networkData?.networkID;
    setBtnLoadingStatus(false);
    if (!networkID) {
      setErrorTip(i18n.t("incorrectNodeAddress"));
      return {};
    }
    return {
      urlInput,
      nameInput,
      networkID,
    };
  }, [nodeAddressValue, nodeName, editItem, allNodeList, isEdit]);

  const clearLocalCache = useCallback(() => {
    let localCacheKeys = Object.keys(LOCAL_CACHE_KEYS);
    for (let index = 0; index < localCacheKeys.length; index++) {
      const keys = localCacheKeys[index];
      let localKey = LOCAL_CACHE_KEYS[keys];
      removeLocal(localKey);
    }
  }, []);

  const onAddNode = useCallback(async () => {
    let baseCheck = await baseConfigCheck();
    if (!baseCheck.urlInput) {
      return;
    }
    const { urlInput, nameInput, networkID } = baseCheck;

    let sameConfig = Default_Network_List.find(
      (nodeItem) => nodeItem.networkID == networkID
    );
    let newConfig = {};
    if (!isEdit) {
      let addItem = {
        ...sameConfig,
        name: nameInput,
        url: urlInput,
        networkID: networkID,
        isDefaultNode: false,
      };
      let list = [...customNodeList];
      list.push(addItem);
      newConfig = {
        customNodeList: list,
        currentNode: addItem,
        netConfigVersion: NET_CONFIG_VERSION,
      };
      await extSaveLocal(NET_WORK_CONFIG_V2, newConfig);

      clearLocalCache();

      updateCustomNodeList;
      dispatch(updateCurrentNode(newConfig.currentNode));
      dispatch(updateCustomNodeList(newConfig.customNodeList));
      dispatch(updateShouldRequest(true));
      dispatch(updateStakingRefresh(true));

      sendNetworkChangeMsg(newConfig.currentNode);

      setTimeout(() => {
        history.goBack();
      }, 50);
    } else {
      let isEditCurrentNode = false;
      let editItemTemp = {
        ...sameConfig,
        name: nameInput,
        url: urlInput,
        isDefaultNode: false,
        networkID: networkID,
      };

      if (editItem.url === currentNode.url) {
        isEditCurrentNode = true;
      }
      let list = [...customNodeList];
      let newList = list.map((item) => {
        if (item.url === editItem.url) {
          return editItemTemp;
        } else {
          return item;
        }
      });

      newConfig = {
        customNodeList: newList,
        currentNode: isEditCurrentNode ? editItemTemp : currentNode,
        netConfigVersion: NET_CONFIG_VERSION,
      };
      await extSaveLocal(NET_WORK_CONFIG_V2, newConfig);
      if (isEditCurrentNode) {
        clearLocalCache();
        dispatch(updateCurrentNode(newConfig.currentNode));
        dispatch(updateCustomNodeList(newConfig.customNodeList));

        dispatch(updateShouldRequest(true));
        dispatch(updateStakingRefresh(true));

        sendNetworkChangeMsg(newConfig.currentNode);
      }

      setTimeout(() => {
        history.goBack();
      }, 50);
    }
  }, [
    nodeAddressValue,
    nodeName,
    baseConfigCheck,
    customNodeList,
    editItem,
    currentNode,
  ]);

  const onInputNodeName = useCallback((e) => {
    setNodeName(e.target.value);
  }, []);

  const onInputNodeAddress = useCallback((e) => {
    setNodeAddressValue(e.target.value);
    setErrorTip("");
  }, []);

  useEffect(() => {
    if (nodeName.trim().length > 0 && nodeAddressValue.trim().length > 0) {
      setBtnStatus(true);
    } else {
      setBtnStatus(false);
    }
  }, [nodeAddressValue, nodeName]);

  const [reminderModalStatus, setReminderModalStatus] = useState(false);
  const onClickDelete = useCallback(() => {
    setReminderModalStatus(true);
  }, []);

  const onCancel = useCallback(() => {
    setReminderModalStatus(false);
  }, []);

  const onConfirmDelete = useCallback(async () => {
    let currentConfigTemp = currentNode;
    let isDeleteCurrentNode = false;
    let list = customNodeList;
    if (editItem.url === currentNode.url) {
      currentConfigTemp = list[0];
      isDeleteCurrentNode = true;
    }
    list = list.filter((item) => {
      return item.url !== editItem.url;
    });

    let newConfig = {
      currentNode: currentConfigTemp,
      customNodeList: list,
      nodeConfigVersion: NET_CONFIG_VERSION,
    };

    await extSaveLocal(NET_WORK_CONFIG_V2, newConfig);
    dispatch(updateCustomNodeList(newConfig.customNodeList));
    if (isDeleteCurrentNode) {
      clearLocalCache();
      dispatch(updateCurrentNode(newConfig.currentNode));
      dispatch(updateShouldRequest(true));
      dispatch(updateStakingRefresh(true));
      sendNetworkChangeMsg(newConfig.currentNode);
    }
    setReminderModalStatus(false);
    history.goBack();
  }, [currentNode, customNodeList, editItem]);

  return (
    <CustomView
      title={title}
      contentClassName={styles.contentClassName}
      rightComponent={
        showDeleteBtn && (
          <p className={styles.deleteBtn} onClick={onClickDelete}>
            {i18n.t("deleteTag")}
          </p>
        )
      }
    >
      <div className={styles.addTipContainer}>
        <span className={styles.addTip}>{i18n.t("addNetworkTip")}</span>
      </div>
      <div className={styles.inputContainer}>
        <Input
          label={i18n.t("nodeName")}
          onChange={onInputNodeName}
          value={nodeName}
          inputType={"text"}
          className={styles.nameInput}
          showBottomTip={true}
        />
        <TextArea
          label={i18n.t("nodeAddress")}
          onChange={onInputNodeAddress}
          value={nodeAddressValue}
          className={styles.addressInput}
          showBottomTip={true}
          bottomErrorTip={errorTip}
        />
      </div>
      <div className={styles.hold} />
      <div className={styles.bottomContainer}>
        <Button
          disable={!btnStatus}
          loading={btnLoadingStatus}
          onClick={onAddNode}
        >
          {i18n.t("confirm")}
        </Button>
      </div>
      <PopupModal
        title={i18n.t("deleteNode")}
        leftBtnContent={i18n.t("cancel")}
        onLeftBtnClick={onCancel}
        rightBtnContent={i18n.t("deleteTag")}
        onRightBtnClick={onConfirmDelete}
        rightBtnStyle={styles.modalDelete}
        modalVisible={reminderModalStatus}
      />
    </CustomView>
  );
};

export default NodeEditor;
