import i18n from "i18next";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AUTO_LOCK_TIME_LIST } from "../../../constant";
import { WALLET_GET_LOCK_TIME, WALLET_UPDATE_LOCK_TIME } from "../../../constant/msgTypes";
import { sendMsg } from "../../../utils/commonMsg";
import CustomView from "../../component/CustomView";
import { StyledContentContainer, StyledRowContainer } from "./index.styled";

const AutoLock = () => {
  const [currentLockDuration, setCurrentLockDuration] = useState<string | number>();
  const navigate = useNavigate();

  const onSelect = useCallback((data: { label: string; value: string | number }) => {
    setCurrentLockDuration(data.value);
    sendMsg(
      {
        action: WALLET_UPDATE_LOCK_TIME,
        payload: { value: data.value },
      },
      () => {
        navigate(-1);
      }
    );
  }, []);

  useEffect(() => {
    sendMsg(
      {
        action: WALLET_GET_LOCK_TIME,
      },
      (data: string | number) => {
        setCurrentLockDuration(data);
      }
    );
  }, []);

  return (
    <CustomView title={i18n.t("autoLock")} ContentWrapper={StyledContentContainer}>
      {AUTO_LOCK_TIME_LIST.map((item, index) => {
        let isChecked = currentLockDuration === item.value;
        return (
          <StyledRowContainer key={index} onClick={() => onSelect(item)}>
            <span>{i18n.t(item.label)}</span>
            {isChecked && <img src="/img/icon_checked.svg" />}
          </StyledRowContainer>
        );
      })}
    </CustomView>
  );
};

export default AutoLock;