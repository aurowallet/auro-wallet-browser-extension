import i18n from "i18next";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "@/hooks/useStore";
import styled from "styled-components";
import { getBalanceBatch } from "../../../background/api";
import { MAIN_COIN_CONFIG } from "../../../constant";
import { ACCOUNT_TYPE } from "../../../constant/commonType";
import { getDefaultHDWalletName, VAULT_VERSION } from "../../../constant/vaultTypes";
import type {
  AccountInfo,
  UIKeyring,
  KeyringAccountItem,
  GetAllAccountResponse,
  GetVaultVersionResponse,
} from "../../types/account";
import {
  DAPP_CHANGE_CONNECTING_ADDRESS,
  WALLET_ADD_ACCOUNT_TO_KEYRING,
  WALLET_CHANGE_CURRENT_ACCOUNT,
  WALLET_GET_ALL_ACCOUNT,
  WALLET_GET_CURRENT_ACCOUNT,
  WALLET_GET_KEYRINGS_LIST,
  WALLET_GET_VAULT_VERSION,
  WALLET_SET_UNLOCKED_STATUS,
  WALLET_TRY_UPGRADE_VAULT,
} from "../../../constant/msgTypes";
import {
  updateAccountList,
  updateCurrentAccount,
} from "../../../reducers/accountReducer";
import {
  setAccountInfo,
  setKeyringInfo,
  updateAccountTypeCount,
} from "../../../reducers/cache";
import { sendMsg } from "../../../utils/commonMsg";
import { createOrActivateTab } from "../../../utils/popup";
import { addressSlice, amountDecimals } from "../../../utils/utils";
import CustomView from "../../component/CustomView";
import Loading from "../../component/Loading";
import Toast from "../../component/Toast";
import VaultUpgradeModal from "../../component/VaultUpgradeModal";
import {
  StyledContentClassName,
  StyledContentContainer,
  StyledRowCommonContainer,
  StyledAccountRow,
  StyledAccountRowLeft,
  StyledAccountName,
  StyledAccountType,
  StyledAddress,
  StyledAccountBalanceRow,
  StyledAccountBalance,
  StyledPointMenuContainer,
  StyledPointMenu,
  StyledIconContainer,
  StyledLockBtn,
  StyledKeyringGroup,
  StyledKeyringHeader,
  StyledKeyringName,
  StyledKeyringMenu,
  StyledKeyringAccounts,
  StyledKeyringAccountRow,
  StyledRowLeft,
  StyledKeyringAccountName,
  StyledKeyringAddress,
  StyledKeyringBalance,
  StyledKeyringPointMenuContainer,
  StyledKeyringPointMenu,
  StyledNotSupportContainer,
  StyledNotSupportTitle,
  StyledAddWalletBtnContainer,
  StyledAddWalletBtn,
  StyledKeyringRightContainer,
  StyledSkeletonGroup,
  StyledSkeletonHeader,
  StyledSkeletonHeaderBar,
  StyledSkeletonRow,
  StyledSkeletonLine,
  StyledSkeletonLineTall,
} from "./index.styled";

const AccountManagePage = () => {
  const currentAddress = useAppSelector(
    (state) => state.accountInfo.currentAccount.address
  );
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isFirstRender = useRef(true);

  const [commonAccountList, setCommonAccountList] = useState<AccountInfo[]>([]);
  const [watchModeAccountList, setWatchModeAccountList] = useState<AccountInfo[]>([]);
  const [keyringsList, setKeyringsList] = useState<UIKeyring[]>([]);
  const [useKeyringView, setUseKeyringView] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [vaultVersion, setVaultVersion] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeStatus, setUpgradeStatus] = useState("idle"); // idle, loading, failed
  const [upgradeSource, setUpgradeSource] = useState<string | null>(null); // "addWallet" or "addAccount"

  const getAccountTypeIndex = useCallback((list: AccountInfo[]) => {
    if (list.length === 0) {
      return 1;
    } else {
      const lastItem = list[list.length - 1];
      const lastIndex = lastItem?.typeIndex;
      return (typeof lastIndex === 'number' ? lastIndex : parseInt(String(lastIndex || '0'))) + 1;
    }
  }, []);

  const fetchBalance = useCallback(async (addressList: string[]) => {
    let tempBalanceList = await getBalanceBatch(addressList);
    dispatch(updateAccountList(tempBalanceList));
  }, [dispatch]);

  const onUpdateAccountTypeCount = useCallback((allAccountList: AccountInfo[]) => {
    let createAccountTypeList = allAccountList.filter(
      (item) => item.type === ACCOUNT_TYPE.WALLET_INSIDE
    );
    let createAccountCount = getAccountTypeIndex(createAccountTypeList);

    let importAccountTypeList = allAccountList.filter(
      (item) => item.type === ACCOUNT_TYPE.WALLET_OUTSIDE
    );
    let importAccountCount = getAccountTypeIndex(importAccountTypeList);

    let ledgerAccountTypeList = allAccountList.filter(
      (item) => item.type === ACCOUNT_TYPE.WALLET_LEDGER
    );
    let ledgerAccountCount = getAccountTypeIndex(ledgerAccountTypeList);
    dispatch(
      updateAccountTypeCount({
        create: createAccountCount,
        import: importAccountCount,
        ledger: ledgerAccountCount,
      })
    );
  }, [dispatch, getAccountTypeIndex]);

  // Refetch keyrings data when navigating back to this page
  const fetchKeyringsData = useCallback(() => {
    // Re-sync currentAccount from backend to guard against stale Redux state
    sendMsg({ action: WALLET_GET_CURRENT_ACCOUNT }, (currentAccountResult: AccountInfo) => {
      if (currentAccountResult?.address) {
        dispatch(updateCurrentAccount(currentAccountResult));
      }
    });
    sendMsg({ action: WALLET_GET_VAULT_VERSION }, (versionResult: GetVaultVersionResponse) => {
      const version = versionResult?.version || "v1";
      setVaultVersion(version);

      if (version === `v${VAULT_VERSION}`) {
        sendMsg({ action: WALLET_GET_KEYRINGS_LIST }, (result: { keyrings?: UIKeyring[] }) => {
          if (result.keyrings && result.keyrings.length > 0) {
            setKeyringsList(result.keyrings);
            setUseKeyringView(true);
            const allAddresses = result.keyrings.flatMap((kr: UIKeyring) =>
              kr.accounts.map((acc: KeyringAccountItem) => acc.address)
            );
            fetchBalance(allAddresses);
          }
        });
      }
    });
  }, [fetchBalance, dispatch]);

  // Refresh data when location changes (e.g., navigating back from WalletDetails)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    fetchKeyringsData();
  }, [location.key]);

  useEffect(() => {
    // Get vault version first
    sendMsg({ action: WALLET_GET_VAULT_VERSION }, (versionResult: GetVaultVersionResponse) => {
      const version = versionResult?.version || "v1";
      setVaultVersion(version);

      if (version === `v${VAULT_VERSION}`) {
        // V3: Use keyrings list directly
        sendMsg({ action: WALLET_GET_KEYRINGS_LIST }, (result: { keyrings?: UIKeyring[] }) => {
          if (result.keyrings && result.keyrings.length > 0) {
            setKeyringsList(result.keyrings);
            setUseKeyringView(true);
            const allAddresses = result.keyrings.flatMap((kr: UIKeyring) =>
              kr.accounts.map((acc: KeyringAccountItem) => acc.address)
            );
            fetchBalance(allAddresses);
          }
          setPageLoading(false);
        });
      } else {
        // V1: Convert accounts to keyring-like structure for unified UI
        sendMsg({ action: WALLET_GET_ALL_ACCOUNT }, async (account: { accounts: GetAllAccountResponse }) => {
          let listData = account.accounts;
          onUpdateAccountTypeCount(listData.allList || []);
          setCommonAccountList(listData.commonList || []);
          setWatchModeAccountList((listData as any).watchList || []);

          // Convert to keyring-like structure for unified UI
          const hdAccounts = (listData.commonList || []).filter(
            (acc: AccountInfo) => acc.type === ACCOUNT_TYPE.WALLET_INSIDE
          );
          const importedAccounts = (listData.commonList || []).filter(
            (acc: AccountInfo) => acc.type === ACCOUNT_TYPE.WALLET_OUTSIDE
          );
          const ledgerAccounts = (listData.commonList || []).filter(
            (acc: AccountInfo) => acc.type === ACCOUNT_TYPE.WALLET_LEDGER
          );

          const convertedKeyrings = [];

          if (hdAccounts.length > 0) {
            convertedKeyrings.push({
              id: "v1-hd",
              type: "hd",
              name: getDefaultHDWalletName(1),
              canAddAccount: true,
              accounts: hdAccounts.map((acc: AccountInfo) => ({
                address: acc.address,
                name: acc.accountName || '',
                hdIndex: acc.hdPath,
                type: acc.type,
              })),
            });
          }

          if (importedAccounts.length > 0) {
            convertedKeyrings.push({
              id: "v1-imported",
              type: "imported",
              name: i18n.t("privateKey"),
              canAddAccount: false,
              accounts: importedAccounts.map((acc: AccountInfo) => ({
                address: acc.address,
                name: acc.accountName || '',
                type: acc.type,
              })),
            });
          }

          if (ledgerAccounts.length > 0) {
            convertedKeyrings.push({
              id: "v1-ledger",
              type: "ledger",
              name: i18n.t("hardwareWallet"),
              canAddAccount: false,
              accounts: ledgerAccounts.map((acc: AccountInfo) => ({
                address: acc.address,
                name: acc.accountName || '',
                hdIndex: acc.hdPath,
                type: acc.type,
              })),
            });
          }

          setKeyringsList(convertedKeyrings);
          setUseKeyringView(true);

          let addressList = (listData.allList || []).map((item: AccountInfo) => item.address);
          fetchBalance(addressList);
          setPageLoading(false);
        });
      }
    });
  }, []);

  const onAddAccountToKeyring = useCallback(
    (keyringId: string) => {
      // For V1 vault, show upgrade modal instead
      if (vaultVersion === "v1") {
        setUpgradeSource("addAccount");
        setShowUpgradeModal(true);
        setUpgradeStatus("idle");
        return;
      }

      Loading.show();
      sendMsg(
        {
          action: WALLET_ADD_ACCOUNT_TO_KEYRING,
          payload: { keyringId },
        },
        (result: { error?: string; account?: AccountInfo }) => {
          Loading.hide();
          if (result.error) {
            Toast.info(i18n.t(result.error));
            return;
          }
          // Refresh keyrings list
          sendMsg({ action: WALLET_GET_KEYRINGS_LIST }, (res: { keyrings?: UIKeyring[] }) => {
            if (res.keyrings) {
              setKeyringsList(res.keyrings);
              if (result.account) {
                dispatch(updateCurrentAccount(result.account));
              }
            }
          });
        }
      );
    },
    [vaultVersion]
  );

  const onGoAddWallet = useCallback(() => {
    // Check vault version before allowing add wallet
    sendMsg({ action: WALLET_GET_VAULT_VERSION }, (result: GetVaultVersionResponse) => {
      if (result.version === "v1") {
        setVaultVersion("v1");
        setUpgradeSource("addWallet");
        setShowUpgradeModal(true);
        setUpgradeStatus("idle");
      } else {
        createOrActivateTab("popup.html?addWallet=true#/register_page");
        window.close();
      }
    });
  }, []);

  const onCloseUpgradeModal = useCallback(() => {
    setShowUpgradeModal(false);
    setUpgradeStatus("idle");
  }, []);

  const onUpgradeVault = useCallback(() => {
    setUpgradeStatus("loading");
    sendMsg({ action: WALLET_TRY_UPGRADE_VAULT }, (result: { success?: boolean }) => {
      if (result.success) {
        setShowUpgradeModal(false);
        setUpgradeStatus("idle");
        setVaultVersion(`v${VAULT_VERSION}`);
        
        sendMsg({ action: WALLET_GET_KEYRINGS_LIST }, (res: { keyrings?: UIKeyring[] }) => {
          if (res.keyrings && res.keyrings.length > 0) {
            setKeyringsList(res.keyrings);
            setUseKeyringView(true);
            
            if (upgradeSource === "addWallet") {
              createOrActivateTab("popup.html?addWallet=true#/register_page");
              window.close();
            } else if (upgradeSource === "addAccount") {
              const hdKeyring = res.keyrings.find((kr: UIKeyring) => kr.type === "hd");
              if (hdKeyring) {
                Loading.show();
                sendMsg(
                  {
                    action: WALLET_ADD_ACCOUNT_TO_KEYRING,
                    payload: { keyringId: hdKeyring.id },
                  },
                  (addResult: { error?: string; account?: AccountInfo }) => {
                    Loading.hide();
                    if (addResult.error) {
                      Toast.info(i18n.t(addResult.error));
                    } else {
                      sendMsg({ action: WALLET_GET_KEYRINGS_LIST }, (refreshRes: { keyrings?: UIKeyring[] }) => {
                        if (refreshRes.keyrings && addResult.account) {
                          setKeyringsList(refreshRes.keyrings);
                          dispatch(updateCurrentAccount(addResult.account));
                        }
                      });
                    }
                  }
                );
              }
            }
          }
        });
        
        // Reset upgrade source
        setUpgradeSource(null);
      } else {
        setUpgradeStatus("failed");
      }
    });
  }, [upgradeSource, dispatch]);

  const onClickLock = useCallback(() => {
    sendMsg(
      {
        action: WALLET_SET_UNLOCKED_STATUS,
        payload: { status: false },
      },
      () => {}
    );
  }, []);

  const goToAccountInfo = useCallback((item: AccountInfo | KeyringAccountItem) => {
    dispatch(setAccountInfo(item));
    navigate("/account_info");
  }, [dispatch, navigate]);

  const goToWalletDetails = useCallback((keyring: UIKeyring) => {
    dispatch(
      setKeyringInfo({
        id: keyring.id,
        name: keyring.name,
        type: keyring.type,
        vaultVersion: vaultVersion,
      })
    );
    navigate("/wallet_details");
  }, [dispatch, navigate, vaultVersion]);

  const onClickAccount = useCallback(
    (item: AccountInfo | KeyringAccountItem) => {
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
            payload: { address: item.address },
          },
          (account: GetAllAccountResponse & { accountList?: AccountInfo[] }) => {
            Loading.hide();
            // Handle both response formats: { accountList: { allList } } and { accountList: [] }
            const hasAccounts = account.currentAccount && (
              (account.accountList && Array.isArray(account.accountList) && account.accountList.length > 0) ||
              (account.accountList && 'allList' in account.accountList && (account.accountList as { allList?: AccountInfo[] }).allList?.length)
            );
            if (hasAccounts) {
              dispatch(updateCurrentAccount(account.currentAccount as AccountInfo));
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
    [currentAddress, goToAccountInfo]
  );

  return (
    <CustomView
      title={i18n.t("accountManage")}
      ContentWrapper={StyledContentClassName}
      rightComponent={
        <StyledLockBtn onClick={onClickLock}>{i18n.t("lock")}</StyledLockBtn>
      }
    >
      <StyledContentContainer>
        {pageLoading ? (
          <AccountListSkeleton />
        ) : useKeyringView ? (
          <>
            {keyringsList.map((keyring) => (
              <KeyringGroup
                key={keyring.id}
                keyring={keyring}
                currentAddress={currentAddress}
                onClickAccount={onClickAccount}
                onAddAccount={onAddAccountToKeyring}
                goToAccountInfo={goToAccountInfo}
                goToWalletDetails={goToWalletDetails}
              />
            ))}
          </>
        ) : (
          <>
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
              <StyledNotSupportContainer>
                <StyledNotSupportTitle>
                  {i18n.t("noSupported")}
                </StyledNotSupportTitle>
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
              </StyledNotSupportContainer>
            )}
          </>
        )}
      </StyledContentContainer>
      {useKeyringView && (
        <StyledAddWalletBtnContainer>
          <StyledAddWalletBtn onClick={onGoAddWallet}>
            {i18n.t("addWallet")}
          </StyledAddWalletBtn>
        </StyledAddWalletBtnContainer>
      )}
      <VaultUpgradeModal
        modalVisible={showUpgradeModal}
        onClose={onCloseUpgradeModal}
        onUpgrade={onUpgradeVault}
        upgradeStatus={upgradeStatus}
      />
    </CustomView>
  );
};
const StyledAddAccountBtn = styled.div`
  color: #594af1;
  font-size: 14px;
  font-weight: 500;
  padding: 10px 20px;
  background-image: url("/img/addBorder.svg");
  background-size: cover;
  background-position: center;
  width: 100%;
  height: 37px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-sizing: border-box;

  &:hover {
    background-image: url("/img/addBorderHover.svg");
  }
`;
const StyledAddAccountBtnV2 = styled(StyledAddAccountBtn)`
  color: rgba(128, 128, 128, 1);
  &:hover {
    background-image: url("/img/addBorderHover.svg");
    color: #594af1;
  }
`;

const AccountListSkeleton = () => (
  <>
    {[1, 2].map((groupIdx) => (
      <StyledSkeletonGroup key={groupIdx}>
        <StyledSkeletonHeader>
          <StyledSkeletonHeaderBar />
        </StyledSkeletonHeader>
        {[1, 2].map((rowIdx) => (
          <StyledSkeletonRow key={rowIdx}>
            <StyledSkeletonLineTall $width="40%" />
            <StyledSkeletonLine $width="55%" />
            <StyledSkeletonLine $width="30%" />
          </StyledSkeletonRow>
        ))}
      </StyledSkeletonGroup>
    ))}
  </>
);

// Keyring Group Component for Multi-Wallet View
interface KeyringGroupProps {
  keyring: UIKeyring;
  currentAddress?: string;
  onClickAccount: (item: AccountInfo | KeyringAccountItem) => void;
  onAddAccount: (keyringId: string) => void;
  goToAccountInfo: (item: AccountInfo | KeyringAccountItem) => void;
  goToWalletDetails: (keyring: UIKeyring) => void;
}

const KeyringGroup = ({
  keyring,
  currentAddress,
  onClickAccount,
  onAddAccount,
  goToAccountInfo,
  goToWalletDetails,
}: KeyringGroupProps) => {
  const accountBalanceMap = useAppSelector(
    (state) => state.accountInfo.accountBalanceMap
  );

  const getBalance = useCallback(
    (address: string) => {
      const balanceMap = accountBalanceMap[address] as { balance?: { total?: string | number } } | undefined;
      if (balanceMap?.balance) {
        const balance = amountDecimals(
          balanceMap.balance?.total || 0,
          MAIN_COIN_CONFIG.decimals
        );
        return `${balance} ${MAIN_COIN_CONFIG.symbol}`;
      }
      return `0 ${MAIN_COIN_CONFIG.symbol}`;
    },
    [accountBalanceMap]
  );

  const getKeyringDisplayName = useCallback(
    (type: string) => {
      switch (type) {
        case "imported":
          return i18n.t("privateKey");
        case "ledger":
          return i18n.t("hardwareWallet");
        default:
          return keyring.name;
      }
    },
    [keyring.name]
  );

  const isHDKeyring = keyring.type === "hd";

  return (
    <StyledKeyringGroup>
      <StyledKeyringHeader>
        <StyledKeyringName>{getKeyringDisplayName(keyring.type)}</StyledKeyringName>
        {isHDKeyring && (
          <StyledKeyringMenu onClick={() => goToWalletDetails(keyring)}>
            <img src="/img/icon_more.svg" alt="menu" />
          </StyledKeyringMenu>
        )}
      </StyledKeyringHeader>
      <StyledKeyringAccounts>
        {keyring.accounts.map((account: KeyringAccountItem) => {
          const isSelect = account.address === currentAddress;
          return (
            <StyledKeyringAccountRow
              key={account.address}
              $isSelect={isSelect}
              onClick={() =>
                onClickAccount({ ...account, accountName: account.name })
              }
            >
              <StyledRowLeft>
                <StyledKeyringAccountName $isSelect={isSelect}>
                  {account.name}
                </StyledKeyringAccountName>
                <StyledKeyringAddress $isSelect={isSelect}>
                  {addressSlice(account.address)}
                </StyledKeyringAddress>
                <StyledKeyringBalance $isSelect={isSelect}>
                  {getBalance(account.address)}
                </StyledKeyringBalance>
              </StyledRowLeft>
              <StyledKeyringRightContainer>
              <StyledKeyringPointMenuContainer
                onClick={(e) => {
                  e.stopPropagation();
                  goToAccountInfo({
                    ...account,
                    accountName: account.name,
                    type: account.type,
                    hdPath: account.hdIndex,
                  });
                }}
              >
                <StyledKeyringPointMenu
                  src={isSelect ? "/img/pointMenu.svg" : "/img/pointMenu_dark.svg"}
                  alt="menu"
                />
              </StyledKeyringPointMenuContainer>
            </StyledKeyringRightContainer>
            </StyledKeyringAccountRow>
          );
        })}
        {keyring.canAddAccount && (
          <StyledAddAccountBtnV2 onClick={() => onAddAccount(keyring.id)}>
            {i18n.t("addAccount")}
          </StyledAddAccountBtnV2>
        )}
      </StyledKeyringAccounts>
    </StyledKeyringGroup>
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

const AddRow = () => {
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

interface CommonAccountRowProps {
  isSelect?: boolean;
  notSupport?: boolean;
  onClickAccount?: (item: AccountInfo) => void;
  account?: AccountInfo;
}

const CommonAccountRow = ({
  isSelect = false,
  notSupport = false,
  onClickAccount = () => {},
  account = {} as AccountInfo,
}: CommonAccountRowProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const accountBalanceMap = useAppSelector(
    (state) => state.accountInfo.accountBalanceMap
  );
  const { showBalance } = useMemo(() => {
    let showBalance: string | number = 0;
    const balanceMap = accountBalanceMap[account.address] as { balance?: { total?: string | number } } | undefined;
    if (balanceMap?.balance) {
      let balance = balanceMap.balance.total || 0;
      balance = amountDecimals(balance, MAIN_COIN_CONFIG.decimals);
      showBalance = balance;
    }
    showBalance = showBalance + " " + MAIN_COIN_CONFIG.symbol;
    return {
      showBalance,
    };
  }, [accountBalanceMap, account.address]);

  const getAccountType = useCallback(
    (item: AccountInfo | KeyringAccountItem) => {
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

  const onClickMenu = useCallback((e: React.MouseEvent) => {
    goToAccountInfo();
    e.stopPropagation();
  }, [goToAccountInfo]);
  return (
    <StyledRowCommonContainer
      onClick={onClickItem}
      $isSelect={isSelect}
      $notSupport={notSupport}
      $canSelect={!notSupport && !isSelect}
    >
      <div>
        <StyledAccountRow>
          <StyledAccountRowLeft>
            <StyledAccountName $isSelect={isSelect}>
              {account.accountName}
            </StyledAccountName>
            {typeText && (
              <StyledAccountType $isSelect={isSelect}>
                {getAccountType(account)}
              </StyledAccountType>
            )}
          </StyledAccountRowLeft>
        </StyledAccountRow>
        <StyledAddress $isSelect={isSelect}>
          {addressSlice(account.address)}
        </StyledAddress>
        <StyledAccountBalanceRow>
          <StyledAccountBalance $isSelect={isSelect}>
            {showBalance}
          </StyledAccountBalance>
        </StyledAccountBalanceRow>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end" }}>
        <StyledIconContainer>
          {accountRightIcon && <img src={accountRightIcon} />}
        </StyledIconContainer>
        <StyledPointMenuContainer onClick={onClickMenu}>
          <StyledPointMenu src={menuIcon} />
        </StyledPointMenuContainer>
      </div>
    </StyledRowCommonContainer>
  );
};

export default AccountManagePage;
