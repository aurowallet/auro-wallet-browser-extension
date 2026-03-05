/**
 * speed up and speed cancel modal
 */
import i18n from "i18next";
import { useCallback, useEffect, useState } from "react";

interface TransactionModalProps {
  modalVisible?: boolean;
  title?: string;
  modalContent?: string;
  onConfirm?: (fee: string) => void;
  onClickClose?: () => void;
  currentFee?: string;
  nextFee?: string;
  currentNonce?: string;
  btnLoading?: boolean;
  waitingLedger?: boolean;
}
import { Trans } from "react-i18next";
import { MAIN_COIN_CONFIG } from "../../../constant";
import { AdvancedModal } from "../AdvancedModal";
import Button, { button_theme } from "../Button";
import LedgerStatusView from "../StatusView/LedgerStatusView";
import NetworkStatusView from "../StatusView/NetworkStatusView";
import {
  StyledOuterContainer,
  StyledInnerContent,
  StyledTitleRow,
  StyledRowTitle,
  StyledRightRow,
  StyledDividedLine,
  StyledBottomContent,
  StyledBottomContainer,
  StyledModalContent,
  StyledLightFont,
  StyledFeeContainer,
  StyledFeeItem,
  StyledFeeTitle,
  StyledFeeContent,
  StyledFeeArrow,
  StyledChangeWrapper,
  StyledChangeCls,
  StyledLedgerContent,
  StyledLoadingSpinner,
  StyledWaitingContent,
  StyledWaitingTip,
  StyledAccountRepeatName,
  StyledRedFont,
  StyledYellowFont,
} from "./index.styled";

export const TransactionModalType = {
  speedUp: "SPEED_UP",
  cancel: "CANCEL",
};
export const TransactionModal = ({
  modalVisible = false,
  title = "",
  modalContent = "",
  onConfirm = () => {},
  onClickClose = () => {},

  currentFee = "",
  nextFee = "",
  currentNonce = "",
  btnLoading = false,
  waitingLedger = false,
}: TransactionModalProps) => {
  const [advanceModalVisible, setAdvanceModalVisible] = useState(false);
  const [nextInputFee, setNextInputFee] = useState(nextFee);

  useEffect(() => {
    if (modalVisible && nextFee) {
      setNextInputFee(nextFee);
    }
  }, [nextFee, modalVisible]);

  const onClickAdvance = useCallback(() => {
    setAdvanceModalVisible(true);
  }, []);
  const onAdvanceConfirm = useCallback((nextFee: string) => {
    if (nextFee) {
      setNextInputFee(nextFee);
    }
    setAdvanceModalVisible(false);
  }, []);
  const onClickAdvanceClose = useCallback(() => {
    setAdvanceModalVisible(false);
  }, []);

  return (
    <>
      {modalVisible && (
        <StyledOuterContainer>
          <StyledInnerContent>
            <div>
              <StyledTitleRow>
                <StyledRowTitle>{title}</StyledRowTitle>
                <StyledRightRow>
                  <LedgerStatusView />
                  <div style={{ marginRight: "6px" }} />
                  <NetworkStatusView />
                </StyledRightRow>
              </StyledTitleRow>
            </div>
            <StyledDividedLine />
            {waitingLedger ? (
              <StyledLedgerContent>
                <StyledLoadingSpinner />
                <StyledWaitingContent>
                  {i18n.t("waitingLedgerConfirmTip")}
                </StyledWaitingContent>
                <StyledWaitingTip>
                  <Trans
                    i18nKey={"waitingLedgerConfirmTip_3"}
                    components={{
                      b: <StyledAccountRepeatName />,
                      red: <StyledRedFont />,
                      yellow: <StyledYellowFont />,
                      br: <br />,
                    }}
                  />
                </StyledWaitingTip>
              </StyledLedgerContent>
            ) : (
              <>
                <StyledModalContent>
                  <Trans
                    i18nKey={modalContent}
                    components={{
                      light: <StyledLightFont />,
                    }}
                  />
                </StyledModalContent>
                <StyledBottomContent>
                  <StyledFeeContainer>
                    <StyledFeeItem>
                      <StyledFeeTitle>{i18n.t("currentFee")}</StyledFeeTitle>
                      <StyledFeeContent>
                        {currentFee + " " + MAIN_COIN_CONFIG.symbol}
                      </StyledFeeContent>
                    </StyledFeeItem>
                    <StyledFeeArrow>
                      <img src="/img/icon_arrow_purple.svg" />
                    </StyledFeeArrow>
                    <StyledFeeItem>
                      <StyledFeeTitle $rightAlign>
                        {i18n.t("newFee")}
                      </StyledFeeTitle>
                      <StyledFeeContent $rightAlign>
                        {nextInputFee + " " + MAIN_COIN_CONFIG.symbol}
                      </StyledFeeContent>
                    </StyledFeeItem>
                  </StyledFeeContainer>
                  <StyledChangeWrapper>
                    <StyledChangeCls onClick={onClickAdvance}>
                      {i18n.t("change")}
                    </StyledChangeCls>
                  </StyledChangeWrapper>
                </StyledBottomContent>
                <StyledBottomContainer>
                  <Button
                    onClick={onClickClose}
                    theme={button_theme.BUTTON_THEME_LIGHT}
                  >
                    {i18n.t("cancel")}
                  </Button>
                  <Button
                    loading={btnLoading}
                    onClick={() => {
                      onConfirm(nextInputFee);
                    }}
                  >
                    {i18n.t("confirm")}
                  </Button>
                </StyledBottomContainer>
              </>
            )}
          </StyledInnerContent>
        </StyledOuterContainer>
      )}
      <AdvancedModal
        modalVisible={advanceModalVisible}
        onConfirm={onAdvanceConfirm}
        onClickClose={onClickAdvanceClose}
        currentFee={currentFee}
        currentNonce={currentNonce}
      />
    </>
  );
};
