import i18n from "i18next";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { WALLET_GET_CREATE_MNEMONIC } from "../../../constant/msgTypes";
import { sendMsg } from "../../../utils/commonMsg";
import BottomBtn from "../../component/BottomBtn";
import CustomView from "../../component/CustomView";
import {
  StyledBackTitle,
  StyledMneContainer,
  StyledMneItemContainer,
  StyledMneIndex,
  StyledMneItem,
} from "./index.styled";

export const ShowMnemonic = () => {
  const [mneList, setMneList] = useState<string[]>([]);


  useEffect(() => {
    sendMsg(
      {
        action: WALLET_GET_CREATE_MNEMONIC,
        payload: {
          isNewMne: true,
        },
      },
      (mnemonic: string) => {
        let list = mnemonic.split(" ");
        setMneList(list);
      }
    );
  }, []);

  const navigate = useNavigate();
  const goToNext = useCallback(() => {
    navigate("/backup_mnemonic");
  }, []);

  return (
    <CustomView title={i18n.t("backupMnemonicPhrase")}>
      <StyledBackTitle>{i18n.t("revealMneTip")}</StyledBackTitle>
      <StyledMneContainer>
        {mneList.map((mne, index) => {
          return <MneItem key={index} mne={mne} index={index} />;
        })}
      </StyledMneContainer>
      <BottomBtn
        onClick={goToNext}
        rightBtnContent={i18n.t("show_seed_button")}
      />
    </CustomView>
  );
};

interface MneItemProps {
  mne?: string;
  index?: number;
  canClick?: boolean;
  onClick?: () => void;
  contentColorStatus?: boolean;
}

export const MneItem = ({
  mne = "",
  index = 0,
  canClick = false,
  onClick = () => {},
  contentColorStatus = false,
}: MneItemProps) => {
  const [showSmallMne] = useState(mne.length >= 8);
  return (
    <StyledMneItemContainer
      $clickable={canClick}
      $colorStatus={contentColorStatus}
      onClick={onClick}
    >
      <StyledMneIndex $small={showSmallMne} $colorStatus={contentColorStatus}>
        {index + 1 + "."}
      </StyledMneIndex>
      <StyledMneItem $small={showSmallMne}>{mne}</StyledMneItem>
    </StyledMneItemContainer>
  );
};