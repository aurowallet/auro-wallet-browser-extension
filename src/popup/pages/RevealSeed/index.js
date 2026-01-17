import { SEC_FROM_TYPE } from "../../../constant/commonType";
import { WALLET_GET_MNE, WALLET_GET_KEYRING_MNEMONIC } from "../../../constant/msgTypes";
import { sendMsg } from "../../../utils/commonMsg";
import SecurityPwd from "../../component/SecurityPwd";
import Toast from "../../component/Toast";
import i18n from "i18next";
import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Button from "../../component/Button";
import CustomView from "../../component/CustomView";
import { MneItem } from "../ShowMnemonic";
import {
  StyledBackTitle,
  StyledMneContainer,
  StyledPlaceholder,
  StyledBottomContainer,
  StyledMneReminderContainer,
  StyledMneReminderTop,
  StyledMneReminderTitle,
  StyledMneReminderContent,
} from "./index.styled";

const RevealSeedPage = ({}) => {

  const navigate = useNavigate();
  const location = useLocation();
  const { keyringId } = location.state || {};
  const [mneList, setMneList] = useState([]);
  const [showSecurity, setShowSecurity] = useState(true);

  const onClickCheck = useCallback(
    (password) => {
      const action = keyringId ? WALLET_GET_KEYRING_MNEMONIC : WALLET_GET_MNE;
      const payload = keyringId ? { keyringId, password } : { password };

      sendMsg({ action, payload }, async (result) => {
        if (result && result.error) {
          if (result.type === "local") {
            Toast.info(i18n.t(result.error));
          } else {
            Toast.info(result.error);
          }
        } else {
          const mnemonic =
            typeof result === "string" ? result : result.mnemonic;
          let list = mnemonic.split(" ");
          setMneList(list);
          setShowSecurity(false);
        }
      });
    },
    [keyringId]
  );

  const goToNext = useCallback(() => {
    navigate(-1);
  }, []);

  if (showSecurity) {
    return (
      <SecurityPwd
        onClickCheck={onClickCheck}
        action={SEC_FROM_TYPE.SEC_SHOW_MNEMONIC}
      />
    );
  }

  return (
    <CustomView title={i18n.t("backupMnemonicPhrase")}>
      <StyledBackTitle>{i18n.t("revealMneTip")}</StyledBackTitle>
      <StyledMneContainer>
        {mneList.map((mne, index) => {
          return <MneItem key={index} mne={mne} index={index} />;
        })}
      </StyledMneContainer>
      <StyledPlaceholder />
      <StyledMneReminderContainer>
        <StyledMneReminderTop>
          <img src="/img/icon_error.svg" />
          <StyledMneReminderTitle>{i18n.t("mneReminder")}</StyledMneReminderTitle>
        </StyledMneReminderTop>
        <StyledMneReminderContent>
          {i18n.t("mneReminderContent")}
        </StyledMneReminderContent>
      </StyledMneReminderContainer>
      <StyledBottomContainer>
        <Button onClick={goToNext}>{i18n.t("done")}</Button>
      </StyledBottomContainer>
    </CustomView>
  );
};

export default RevealSeedPage;