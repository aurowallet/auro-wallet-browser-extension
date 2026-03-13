import { WALLET_GET_CREATE_MNEMONIC } from "@/constant/msgTypes";
import Button from "@/popup/component/Button";
import { MneItemV2 } from "@/popup/component/MneItem";
import ProcessLayout from "@/popup/component/ProcessLayout";
import Toast from "@/popup/component/Toast";
import { sendMsg } from "@/utils/commonMsg";
import { parseMnemonicWords } from "@/utils/utils";
import i18n from "i18next";
import { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import type { ProcessViewProps } from "../../types/common";
import { BackupMneTip } from "./BackupMneTip";

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

type MnemonicViewProps = ProcessViewProps;

export const MnemonicView = ({
  onClickPre,
  onClickNext,
}: MnemonicViewProps) => {
  const [agree, setAgree] = useState(false);
  const onClickAgree = useCallback(() => {
    setAgree(true);
  }, []);
  const [mneList, setMneList] = useState<string[]>([]);
  const onClickPreRef = useRef(onClickPre);
  useEffect(() => { onClickPreRef.current = onClickPre; }, [onClickPre]);

  useEffect(() => {
    return () => {
      setMneList([]);
    };
  }, []);

  useEffect(() => {
    if (!agree) return;
    if (mneList.length > 0) return;

    sendMsg(
      {
        action: WALLET_GET_CREATE_MNEMONIC,
        payload: {
          isNewMne: true,
        },
      },
      (mnemonic: string) => {
        const list = parseMnemonicWords(mnemonic || "");
        if (list.length === 0) {
          Toast.info(i18n.t("tryAgain"));
          onClickPreRef.current?.();
          return;
        }
        setMneList(list);
      },
      () => {
        Toast.info(i18n.t("tryAgain"));
        onClickPreRef.current?.();
      }
    );
  }, [agree, mneList.length]);

  if (!agree) {
    return <BackupMneTip onClickNext={onClickAgree} onClickPre={onClickPre} />;
  }
  return (
    <ProcessLayout
      onClickBack={onClickPre}
      title={i18n.t("backupMnemonicPhrase")}
      bottomContent={
        <Button disable={mneList.length === 0} onClick={onClickNext}>
          {i18n.t("show_seed_button")}
        </Button>
      }
    >
      <StyledMneTip>{i18n.t("revealMneTip")}</StyledMneTip>
      <StyledMneContainer>
        {mneList.map((mne, index) => {
          return <MneItemV2 key={index} mne={mne} index={index} />;
        })}
      </StyledMneContainer>
    </ProcessLayout>
  );
};
