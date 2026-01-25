import i18n from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getLocal, saveLocal } from "../../../../background/localStorage";
import { ADDRESS_BOOK_CONFIG } from "../../../../constant/storageKey";
import { addressValid, trimSpace } from "../../../../utils/utils";
import Button from "../../../component/Button";
import CustomView from "../../../component/CustomView";
import Input from "../../../component/Input";
import { PopupModal } from "../../../component/PopupModal";
import TextArea from "../../../component/TextArea";
import {
  StyledInputContainer,
  StyledPlaceholder,
  StyledBottomContainer,
  StyledDeleteBtn,
  StyledModalDelete,
} from "./index.styled";

export const AddressEditorType = {
    add: "add",
    delete: "delete",
    edit: "edit"
}

const AddressEditor = () => {


    const navigate = useNavigate()
    const location = useLocation()
    const [reminderModalStatus, setReminderModalStatus] = useState(false)

    const [btnStatus,setBtnStatus] = useState(true)
    const [errorTip, setErrorTip] = useState('')

    const {
        editorType, editIndex, editItem
    } = useMemo(() => {
        let editorType = location?.state?.editorType ?? "";
        let editIndex = location?.state?.editIndex ?? "";
        let editItem = location?.state?.editItem ?? "";
        return {
            editorType, editIndex, editItem
        }
    }, [location])


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

    interface AddressBookItem {
        name: string;
        address: string;
    }
    const checkExist = (list: AddressBookItem[], targetAddress: string) => {
        for (let index = 0; index < list.length; index++) {
            const item = list[index];
            if (item && item.address.toLowerCase() === targetAddress.toLowerCase()) {
                setErrorTip(i18n.t('repeatTip'))
                return true
            }
        }
        return false
    }

    const onAddAddress = useCallback(() => {
        let address = trimSpace(addressValue) as string
        let name: string = trimSpace(addressName) as string

        if (!addressValid(address)) {
            setErrorTip(i18n.t("incorrectAddressFormat"))
            return
        }
        let list: AddressBookItem[] | string | null = getLocal(ADDRESS_BOOK_CONFIG)

        if (editorType === AddressEditorType.add) {
            if (list) {
                list = JSON.parse(list as string) as AddressBookItem[]
                let exist = checkExist(list, address)
                if (exist) {
                    return
                }
            } else {
                list = []
            }
            name = name.length > 0 ? name : (address as string)
            list.push({
                name: name,
                address: address,
            })
            saveLocal(ADDRESS_BOOK_CONFIG, JSON.stringify(list))

            setTimeout(() => {
                navigate(-1)
            }, 50);

        } else if (editorType === AddressEditorType.edit) {
            let parsedList: AddressBookItem[] = [];
            if (list) {
                parsedList = JSON.parse(list as string) as AddressBookItem[]
            }

            let currentAddress = parsedList[editIndex]
            if (currentAddress) {
                currentAddress.address = address
                currentAddress.name = name
                parsedList[editIndex] = currentAddress
            }

            saveLocal(ADDRESS_BOOK_CONFIG, JSON.stringify(parsedList))

            setTimeout(() => {
                navigate(-1)
            }, 50);
        }

    }, [addressValue, addressName, editIndex])


    const onInputAddressName = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setAddressName(e.target.value)
    }, [])


    const onInputAddress = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setAddressValue(e.target.value)
        setErrorTip("")
    }, [])


    const onClickDelete = useCallback(() => {
        setReminderModalStatus(true)
    }, [])

    const onCloseModal = useCallback(() => {
        let rawList: string | null = getLocal(ADDRESS_BOOK_CONFIG)
        let parsedList: AddressBookItem[] = [];
        if (rawList) {
            parsedList = JSON.parse(rawList) as AddressBookItem[]
        }
        parsedList.splice(editIndex, 1)
        saveLocal(ADDRESS_BOOK_CONFIG, JSON.stringify(parsedList))
        setTimeout(() => {
            setReminderModalStatus(false)
            navigate(-1)
        }, 50);


    }, [editorType, editIndex, editItem])
    const onCancel = useCallback(() => {
        setReminderModalStatus(false)
    }, [])

    useEffect(()=>{
        if((trimSpace(addressName) as string).length > 0 && (trimSpace(addressValue) as string).length > 0){
            setBtnStatus(false)
        }else{
            setBtnStatus(true)
        }
    },[addressName,addressValue])


    return (
        <CustomView
            title={title}
            rightComponent={
                editorType === AddressEditorType.edit && (
                    <StyledDeleteBtn onClick={onClickDelete}>
                        {i18n.t("deleteTag")}
                    </StyledDeleteBtn>
                )
            }
        >
            <StyledInputContainer>
                <Input
                    label={i18n.t("name")}
                    onChange={onInputAddressName}
                    value={addressName}
                    inputType={"text"}
                />
                <TextArea
                    label={i18n.t("address")}
                    onChange={onInputAddress}
                    value={addressValue}
                    showBottomTip={true}
                    bottomErrorTip={errorTip}
                />
            </StyledInputContainer>
            <StyledPlaceholder />
            <StyledBottomContainer>
                <Button disable={btnStatus} onClick={onAddAddress}>
                    {i18n.t("confirm")}
                </Button>
            </StyledBottomContainer>
            <PopupModal
                title={i18n.t("deleteAddress")}
                leftBtnContent={i18n.t("cancel")}
                onLeftBtnClick={onCancel}
                rightBtnContent={i18n.t("deleteTag")}
                onRightBtnClick={onCloseModal}
                rightBtnStyle={StyledModalDelete}
                modalVisible={reminderModalStatus}
            />
        </CustomView>
    );
};

export default AddressEditor;
