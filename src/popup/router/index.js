import React from 'react';
import { HashRouter, Route, Switch, useHistory } from 'react-router-dom';
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
import LedgerConnect from '../pages/LedgerConnect';
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

import Perferences from '../pages/Perferences';
import DevPage from '../pages/DevPage';
import DevDetailPage from '../pages/DevPage/DevDetail';




export function getAllRouter() {
  return (
    <HashRouter useHistory={useHistory} >
      <Switch>
        <Route path="/" exact component={MainRouter} />
        <Route path="/create_password" component={CreatePassword} />
        <Route path="/show_mnemonic" component={ShowMnemonic} />
        <Route path="/backup_mnemonic" component={BackupMnemonics} />
        <Route path="/backup_success" component={BackupSuccess} />
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

        <Route path="/lock_page" component={LockPage} />
        <Route path="/about_us" component={AboutUs} />
        <Route path="/network_page" component={NetworkPage} />
        <Route path="/account_name" component={AccountName} />
        <Route path="/reset_password" component={ResetPassword} />
        <Route path="/backup_tips" component={BackupTips} />

        <Route path="/staking" component={Staking} />
        <Route path="/staking_list" component={StakingList} />
        <Route path="/staking_transfer" component={StakingTransfer} />
        <Route path="/ledger_connect" component={LedgerConnect} />

        <Route path="/import_keypair" component={ImportKeypair} />

        <Route path="/setting" component={Setting} />
        <Route path="/address_book" component={AddressBook} />
        <Route path="/currency_unit" component={CurrencyUnit} />
        <Route path="/register_page" component={Welcome} />

        <Route path="/request_sign" component={SignTransaction} />
        <Route path="/approve_page" component={ApprovePage} />
        <Route path="/token_sign" component={TokenSignPage} />
        
        <Route path={"/app_connection"} component={AppConnection}/>
        <Route path={"/auto_lock"} component={AutoLock}/>
        <Route path={"/address_editor"} component={AddressEditor}/>
        <Route path={"/node_editor"} component={NodeEditor}/>
        <Route path={"/ledger_page"} component={LedgerPage}/>

        <Route path={"/createprocess"} component={CreateProcessPage}/>
        <Route path={"/add_account"} component={AddAccount}/>
        
        <Route path={"/token_detail"} component={TokenDetail}/>

        <Route path="/credential_manage" component={CredentialManage} />
        <Route path={"/credential_detail"} component={CredentialDetail}/>

        <Route path="/perferences_page" component={Perferences} />
        <Route path="/devpage" component={DevPage} />
        <Route path="/dev_detail_page" component={DevDetailPage} />
      </Switch>
    </HashRouter>
  );
}
