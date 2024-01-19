import { WALLET_GET_CREATE_MNEMONIC } from "@/constant/msgTypes";
import Button from "@/popup/component/Button";
import { MneItemV2 } from "@/popup/component/MneItem";
import { sendMsg } from "@/utils/commonMsg";
import i18n from "i18next";
import { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import { BackView } from ".";
import { BackupMneTip } from "./BackupMneTip";

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
  width: 600px;
  bottom: 30px;
  left: 50%;
  transform: translate(-50%);
`;

const StyledMneTip = styled.div`
  font-weight: 500;
  font-size: 14px;
  line-height: 17px;
  color: var(--mineBlack);
  margin: 10px 0 0;
`;
const StyledMneContainer = styled.div`
  margin-top: 20px;
  display: grid;
  max-width: 408px;
  grid-template-columns: 1fr 1fr 1fr;
  grid-row-gap: 12px;
  grid-column-gap: 20px;
`;

export const MnemonicView = ({ onClickPre, onClickNext }) => {
  const [agree, setAgree] = useState(false);
  const onClickAgree = useCallback(() => {
    setAgree(true);
  }, []);
  const [mneList, setMneList] = useState([]);

  useEffect(() => {
    sendMsg(
      {
        action: WALLET_GET_CREATE_MNEMONIC,
        payload: {
          isNewMne: true,
        },
      },
      (mnemonic) => {
        let list = mnemonic.split(" ");
        setMneList(list);
      }
    );
  }, []);

  if (!agree) {
    return <BackupMneTip onClickNext={onClickAgree} onClickPre={onClickPre} />;
  }
  return (
    <StyledPwdContainer>
      <BackView onClickBack={onClickPre} />
      <StyledPwdContentContainer>
        <StyledProcessTitle>
          {i18n.t("backupMnemonicPhrase")}
        </StyledProcessTitle>
        <StyledMneTip>{i18n.t("revealMneTip")}</StyledMneTip>
        <StyledMneContainer>
          {mneList.map((mne, index) => {
            return <MneItemV2 key={index} mne={mne} index={index} />;
          })}
        </StyledMneContainer>
      </StyledPwdContentContainer>
      <StyledBottomContainer>
        <Button onClick={onClickNext}>{i18n.t("show_seed_button")}</Button>
      </StyledBottomContainer>
    </StyledPwdContainer>
  );
};
