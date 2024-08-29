import { updateApproveStatus } from "@/reducers/popupReducer";
import i18n from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  DAPP_ACTION_CLOSE_WINDOW,
  DAPP_ACTION_GET_ACCOUNT,
  DAPP_GET_CURRENT_ACCOUNT_CONNECT_STATUS,
  GET_APPROVE_PARAMS,
  WALLET_GET_CURRENT_ACCOUNT,
} from "../../../constant/msgTypes";
import { updateDAppOpenWindow } from "../../../reducers/cache";
import {
  ENTRY_WITCH_ROUTE,
  updateEntryWitchRoute,
} from "../../../reducers/entryRouteReducer";
import { sendMsg } from "../../../utils/commonMsg";
import { addressSlice } from "../../../utils/utils";
import Button, { button_size, button_theme } from "../../component/Button";
import DappWebsite from "../../component/DappWebsite";
import { LockPage } from "../Lock";
import styles from "./index.module.scss";

const ApprovePage = () => {
  const dispatch = useDispatch();

  const dappWindow = useSelector((state) => state.cache.dappWindow);
  const currentAccount = useSelector(
    (state) => state.accountInfo.currentAccount
  );

  const [lockStatus, setLockStatus] = useState(false);
  const [params, setParams] = useState({});

  useEffect(() => {
    sendMsg(
      {
        action: GET_APPROVE_PARAMS,
      },
      (data) => {
        setParams(data)
      }
    );
  }, []);

  const goToHome = useCallback(() => {
    let url = dappWindow?.url;
    if (url) {
      dispatch(updateEntryWitchRoute(ENTRY_WITCH_ROUTE.HOME_PAGE));
    }
    dispatch(updateDAppOpenWindow({}));
  }, [dappWindow]);

  useEffect(() => {
    sendMsg(
      {
        action: WALLET_GET_CURRENT_ACCOUNT,
      },
      async (currentAccount) => {
        setLockStatus(currentAccount.isUnlocked);
      }
    );
  }, []);

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
        goToHome();
      }
    );
  }, [currentAccount, goToHome, params]);

  const onConfirm = useCallback(() => {
    let selectAccount = [currentAccount];
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
        goToHome();
      }
    );
  }, [goToHome, params, currentAccount]);

  const onClickUnLock = useCallback((account) => {
    let siteUrl = params?.site?.origin || "";
    const address = account?.address||currentAccount.address
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
        } else {
          setLockStatus(true);
        }
      }
    );
  }, [currentAccount, params]);

  const showAccountInfo = useMemo(() => {
    return (
      currentAccount.accountName +
      "(" +
      addressSlice(currentAccount.address, 6) +
      ")"
    );
  }, [currentAccount]);

  if (!lockStatus) {
    return (
      <LockPage
        onDappConfirm={true}
        onClickUnLock={onClickUnLock}
      />
    );
  }
  return (
    <div className={styles.container}>
      <div className={styles.titleRow}>
        <p className={styles.title}>{i18n.t("connectionRequest")}</p>
      </div>
      <div className={styles.content}>
        <div className={styles.websiteContainer}>
          <DappWebsite siteIcon={params?.site?.webIcon} siteUrl={params?.site?.origin} />
        </div>
        <p className={styles.accountTip}>{i18n.t("approveTip") + ":"}</p>
        <p className={styles.accountAddress}>{showAccountInfo}</p>
      </div>
      <div className={styles.bottomView}>
      <p className={styles.warningTip}>{i18n.t('approveWaring')}</p>
        <div className={styles.btnGroup}>
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
        </div>
      </div>
    </div>
  );
};

export default ApprovePage;
