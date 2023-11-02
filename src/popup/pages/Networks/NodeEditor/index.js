import i18n from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from 'react-router-dom';
import { NET_CONFIG_VERSION } from "../../../../../config";
import { getNetworkList, getNodeChainId } from "../../../../background/api";
import { extSaveLocal } from "../../../../background/extensionStorage";
import { getLocal, removeLocal } from "../../../../background/localStorage";
import { LOCAL_CACHE_KEYS, NET_WORK_CONFIG } from "../../../../constant/storageKey";
import { BASE_unknown_config, NET_CONFIG_MAP } from "../../../../constant/network";
import { updateShouldRequest, updateStakingRefresh } from "../../../../reducers/accountReducer";
import { NET_CONFIG_ADD, updateNetChainIdConfig, updateNetConfig } from "../../../../reducers/network";
import { checkNetworkUrlExist, sendNetworkChangeMsg, trimSpace, urlValid } from "../../../../utils/utils";
import Button from "../../../component/Button";
import CustomView from "../../../component/CustomView";
import Input from "../../../component/Input";
import { PopupModal } from "../../../component/PopupModal";
import TextArea from "../../../component/TextArea";
import styles from "./index.module.scss";

export const NodeEditorType = {
    add: "add",
    edit: "edit"
}

const NodeEditor = ({ }) => { 


    const history = useHistory()
    const dispatch = useDispatch()
    const netConfigList = useSelector(state => state.network.netList)
    const currentConfig = useSelector(state => state.network.currentConfig)


    const [btnStatus, setBtnStatus] = useState(false)
    const [btnLoadingStatus,setBtnLoadingStatus] = useState(false)
    const [errorTip, setErrorTip] = useState('')
    const [networkList, setNetworkList] = useState([])

    const {
        editorType, editIndex, editItem
    } = useMemo(() => {
        let editorType = history.location?.params?.editorType ?? "";
        let editIndex = history.location?.params?.editIndex ?? "";
        let editItem = history.location?.params?.editItem ?? "";
        return {
            editorType, editIndex, editItem
        }
    }, [history])

    const [nodeName, setNodeName] = useState(() => {
        if (editorType === NodeEditorType.edit) {
            return editItem.name || ''
        } else {
            return ""
        }
    })
    const [nodeAddressValue, setNodeAddressValue] = useState(() => {
        if (editorType === NodeEditorType.edit) {
            return editItem.url || ''
        } else {
            return ""
        }
    })
    const fetchData = useCallback(async () => {
        let network = await getNetworkList()
        if(Array.isArray(network) &&  network.length>0){
            dispatch(updateNetChainIdConfig(network)) 
          }
        if (network.length <= 0) {
            let listJson = getLocal(NETWORK_ID_AND_TYPE)
            let list = JSON.parse(listJson)
            if (list.length > 0) {
                network = list
            }
        }
        setNetworkList(network)
    }, [])

    useEffect(() => {
        fetchData()
    }, [])


    const {
        title,showDeleteBtn
    } = useMemo(() => {

        let showDeleteBtn = true
        let title = i18n.t("editNode")
        if (editorType === NodeEditorType.add) {
            title = i18n.t('addNode')
            showDeleteBtn = false
        }
        
        return {
            title,showDeleteBtn
        }
    }, [editorType,i18n])

    const checkGqlHealth = (async (url) => {
        let chainData = await getNodeChainId(url)
        let chainId = chainData?.daemonStatus?.chainId || ""
        let networkConfig = {}
        for (let index = 0; index < networkList.length; index++) {
            const network = networkList[index];
            if (network.chain_id === chainId) {
                networkConfig = network
                break
            }
        }
        let config
        Object.keys(NET_CONFIG_MAP).forEach((key)=>{
            const item = NET_CONFIG_MAP[key]
            if(item.type_id === networkConfig.type){
                config = item.config
            }
        })
        if(!config){
            config = BASE_unknown_config
        }
        return { chainId, config }
    })

    const baseConfigCheck = useCallback(async () => {
        let urlInput = trimSpace(nodeAddressValue)
        let nameInput = trimSpace(nodeName)
        if (!urlValid(urlInput)) {
            setErrorTip(i18n.t("incorrectNodeAddress"))
            return {}
        }


        let exist = checkNetworkUrlExist(netConfigList,urlInput)////checkExist(urlInput) 
        if (exist.index !== -1) {
            if (editorType === NodeEditorType.add) {
                setErrorTip(i18n.t('nodeAddressExists'))
                return {}
            } else {
                if (exist.config.id !== editItem.id) {
                    Toast.info(i18n.t('nodeAddressExists'))
                    return {}
                }
            }
        }
        setBtnLoadingStatus(true)
        let chainConfig = await checkGqlHealth(urlInput)
        setBtnLoadingStatus(false)
        if (!chainConfig.chainId) {
            setErrorTip(i18n.t('incorrectNodeAddress'))
            return {}
        }
        return { urlInput, nameInput, config: chainConfig.config,chainId:chainConfig.chainId }
    }, [nodeAddressValue, nodeName, editItem, netConfigList])

    const clearLocalCache = useCallback(() => {
        let localCacheKeys = Object.keys(LOCAL_CACHE_KEYS)
        for (let index = 0; index < localCacheKeys.length; index++) {
            const keys = localCacheKeys[index];
            let localKey = LOCAL_CACHE_KEYS[keys]
            removeLocal(localKey)
        }
    }, [])

    const onAddNode = useCallback(async () => {
        let baseCheck = await baseConfigCheck()
        if (!baseCheck.urlInput) {
            return
        }
        const { urlInput, nameInput, config,chainId } = baseCheck

        let newConfig = {}
        if (editorType === NodeEditorType.add) {
            let addItem = {
                ...config,
                name: nameInput,
                url: urlInput,
                id: urlInput,
                type: NET_CONFIG_ADD,
                chainId
            }
            let list = [...netConfigList];
            list.push(addItem)


            newConfig = {
                netList: list,
                currentConfig: addItem,
                netConfigVersion: NET_CONFIG_VERSION
            }

        } else if (editorType === NodeEditorType.edit) {
            let currentEditItem = editItem
            let currentConfigTemp = { ...currentConfig }
            if (currentEditItem.id === currentConfig.url) {
                currentConfigTemp.url = urlInput
                currentConfigTemp.name = nameInput
                currentConfigTemp.netType = config.netType
            }
            let editItemTemp = {
                ...config,
                name: nameInput,
                url: urlInput,
                id: urlInput,
                type: NET_CONFIG_ADD,
                chainId,
            }
            let list = [...netConfigList];
            let newList = list.map((item) => {
                if (item.id === currentEditItem.id) {
                    return editItemTemp
                } else {
                    return item
                }
            })

            newConfig = {
                netList: newList,
                currentConfig: currentConfigTemp,
                netConfigVersion: NET_CONFIG_VERSION
            }
        }

        await extSaveLocal(NET_WORK_CONFIG, newConfig)

        clearLocalCache()

        dispatch(updateNetConfig(newConfig))
        dispatch(updateShouldRequest(true))
        dispatch(updateStakingRefresh(true))

        sendNetworkChangeMsg(newConfig.currentConfig)

        setTimeout(() => {
            history.goBack()
        }, 50);

    }, [nodeAddressValue, nodeName, editIndex,
        baseConfigCheck, netConfigList, editItem, currentConfig])


    const onInputNodeName = useCallback((e) => {
        setNodeName(e.target.value)
    }, [])


    const onInputNodeAddress = useCallback((e) => {
        setNodeAddressValue(e.target.value)
        setErrorTip("")
    }, [])




    useEffect(() => {
        if (nodeName.trim().length > 0 && nodeAddressValue.trim().length > 0) {
            setBtnStatus(true)
        } else {
            setBtnStatus(false)
        }
    }, [nodeAddressValue, nodeName])
 
    const [reminderModalStatus, setReminderModalStatus] = useState(false)
    const onClickDelete = useCallback(()=>{
        setReminderModalStatus(true)
    },[])


    const onCancel = useCallback(() => {
        setReminderModalStatus(false)
    }, [])

    const onConfirmDelete = useCallback(async () => {
        let currentConfigTemp = currentConfig
        let list = netConfigList
        if (editItem.url === currentConfigTemp.url) {
            currentConfigTemp = list[0]
        }
        list = list.filter((item, index) => {
            return item.url !== editItem.url
        })

        let newConfig = {
            netList: list,
            currentConfig: currentConfigTemp,
            netConfigVersion: NET_CONFIG_VERSION
        }

        await extSaveLocal(NET_WORK_CONFIG, newConfig)
        clearLocalCache()
        dispatch(updateNetConfig(newConfig))
        dispatch(updateShouldRequest(true))
        dispatch(updateStakingRefresh(true))
        sendNetworkChangeMsg(newConfig.currentConfig)
        setReminderModalStatus(false)
        history.goBack()

    }, [currentConfig,netConfigList,editItem])

    return (<CustomView 
        title={title} 
        contentClassName={styles.contentClassName}
        rightComponent={
            showDeleteBtn && <p className={styles.deleteBtn}
                onClick={onClickDelete}>
                {i18n.t('delete')}
            </p>
        }>
        <div className={styles.addTipContainer}>
            <span className={styles.addTip}>
                {i18n.t('addNetworkTip')}
            </span>
        </div>
        <div className={styles.inputContainer}>
            <Input
                label={i18n.t('name')}
                onChange={onInputNodeName}
                value={nodeName}
                inputType={'text'}
                className={styles.nameInput}
                showBottomTip={true}
            />
            <TextArea
                label={i18n.t('nodeAddress')}
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
                onClick={onAddNode}>
                {i18n.t('confirm')}
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

    </CustomView>)
}

export default NodeEditor
