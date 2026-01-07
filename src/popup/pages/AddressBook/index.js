import i18n from "i18next";
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from 'react-router-dom';
import { getLocal } from "../../../background/localStorage";
import { ADDRESS_BOOK_CONFIG } from "../../../constant/storageKey";
import { updateAddressDetail } from "../../../reducers/cache";
import BottomBtn from "../../component/BottomBtn";
import CustomView from "../../component/CustomView";
import { AddressEditorType } from "./AddressEditor";
import styles from "./index.module.scss";

const AddressBook = ({ }) => {

    const navigate = useNavigate()
    const dispatch = useDispatch()

    const addressBookFrom = useSelector(state => state.cache.addressBookFrom)

    const [localAddressList, setLocalAddressList] = useState([])
    const [localAddressLength, setLocalAddressLength] = useState(0)



    const getLocalAddress = useCallback(() => {
        let list = getLocal(ADDRESS_BOOK_CONFIG)

        if (list) {
            list = JSON.parse(list)
        } else {
            list = []
        }
        setLocalAddressList(list)
    }, [])
    useEffect(() => {
        getLocalAddress()
    }, [])


    useEffect(() => {
        setLocalAddressLength(localAddressList.length)
    }, [localAddressList])




    const onAddAddress = useCallback(() => {
        navigate("/address_editor", { state: { editorType: AddressEditorType.add } })
    }, [])

    const onClickAddressItem = useCallback((localAddress, editIndex) => {
        if (addressBookFrom) {
            navigate(-1)
            dispatch(updateAddressDetail(localAddress))
        } else {
            navigate("/address_editor", {
                state: {
                    editorType: AddressEditorType.edit,
                    editItem: localAddress,
                    editIndex: editIndex
                }
            })
        }

    }, [addressBookFrom])

    return (<CustomView title={i18n.t('addressBook')} contentClassName={styles.addressBookContainer}>
        {
            localAddressList.length === 0 ?
                <div className={styles.emptyContainer}>
                    <img src="/img/icon_empty.svg" className={styles.emptyIcon} />
                    <p className={styles.noAddressTip}>{i18n.t('noAddress')}</p>
                </div>
                :
                <div className={styles.addressContainer}>
                    {
                        localAddressList.map((localAddress, index) => {
                            return (
                                <div key={index} className={styles.addressItemOuter}>
                                    <div key={index} className={styles.addressItemContainer} onClick={() => onClickAddressItem(localAddress, index)}>
                                        <p className={styles.addressName}>{localAddress.name}</p>
                                        <p className={styles.addressValue}>{localAddress.address}</p>
                                    </div>
                                    {index !== (localAddressLength - 1) && <div className={styles.dividedLine} />}
                                </div>)
                        })
                    }
                </div>
        }

        <BottomBtn 
            containerClass={styles.bottomContainer}
            onClick={onAddAddress}
            rightBtnContent={i18n.t('add')}
            noHolder={true}
        />
    </CustomView>)
}

export default AddressBook