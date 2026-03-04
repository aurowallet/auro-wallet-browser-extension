import { useMemo } from "react";
import i18n from "i18next";
import Input from "../../component/Input";
import { isNaturalNumber } from "@/utils/utils";
import {
    StyledAdvanceContainer,
    StyledAdvanceEntry,
    StyledAdvanceTitle,
    StyledAdvanceIcon,
    StyledAdvanceInputGroup,
    StyledWarningTip,
} from "./index.styled";
import { useAppSelector } from "@/hooks/useStore";

interface AdvanceModeProps {
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

const AdvanceMode = ({
    isOpenAdvance = false,
    onClickAdvance = () => { },

    feeValue = "",
    feePlaceholder = "",
    onFeeInput = () => { },
    feeErrorTip = "",

    nonceValue = "",
    onNonceInput = () => { },

    type = "",
}: AdvanceModeProps) => {
    const mainTokenNetInfo = useAppSelector((state) => state.accountInfo.mainTokenNetInfo)
    const nonceHolder = useMemo(() => {
        return isNaturalNumber(mainTokenNetInfo?.inferredNonce) ? String(mainTokenNetInfo?.inferredNonce) : ""
    }, [mainTokenNetInfo])

    return (
        <StyledAdvanceContainer>
            {!type && (
                <StyledAdvanceEntry onClick={onClickAdvance}>
                    <StyledAdvanceTitle>{i18n.t("advanceMode")}</StyledAdvanceTitle>
                    <StyledAdvanceIcon
                        $isOpen={isOpenAdvance}
                        src="/img/icon_unfold_Default.svg"
                    />
                </StyledAdvanceEntry>
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
        </StyledAdvanceContainer>
    )
}


export default AdvanceMode