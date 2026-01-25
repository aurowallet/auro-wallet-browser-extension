import i18n from "i18next";
import { useCallback, useEffect, useState } from "react";
import { useAppSelector } from "@/hooks/useStore";
import {
  DAPP_CONNECTION_LIST,
  DAPP_DISCONNECT_SITE,
} from "../../../constant/msgTypes";
import { sendMsg } from "../../../utils/commonMsg";
import CustomView from "../../component/CustomView";
import Toast from "../../component/Toast";
import {
  StyledRowContainer,
  StyledEmptyContainer,
  StyledEmptyIcon,
  StyledNoDAppTip,
} from "./index.styled";

const AppConnection = () => {
  const currentAddress = useAppSelector(
    (state) => state.accountInfo.currentAccount.address
  );
  const [connectList, setConnectList] = useState<string[]>([]);

  useEffect(() => {
    sendMsg(
      {
        action: DAPP_CONNECTION_LIST,
        payload: {
          address: currentAddress,
        },
      },
      (list: string[]) => {
        setConnectList(list);
      }
    );
  }, []);

  const onDeleteConnect = useCallback(
    (item: string, index: number) => {
      sendMsg(
        {
          action: DAPP_DISCONNECT_SITE,
          payload: {
            siteUrl: item,
            address: currentAddress,
          },
        },
        (status) => {
          if (status) {
            let newList = [...connectList];
            newList.splice(index, 1);
            setConnectList(newList);
          } else {
            Toast.info(i18n.t("disconnectFailed"));
          }
        }
      );
    },
    [connectList, i18n, currentAddress]
  );

  return (
    <CustomView title={i18n.t("appConnection")}>
      {connectList.length === 0 ? (
        <StyledEmptyContainer>
          <StyledEmptyIcon src="/img/icon_empty.svg" />
          <StyledNoDAppTip>{i18n.t("noConnectedApps")}</StyledNoDAppTip>
        </StyledEmptyContainer>
      ) : (
        <>
          {connectList.map((item, index) => {
            return (
              <StyledRowContainer key={index}>
                <span>{item}</span>
                <img
                  src="/img/icon_delete.svg"
                  onClick={() => onDeleteConnect(item, index)}
                />
              </StyledRowContainer>
            );
          })}
        </>
      )}
    </CustomView>
  );
};

export default AppConnection;
