import i18n from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import Button from "../Button";
import Input from "../Input";
import { isNaturalNumber } from "@/utils/utils";
import {
    StyledOverlay,
    StyledModalContent,
    StyledTitleRow,
    StyledRowTitle,
    StyledCloseButton,
    StyledDivider,
    StyledBottomContent,
    StyledBottomContainer,
    StyledWarningTip,
} from "./index.styled";

const DAppAdvance = ({
    modalVisible = false,
    title = '',
    onConfirm = () => { },
    onClickClose = () => { },

    feeValue = "",
    feePlaceHolder = "",
    onFeeInput = () => { },
    feeErrorTip = "",

    nonceValue = "",
    onNonceInput = () => { },
    zkAppNonce = ""
}) => {

    const mainTokenNetInfo = useSelector(state => state.accountInfo.mainTokenNetInfo)
    const nonceHolder = useMemo(() => {
        if (zkAppNonce) {
            return zkAppNonce
        }
        return isNaturalNumber(mainTokenNetInfo?.inferredNonce) ? mainTokenNetInfo.inferredNonce : ""
    }, [mainTokenNetInfo, zkAppNonce])

    const onClickOuter = useCallback((e) => {
        onClickClose()
    }, [onClickClose])

    const onClickContent = useCallback((e) => {
        e.stopPropagation();
    }, [onClickClose])

    const [modalBg, setModalBg] = useState(modalVisible)

    useEffect(() => {
        if (modalVisible) {
            setModalBg(modalVisible)
        } else {
            setTimeout(() => {
                setModalBg(modalVisible)
            }, 300);
        }
    }, [modalVisible])

    return (
        <>
            <StyledOverlay $show={modalBg} onClick={onClickOuter}>
                <StyledModalContent $visible={modalVisible} onClick={onClickContent}>
                    <div>
                        <StyledTitleRow>
                            <StyledRowTitle>{title}</StyledRowTitle>
                            <StyledCloseButton onClick={onClickClose} src="/img/icon_nav_close.svg" />
                        </StyledTitleRow>
                    </div>
                    <StyledDivider />
                    <StyledBottomContent>
                        <Input
                            label={i18n.t('transactionFee')}
                            onChange={onFeeInput}
                            value={feeValue}
                            inputType={'text'}
                            showBottomTip={true}
                            placeholder={feePlaceHolder}
                            bottomTip={feeErrorTip}
                            bottomTipClass={StyledWarningTip}
                        />
                        <Input
                            label={"Nonce"}
                            onChange={onNonceInput}
                            value={nonceValue}
                            inputType={'text'}
                            placeholder={nonceHolder}
                        />
                    </StyledBottomContent>
                    <StyledBottomContainer $visible={modalVisible}>
                        <Button onClick={onConfirm}>
                            {i18n.t('confirm')}
                        </Button>
                    </StyledBottomContainer>
                </StyledModalContent>
            </StyledOverlay>
        </>
    )
}
export default DAppAdvance