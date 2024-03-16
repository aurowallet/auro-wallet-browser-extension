import cls from "classnames";
import i18n from "i18next";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import { MAIN_COIN_CONFIG } from "../../../constant";
import { getBalanceBatch } from "../../../background/api";
import {
  ACCOUNT_NAME_FROM_TYPE,
  ACCOUNT_TYPE,
} from "../../../constant/commonType";
import {
  DAPP_CHANGE_CONNECTING_ADDRESS,
  WALLET_CHANGE_CURRENT_ACCOUNT,
  WALLET_GET_ALL_ACCOUNT,
  WALLET_SET_UNLOCKED_STATUS,
} from "../../../constant/msgTypes";
import {
  updateAccountList,
  updateCurrentAccount,
} from "../../../reducers/accountReducer";
import {
  setAccountInfo,
  setChangeAccountName,
  updateAccoutType,
} from "../../../reducers/cache";
import { sendMsg } from "../../../utils/commonMsg";
import { addressSlice, amountDecimals, isNumber } from "../../../utils/utils";
import Button, { button_size } from "../../component/Button";
import CustomView from "../../component/CustomView";
import Loading from "../../component/Loading";
import Toast from "../../component/Toast";
import styles from "./index.module.scss";
import extension from "extensionizer";

const AccountManagePage = ({}) => {
  // 更新一下 ui
  const dispatch = useDispatch();
  const history = useHistory();
  const isMounted = useRef(true);

  const accountBalanceMap = useSelector(
    (state) => state.accountInfo.accountBalanceMap
  );
  const [accountList, setAccountList] = useState([]);
  const [commonAccountList, setCommonAccountList] = useState([]);
  const [watchModeAccountList, setWatchModeAccountList] = useState([]);
  const [balanceList, setBalanceList] = useState(accountBalanceMap || {});

  const [currentAddress, setCurrentAddress] = useState("");
  useEffect(() => {
    setBalanceList(accountBalanceMap);
  }, [accountBalanceMap]);

  const setBalanceMap = useCallback(
    (commonAccountList, watchModeAccountList, balanceList) => {
      let tempCommonAccountList = setBalance2Account(
        commonAccountList,
        balanceList
      );
      let tempWatchModeAccountList = setBalance2Account(
        watchModeAccountList,
        balanceList
      );
      setCommonAccountList(tempCommonAccountList);
      setWatchModeAccountList(tempWatchModeAccountList);
    },
    []
  );

  useEffect(() => {
    let keys = Object.keys(balanceList);
    if (keys.length > 0) {
      setBalanceMap(commonAccountList, watchModeAccountList, balanceList);
    }
  }, [balanceList, commonAccountList, watchModeAccountList]);

  const getAccountTypeIndex = useCallback((list) => {
    if (list.length === 0) {
      return 1;
    } else {
      return parseInt(list[list.length - 1].typeIndex) + 1;
    }
  }, []);

  const goAddLedger = useCallback(() => {
    const isLedgerCapable = !window || (window && !window.USB);
    if (isLedgerCapable) {
      Toast.info(i18n.t("ledgerNotSupport"));
      return;
    }
    let accountTypeList = accountList.filter((item, index) => {
      return item.type === ACCOUNT_TYPE.WALLET_LEDGER;
    });
    let accountCount = getAccountTypeIndex(accountTypeList);
    dispatch(updateAccoutType(ACCOUNT_NAME_FROM_TYPE.LEDGER));
    dispatch(
      setChangeAccountName({
        fromType: ACCOUNT_NAME_FROM_TYPE.LEDGER,
        accountCount,
      })
    );
    extension.tabs.create({
      url: "popup.html#/ledger_page",
    });
  }, [i18n, accountList]);

  const goImport = useCallback(() => {
    let accountTypeList = accountList.filter((item, index) => {
      return item.type === ACCOUNT_TYPE.WALLET_OUTSIDE;
    });
    let accountCount = getAccountTypeIndex(accountTypeList);
    dispatch(
      setChangeAccountName({
        accountCount,
      })
    );
    history.push("import_page");
  }, [accountList]);

  const goToCreate = useCallback(() => {
    let accountTypeList = accountList.filter((item, index) => {
      return item.type === ACCOUNT_TYPE.WALLET_INSIDE;
    });

    let accountCount = getAccountTypeIndex(accountTypeList);
    dispatch(setChangeAccountName({ accountCount }));
    dispatch(updateAccoutType(ACCOUNT_NAME_FROM_TYPE.INSIDE));
    history.push("/account_name");
  }, [accountList]);

  const setBalance2Account = useCallback((accountList, balanceList) => {
    if (balanceList && Object.keys(balanceList).length === 0) {
      return accountList;
    }
    for (let index = 0; index < accountList.length; index++) {
      const account = accountList[index];
      let accountBalance = balanceList[account.address];
      if (accountBalance) {
        let balance = accountBalance.balance.total;
        balance = amountDecimals(balance, MAIN_COIN_CONFIG.decimals);
        accountList[index].balance = balance;
      }
    }
    return accountList;
  }, []);

  const fetchBalance = useCallback(
    async (addressList, commonAccountList, watchModeAccountList) => {
      let tempBalanceList = await getBalanceBatch(addressList);
      dispatch(updateAccountList(tempBalanceList));
      if (isMounted.current) {
        setBalanceMap(commonAccountList, watchModeAccountList, tempBalanceList);
      }
    },
    []
  );

  useEffect(() => {
    sendMsg(
      {
        action: WALLET_GET_ALL_ACCOUNT,
      },
      async (account) => {
        let listData = account.accounts;
        setAccountList(listData.allList);
        setCommonAccountList(listData.commonList);
        setWatchModeAccountList(listData.watchList);
        setCurrentAddress(account.currentAddress);

        let addressList = listData.allList.map((item) => {
          return item.address;
        });
        fetchBalance(addressList, listData.commonList, listData.watchList);
      }
    );
  }, []);

  const onClickLock = useCallback(() => {
    sendMsg(
      {
        action: WALLET_SET_UNLOCKED_STATUS,
        payload: false,
      },
      (res) => {}
    );
  }, []);

  const goToAccountInfo = useCallback((item) => {
    dispatch(setAccountInfo(item));
    history.push("/account_info");
  }, []);

  const onClickAccount = useCallback(
    (item) => {
      if (item.type === ACCOUNT_TYPE.WALLET_WATCH) {
        goToAccountInfo(item);
        return;
      }
      let oldAddress = currentAddress;
      if (item.address !== currentAddress) {
        Loading.show();
        sendMsg(
          {
            action: WALLET_CHANGE_CURRENT_ACCOUNT,
            payload: item.address,
          },
          (account) => {
            Loading.hide();
            let listData = account.accountList;
            if (listData.allList && listData.allList.length > 0) {
              dispatch(updateCurrentAccount(account.currentAccount));
              let commonList = setBalance2Account(
                listData.commonList,
                balanceList
              );
              let watchList = setBalance2Account(
                listData.watchList,
                balanceList
              );

              setAccountList(listData.allList);
              setCommonAccountList(commonList);
              setWatchModeAccountList(watchList);
              setCurrentAddress(account.currentAddress);
              sendMsg(
                {
                  action: DAPP_CHANGE_CONNECTING_ADDRESS,
                  payload: {
                    address: oldAddress,
                    currentAddress: item.address,
                  },
                },
                (status) => {}
              );
            }
          }
        );
      }
    },
    [currentAddress, balanceList]
  );

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  return (
    <CustomView
      title={i18n.t("accountManage")}
      customContainerClass={styles.customContainerClass}
      contentClassName={styles.contentClassName}
      rightComponent={
        <p className={styles.lockBtn} onClick={onClickLock}>
          {i18n.t("lock")}
        </p>
      }
    >
      <div className={styles.contentContainer}>
        {commonAccountList.map((item, index) => {
          let isSelect = item.address === currentAddress;
          return (
            <CommonAccountRow
              onClickAccount={onClickAccount}
              isSelect={isSelect}
              key={index}
              account={item}
            />
          );
        })}
        {watchModeAccountList.length > 0 && (
          <div className={styles.notSupportContainer}>
            <p className={styles.notSupportTitle}>{i18n.t("noSupported")}</p>
            {watchModeAccountList.map((item, index) => {
              return (
                <CommonAccountRow
                  onClickAccount={onClickAccount}
                  key={index}
                  notSupport={true}
                  isSelect={false}
                  account={item}
                />
              );
            })}
          </div>
        )}
      </div>
      <div className={styles.btnGroup}>
        <AccountBtn
          onClick={goToCreate}
          leftIcon={"/img/import.svg"}
          title={i18n.t("create")}
        />
        <AccountBtn
          onClick={goImport}
          className={styles.whiteBtn}
          leftIcon={"/img/create.svg"}
          title={i18n.t("import")}
        />
        <AccountBtn
          onClick={goAddLedger}
          className={styles.whiteBtn}
          leftIcon={"/img/ledger.svg"}
          title={"Ledger"}
        />
      </div>
    </CustomView>
  );
};

const AccountBtn = ({
  leftIcon,
  title,
  onClick = () => {},
  className = "",
}) => {
  return (
    <Button
      size={button_size.middle}
      className={cls(styles.btnContainer, className)}
      leftIcon={leftIcon}
      onClick={onClick}
    >
      {title}
    </Button>
  );
};

const CommonAccountRow = ({
  isSelect = false,
  notSupport = false,
  onClickAccount = () => {},
  account = {},
}) => {
  const dispatch = useDispatch();
  const history = useHistory();

  const [showBalance, setShowBalance] = useState(0);

  useEffect(() => {
    let balance = isNumber(account.balance) ? account.balance : 0;
    balance = balance + " " + MAIN_COIN_CONFIG.symbol;
    setShowBalance(balance);
  }, [account.balance]);

  const getAccountType = useCallback(
    (item) => {
      let typeText = "";
      switch (item.type) {
        case ACCOUNT_TYPE.WALLET_OUTSIDE:
          typeText = i18n.t("imported");
          break;
        case ACCOUNT_TYPE.WALLET_LEDGER:
          typeText = "Ledger";
          break;
        case ACCOUNT_TYPE.WALLET_WATCH:
          typeText = i18n.t("watch");
          break;
        default:
          break;
      }
      return typeText;
    },
    [i18n]
  );

  const { menuIcon, accountRightIcon, typeText } = useMemo(() => {
    let menuIcon = isSelect ? "/img/pointMenu.svg" : "/img/pointMenu_dark.svg";
    let accountRightIcon = "";
    if (notSupport) {
      accountRightIcon = "/img/icon_warning.svg";
    } else {
      if (isSelect) {
        accountRightIcon = "/img/icon_checked_white.svg";
      }
    }
    let typeText = getAccountType(account);
    return {
      menuIcon,
      accountRightIcon,
      typeText,
    };
  }, [isSelect, notSupport, account, account.balance]);

  const onClickItem = useCallback(() => {
    onClickAccount(account);
  }, [account, onClickAccount]);

  const goToAccountInfo = useCallback(() => {
    dispatch(setAccountInfo(account));
    history.push("/account_info");
  }, [account]);

  const onClickMenu = useCallback((e) => {
    goToAccountInfo();
    e.stopPropagation();
  }, []);
  return (
    <div
      onClick={onClickItem}
      className={cls(styles.rowCommomContainer, {
        [styles.rowSelected]: isSelect,
        [styles.rowNotSupport]: notSupport,
        [styles.rowCanSelect]: !notSupport && !isSelect,
      })}
    >
      <div className={styles.rowLeft}>
        <div className={styles.accountRow}>
          <div className={styles.accountRowLeft}>
            <p
              className={cls(styles.accountName, {
                [styles.accountNameSelected]: isSelect,
              })}
            >
              {account.accountName}
            </p>
            {typeText && (
              <div
                className={cls(styles.accountType, {
                  [styles.accountTypeSelected]: isSelect,
                })}
              >
                {getAccountType(account)}
              </div>
            )}
          </div>
        </div>
        <p
          className={cls(styles.address, {
            [styles.addressSelected]: isSelect,
          })}
        >
          {addressSlice(account.address)}
        </p>
        <div className={styles.accountBalanceRow}>
          <p
            className={cls(styles.accountBalance, {
              [styles.accountBalanceSelected]: isSelect,
            })}
          >
            {showBalance}
          </p>
        </div>
      </div>
      <div className={styles.rowRight}>
        <div className={styles.iconContainer}>
          {accountRightIcon && <img src={accountRightIcon} />}
        </div>
        <div onClick={onClickMenu} className={styles.pointMenuContainer}>
          <img src={menuIcon} className={styles.pointMenu} />
        </div>
      </div>
    </div>
  );
};

export default AccountManagePage;
