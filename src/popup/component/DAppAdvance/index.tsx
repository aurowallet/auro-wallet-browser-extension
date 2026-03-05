import i18n from "i18next";
import { MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Button from "../Button";
import Input from "../Input";
import Toast from "../Toast";
import { useAppSelector } from "@/hooks/useStore";
import { isNaturalNumber, isNumber } from "@/utils/utils";
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

interface DAppAdvanceProps {
    modalVisible?: boolean;
    title?: string;
    onConfirm?: () => void;
    onClickClose?: () => void;
    feeValue?: string;
    feePlaceHolder?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onFeeInput?: (e: any) => void;
    feeErrorTip?: string;
    nonceValue?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onNonceInput?: (e: any) => void;
    zkAppNonce?: string;
}

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
}: DAppAdvanceProps) => {
    const mainTokenNetInfo = useAppSelector((state) => state.accountInfo.mainTokenNetInfo)
    const nonceHolder = useMemo(() => {
        if (zkAppNonce) {
            return zkAppNonce
        }
        return isNaturalNumber(mainTokenNetInfo?.inferredNonce) ? String(mainTokenNetInfo?.inferredNonce) : ""
    }, [mainTokenNetInfo, zkAppNonce])

    const handleConfirm = useCallback(() => {
        if (feeValue && !isNumber(feeValue)) {
            Toast.info(i18n.t("inputFeeError"));
            return;
        }
        if (nonceValue && !isNaturalNumber(nonceValue)) {
            Toast.info(i18n.t("inputNonceError", { nonce: "nonce" }));
            return;
        }
        onConfirm();
    }, [feeValue, nonceValue, onConfirm]);

    const onClickOuter = useCallback(() => {
        onClickClose()
    }, [onClickClose])

    const onClickContent = useCallback((e: MouseEvent) => {
        e.stopPropagation();
    }, [])

    const [modalBg, setModalBg] = useState(modalVisible)
    const closeTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

    useEffect(() => {
        if (modalVisible) {
            clearTimeout(closeTimerRef.current)
            setModalBg(true)
        } else {
            closeTimerRef.current = setTimeout(() => {
                setModalBg(false)
            }, 300);
        }
        return () => clearTimeout(closeTimerRef.current)
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
                            label={i18n.t('networkFee')}
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
                        <Button onClick={handleConfirm}>
                            {i18n.t('confirm')}
                        </Button>
                    </StyledBottomContainer>
                </StyledModalContent>
            </StyledOverlay>
        </>
    )
}
export default DAppAdvance