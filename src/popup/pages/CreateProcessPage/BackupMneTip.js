import Button from "@/popup/component/Button";
import { CheckBox } from "@/popup/component/CheckBox";
import i18n from "i18next";
import { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import { BackView } from ".";

const StyledPwdContainer = styled.div`
  margin-top: 20px;
`;
const StyledPwdContentContainer = styled.div`
  padding: 40px;
`;
const StyledProcessTitle = styled.div`
  color: var(--Black, #000);
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 40px;
`;

const StyledBottomContainer = styled.div`
  position: absolute;
  width: calc(100% - 80px);
  min-width: 375px;
  bottom: 30px;
  left: 50%;
  transform: translate(-50%);
  > :last-child {
    margin: 0 30px;
    max-width: calc(100% - 60px);
  }
`;
const StyledPageTip = styled.p`
  font-weight: 500;
  font-size: 14px;
  line-height: 17px;
  color: #000000;
  margin: 10px 0 0;
`;

const StyledPageContent = styled.p`
  font-weight: 400;
  font-size: 14px;
  line-height: 17px;
  color: var(--mediumBlack);
  margin: 20px 0 0;
`;

export const BackupMneTip = ({ onClickNext, onClickPre }) => {
  const [btnClick, setBtnClick] = useState(false);

  const [checkBox_1, setCheckBox_1] = useState(false);
  const [checkBox_2, setCheckBox_2] = useState(false);

  const onClickCheckbox_1 = useCallback(() => {
    setCheckBox_1((state) => !state);
  }, []);
  const onClickCheckbox_2 = useCallback(() => {
    setCheckBox_2((state) => !state);
  }, []);

  useEffect(() => {
    setBtnClick(checkBox_1 && checkBox_2);
  }, [checkBox_1, checkBox_2]);
  return (
    <StyledPwdContainer>
      <BackView onClickBack={onClickPre} />
      <StyledPwdContentContainer>
        <StyledProcessTitle>
          {i18n.t("backupMnemonicPhrase")}
        </StyledProcessTitle>
        <StyledPageTip>{i18n.t("backTips_1")}</StyledPageTip>
        <StyledPageContent>{i18n.t("backTips_2")}</StyledPageContent>
        <StyledPageContent>{i18n.t("backTips_3")}</StyledPageContent>
      </StyledPwdContentContainer>
      <StyledBottomContainer>
        <RowCheckLine
          checkStatus={checkBox_1}
          onClick={onClickCheckbox_1}
          content={i18n.t("backup_checkbox_1")}
        />
        <RowCheckLine
          checkStatus={checkBox_2}
          onClick={onClickCheckbox_2}
          content={i18n.t("backup_checkbox_2")}
        />
        <Button disable={!btnClick} onClick={onClickNext}>
          {i18n.t("next")}
        </Button>
      </StyledBottomContainer>
    </StyledPwdContainer>
  );
};

const StyledRowLine = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  cursor: pointer;
`;
const StyledRowContent = styled.div`
  font-size: 14px;
  line-height: 17px;
  color: var(--mediumBlack);
  margin: 0 0 0 10px;
`;
const RowCheckLine = ({ content, onClick, checkStatus }) => {
  return (
    <StyledRowLine onClick={onClick}>
      <CheckBox status={checkStatus} />
      <StyledRowContent>{content}</StyledRowContent>
    </StyledRowLine>
  );
};
