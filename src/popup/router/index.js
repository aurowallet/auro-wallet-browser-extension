import React from 'react';
import { HashRouter, Route, Switch, useHistory } from 'react-router-dom';
import MainRouter from '../pages';
import AboutUs from '../pages/AboutUs';
import AccountInfo from '../pages/AccountInfo';
import AccountManagePage from '../pages/AccountManage';
import AccountName from '../pages/AccountName';
import BackupMnemonics from '../pages/BackupMnemonics';
import BackupSuccess from '../pages/BackupSuccess';
import BackupTips from '../pages/BackupTips';
import CreatePassword from '../pages/CreatePassword';
import ImportAccount from '../pages/ImportAccount';
import InfoPage from '../pages/InfoPage';
import LanguageManagement from '../pages/LanguageManage';
import LockPage from '../pages/Lock';
import HomePage from '../pages/Main';
import NetworkPage from '../pages/Networks';
import ReceivePage from '../pages/Receive';
import RecordPage from '../pages/Record';
import ResetPassword from '../pages/ResetPassword';
import RestoreAccount from '../pages/RestoreAccount';
import RevealSeedPage from '../pages/RevealSeed';
import SecurityPage from '../pages/Security';
import SecurityPwdPage from '../pages/SecurityPwdPage';
import SendPage from '../pages/Send';
import ShowMnemonic from '../pages/ShowMnemonic';
import ShowPrivateKeyPage from '../pages/ShowPrivateKey';
import StakingList from '../pages/StakingList';
import StakingTransfer from '../pages/StakingTransfer';
import LedgerConnect from '../pages/LedgerConnect';
import LedgerImport from '../pages/LedgerImport';
import ImportPage from '../pages/ImportPage';
import ImportKeypair from '../pages/ImportKeypair';


export function getAllRouter() {
  return (
    <HashRouter useHistory={useHistory} >
      <Switch>
        {/*<Route path="/" exact component={LedgerImport} />*/}
        <Route path="/" exact component={MainRouter} />
        <Route path="/createpassword" component={CreatePassword} />
        <Route path="/showmnemonic" component={ShowMnemonic} />
        <Route path="/backupmnemonic" component={BackupMnemonics} />
        <Route path="/backupsuccess" component={BackupSuccess} />
        <Route path="/homepage" component={HomePage} />
        <Route path="/send_page" component={SendPage} />
        <Route path="/receive_page" component={ReceivePage} />
        <Route path="/record_page" component={RecordPage} />
        <Route path="/restore_account" component={RestoreAccount} />
        <Route path="/import_account" component={ImportAccount} />


        <Route path="/account_manage" component={AccountManagePage} />
        <Route path="/account_info" component={AccountInfo} />
        <Route path="/security_page" component={SecurityPage} />
        <Route path="/language_management_page" component={LanguageManagement} />
        <Route path="/reveal_seed_page" component={RevealSeedPage} />
        <Route path="/show_privatekey_page" component={ShowPrivateKeyPage} />
        <Route path="/security_pwd_page" component={SecurityPwdPage} />

        <Route path="/lock_page" component={LockPage} />
        <Route path="/info_page" component={InfoPage} />
        <Route path="/about_us" component={AboutUs} />
        <Route path="/network_page" component={NetworkPage} />
        <Route path="/account_name" component={AccountName} />
        <Route path="/reset_password" component={ResetPassword} />
        <Route path="/backup_tips" component={BackupTips} />

        <Route path="/stacking_list" component={StakingList} />
        <Route path="/stacking_transfer" component={StakingTransfer} />
        <Route path="/ledger_connect" component={LedgerConnect} />
        <Route path="/ledger_import" component={LedgerImport} />

        <Route path="/import_page" component={ImportPage} />
        <Route path="/import_keypair" component={ImportKeypair} />
        
      </Switch>
    </HashRouter>
  );
}
