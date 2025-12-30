import cls from "classnames";
import i18n from "i18next";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { MAIN_COIN_CONFIG } from "../../../constant";
import { getBalanceBatch } from "../../../background/api";
import { ACCOUNT_TYPE } from "../../../constant/commonType";
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
import { setAccountInfo, updateAccountTypeCount } from "../../../reducers/cache";
import { sendMsg } from "../../../utils/commonMsg";
import { addressSlice, amountDecimals, isNumber } from "../../../utils/utils";
import CustomView from "../../component/CustomView";
import Loading from "../../component/Loading";
import styles from "./index.module.scss";
import styled from "styled-components";

const AccountManagePage = ({}) => {
  const currentAddress = useSelector(
    (state) => state.accountInfo.currentAccount.address
  );
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isMounted = useRef(true);

  const [commonAccountList, setCommonAccountList] = useState([]);
  const [watchModeAccountList, setWatchModeAccountList] = useState([]);


  const getAccountTypeIndex = useCallback((list) => {
    if (list.length === 0) {
      return 1;
    } else {
      return parseInt(list[list.length - 1].typeIndex) + 1;
    }
  }, []);

  const fetchBalance = useCallback(
    async (addressList) => {
      let tempBalanceList = await getBalanceBatch(addressList);
      dispatch(updateAccountList(tempBalanceList));
    },
    []
  );

  const onUpdateAccountTypeCount = useCallback((allAccountList) => {
    let createAccountTypeList = allAccountList.filter((item) => {
      return item.type === ACCOUNT_TYPE.WALLET_INSIDE;
    });
    let createAccountCount = getAccountTypeIndex(createAccountTypeList);

    let importAccountTypeList = allAccountList.filter((item) => {
      return item.type === ACCOUNT_TYPE.WALLET_OUTSIDE;
    });
    let importAccountCount = getAccountTypeIndex(importAccountTypeList);

    let ledgerAccountTypeList = allAccountList.filter((item) => {
      return item.type === ACCOUNT_TYPE.WALLET_LEDGER;
    });
    let ledgerAccountCount = getAccountTypeIndex(ledgerAccountTypeList);
    dispatch(
      updateAccountTypeCount({
        create: createAccountCount,
        import: importAccountCount,
        ledger: ledgerAccountCount,
      })
    );
  }, []);
  useEffect(() => {
    sendMsg(
      {
        action: WALLET_GET_ALL_ACCOUNT,
      },
      async (account) => {
        let listData = account.accounts;
        onUpdateAccountTypeCount(listData.allList);
        setCommonAccountList(listData.commonList);
        setWatchModeAccountList(listData.watchList);

        let addressList = listData.allList.map((item) => {
          return item.address;
        });
        fetchBalance(addressList);
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
    navigate("/account_info");
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
              navigate(-1);
            }
          }
        );
      }
    },
    [currentAddress]
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
        <AddRow />
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
    </CustomView>
  );
};

const StyledAddRowWrapper = styled.div`
  color: var(--mainBlue, #594af1);
  font-size: 14px;
  font-weight: 500;

  margin-bottom: 20px;
  padding: 20px;

  background-image: url(${"/img/addBorder.svg"});
  background-size: cover;
  background-position: center;
  width: 100%;
  height: 57px;

  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;


  &:hover {
    background-image: url("/img/addBorderHover.svg");
  }
`;

const AddRow = ({}) => {
  const navigate = useNavigate();
  const onGoAdd = useCallback(() => {
    navigate("/add_account");
  }, []);
  return (
    <StyledAddRowWrapper onClick={onGoAdd}>
      {i18n.t("addAccount")}
    </StyledAddRowWrapper>
  );
};

const CommonAccountRow = ({
  isSelect = false,
  notSupport = false,
  onClickAccount = () => {},
  account = {},
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const accountBalanceMap = useSelector(
    (state) => state.accountInfo.accountBalanceMap
  );
  const{showBalance}= useMemo(()=>{
    let showBalance = 0
    let balanceMap = accountBalanceMap[account.address]
    if(balanceMap){
      let balance = balanceMap.balance.total;
        balance = amountDecimals(balance, MAIN_COIN_CONFIG.decimals);
        showBalance = balance
    }
    showBalance = showBalance + " " + MAIN_COIN_CONFIG.symbol;
    return {
      showBalance
    }
  },[accountBalanceMap,account.address])

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
    navigate("/account_info");
  }, [account]);

  const onClickMenu = useCallback((e) => {
    goToAccountInfo();
    e.stopPropagation();
  }, []);
  return (
    <div
      onClick={onClickItem}
      className={cls(styles.rowCommonContainer, {
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
