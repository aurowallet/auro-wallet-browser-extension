import i18n from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useHistory } from 'react-router-dom';
import { getLocal, saveLocal } from "../../../../background/localStorage";
import { ADDRESS_BOOK_CONFIG } from "../../../../constant/storageKey";
import { trimSpace } from "../../../../utils/utils";
import { addressValid } from "../../../../utils/validator";
import Button from "../../../component/Button";
import CustomView from "../../../component/CustomView";
import Input from "../../../component/Input";
import { PopupModal } from "../../../component/PopupModal";
import TextArea from "../../../component/TextArea";
import styles from "./index.module.scss";

export const AddressEditorType = {
    add: "add",
    delete: "delete",
    edit: "edit"
}

const AddressEditor = ({ }) => {


    const history = useHistory()
    const [reminderModalStatus, setReminderModalStatus] = useState(false)

    const [btnStatus,setBtnStatus] = useState(true)
    const [errorTip, setErrorTip] = useState('')

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


    const [addressName, setAddressName] = useState(() => {
        if (editorType === AddressEditorType.edit) {
            return editItem.name || ''
        } else {
            return ""
        }
    })
    const [addressValue, setAddressValue] = useState(() => {
        if (editorType === AddressEditorType.edit) {
            return editItem.address || ''
        } else {
            return ""
        }
    })


    const {
        title
    } = useMemo(() => {

        let title = i18n.t("editAddress")
        if (editorType === AddressEditorType.add) {
            title = i18n.t('addAddress')
        }

        return {
            title
        }
    }, [i18n,editorType])

    const checkExist = (list, targetAddress) => {
        for (let index = 0; index < list.length; index++) {
            const item = list[index];
            if (item.address.toLowerCase() === targetAddress.toLowerCase()) {
                setErrorTip(i18n.t('repeatTip'))
                return true
            }
        }
        return false
    }

    const onAddAddress = useCallback(() => {
        let address = trimSpace(addressValue)
        let name = trimSpace(addressName)

        if (!addressValid(address)) {
            setErrorTip(i18n.t("incorrectAddressFormat"))
            return
        }
        let list = getLocal(ADDRESS_BOOK_CONFIG)

        if (editorType === AddressEditorType.add) {
            if (list) {
                list = JSON.parse(list)
                let exist = checkExist(list, address)
                if (exist) {
                    return
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

            setTimeout(() => {
                history.goBack()
            }, 50);

        } else if (editorType === AddressEditorType.edit) {
            if (list) {
                list = JSON.parse(list)
            }

            let currentAddress = list[editIndex]
            currentAddress.address = address
            currentAddress.name = name
            list[editIndex] = currentAddress

            saveLocal(ADDRESS_BOOK_CONFIG, JSON.stringify(list))

            setTimeout(() => {
                history.goBack()
            }, 50);
        }

    }, [addressValue, addressName, editIndex])


    const onInputAddressName = useCallback((e) => {
        setAddressName(e.target.value)
    }, [])


    const onInputAddress = useCallback((e) => {
        setAddressValue(e.target.value)
        setErrorTip("")
    }, [])


    const onClickDelete = useCallback(() => {
        setReminderModalStatus(true)
    }, [])

    const onCloseModal = useCallback(() => {
        let list = getLocal(ADDRESS_BOOK_CONFIG)

        if (list) {
            list = JSON.parse(list)
        }
        list.splice(editIndex, 1)
        saveLocal(ADDRESS_BOOK_CONFIG, JSON.stringify(list))
        setTimeout(() => {
            setReminderModalStatus(false)
            history.goBack()
        }, 50);


    }, [editorType, editIndex, editItem])
    const onCancel = useCallback(() => {
        setReminderModalStatus(false)
    }, [])

    useEffect(()=>{
        if(trimSpace(addressName).length > 0 && trimSpace(addressValue).length > 0){
            setBtnStatus(false)
        }else{
            setBtnStatus(true)
        }
    },[addressName,addressValue])


    return (<CustomView title={title}
        rightComponent={
            editorType === AddressEditorType.edit &&
            <p className={styles.deleteBtn}
                onClick={onClickDelete}>
                {i18n.t('delete')}
            </p>
        }
    >
        <div className={styles.inputContainer}>
            <Input
                label={i18n.t('name')}
                onChange={onInputAddressName}
                value={addressName}
                inputType={'text'}
                className={styles.nameInput}
            />
            <TextArea
                label={i18n.t('address')}
                onChange={onInputAddress}
                value={addressValue}
                className={styles.addressInput}
                showBottomTip={true}
                bottomErrorTip={errorTip}
            />
        </div>
        <div className={styles.hold} />
        <div className={styles.bottomContainer}>
            <Button
                disable={btnStatus}
                onClick={onAddAddress}>
                {i18n.t('confirm')}
            </Button>
        </div>

        <PopupModal
            title={i18n.t('deleteAddress')}
            leftBtnContent={i18n.t('cancel')}
            onLeftBtnClick={onCancel}
            rightBtnContent={i18n.t('delete')}
            onRightBtnClick={onCloseModal}
            rightBtnStyle={styles.modalDelete}
            modalVisable={reminderModalStatus} />

    </CustomView>)
}

export default AddressEditor
