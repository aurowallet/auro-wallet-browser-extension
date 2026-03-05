import i18n from "i18next";
import { MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import BigNumber from "bignumber.js";
import Button from "../Button";
import Input from "../Input";
import Toast from "../Toast";
import { useAppSelector } from "@/hooks/useStore";
import { isNaturalNumber, isNumber } from "@/utils/utils";
import { useFeeValidation } from "@/hooks/useFeeValidation";
import type { FeeConfig } from "@/types/tx.types";
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
    StyledFeeBtnGroup,
    StyledSlowButton,
    StyledNormalButton,
    StyledFastButton,
} from "./AdvanceModal.styled";

interface FeeOption {
    key: 'slow' | 'medium' | 'fast';
    label: string;
    fee: string;
}

interface AdvanceModalProps {
    modalVisible?: boolean;
    onConfirm?: (fee: string, nonce: string) => void;
    onClickClose?: () => void;
    currentFee?: string;
    currentNonce?: string;
    advanceFee?: string;
    advanceNonce?: string;
    feeConfig?: FeeConfig;
    showFeeButtons?: boolean;
}

const AdvanceModal = ({
    modalVisible = false,
    onConfirm = () => { },
    onClickClose = () => { },
    currentFee = "",
    currentNonce = "",
    advanceFee = "",
    advanceNonce = "",
    feeConfig,
    showFeeButtons = true,
}: AdvanceModalProps) => {
    const mainTokenNetInfo = useAppSelector((state) => state.accountInfo.mainTokenNetInfo);
    const [inputFee, setInputFee] = useState("");
    const [inputNonce, setInputNonce] = useState("");
    const { feeErrorTip, setFeeErrorTip, validateFee } = useFeeValidation();

    const nonceHolder = useMemo(() => {
        return isNaturalNumber(mainTokenNetInfo?.inferredNonce) ? String(mainTokenNetInfo?.inferredNonce) : "";
    }, [mainTokenNetInfo]);

    const feeOptions: FeeOption[] = useMemo(() => {
        const txFee = feeConfig?.transactionFee;
        return [
            { key: 'slow', label: i18n.t("fee_slow"), fee: txFee?.slow ?? "" },
            { key: 'medium', label: i18n.t("fee_default"), fee: txFee?.medium ?? "" },
            { key: 'fast', label: i18n.t("fee_fast"), fee: txFee?.fast ?? "" },
        ];
    }, [feeConfig]);

    const selectedFeeKey = useMemo(() => {
        const currentValue = inputFee || currentFee;
        if (!currentValue) return null;
        const matched = feeOptions.find(opt => new BigNumber(opt.fee).isEqualTo(currentValue));
        return matched?.key || null;
    }, [inputFee, currentFee, feeOptions]);

    const onFeeInput = useCallback((e: { target: { value: string } }) => {
        const value = e.target.value;
        setInputFee(value);
        validateFee(value);
    }, [validateFee]);

    const onNonceInput = useCallback((e: { target: { value: string } }) => {
        setInputNonce(e.target.value);
    }, []);

    const onClickFeeButton = useCallback((fee: string) => {
        setInputFee(fee);
        validateFee(fee);
    }, [validateFee]);

    const handleConfirm = useCallback(() => {
        if (inputFee && !isNumber(inputFee)) {
            Toast.info(i18n.t("inputFeeError"), { top: '60%' });
            return;
        }
        if (inputNonce && !isNaturalNumber(inputNonce)) {
            Toast.info(i18n.t("inputNonceError", { nonce: "nonce" }), { top: '60%' });
            return;
        }
        onConfirm(inputFee, inputNonce);
    }, [inputFee, inputNonce, onConfirm]);

    const onClickOuter = useCallback(() => {
        onClickClose();
    }, [onClickClose]);

    const onClickContent = useCallback((e: MouseEvent) => {
        e.stopPropagation();
    }, []);

    const [modalBg, setModalBg] = useState(modalVisible);

    const closeTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    useEffect(() => {
        if (modalVisible) {
            clearTimeout(closeTimerRef.current);
            setModalBg(true);
            setInputFee(advanceFee);
            setInputNonce(advanceNonce);
            if (advanceFee) {
                validateFee(advanceFee);
            } else {
                setFeeErrorTip("");
            }
        } else {
            closeTimerRef.current = setTimeout(() => {
                setModalBg(false);
            }, 300);
        }
        return () => clearTimeout(closeTimerRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [modalVisible]);

    const renderFeeButton = useCallback((option: FeeOption) => {
        const isSelected = selectedFeeKey === option.key;
        const ButtonComponent = option.key === 'slow'
            ? StyledSlowButton
            : option.key === 'medium'
                ? StyledNormalButton
                : StyledFastButton;

        return (
            <ButtonComponent
                key={option.key}
                $selected={isSelected}
                onClick={() => onClickFeeButton(option.fee)}
            >
                {option.label}
            </ButtonComponent>
        );
    }, [selectedFeeKey, onClickFeeButton]);

    const feeButtonsComponent = useMemo(() => {
        if (!showFeeButtons || !feeOptions.some(opt => opt.fee)) return undefined;
        return (
            <StyledFeeBtnGroup>
                {feeOptions.map(renderFeeButton)}
            </StyledFeeBtnGroup>
        );
    }, [showFeeButtons, feeOptions, renderFeeButton]);

    return (
        <>
            <StyledOverlay $show={modalBg} onClick={onClickOuter}>
                <StyledModalContent $visible={modalVisible} onClick={onClickContent}>
                    <div>
                        <StyledTitleRow>
                            <StyledRowTitle>{i18n.t("advanceMode")}</StyledRowTitle>
                            <StyledCloseButton onClick={onClickClose} src="/img/icon_nav_close.svg" />
                        </StyledTitleRow>
                    </div>
                    <StyledDivider />
                    <StyledBottomContent>
                        <Input
                            label={i18n.t('networkFee')}
                            onChange={onFeeInput}
                            value={inputFee}
                            inputType={'text'}
                            showBottomTip={true}
                            placeholder={currentFee}
                            bottomTip={feeErrorTip}
                            bottomTipClass={StyledWarningTip}
                            rightStableComponent={feeButtonsComponent}
                        />
                        <Input
                            label={"Nonce"}
                            onChange={onNonceInput}
                            value={inputNonce}
                            inputType={'text'}
                            placeholder={nonceHolder || currentNonce}
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
    );
};

export default AdvanceModal;
