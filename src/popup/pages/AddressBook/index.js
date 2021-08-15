import cx from "classnames";
import React from "react";
import { connect } from "react-redux";
import networkDeleteHover from "../../../assets/images/networkDeleteHover.png";
import { getLocal, saveLocal } from "../../../background/localStorage";
import { ADDRESS_BOOK_CONFIG } from "../../../constant/storageKey";
import { getLanguage } from "../../../i18n";
import { updateAddressDetail } from "../../../reducers/cache";
import { nameLengthCheck, trimSpace } from "../../../utils/utils";
import { addressValid } from "../../../utils/validator";
import Button from "../../component/Button";
import ConfirmModal from "../../component/ConfirmModal";
import CustomInput from "../../component/CustomInput";
import CustomView from "../../component/CustomView";
import TestModal from "../../component/TestModal";
import Toast from "../../component/Toast";
import "./index.scss";
class AddressBook extends React.Component {
    constructor(props) {
        super(props);
        let nextRoute = props.location.params?.nextRoute ?? "";
        this.state = {
            addressList: [],
            nextRoute: nextRoute,
            address: "",
            addressName: "",
            currentClickIndex: -1,
            focusAddress: -1
        };
        this.modal = React.createRef();
        this.isUnMounted = false;
    }
    componentDidMount() {
        let list = getLocal(ADDRESS_BOOK_CONFIG)

        if (list) {
            list = JSON.parse(list)
        } else {
            list = []
        }
        this.callSetState({
            addressList: list
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

    onMouseEnter = (address) => {
        this.callSetState({
            focusAddress: address
        })
    }
    onMouseLeave = () => {
        this.callSetState({
            focusAddress: -1
        })
    }

    renderAddressList = () => {
        return this.state.addressList.map((item, index) => {
            return (
                <div key={index + ""}
                    onMouseEnter={() => this.onMouseEnter(item.address)}
                    onMouseLeave={() => this.onMouseLeave()}
                    onClick={() => { this.onClickItem(item, index) }}
                    className={"address-item-container click-cursor"}>
                    <div className={"address-item-top"}>
                        <p className={"address-item-name"}>{item.name}</p>
                        <img onClick={(event) => {
                            event.stopPropagation();
                            this.onDeleteConfirm(item)
                        }} className={
                            cx({
                                "click-cursor": true,
                                "network-delete-container-none": this.state.focusAddress !== item.address,
                                "network-delete-container": this.state.focusAddress === item.address
                            })
                        } src={networkDeleteHover} />

                    </div>
                    <p className={"address-item-address"}>{item.address}</p>
                </div>
            )
        })
    }
    onDeleteConfirm = (item) => {
        let title = getLanguage('prompt')
        let content = getLanguage("confirmDelete")
        let confirmText = getLanguage('onConfirm')
        let cancelText = getLanguage('cancel')
        ConfirmModal.show({
            title, content,
            confirmText,
            cancelText,
            showClose: true,
            onConfirm: () => this.onModalConfirm(item),
        })
    }
    onModalConfirm = (item) => {
        ConfirmModal.hide()
        this.onClickDelete(item)
    }
    onClickDelete = (item) => {
        let list = getLocal(ADDRESS_BOOK_CONFIG)
        if (list) {
            list = JSON.parse(list)
        } else {
            list = []
        }
        let address = item.address
        list = list.filter((innerItem, index) => {
            return innerItem.address.toLowerCase() !== address.toLowerCase()
        })
        saveLocal(ADDRESS_BOOK_CONFIG, JSON.stringify(list))
        Toast.info(getLanguage('deleteSuccess'))
        this.callSetState({
            addressList: list
        })


    }
    onClickItem = (item, index) => {
        const { addressBookFrom } = this.props
        if (addressBookFrom) {
            this.props.history.goBack()
            this.props.updateAddressDetail(item)
        } else {
            this.callSetState({
                address: item.address,
                addressName: item.name,
                currentClickIndex: index
            }, () => {
                this.onAddAddress()
            })
        }
    }
    goToAdd = () => {
        this.onAddAddress()
    }
    renderAddBtn = () => {
        return (
            <div className="bottom-container">
                <Button
                    content={getLanguage("onAdd")}
                    onClick={this.goToAdd}
                />
            </div>)
    }
    onCloseModal = () => {
        this.modal.current.setModalVisable(false)
        this.callSetState({
            address: "",
            addressName: "",
            currentClickIndex: -1
        })
    }
    onSetModalVisable = (visable) => {
        if (!visable) {
            this.callSetState({
                address: "",
                addressName: "",
                currentClickIndex: -1
            })
        }

    }
    onAddAddress = (e) => {
        this.modal.current.setModalVisable(true)
    }
    onConfirm = () => {
        let address = trimSpace(this.state.address)
        let name = trimSpace(this.state.addressName)
        if (!addressValid(address)) {
            Toast.info(getLanguage("sendAddressError"))
            return
        }
        let list = getLocal(ADDRESS_BOOK_CONFIG)

        if (this.state.currentClickIndex !== -1) {
            if (list) {
                list = JSON.parse(list)
            }
            let currentAddress = list[this.state.currentClickIndex]
            currentAddress.address = this.state.address
            currentAddress.name = this.state.addressName
            list[this.state.currentClickIndex] = currentAddress
            saveLocal(ADDRESS_BOOK_CONFIG, JSON.stringify(list))
            Toast.info(getLanguage('updateSuccess'))
        } else {
            if (list) {
                list = JSON.parse(list)
                for (let index = 0; index < list.length; index++) {
                    const item = list[index];
                    if (item.address.toLowerCase() === address.toLowerCase()) {
                        Toast.info(getLanguage('repeatTip'))
                        return
                    }
                }
            } else {
                list = []
            }
            name = name.length > 0 ? name : address
            list.push({
                name: name,
                address: address,
            })
            saveLocal(ADDRESS_BOOK_CONFIG, JSON.stringify(list))
            Toast.info(getLanguage('addSuccess'))
        }
        this.onCloseModal()
        this.callSetState({
            addressList: list,
        })
    }
    onSubmit = (event) => {
        event.preventDefault();
    }
    renderActionBtn = () => {
        return (
            <div className={"address-info-btn-container"}>
                <Button
                    content={getLanguage('confirm')}
                    onClick={this.onConfirm}
                    propsClass={"modal-common-btn"}
                />
                <Button
                    content={getLanguage('cancel')}
                    propsClass={"modal-common-btn modal-common-btn-cancel"}
                    onClick={this.onCloseModal}
                />
            </div>
        )
    }
    onTextInput = (e) => {
        if (!this.isUnMounted) {
            this.callSetState({
                addressName: e.target.value,
            }, () => {
                let checkResult = nameLengthCheck(this.state.addressName)
                if (checkResult) {
                    this.callSetState({
                        errorTipShow: false
                    })
                } else {
                    this.callSetState({
                        errorTipShow: true
                    })
                }
            })
        }
    }
    onAddressInput = (e) => {
        if (!this.isUnMounted) {
            this.callSetState({
                address: e.target.value,
            })
        }
    }
    renderInput = () => {
        return (
            <div className={'address-input-con'}>
                <CustomInput
                    placeholder={getLanguage("addressName")}
                    value={this.state.addressName}
                    onTextInput={this.onTextInput}
                    wrapPropClass={"input-wrap-padding"}
                    propsClass={"input-padding"}
                />
                <textarea
                    className={"address-text-area-input"}
                    placeholder={getLanguage('address')}
                    value={this.state.address}
                    onChange={this.onAddressInput} />
            </div>)
    }
    renderChangeModal = () => {
        return (<TestModal
            ref={this.modal}
            showClose={true}
            actionCallback={this.onSetModalVisable}
        >
            <div className={'account-change-name-container'}>
                <p className={
                    cx({ "account-change-name-title": true })
                }>{getLanguage('addAddress')}</p>
                {this.renderInput()}
                {this.renderActionBtn()}
            </div>
        </TestModal>)
    }
    render() {
        return (
            <CustomView
                title={getLanguage("addressBook")}
                history={this.props.history}>
                <div className="address-book-out-container">
                    {this.renderAddressList()}
                </div>
                {this.renderAddBtn()}
                <form onSubmit={this.onSubmit}>
                    {this.renderChangeModal()}
                </form>
            </CustomView>)
    }
}

const mapStateToProps = (state) => ({
    addressBookFrom: state.cache.addressBookFrom,
});

function mapDispatchToProps(dispatch) {
    return {
        updateAddressDetail: (addressDetail) => {
            dispatch(updateAddressDetail(addressDetail))
        },
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(AddressBook);
