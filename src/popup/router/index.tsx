import React, { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { StyledAppHeader } from '../App.styled';
import browser from 'webextension-polyfill';
import { FROM_BACK_TO_RECORD, WALLET_GET_CREATE_FLOW_STATE, WORKER_ACTIONS } from '../../constant/msgTypes';
import { useAppDispatch, useAppSelector } from '@/hooks/useStore';
import { updatePopupLockStatus } from '../../reducers/cache';
import { ENTRY_WITCH_ROUTE, updateEntryWitchRoute } from '../../reducers/entryRouteReducer';
import MainRouter from '../pages';
import AboutUs from '../pages/AboutUs';
import AccountInfo from '../pages/AccountInfo';
import AccountManagePage from '../pages/AccountManage';
import AccountName from '../pages/AccountName';
import AddressBook from '../pages/AddressBook';
import AddressEditor from '../pages/AddressBook/AddressEditor';
import CredentialManage from '../pages/CredentialManage';
import CredentialDetail from '../pages/CredentialManage/CredentialDetail';
import AppConnection from '../pages/AppConnection';
import ApprovePage from '../pages/ApprovePage';
import AutoLock from '../pages/AutoLock';
import {BackupMnemonics} from '../pages/BackupMnemonics';
import {BackupSuccess} from '../pages/BackupSuccess';
import CurrencyUnit from '../pages/CurrencyUnit';
import ImportAccount from '../pages/ImportAccount';
import ImportKeypair from '../pages/ImportKeypair';
import LanguageManagement from '../pages/LanguageManage';
import { LedgerPage } from '../pages/LedgerPage';
import {LockPage} from '../pages/Lock';
import HomePage from '../pages/Main';
import NetworkPage from '../pages/Networks';
import NodeEditor from '../pages/Networks/NodeEditor';
import ReceivePage from '../pages/Receive';
import RecordPage from '../pages/Record';
import ResetPassword from '../pages/ResetPassword';
import RestoreAccount from '../pages/RestoreAccount';
import RevealSeedPage from '../pages/RevealSeed';
import SecurityPage from '../pages/Security';
import SendPage from '../pages/Send';
import Setting from '../pages/Setting';
import {ShowMnemonic} from '../pages/ShowMnemonic';
import ShowPrivateKeyPage from '../pages/ShowPrivateKey';
import SignTransaction from "../pages/SignTransaction";
import Staking from '../pages/Staking';
import StakingList from '../pages/StakingList';
import StakingTransfer from '../pages/StakingTransfer';
import Welcome from '../pages/Welcome';
import { CreateProcessPage } from '../pages/CreateProcessPage';
import AddAccount from '../pages/AddAccount';
import TokenDetail from '../pages/TokenDetail';
import TokenSignPage from '../pages/Send/tokenSign';

import Preferences from '../pages/Preferences';
import DevPage from '../pages/DevPage';
import DevDetailPage from '../pages/DevPage/DevDetail';
import VaultDebug from '../pages/DevPage/VaultDebug';
import WalletDetails from '../pages/WalletDetails';
import { sendMsgV2 } from '@/utils/commonMsg';

const FULL_PAGE_ROUTES = ["/ledger_page", "/register_page", "/createprocess"];
const ZK_PAGE_ROUTES = ["/approve_page", "/request_sign", "/token_sign"];

interface CreateFlowState {
  hasExistingWallet: boolean;
  isUnlocked: boolean;
}

const LockListener = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const syncCurrentLockStatus = async () => {
      try {
        const state = await sendMsgV2<CreateFlowState>({
          action: WALLET_GET_CREATE_FLOW_STATE,
        });
        const isLocked = !!state?.hasExistingWallet && !state?.isUnlocked;
        if (isLocked) {
          dispatch(updateEntryWitchRoute(ENTRY_WITCH_ROUTE.LOCK_PAGE));
        } else if (state?.hasExistingWallet) {
          dispatch(updateEntryWitchRoute(ENTRY_WITCH_ROUTE.HOME_PAGE));
        }
        dispatch(updatePopupLockStatus(isLocked));
      } catch (e) {
        console.warn('[LockListener] syncCurrentLockStatus failed:', e);
      }
    };

    void syncCurrentLockStatus();

    const lockEvent = (
      message: { type: string; action: string; payload?: boolean },
      _sender: browser.Runtime.MessageSender,
      sendResponse: () => void
    ) => {
      const { type, action, payload } = message;
      if (type === FROM_BACK_TO_RECORD && action === WORKER_ACTIONS.SET_LOCK) {
        const isLocked = !payload;
        if (isLocked) {
          dispatch(updateEntryWitchRoute(ENTRY_WITCH_ROUTE.LOCK_PAGE));
        } else {
          dispatch(updateEntryWitchRoute(ENTRY_WITCH_ROUTE.HOME_PAGE));
        }
        dispatch(updatePopupLockStatus(isLocked));
        sendResponse();
        return true;
      }
      return false;
    };
    browser.runtime.onMessage.addListener(
      lockEvent as Parameters<typeof browser.runtime.onMessage.addListener>[0]
    );
    return () => {
      browser.runtime.onMessage.removeListener(
        lockEvent as Parameters<typeof browser.runtime.onMessage.removeListener>[0]
      );
    };
  }, [dispatch]);

  return null;
};

const LockGate = () => {
  const popupLockStatus = useAppSelector((state) => state.cache.popupLockStatus);

  if (!popupLockStatus) {
    return null;
  }

  return createPortal(
    <LockPage />,
    document.body
  );
};

const LayoutShell = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  const showFull = useMemo(() => {
    const isPopup = window.location.pathname.indexOf("popup.html") !== -1;
    const isNotification = window.location.pathname.indexOf("notification.html") !== -1;
    const isFullPage = FULL_PAGE_ROUTES.some((route) => location.pathname.startsWith(route));
    return (!isPopup || isFullPage) && !isNotification;
  }, [location.pathname]);

  const autoWidth = useMemo(() => {
    return ZK_PAGE_ROUTES.some((route) => location.pathname.startsWith(route));
  }, [location.pathname]);

  return (
    <StyledAppHeader $showFull={showFull} $autoWidth={autoWidth}>
      {children}
      <LockGate />
      <div id="app-overlay-container" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
    </StyledAppHeader>
  );
};

export function getAllRouter() {
  return (
    <HashRouter>
      <LayoutShell>
      <LockListener />
      <Routes>
        <Route path="/" element={<MainRouter />} />
        <Route path="/show_mnemonic" element={<ShowMnemonic />} />
        <Route path="/backup_mnemonic" element={<BackupMnemonics />} />
        <Route path="/backup_success" element={<BackupSuccess />} />
        <Route path="/homepage" element={<HomePage />} />
        <Route path="/send_page" element={<SendPage />} />
        <Route path="/receive_page" element={<ReceivePage />} />
        <Route path="/record_page" element={<RecordPage />} />
        <Route path="/restore_account" element={<RestoreAccount />} />
        <Route path="/import_account" element={<ImportAccount />} />

        <Route path="/account_manage" element={<AccountManagePage />} />
        <Route path="/account_info" element={<AccountInfo />} />
        <Route path="/security_page" element={<SecurityPage />} />
        <Route path="/language_management_page" element={<LanguageManagement />} />
        <Route path="/reveal_seed_page" element={<RevealSeedPage />} />
        <Route path="/show_privatekey_page" element={<ShowPrivateKeyPage />} />

        <Route path="/about_us" element={<AboutUs />} />
        <Route path="/network_page" element={<NetworkPage />} />
        <Route path="/account_name" element={<AccountName />} />
        <Route path="/reset_password" element={<ResetPassword />} />

        <Route path="/staking" element={<Staking />} />
        <Route path="/staking_list" element={<StakingList />} />
        <Route path="/staking_transfer" element={<StakingTransfer />} />

        <Route path="/import_keypair" element={<ImportKeypair />} />

        <Route path="/setting" element={<Setting />} />
        <Route path="/address_book" element={<AddressBook />} />
        <Route path="/currency_unit" element={<CurrencyUnit />} />
        <Route path="/register_page" element={<Welcome />} />

        <Route path="/request_sign" element={<SignTransaction />} />
        <Route path="/approve_page" element={<ApprovePage />} />
        <Route path="/token_sign" element={<TokenSignPage />} />
        
        <Route path="/app_connection" element={<AppConnection />} />
        <Route path="/auto_lock" element={<AutoLock />} />
        <Route path="/address_editor" element={<AddressEditor />} />
        <Route path="/node_editor" element={<NodeEditor />} />
        <Route path="/ledger_page" element={<LedgerPage />} />

        <Route path="/createprocess" element={<CreateProcessPage />} />
        <Route path="/add_account" element={<AddAccount />} />
        
        <Route path="/token_detail" element={<TokenDetail />} />

        <Route path="/credential_manage" element={<CredentialManage />} />
        <Route path="/credential_detail" element={<CredentialDetail />} />

        <Route path="/preferences_page" element={<Preferences />} />
        <Route path="/devpage" element={<DevPage />} />
        <Route path="/dev_detail_page" element={<DevDetailPage />} />
        {process.env.NODE_ENV === 'development' && (
          <Route path="/vault_debug" element={<VaultDebug />} />
        )}
        <Route path="/wallet_details" element={<WalletDetails />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </LayoutShell>
    </HashRouter>
  );
}
