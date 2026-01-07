import Button from "@/popup/component/Button";
import { CheckBox } from "@/popup/component/CheckBox";
import ProcessLayout from "@/popup/component/ProcessLayout";
import i18n from "i18next";
import { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
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
const StyledCheckList = styled.div``;

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
  margin-left: 10px;
`;

const RowCheckLine = ({ content, onClick, checkStatus }) => (
  <StyledRowLine onClick={onClick}>
    <CheckBox status={checkStatus} />
    <StyledRowContent>{content}</StyledRowContent>
  </StyledRowLine>
);

export const BackupMneTip = ({ onClickNext, onClickPre }) => {
  const [btnClick, setBtnClick] = useState(false);
  const [checkBox_1, setCheckBox_1] = useState(false);
  const [checkBox_2, setCheckBox_2] = useState(false);

  const onClickCheckbox_1 = useCallback(
    () => setCheckBox_1((prev) => !prev),
    []
  );
  const onClickCheckbox_2 = useCallback(
    () => setCheckBox_2((prev) => !prev),
    []
  );

  useEffect(() => {
    setBtnClick(checkBox_1 && checkBox_2);
  }, [checkBox_1, checkBox_2]);

  return (
    <ProcessLayout
      onClickBack={onClickPre}
      title={i18n.t("backupMnemonicPhrase")}
      bottomLeftContent={
        <StyledCheckList>
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
        </StyledCheckList>
      }
      bottomContent={
        <Button disable={!btnClick} onClick={onClickNext}>
          {i18n.t("next")}
        </Button>
      }
    >
      <StyledPageTip>{i18n.t("backTips_1")}</StyledPageTip>
      <StyledPageContent>{i18n.t("backTips_2")}</StyledPageContent>
      <StyledPageContent>{i18n.t("backTips_3")}</StyledPageContent>
    </ProcessLayout>
  );
};
