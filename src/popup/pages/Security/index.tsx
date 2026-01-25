import { AUTO_LOCK_TIME_LIST } from "@/constant";
import { WALLET_GET_LOCK_TIME } from "@/constant/msgTypes";
import { sendMsg } from "@/utils/commonMsg";
import i18n from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import CustomView from "../../component/CustomView";
import {
  StyledContainer,
  StyledRowContainer,
  StyledRowTitle,
  StyledRowLeft,
  StyledRowContent,
} from "./index.styled";

const Security = () => {

  const navigate = useNavigate();

  const [currentLockTime, setCurrentLockTime] = useState<string | number>("");
  useEffect(() => {
    sendMsg(
      {
        action: WALLET_GET_LOCK_TIME,
      },
      (time: string | number) => {
        setCurrentLockTime(time);
      }
    );
  }, []);
  const { displayLockTime } = useMemo(() => {
    let displayLockTime = "";
    let lockTime = AUTO_LOCK_TIME_LIST.filter((time) => {
      return time.value === currentLockTime;
    });
    if (lockTime.length > 0) {
      let lockTimeItem = lockTime[0];
      displayLockTime = lockTimeItem ? i18n.t(lockTimeItem.label) : "";
    }

    return {
      displayLockTime,
    };
  }, [i18n, currentLockTime]);

  const goToPage = useCallback((nextRoute: string) => {
    navigate(nextRoute);
  }, []);

  return (
    <CustomView title={i18n.t("security")} ContentWrapper={StyledContainer}>
      <RowItem
        title={i18n.t("changePassword")}
        onClickItem={() => goToPage("/reset_password")}
      />
      <RowItem
        title={i18n.t("autoLock")}
        content={displayLockTime}
        onClickItem={() => {
          goToPage("/auto_lock");
        }}
      />
    </CustomView>
  );
};

const RowItem = ({ title = "", content = "", onClickItem = () => {} }) => {
  return (
    <StyledRowContainer onClick={onClickItem}>
      <div>
        <StyledRowTitle>{title}</StyledRowTitle>
      </div>
      <StyledRowLeft>
        <StyledRowContent>{content}</StyledRowContent>
        <img src="/img/icon_arrow.svg" />
      </StyledRowLeft>
    </StyledRowContainer>
  );
};

export default Security;
