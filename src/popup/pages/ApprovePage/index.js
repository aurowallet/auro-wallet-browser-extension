import { ENTRY_WITCH_ROUTE } from "@/reducers/entryRouteReducer";
import { updateApproveStatus } from "@/reducers/popupReducer";
import i18n from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  DAPP_ACTION_CLOSE_WINDOW,
  DAPP_ACTION_GET_ACCOUNT,
  DAPP_GET_CURRENT_ACCOUNT_CONNECT_STATUS,
  GET_APPROVE_PARAMS,
} from "../../../constant/msgTypes";
import { sendMsg } from "../../../utils/commonMsg";
import { addressSlice } from "../../../utils/utils";
import Button, { button_size, button_theme } from "../../component/Button";
import DappWebsite from "../../component/DappWebsite";
import styles from "./index.module.scss";
import { REQUEST_TAB_MESSION } from "@/constant/storageKey";
import { getLocal, saveLocal } from "@/background/localStorage";
import browser from "webextension-polyfill";

const ApprovePage = () => {
  const dispatch = useDispatch();

  const currentAccount = useSelector(
    (state) => state.accountInfo.currentAccount
  );
  const entryWitchRoute = useSelector(
    (state) => state.entryRouteReducer.entryWitchRoute
  );

  const [params, setParams] = useState({});
  const [hasTabPermission, setHasTabPermission] = useState(false);

  useEffect(() => {
    sendMsg(
      {
        action: GET_APPROVE_PARAMS,
      },
      (data) => {
        setParams(data);
      }
    );
  }, []);

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

  useEffect(() => {
    browser.permissions
      .contains({
        permissions: ["tabs"],
      })
      .then((result) => {
        setHasTabPermission(result);
      });
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
      }
    );
  }, [currentAccount, params]);

  const onConfirm = useCallback(() => {
    let request = getLocal(REQUEST_TAB_MESSION);
    if (!hasTabPermission && !request) {
      browser.permissions
        .request({
          permissions: ["tabs"],
        })
        .then((granted) => {
          if (granted) {
            console.log("Tabs permission granted");
          } else {
            console.log("Tabs permission denied");
            saveLocal(REQUEST_TAB_MESSION, true);
          }
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
            }
          );
        });
      return;
    }

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
      }
    );
  }, [params, currentAccount, hasTabPermission]);

  const showAccountInfo = useMemo(() => {
    return (
      currentAccount.accountName +
      "(" +
      addressSlice(currentAccount.address, 6) +
      ")"
    );
  }, [currentAccount]);

  return (
    <div className={styles.container}>
      <div className={styles.titleRow}>
        <p className={styles.title}>{i18n.t("connectionRequest")}</p>
      </div>
      <div className={styles.content}>
        <div className={styles.websiteContainer}>
          <DappWebsite
            siteIcon={params?.site?.webIcon}
            siteUrl={params?.site?.origin}
          />
        </div>
        <p className={styles.accountTip}>{i18n.t("approveTip") + ":"}</p>
        <p className={styles.accountAddress}>{showAccountInfo}</p>
      </div>
      <div className={styles.bottomView}>
        <p className={styles.warningTip}>{i18n.t("approveWaring")}</p>
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
