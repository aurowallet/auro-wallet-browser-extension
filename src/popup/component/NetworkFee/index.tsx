import { useCallback, useState } from "react";
import i18n from "i18next";
import { MAIN_COIN_CONFIG } from "@/constant";
import type { FeeConfig } from "@/types/tx.types";
import AdvanceModal from "./AdvanceModal";
import {
    StyledNetworkFeeContainer,
    StyledFeeRow,
    StyledFeeLabel,
    StyledFeeValue,
    StyledDividedLine,
    StyledAdvanceLink,
} from "./index.styled";

interface NetworkFeeProps {
    currentFee: string;
    currentNonce?: string;
    advanceFee?: string;
    advanceNonce?: string;
    feeConfig?: FeeConfig;
    showFeeButtons?: boolean;
    onAdvanceConfirm?: (fee: string, nonce: string) => void;
    onAdvanceClick?: () => void;
    hideAdvanceLink?: boolean;
}

const NetworkFee = ({
    currentFee,
    currentNonce = "",
    advanceFee = "",
    advanceNonce = "",
    feeConfig,
    showFeeButtons = true,
    onAdvanceConfirm,
    onAdvanceClick,
    hideAdvanceLink = false,
}: NetworkFeeProps) => {
    const [modalVisible, setModalVisible] = useState(false);

    const onClickAdvance = useCallback(() => {
        if (onAdvanceClick) {
            onAdvanceClick();
        } else {
            setModalVisible(true);
        }
    }, [onAdvanceClick]);

    const onClickClose = useCallback(() => {
        setModalVisible(false);
    }, []);

    const handleConfirm = useCallback((fee: string, nonce: string) => {
        setModalVisible(false);
        onAdvanceConfirm?.(fee, nonce);
    }, [onAdvanceConfirm]);

    return (
        <StyledNetworkFeeContainer>
            <StyledFeeRow>
                <StyledFeeLabel>{i18n.t("networkFee")}</StyledFeeLabel>
                <StyledFeeValue>{currentFee + " " + MAIN_COIN_CONFIG.symbol}</StyledFeeValue>
            </StyledFeeRow>
            <StyledDividedLine />
            {!hideAdvanceLink && (
                <StyledAdvanceLink onClick={onClickAdvance}>
                    {i18n.t("advanceMode")}
                </StyledAdvanceLink>
            )}
            {!onAdvanceClick && (
                <AdvanceModal
                    modalVisible={modalVisible}
                    onClickClose={onClickClose}
                    onConfirm={handleConfirm}
                    currentFee={currentFee}
                    currentNonce={currentNonce}
                    advanceFee={advanceFee}
                    advanceNonce={advanceNonce}
                    feeConfig={feeConfig}
                    showFeeButtons={showFeeButtons}
                />
            )}
        </StyledNetworkFeeContainer>
    );
};

export default NetworkFee;
