/**
 * speed up and speed cancel modal
 */
import i18n from "i18next";
import Button from "../Button";
import AdvanceMode from "../AdvanceMode";
import { useCallback, useEffect, useState } from "react";
import BigNumber from "bignumber.js";
import {
  StyledModalOverlay,
  StyledModalContent,
  StyledTitleRow,
  StyledRowTitle,
  StyledCloseButton,
  StyledRightRow,
  StyledDivider,
  StyledBottomContent,
  StyledBottomContainer,
} from "./index.styled";

interface AdvancedModalProps {
  modalVisible?: boolean;
  onConfirm?: (fee: string) => void;
  onClickClose?: () => void;
  currentNonce?: string;
  currentFee?: string;
}

export const AdvancedModal = ({
  modalVisible = false,
  onConfirm = () => {},
  onClickClose = () => {},
  currentNonce = "",
  currentFee = "",
}: AdvancedModalProps) => {
  const [inputFee, setInputFee] = useState("");
  const [feeErrorTip, setFeeErrorTip] = useState("");
  const [isOpenAdvance, setIsOpenAdvance] = useState(false);

  const onClickAdvance = useCallback(() => {
    setIsOpenAdvance((state: boolean) => !state);
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onFeeInput = useCallback(
    (e: any) => {
      const value = e?.target?.value ?? e;
      setInputFee(value);
      if (BigNumber(value).gt(10)) {
        setFeeErrorTip(i18n.t("feeTooHigh"));
      } else {
        setFeeErrorTip("");
      }
    },
    []
  );
  useEffect(() => {
    if (!modalVisible) {
      setInputFee("");
      setFeeErrorTip("");
    }
  }, [modalVisible]);

  return (
    <>
      {modalVisible && (
        <StyledModalOverlay>
          <StyledModalContent>
            <div>
              <StyledTitleRow>
                <StyledRowTitle>{i18n.t("advanceMode")}</StyledRowTitle>
                <StyledRightRow>
                  <StyledCloseButton
                    onClick={onClickClose}
                    src="/img/icon_nav_close.svg"
                  />
                </StyledRightRow>
              </StyledTitleRow>
            </div>
            <StyledDivider />
            <StyledBottomContent>
              <AdvanceMode
                onClickAdvance={onClickAdvance}
                isOpenAdvance={true}
                feeValue={inputFee}
                feePlaceholder={currentFee}
                onFeeInput={onFeeInput}
                feeErrorTip={feeErrorTip}
                nonceValue={currentNonce}
                type={"modal"}
              />
            </StyledBottomContent>
            <StyledBottomContainer>
              <Button onClick={() => onConfirm(inputFee)}>
                {i18n.t("confirm")}
              </Button>
            </StyledBottomContainer>
          </StyledModalContent>
        </StyledModalOverlay>
      )}
    </>
  );
};
