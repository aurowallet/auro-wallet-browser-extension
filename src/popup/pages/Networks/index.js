import cls from "classnames";
import { useCallback, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { NET_CONFIG_VERSION } from "../../../../config";
import { removeLocal, saveLocal } from "../../../background/localStorage";
import { LOCAL_CACHE_KEYS, NET_WORK_CONFIG } from "../../../constant/storageKey";
import { updateShouldRequest, updateStakingRefresh } from "../../../reducers/accountReducer";
import { NET_CONFIG_ADD, NET_CONFIG_DEFAULT, updateNetConfig } from "../../../reducers/network";
import { sendNetworkChangeMsg } from "../../../utils/utils";

import i18n from "i18next";
import { useHistory } from 'react-router-dom';
import Button from "../../component/Button";
import CustomView from "../../component/CustomView";
import styles from "./index.module.scss";


import { PopupModal } from "../../component/PopupModal";
import { NodeEditorType } from "./NodeEditor";


const NetworkPage = ({ }) => {

    const netConfigList = useSelector(state => state.network.netList)
    const currentConfig = useSelector(state => state.network.currentConfig)

    const [reminderModalStatus, setReminderModalStatus] = useState(false)
    const [editMode, setEditMode] = useState(false)

    const dispatch = useDispatch()
    const history = useHistory()

    const { nodeList, } = useMemo(() => {

        let defaultList = []
        let customList = []
        netConfigList.map((item) => {
            if (item.type === NET_CONFIG_DEFAULT) {
                defaultList.push(item)
            } else {
                customList.push(item)
            }
        })


        let nodeList = [
            {
                title: i18n.t('defaultNode'),
                type: NET_CONFIG_DEFAULT,
                list: defaultList
            },
            {
                title: i18n.t('costomNode'),
                type: NET_CONFIG_ADD,
                list: customList
            }
        ]


        return {
            nodeList,
        }
    }, [netConfigList, i18n])

    const {
        rightBtcContent
    } = useMemo(() => {
        let rightBtcContent = editMode ? i18n.t('done') : i18n.t('edit')
        return {
            rightBtcContent
        }
    }, [i18n, editMode])


    const onClickEdit = useCallback(() => {
        setEditMode(state => !state)
    }, [editMode])

    const onAddNode = useCallback(() => {
        history.push({
            pathname: "node_editor",
            params: { editorType: NodeEditorType.add }
        })
    }, [])
    const clearLocalCache = useCallback(() => {
        let localCacheKeys = Object.keys(LOCAL_CACHE_KEYS)
        for (let index = 0; index < localCacheKeys.length; index++) {
            const keys = localCacheKeys[index];
            let localKey = LOCAL_CACHE_KEYS[keys]
            removeLocal(localKey)
        }
    }, [])

    const onClickRow = useCallback((nodeItem) => {
        if (editMode) {
            return
        }
        let config = {
            netList: netConfigList,
            currentConfig: nodeItem,
            netConfigVersion: NET_CONFIG_VERSION
        }
        saveLocal(NET_WORK_CONFIG, JSON.stringify(config))
        clearLocalCache()

        dispatch(updateNetConfig(config))
        dispatch(updateShouldRequest(true))
        dispatch(updateStakingRefresh(true))

        sendNetworkChangeMsg(config.currentConfig)
        history.goBack()

    }, [netConfigList, editMode])


    const [deleteItemTemp, setDeleteItemTemp] = useState({})
    const onDeleteNode = useCallback((nodeItem) => {
        setDeleteItemTemp(nodeItem)
        setReminderModalStatus(true)
    }, [netConfigList])

    const onEditItem = useCallback((nodeItem) => {
        history.push({
            pathname: "node_editor",
            params: {
                editorType: NodeEditorType.edit,
                editItem: nodeItem
            }
        })
    }, [netConfigList])

    const onConfirmDelete = useCallback(() => {

        let currentConfigTemp = currentConfig
        let list = netConfigList
        if (deleteItemTemp.url === currentConfigTemp.url) {
            currentConfigTemp = list[0]
        }
        list = list.filter((item, index) => {
            return item.url !== deleteItemTemp.url
        })

        let newConfig = {
            netList: list,
            currentConfig: currentConfigTemp,
            netConfigVersion: NET_CONFIG_VERSION
        }


        saveLocal(NET_WORK_CONFIG, JSON.stringify(newConfig))

        clearLocalCache()

        dispatch(updateNetConfig(newConfig))
        dispatch(updateShouldRequest(true))
        dispatch(updateStakingRefresh(true))
        sendNetworkChangeMsg(newConfig.currentConfig)
        setReminderModalStatus(false)

    }, [deleteItemTemp, currentConfig, netConfigList, deleteItemTemp])

    const onCancel = useCallback(() => {
        setReminderModalStatus(false)
    }, [])

    return (
        <CustomView
            title={i18n.t('network')}
            contentClassName={styles.contentClassName}
            rightComponent={
                <p className={styles.editBtn}
                    onClick={onClickEdit}>
                    {rightBtcContent}
                </p>
            }>
            <div className={styles.innerContent}>
                {
                    nodeList.map((netNode, index) => {
                        if (netNode.list.length == 0) {
                            return <div key={index} />
                        }
                        let showNetType = netNode.type !== NET_CONFIG_DEFAULT
                        return (<div key={index}>
                            <p className={styles.nodeListTitle}>{netNode.title}</p>
                            {
                                netNode.list.map((nodeItem, j) => {
                                    let select = currentConfig.url === nodeItem.url
                                    return <div key={j} className={styles.rowContainer}>
                                        <div className={cls(styles.nodeItemContainer, {
                                            [styles.editMode]: editMode
                                        })} onClick={() => onClickRow(nodeItem)}>
                                            <div className={styles.rowleft}>
                                                <div className={styles.rowTopContainer}>
                                                    <p className={styles.nodeName}>{nodeItem.name}</p>
                                                    {showNetType && <div className={styles.nodeTypeContainer}>
                                                        <span className={styles.nodeType}>{nodeItem.netType}</span>
                                                    </div>}
                                                </div>
                                                <p className={styles.nodeUrl}>{nodeItem.url}</p>
                                            </div>
                                            {!editMode && <div className={styles.rowRight}>
                                                {select && <img src="/img/icon_checked.svg" className={styles.checkedIcon} />}
                                            </div>}
                                            {editMode && showNetType && <div className={styles.rowRight} onClick={() => onEditItem(nodeItem)}>
                                                <img src="/img/icon_edit.svg" className={styles.editIcon} />
                                            </div>}
                                        </div>
                                        {editMode && showNetType && <div className={styles.deleteIconContainer} onClick={() => onDeleteNode(nodeItem)}>
                                            <img src="/img/icon_delete.svg" className={styles.deleteIcon} />
                                        </div>}
                                    </div>
                                })
                            }
                        </div>)
                    })
                }
            </div>

            <div className={styles.bottomContainer}>
                <Button
                    onClick={onAddNode}>
                    {i18n.t('addNode')}
                </Button>
            </div>

            <PopupModal
                title={i18n.t('deleteNode')}
                leftBtnContent={i18n.t('cancel')}
                onLeftBtnClick={onCancel}
                rightBtnContent={i18n.t('delete')}
                onRightBtnClick={onConfirmDelete}
                rightBtnStyle={styles.modalDelete}
                modalVisable={reminderModalStatus} />
        </CustomView >
    )
}

export default NetworkPage