import i18n from "i18next";
import { useCallback, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import BottomBtn from "../../component/BottomBtn";
import {
  StyledContainer,
  StyledBackupTitle,
  StyledBackupContent,
  StyledBottomContainer,
} from "./index.styled";

export const BackupSuccess = () => {

  const navigate = useNavigate();
  const location = useLocation();
  const { showTip } = useMemo(() => {
    let type = location?.state?.type ?? "";

    let showTip = "";
    if (type === "restore") {
      showTip = "backup_success_restore";
    } else if (type === "ledger") {
      showTip = "ledgerSuccessTip";
    } else {
      showTip = "backup_success";
    }

    return {
      showTip,
    };
  }, [location]);

  const goToNext = useCallback(() => {
    navigate("/homepage");
  }, [navigate]);

  return (
    <StyledContainer>
      <img src="/img/backup_success.svg" />
      <StyledBackupTitle>{i18n.t("success")}</StyledBackupTitle>
      <StyledBackupContent>{i18n.t(showTip)}</StyledBackupContent>
      <BottomBtn
        containerClass={StyledBottomContainer}
        onClick={goToNext}
        rightBtnContent={i18n.t("start")}
      />
    </StyledContainer>
  );
};