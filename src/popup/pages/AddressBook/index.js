import i18n from "i18next";
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getLocal } from "../../../background/localStorage";
import { ADDRESS_BOOK_CONFIG } from "../../../constant/storageKey";
import { updateAddressDetail } from "../../../reducers/cache";
import BottomBtn from "../../component/BottomBtn";
import CustomView from "../../component/CustomView";
import { AddressEditorType } from "./AddressEditor";
import {
  StyledContainer,
  StyledEmptyContainer,
  StyledEmptyIcon,
  StyledNoAddressTip,
  StyledBottomContainer,
  StyledAddressContainer,
  StyledAddressItemContainer,
  StyledAddressName,
  StyledAddressValue,
  StyledDividedLine,
} from "./index.styled";

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

    return (
        <CustomView title={i18n.t("addressBook")} ContentWrapper={StyledContainer}>
            {localAddressList.length === 0 ? (
                <StyledEmptyContainer>
                    <StyledEmptyIcon src="/img/icon_empty.svg" />
                    <StyledNoAddressTip>{i18n.t("noAddress")}</StyledNoAddressTip>
                </StyledEmptyContainer>
            ) : (
                <StyledAddressContainer>
                    {localAddressList.map((localAddress, index) => {
                        return (
                            <div key={index}>
                                <StyledAddressItemContainer
                                    onClick={() => onClickAddressItem(localAddress, index)}
                                >
                                    <StyledAddressName>{localAddress.name}</StyledAddressName>
                                    <StyledAddressValue>{localAddress.address}</StyledAddressValue>
                                </StyledAddressItemContainer>
                                {index !== localAddressLength - 1 && <StyledDividedLine />}
                            </div>
                        );
                    })}
                </StyledAddressContainer>
            )}
            <BottomBtn
                containerClass={StyledBottomContainer}
                onClick={onAddAddress}
                rightBtnContent={i18n.t("add")}
                noHolder={true}
            />
        </CustomView>
    );
};

export default AddressBook;