import { useMemo } from "react";
import { useSelector } from "react-redux";
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
}) => {
    const mainTokenNetInfo = useSelector(state => state.accountInfo.mainTokenNetInfo)
    const nonceHolder = useMemo(() => {
        return isNaturalNumber(mainTokenNetInfo?.inferredNonce) ? mainTokenNetInfo?.inferredNonce : ""
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
                        label={i18n.t('transactionFee')}
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