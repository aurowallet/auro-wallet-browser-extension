import { MAIN_COIN_CONFIG } from "@/constant";
import type { FeeConfig } from "@/types/tx.types";
import BigNumber from "bignumber.js";
import i18n from "i18next";
import { useMemo } from "react";
import CountdownTimer from "../CountdownTimer";
import {
    StyledFeeContainer,
    StyledTopContainer,
    StyledFeeTitle,
    StyledFeeAmount,
    StyledBtnGroup,
    StyledFeeButton,
} from "./index.styled";

interface FeeItem {
    text: string;
    fee: string;
}

interface FeeGroupProps {
    currentFee: string;
    feeConfig?: FeeConfig;
    onClickFee?: (fee: FeeItem) => void;
    showFeeGroup?: boolean;
    hideTimer?: boolean;
}

const FeeGroup = ({
  currentFee,
  feeConfig,
  onClickFee = () => {},
  showFeeGroup = true,
  hideTimer = true,
}: FeeGroupProps) => {
  const { feeList } = useMemo(() => {
    const txFee = feeConfig?.transactionFee;
    const feeList: FeeItem[] = [
      {
        text: i18n.t("fee_slow"),
        fee: txFee?.slow ?? " ",
      },
      {
        text: i18n.t("fee_default"),
        fee: txFee?.medium ?? " ",
      },
      {
        text: i18n.t("fee_fast"),
        fee: txFee?.fast ?? " ",
      },
    ];
    return {
      feeList,
    };
  }, [feeConfig]);

  return (
    <StyledFeeContainer>
      <StyledTopContainer>
        <StyledFeeTitle>{i18n.t("networkFee")}</StyledFeeTitle>
        <StyledFeeAmount>
          <div>{currentFee + " " + MAIN_COIN_CONFIG.symbol}</div>
          {!hideTimer ? <CountdownTimer /> : <></>}
        </StyledFeeAmount>
      </StyledTopContainer>
      {showFeeGroup ? (
        <StyledBtnGroup>
          {feeList.map((fee, index) => {
            let selectStatus = new BigNumber(fee.fee).isEqualTo(currentFee);
            return (
              <StyledFeeButton
                key={index}
                onClick={() => onClickFee(fee)}
                $selected={selectStatus}
              >
                {fee.text}
              </StyledFeeButton>
            );
          })}
        </StyledBtnGroup>
      ) : (
        <></>
      )}
    </StyledFeeContainer>
  );
};

export default FeeGroup;
