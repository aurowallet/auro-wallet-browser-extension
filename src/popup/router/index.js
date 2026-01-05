import React from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
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
import {BackupTips} from '../pages/BackupTips';
import CreatePassword from '../pages/CreatePassword';
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




export function getAllRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<MainRouter />} />
        <Route path="/create_password" element={<CreatePassword />} />
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

        <Route path="/lock_page" element={<LockPage />} />
        <Route path="/about_us" element={<AboutUs />} />
        <Route path="/network_page" element={<NetworkPage />} />
        <Route path="/account_name" element={<AccountName />} />
        <Route path="/reset_password" element={<ResetPassword />} />
        <Route path="/backup_tips" element={<BackupTips />} />

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
        <Route path="/vault_debug" element={<VaultDebug />} />
      </Routes>
    </HashRouter>
  );
}
