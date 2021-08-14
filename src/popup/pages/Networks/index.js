import cx from "classnames";
import React from "react";
import { connect } from "react-redux";
import networkDeleteHover from "../../../assets/images/networkDeleteHover.png";
import select_account_no from "../../../assets/images/select_account_no.png";
import select_account_ok from "../../../assets/images/select_account_ok.png";
import { getNodeVersion } from "../../../background/api";
import { saveLocal } from "../../../background/localStorage";
import { NET_WORK_CONFIG } from "../../../constant/storageKey";
import { getLanguage } from "../../../i18n";
import { updateShouldRequest } from "../../../reducers/accountReducer";
import { NET_CONFIG_ADD, NET_CONFIG_DEFAULT, updateCurrentNetwork, updateNetConfig } from "../../../reducers/network";
import { trimSpace, urlValid } from "../../../utils/utils";
import Button, { BUTTON_TYPE_CANCEL } from "../../component/Button";
import ConfirmModal from "../../component/ConfirmModal";
import CustomInput from "../../component/CustomInput";
import CustomView from "../../component/CustomView";
import Loading from "../../component/Loading";
import TestModal from "../../component/TestModal";
import Toast from "../../component/Toast";
import "./index.scss";

class NetworkPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            netConfigList: [],
            currentUrl: "",
            netUrl: "",
            itemFocusUrl: -1
        };
        this.modal = React.createRef();
        this.isUnMounted = false;
    }
    componentDidMount() {
        let config = this.props.netConfig
        this.callSetState({
            netConfigList: config.netList,
            currentUrl: config.currentUrl,
        })
    }
    componentWillUnmount(){
        this.isUnMounted = true;
      }
      callSetState=(data,callback)=>{
        if(!this.isUnMounted){
          this.setState({
            ...data
          },()=>{
            callback&&callback()
          })
        }
      }
    onSelect = (netItem) => {
        this.props.updateCurrentNetwork(netItem.url, netItem.type)
        this.callSetState({
            currentUrl: netItem.url
        }, () => {
            this.updateLocalConfig()
        })
    }
    updateLocalConfig = () => {
        let config = {
            netList: this.state.netConfigList,
            currentUrl: this.state.currentUrl
        }
        saveLocal(NET_WORK_CONFIG, JSON.stringify(config))
        this.props.updateNetConfig(config)
        this.props.updateShouldRequest(true)
    }

    onConfirmDelete = (netItem) => {
        let nowUrl = this.state.currentUrl
        let list = this.state.netConfigList
        if (netItem.url === this.state.currentUrl) {
            nowUrl = list[0].url
            this.props.updateCurrentNetwork(list[0].url, list[0].type)
        }
        list = list.filter((item, index) => {
            return item.url !== netItem.url
        })
        ConfirmModal.hide()
        this.callSetState({
            netConfigList: list,
            currentUrl: nowUrl
        }, () => {
            this.updateLocalConfig()
            Toast.info(getLanguage('deleteSuccess'))
        })
    }
    onCancel = () => {
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
            onCancel: this.onCancel,
        })

    }
    onMouseEnter = (url) => {
        this.callSetState({
            itemFocusUrl: url
        })
    }
    onMouseLeave = () => {
        this.callSetState({
            itemFocusUrl: -1
        })
    }
    renderItem = (netItem, index) => {
        let { url, type } = netItem
        let imgUrl = this.state.currentUrl === url ? select_account_ok : select_account_no
        let isDefault = type === NET_CONFIG_DEFAULT
        return (
            <div onClick={() => this.onSelect(netItem, index)} key={index + ""}
                onMouseEnter={() => this.onMouseEnter(url)}
                onMouseLeave={() => this.onMouseLeave(url)}
                className={"network-item-container click-cursor"}>
                {isDefault && <p className={"network-type"}>Mainnet</p>}
                <p className={"network-item-content"}>{url}</p>
                <div className={"network-item-img-container"}>
                    <img onClick={() => this.onSelect(netItem, index)} className={"lang-option-img click-cursor"} src={imgUrl} />
                    <img onClick={() => this.onDelete(netItem, index)} className={
                        cx({
                            "click-cursor": true,
                            "network-delete-container-none": isDefault || this.state.itemFocusUrl !== url,
                            "network-delete-container": !isDefault && this.state.itemFocusUrl === url
                        })
                    } src={networkDeleteHover} />
                </div>
            </div>
        )
    }
    renderBottonBtn = () => {
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
        for (let index = 0; index < list.length; index++) {
            const net = list[index];
            if (net.url === url) {
                return true
            }
        }
        return false
    }
    checkGqlHealth= async(url)=>{
        let version = await getNodeVersion(url)
        if(!version.error){
            return true
        }
        return false
    }
    onAddNetConfig = async () => {
        let urlInput = trimSpace(this.state.netUrl)
        if (!urlValid(urlInput)) {
            Toast.info(getLanguage("urlError_1"))
            return
        }
        if (this.isExist(urlInput)) {
            Toast.info(getLanguage('urlError_2'))
            return
        }
        Loading.show()
        let health = await this.checkGqlHealth(urlInput)
        Loading.hide()
        if(!health){
            Toast.info(getLanguage('urlError_1'))
            return
        }
        setTimeout(() => {
            this.onCloseModal()
            let addItem = {
                url: urlInput,
                type: NET_CONFIG_ADD
            }
            let list = [...this.state.netConfigList];
            list.push(addItem)
            this.callSetState({
                netConfigList: list,
                currentUrl: addItem.url,
                netUrl: "",
            }, () => {
                this.props.updateCurrentNetwork(addItem.url, addItem.type)
                this.updateLocalConfig()
            })
        }, 350);
    }
    renderActionBtn = () => {
        return (
            <div className={"account-info-btn-container"}>
                <Button
                    content={getLanguage('confirm_1')}
                    onClick={this.onAddNetConfig}
                    propsClass={'modal-button-width'}
                    type={"submit"}
                />
                <Button
                    buttonType={BUTTON_TYPE_CANCEL}
                    content={getLanguage('cancel')}
                    onClick={this.onCloseModal}
                    propsClass={'modal-button-width'}
                />
            </div>)
    }
    onTextInput = (e) => {
        this.callSetState({
            netUrl: e.target.value
        })
    }
    renderInput = () => {
        return (
            <div className="change-input-wrapper">
                <CustomInput
                    value={this.state.netUrl}
                    onTextInput={this.onTextInput}
                />
                {/* <img onClick={this.onCloseModal} className="modal-close click-cursor" src={modalClose} /> */}
            </div>)
    }
    onAdd = (e) => {
        this.modal.current.setModalVisable(true)
    }
    onCloseModal = () => {
        this.modal.current.setModalVisable(false)
    }
    renderChangeModal = () => {
        return (<TestModal
            ref={this.modal}
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
                    return this.renderItem(item, index)
                })}
            </div>
        )
    }
    onSubmit = (event) => {
        event.preventDefault();
    }
    render() {
        return (
            <CustomView
                title={getLanguage('networkConfig')}
                history={this.props.history}>
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
        updateCurrentNetwork: (url, type) => {
            dispatch(updateCurrentNetwork(url, type))
        },
        updateNetConfig: (config) => {
            dispatch(updateNetConfig(config))
        },updateShouldRequest: (shouldRefresh) => {
            dispatch(updateShouldRequest(shouldRefresh))
          },
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(NetworkPage);
