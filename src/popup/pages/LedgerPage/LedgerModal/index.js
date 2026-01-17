import i18n from "i18next";
import { Trans } from "react-i18next";
import {
  StyledOuterContainer,
  StyledContentContainer,
  StyledTipTitle,
  StyledTipContent,
  StyledRedFont,
  StyledLedgerStep,
  StyledDividedLine,
  StyledLedgerLoading,
} from "./index.styled";

export const LedgerModal = ({ modalVisible }) => {
  return (
    <>
      {modalVisible && (
        <StyledOuterContainer>
          <StyledContentContainer>
            <StyledTipTitle>{i18n.t("tips")}</StyledTipTitle>
            <StyledTipContent>{i18n.t("ledgerContentTip_1")}</StyledTipContent>
            <StyledLedgerStep>
              <span>{"Get Address > Generate > Approve"}</span>
            </StyledLedgerStep>
            <StyledTipContent>
              <Trans
                i18nKey={"ledgerCloseWarning"}
                components={{
                  red: <StyledRedFont />,
                }}
              />
            </StyledTipContent>
            <StyledTipContent>{i18n.t("ledgerCloseTip")}</StyledTipContent>
            <StyledDividedLine />
            <StyledLedgerLoading src={"/img/ledgerLoading.svg"} />
          </StyledContentContainer>
        </StyledOuterContainer>
      )}
    </>
  );
};
