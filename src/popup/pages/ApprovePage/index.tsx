import { updateCurrentAccount, type AccountData } from "@/reducers/accountReducer";
import { ENTRY_WITCH_ROUTE } from "@/reducers/entryRouteReducer";
import { updateApproveStatus } from "@/reducers/popupReducer";
import i18n from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useStore";
import {
  DAPP_ACTION_CLOSE_WINDOW,
  DAPP_ACTION_GET_ACCOUNT,
  DAPP_GET_CURRENT_ACCOUNT_CONNECT_STATUS,
  GET_APPROVE_PARAMS,
  WALLET_GET_CURRENT_ACCOUNT,
} from "../../../constant/msgTypes";
import { sendMsg, sendMsgV2 } from "../../../utils/commonMsg";
import { addressSlice } from "../../../utils/utils";
import Button, { button_size, button_theme } from "../../component/Button";
import DappWebsite from "../../component/DappWebsite";
import {
  StyledContainer,
  StyledTitleRow,
  StyledTitle,
  StyledContent,
  StyledAccountTip,
  StyledAccountAddress,
  StyledWarningTip,
  StyledBtnGroup,
  StyledBottomView,
} from "./index.styled";

const ApprovePage = () => {

  const dispatch = useAppDispatch();

  const currentAccount = useAppSelector(
    (state) => state.accountInfo.currentAccount
  );
  const entryWitchRoute = useAppSelector(
    (state) => state.entryRouteReducer.entryWitchRoute
  );

  interface ApproveParams {
    id?: string;
    site?: { origin?: string; webIcon?: string };
  }
  const [params, setParams] = useState<ApproveParams>({});

  const refreshCurrentAccount = useCallback(async (): Promise<AccountData | null> => {
    try {
      const latestAccount = await sendMsgV2<AccountData>({
        action: WALLET_GET_CURRENT_ACCOUNT,
      });
      if (latestAccount?.address) {
        dispatch(updateCurrentAccount(latestAccount));
        return latestAccount;
      }
    } catch {
    }
    return null;
  }, [dispatch]);

  useEffect(() => {
    sendMsg(
      {
        action: GET_APPROVE_PARAMS,
      },
      (data: ApproveParams) => {
        setParams(data);
      }
    );
  }, []);

  useEffect(() => {
    void refreshCurrentAccount();
  }, [refreshCurrentAccount]);

  const getConnectAfterLock = useCallback(() => {
    let siteUrl = params?.site?.origin || "";
    const address = currentAccount.address;
    sendMsg(
      {
        action: DAPP_GET_CURRENT_ACCOUNT_CONNECT_STATUS,
        payload: {
          siteUrl: siteUrl,
          currentAddress: address,
        },
      },
      async (currentAccountConnectStatus) => {
        if (currentAccountConnectStatus) {
          sendMsg(
            {
              action: DAPP_ACTION_CLOSE_WINDOW,
              payload: {
                account: address,
                resultOrigin: siteUrl,
                id: params.id,
              },
            },
            (res) => {
              dispatch(updateApproveStatus(false));
            }
          );
        }
      }
    );
  }, [currentAccount, params]);

  useEffect(() => {
    if (entryWitchRoute == ENTRY_WITCH_ROUTE.HOME_PAGE) {
      getConnectAfterLock();
    }
  }, [entryWitchRoute, getConnectAfterLock]);

  const onCancel = useCallback(() => {
    sendMsg(
      {
        action: DAPP_ACTION_GET_ACCOUNT,
        payload: {
          selectAccount: [],
          currentAddress: currentAccount.address,
          resultOrigin: params?.site?.origin,
          id: params?.id,
        },
      },
      async () => {
        dispatch(updateApproveStatus(false));
      }
    );
  }, [currentAccount, params]);

  const onConfirm = useCallback(async () => {
    const latestAccount = await refreshCurrentAccount();
    const approvedAccount = latestAccount?.address ? latestAccount : currentAccount;
    if (!approvedAccount?.address) {
      return;
    }
    const selectAccount = [approvedAccount];
    sendMsg(
      {
        action: DAPP_ACTION_GET_ACCOUNT,
        payload: {
          selectAccount,
          resultOrigin: params?.site?.origin,
          id: params.id,
        },
      },
      () => {
        dispatch(updateApproveStatus(false));
      }
    );
  }, [params, currentAccount, refreshCurrentAccount, dispatch]);

  const showAccountInfo = useMemo(() => {
    if (!currentAccount?.address) {
      return "--";
    }
    const accountName = currentAccount.accountName || i18n.t("account");
    return accountName + "(" + addressSlice(currentAccount.address, 6) + ")";
  }, [currentAccount]);

  return (
    <StyledContainer>
      <StyledTitleRow>
        <StyledTitle>{i18n.t("connectionRequest")}</StyledTitle>
      </StyledTitleRow>
      <StyledContent>
        <div>
          <DappWebsite
            siteIcon={params?.site?.webIcon}
            siteUrl={params?.site?.origin}
          />
        </div>
        <StyledAccountTip>{i18n.t("approveTip") + ":"}</StyledAccountTip>
        <StyledAccountAddress>{showAccountInfo}</StyledAccountAddress>
      </StyledContent>
      <StyledBottomView>
        <StyledWarningTip>{i18n.t("approveWaring")}</StyledWarningTip>
        <StyledBtnGroup>
          <Button
            onClick={onCancel}
            theme={button_theme.BUTTON_THEME_LIGHT}
            size={button_size.middle}
          >
            {i18n.t("cancel")}
          </Button>
          <Button size={button_size.middle} onClick={onConfirm}>
            {i18n.t("connect")}
          </Button>
        </StyledBtnGroup>
      </StyledBottomView>
    </StyledContainer>
  );
};

export default ApprovePage;
