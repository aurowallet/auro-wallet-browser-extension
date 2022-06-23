import cx from "classnames";
import React from "react";
import { connect } from "react-redux";
import { MAIN_NET_BASE_CONFIG, NET_CONFIG_VERSION, QA_NET_BASE_CONFIG, TEST_NET_BASE_CONFIG, UNKNOWN_NET_BASE_CONFIG } from "../../../../config";
import select_account_no from "../../../assets/images/select_account_no.png";
import select_account_ok from "../../../assets/images/select_account_ok.png";
import { getNetworkList, getNodeChainId } from "../../../background/api";
import { getLocal, removeLocal, saveLocal } from "../../../background/localStorage";
import { LOCAL_CACHE_KEYS, NETWORK_ID_AND_TYPE, NET_WORK_CONFIG } from "../../../constant/storageKey";
import { getLanguage } from "../../../i18n";
import { updateShouldRequest, updateStakingRefresh } from "../../../reducers/accountReducer";
import { NET_CONFIG_ADD, NET_CONFIG_DEFAULT, updateNetConfig } from "../../../reducers/network";
import { sendNetworkChangeMsg, trimSpace, urlValid } from "../../../utils/utils";
import Button, { BUTTON_TYPE_CANCEL } from "../../component/Button";
import ConfirmModal from "../../component/ConfirmModal";
import CustomInput from "../../component/CustomInput";
import CustomView from "../../component/CustomView";
import Loading from "../../component/Loading";
import TestModal from "../../component/TestModal";
import Toast from "../../component/Toast";
import "./index.scss";


import deleteIcon from "../../../assets/images/deleteIcon.svg";
import editIcon from "../../../assets/images/editIcon.svg";

const MODAL_TYPE = { 
    "ADD": "ADD",
    "UPDATE": "UPDATE"
}
class NetworkPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            netConfigList: props.netConfig.netList,
            currentConfig: props.netConfig.currentConfig,
            netUrl: "",
            nodeName: "",
            editMode: false,
            testModalType: MODAL_TYPE.ADD,
            editItem: {},
            btnClick: false,
            networkList: []
        };
        this.modal = React.createRef();
        this.isUnMounted = false;
    }
    componentDidMount() {
        this.fetchData()
    }
    fetchData = async () => {
        let network = await getNetworkList()
        if (network.length <= 0) {
            let listJson = getLocal(NETWORK_ID_AND_TYPE)
            let list = JSON.parse(listJson)
            if (list.length > 0) {
                network = list
            }
        }
        this.callSetState({
            networkList: network
        })
    }
    componentWillUnmount() {
        this.isUnMounted = true;
    }
    callSetState = (data, callback) => {
        if (!this.isUnMounted) {
            this.setState({
                ...data
            }, () => {
                callback && callback()
            })
        }
    }
    onSelect = (netItem) => {
        if (this.state.editMode) {
            return
        }
        this.callSetState({
            currentConfig: netItem
        }, () => {
            this.updateLocalConfig()
        })
    }
    updateLocalConfig = () => {
        let config = {
            netList: this.state.netConfigList,
            currentConfig: this.state.currentConfig,
            netConfigVersion: NET_CONFIG_VERSION
        }
        saveLocal(NET_WORK_CONFIG, JSON.stringify(config))

        this.clearLocalCache()
        this.props.updateNetConfig(config)
        this.props.updateShouldRequest(true)
        this.props.updateStakingRefresh(true)
        sendNetworkChangeMsg(config.currentConfig)
    }
    clearLocalCache = () => {
        let localCacheKeys = Object.keys(LOCAL_CACHE_KEYS)
        for (let index = 0; index < localCacheKeys.length; index++) {
            const keys = localCacheKeys[index];
            let localKey = LOCAL_CACHE_KEYS[keys]
            removeLocal(localKey)
        }
    }
    onConfirmDelete = (netItem) => {
        let currentConfig = this.state.currentConfig
        let list = this.state.netConfigList
        if (netItem.url === currentConfig.url) {
            currentConfig = list[0]
        }
        list = list.filter((item, index) => {
            return item.url !== netItem.url
        })
        ConfirmModal.hide()
        this.callSetState({
            netConfigList: list,
            currentConfig: currentConfig
        }, () => {
            this.updateLocalConfig()
            Toast.info(getLanguage('deleteSuccess'))
        })
    }

    onDelete = (netItem, index) => {
        let title = getLanguage('prompt')
        let content = getLanguage("confirmDeleteNode")
        let cancelText = getLanguage('cancel')
        let confirmText = getLanguage('confirm')
        ConfirmModal.show({
            title, content, cancelText, confirmText,
            onConfirm: () => {
                this.onConfirmDelete(netItem)
            },
        })
    }
    renderItemRight = (netItem, imgUrl) => {
        let { type } = netItem
        let isDefault = type === NET_CONFIG_DEFAULT
        if (isDefault) {
            return (<div className={"network-item-img-container"}>
                {this.state.editMode ? <></> : <img onClick={() => this.onSelect(netItem)} className={"lang-option-img click-cursor"} src={imgUrl} />}
            </div>)
        } else {
            return (
                <div className={"network-item-img-container"}>
                    {this.state.editMode ? <>
                        <div className="baseIconContainer editIconContainer click-cursor" onClick={() => this.onEdit(netItem)} >
                            <img className={"networkEditContent"} src={editIcon} />
                        </div>
                        <div className="baseIconContainer deleteIconContainer click-cursor" onClick={() => this.onDelete(netItem)} >
                            <img className={"networkEditContent"} src={deleteIcon} />
                        </div>
                    </> : <img onClick={() => this.onSelect(netItem)} className={"lang-option-img click-cursor"} src={imgUrl} />}
                </div>)
        }
    }
    renderItem = (netItem, index, showNetType) => {
        let { url, name, netType } = netItem
        let imgUrl = this.state.currentConfig.url === url ? select_account_ok : select_account_no
        return (
            <div onClick={() => this.onSelect(netItem, true)} key={index + ""}
                className={cx("network-item-container",{
                    "click-cursor":!this.state.editMode
                })}>
                <div className={"networkItemLeftCon"}>
                    <p className={"networkItemTitle"}>{name}
                        {showNetType && <span className={"networkItemType"}>{netType}</span>}
                    </p>
                    <p className={"network-item-content"}>{url}</p>
                </div>
                {this.renderItemRight(netItem, imgUrl)}
            </div>
        )
    }
    renderBottonBtn = () => {
        if (this.state.editMode) {
            return <></>
        }
        return (
            <div className="bottom-container">
                <Button
                    content={getLanguage('addNetWork')}
                    onClick={this.onAdd}
                />
            </div>
        )
    }
    isExist = (url) => {
        let list = this.state.netConfigList
        let sameIndex = -1
        for (let index = 0; index < list.length; index++) {
            const net = list[index];
            if (net.url === url) {
                sameIndex = index
                break
            }
        }
        return sameIndex
    }
    checkGqlHealth = async (url) => {
        const { networkList } = this.state
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
        let config = {}
        switch (networkConfig.type) {
            case "0":
                config = MAIN_NET_BASE_CONFIG
                break;
            case "1":
                config = TEST_NET_BASE_CONFIG
                break;
            case "11":
            default:
                config = QA_NET_BASE_CONFIG
                break;
        }
        return { chainId, config }
    }
    baseConfigCheck = async () => {
        let urlInput = trimSpace(this.state.netUrl)
        let nameInput = trimSpace(this.state.nodeName)
        if (!urlValid(urlInput)) {
            Toast.info(getLanguage("urlError_1"))
            return false
        }
        if (nameInput.length === 0) {
            Toast.info(getLanguage('noNetworkNameTip'))
            return
        }
        let existIndex = this.isExist(urlInput)

        if (existIndex !== -1) {
            if (this.state.testModalType === MODAL_TYPE.UPDATE) {
                let existConfig = this.state.netConfigList[existIndex]
                if (existConfig.id !== this.state.editItem.id) {
                    Toast.info(getLanguage('urlError_2'))
                    return false
                }
            } else {
                Toast.info(getLanguage('urlError_2'))
                return false
            }
        }
        Loading.show()
        let chainConfig = await this.checkGqlHealth(urlInput)
        Loading.hide()
        if (!chainConfig.chainId) {
            Toast.info(getLanguage('urlError_1'))
            return false
        }
        return { urlInput, nameInput, config: chainConfig.config }
    }

    onEdit = (netItem) => {
        this.callSetState({
            netUrl: netItem.url,
            nodeName: netItem.name,
            editItem: netItem,
            testModalType: MODAL_TYPE.UPDATE
        }, () => {
            this.modal.current.setModalVisable(true)
        })
    }
    onEditConfirm = async () => {
        let baseCheck = await this.baseConfigCheck()
        if (!baseCheck) {
            return
        }
        const { urlInput, nameInput, config } = baseCheck
        this.onCloseModal()
        let currentEditItem = this.state.editItem
        let currentConfig = { ...this.state.currentConfig }
        if (currentEditItem.id === currentConfig.url) {
            currentConfig.url = urlInput
            currentConfig.name = nameInput
            currentConfig.netType = config.netType
        }
        let editItem = {
            ...config,
            name: nameInput,
            url: urlInput,
            id: urlInput,
            type: NET_CONFIG_ADD,
        }
        let list = [...this.state.netConfigList];
        let newList = list.map((item) => {
            if (item.id === currentEditItem.id) {
                return editItem
            } else {
                return item
            }
        })
        this.callSetState({
            netConfigList: newList,
            currentConfig: currentConfig,
            netUrl: "",
            nodeName: ""
        }, () => {
            Toast.info(getLanguage('updateSuccess'))
            this.updateLocalConfig()
        })
    }
    onAddNetConfig = async () => {
        let baseCheck = await this.baseConfigCheck()
        if (!baseCheck) {
            return
        }
        const { urlInput, nameInput, config } = baseCheck
        setTimeout(() => {
            this.onCloseModal()
            Toast.info(getLanguage('addSuccess'))
            let addItem = {
                ...config,
                name: nameInput,
                url: urlInput,
                id: urlInput,
                type: NET_CONFIG_ADD,
            }
            let list = [...this.state.netConfigList];
            list.push(addItem)
            this.callSetState({
                netConfigList: list,
                currentConfig: addItem,
                netUrl: "",
                nodeName: ""
            }, () => {
                this.updateLocalConfig()
            })
        }, 350);
    }
    onModalClick = () => {
        if (this.state.testModalType === MODAL_TYPE.ADD) {
            this.onAddNetConfig()
        } else if (this.state.testModalType === MODAL_TYPE.UPDATE) {
            this.onEditConfirm()
        }
    }
    setBtnStatus = () => {
        let nodeName = this.state.nodeName
        nodeName = trimSpace(nodeName)

        let netUrl = this.state.netUrl
        netUrl = trimSpace(netUrl)
        let canClick = false
        if (nodeName.length > 0 && netUrl.length > 0) {
            canClick = true
        }
        this.callSetState({
            btnClick: canClick
        })
    }
    renderActionBtn = () => {
        let confirmContent = getLanguage('confirm_1')
        return (
            <div className={"networkBtnContainer"}>
                <Button
                    content={confirmContent}
                    onClick={this.onModalClick}
                    propsClass={'modal-button-width'}
                    type={"submit"}
                    disabled={!this.state.btnClick}
                />
                <Button
                    buttonType={BUTTON_TYPE_CANCEL}
                    content={getLanguage('cancel')}
                    onClick={this.onCloseModal}
                    propsClass={'modal-button-width'}
                />
            </div>)
    }
    onUrltInput = (e) => {
        this.callSetState({
            netUrl: e.target.value
        }, () => {
            this.setBtnStatus()
        })
    }
    onNameInput = (e) => {
        this.callSetState({
            nodeName: e.target.value
        }, () => {
            this.setBtnStatus()
        })
    }
    renderInput = () => {
        return (
            <div className="networkInputWrapper">
                <p className={"addNetworkTip"}>{getLanguage('addNetworkTip')}</p>
                <CustomInput
                    value={this.state.nodeName}
                    placeholder={getLanguage('addressName')}
                    onTextInput={this.onNameInput}
                />
                <div className={'networkTextArea'}>
                    <textarea
                        className={"networkAreaInput"}
                        placeholder={getLanguage('address')}
                        value={this.state.netUrl}
                        onChange={this.onUrltInput} />
                </div>
            </div>)
    }
    onAdd = (e) => {
        this.callSetState({
            editMode: false,
            testModalType: MODAL_TYPE.ADD
        }, () => {
            this.modal.current.setModalVisable(true)
        })
    }
    onCloseModal = () => {
        if (this.state.testModalType === MODAL_TYPE.ADD) {
            this.modal.current.setModalVisable(false)
        } else {
            this.callSetState({
                netUrl: "",
                nodeName: "",
            }, () => {
                this.modal.current.setModalVisable(false)
            })
        }
    }
    renderChangeModal = () => {
        return (<TestModal
            ref={this.modal}
            touchToClose={true}
            title={getLanguage('addNetWork')}
        >
            {this.renderInput()}
            {this.renderActionBtn()}
        </TestModal>)
    }
    renderDefaultNet = () => {
        let list = this.state.netConfigList.filter((item) => item.type === NET_CONFIG_DEFAULT)

        if (list.length <= 0) {
            return <div />
        }
        return (
            <div>
                <p className={"network-title"}>{getLanguage("defaultNetwork")}</p>
                {list.map((item, index) => {
                    return this.renderItem(item, index)
                })}
            </div>
        )
    }
    renderCustomtNet = () => {
        let list = this.state.netConfigList.filter((item) => item.type !== NET_CONFIG_DEFAULT)
        if (list.length <= 0) {
            return <div />
        }
        return (
            <div className={"network-item-diff"}>
                <p className={"network-title"}>{getLanguage('customNetwork')}</p>
                {list.map((item, index) => {
                    return this.renderItem(item, index, true)
                })}
            </div>
        )
    }
    onSubmit = (event) => {
        event.preventDefault();
    }
    onClickEdit = () => {
        this.callSetState({
            editMode: !this.state.editMode
        })
    }
    renderEditBtn = () => {
        let content = this.state.editMode ? getLanguage('over') : getLanguage('edit')
        return (
            <div onClick={this.onClickEdit} className={"networkEditcontainer click-cursor"}>
                <p className={cx("networkEdit", this.state.editMode ? "networkEditing" : "networkEditCommon")}>{content}</p>
            </div>)
    }
    render() {
        return (
            <CustomView
                title={getLanguage('networkConfig')}
                history={this.props.history}
                rightComponent={this.renderEditBtn()}>
                <div className={"network-container"}>
                    {this.renderDefaultNet()}
                    {this.renderCustomtNet()}
                </div>
                {this.renderBottonBtn()}
                <form onSubmit={this.onSubmit}
                >
                    {this.renderChangeModal()}
                </form>
            </CustomView>)
    }
}

const mapStateToProps = (state) => ({
    netConfig: state.network,
});

function mapDispatchToProps(dispatch) {
    return {
        updateNetConfig: (config) => {
            dispatch(updateNetConfig(config))
        },
        updateShouldRequest: (shouldRefresh) => {
            dispatch(updateShouldRequest(shouldRefresh))
        },
        updateStakingRefresh: (shouldRefresh) => {
            dispatch(updateStakingRefresh(shouldRefresh))
        },
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(NetworkPage);
