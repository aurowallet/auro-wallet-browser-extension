import { MAIN_COIN_CONFIG } from "@/constant";
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

const FeeGroup = ({
  currentFee,
  netFeeList = [],
  onClickFee = () => {},
  showFeeGroup = true,
  hideTimer = true,
}) => {
  const { feeList } = useMemo(() => {
    let feeList = [
      {
        text: i18n.t("fee_slow"),
        fee: " ",
      },
      {
        text: i18n.t("fee_default"),
        fee: " ",
      },
      {
        text: i18n.t("fee_fast"),
        fee: " ",
      },
    ];
    if (netFeeList.length >= feeList.length) {
      feeList = feeList.map((item, index) => ({
        ...item,
        fee: netFeeList[index].value,
      }));
    }
    return {
      feeList,
    };
  }, [netFeeList]);

  return (
    <StyledFeeContainer>
      <StyledTopContainer>
        <StyledFeeTitle>{i18n.t("fee")}</StyledFeeTitle>
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
