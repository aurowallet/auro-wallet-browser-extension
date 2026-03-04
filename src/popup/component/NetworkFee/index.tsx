import { useMemo } from "react";
import i18n from "i18next";
import { MAIN_COIN_CONFIG } from "@/constant";
import { isNaturalNumber } from "@/utils/utils";
import Input from "../Input";
import { useAppSelector } from "@/hooks/useStore";
import {
    StyledNetworkFeeContainer,
    StyledFeeRow,
    StyledFeeLabel,
    StyledFeeValue,
    StyledDividedLine,
    StyledAdvanceLink,
    StyledAdvanceInputGroup,
    StyledWarningTip,
} from "./index.styled";

interface NetworkFeeProps {
    currentFee: string;
    isOpenAdvance?: boolean;
    onClickAdvance?: () => void;
    feeValue?: string;
    feePlaceholder?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onFeeInput?: (e: any) => void;
    feeErrorTip?: string;
    nonceValue?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onNonceInput?: (e: any) => void;
    type?: string;
}

const NetworkFee = ({
    currentFee,
    isOpenAdvance = false,
    onClickAdvance = () => { },
    feeValue = "",
    feePlaceholder = "",
    onFeeInput = () => { },
    feeErrorTip = "",
    nonceValue = "",
    onNonceInput = () => { },
    type = "",
}: NetworkFeeProps) => {
    const mainTokenNetInfo = useAppSelector((state) => state.accountInfo.mainTokenNetInfo);
    const nonceHolder = useMemo(() => {
        return isNaturalNumber(mainTokenNetInfo?.inferredNonce) ? String(mainTokenNetInfo?.inferredNonce) : "";
    }, [mainTokenNetInfo]);

    return (
        <StyledNetworkFeeContainer>
            <StyledFeeRow>
                <StyledFeeLabel>{i18n.t("networkFee")}</StyledFeeLabel>
                <StyledFeeValue>{currentFee + " " + MAIN_COIN_CONFIG.symbol}</StyledFeeValue>
            </StyledFeeRow>
            <StyledDividedLine />
            {!type && (
                <StyledAdvanceLink onClick={onClickAdvance}>
                    {i18n.t("advanceMode")}
                </StyledAdvanceLink>
            )}
            {isOpenAdvance && (
                <StyledAdvanceInputGroup>
                    <Input
                        label={i18n.t('networkFee')}
                        onChange={onFeeInput}
                        value={feeValue}
                        inputType={'numric'}
                        placeholder={feePlaceholder}
                        showBottomTip={true}
                        bottomTip={feeErrorTip}
                        bottomTipClass={StyledWarningTip}
                    />
                    <Input
                        label={"Nonce"}
                        onChange={onNonceInput}
                        value={nonceValue}
                        inputType={'numric'}
                        placeholder={nonceHolder}
                        inputDisable={!!type}
                    />
                </StyledAdvanceInputGroup>
            )}
        </StyledNetworkFeeContainer>
    );
};

export default NetworkFee;
