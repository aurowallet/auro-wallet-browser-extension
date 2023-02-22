import './App.scss';
import { getAllRouter as AllRouter } from './router';
import IdleTimer from 'react-idle-timer'
import { sendMsg } from '../utils/commonMsg';
import { WALLET_RESET_LAST_ACTIVE_TIME } from '../constant/types';
import { useEffect, useState } from 'react';
import cls from "classnames"

function setLastActiveTime(){ 
  sendMsg({
    action: WALLET_RESET_LAST_ACTIVE_TIME,
  }, () => {})
}

function App() {
  const [showFullStatus,setShowFullStatus] = useState(false)
  useEffect(()=>{
    const url = new URL(window.location.href); 
    let dappIndex = url.href.indexOf('popup.html#/approve_page') !==-1 || url.href.indexOf('popup.html#/request_sign')!==-1
    let ledgerIndex = url.href.indexOf('popup.html#/ledger_connect') !==-1
    let ledgerPageIndex = url.href.indexOf('popup.html#/ledger_page') !==-1
    if (url.pathname.indexOf('popup.html') !==-1 && !dappIndex && !ledgerIndex && !ledgerPageIndex) {
      setShowFullStatus(false)
    }else{
      setShowFullStatus(true)
    }
  },[window.location.href])
  
  return (
    <div className="App">
      <IdleTimer onAction={setLastActiveTime} throttle={1000}>
      <header className={cls("App-header",{
          "App-header-full":showFullStatus
      })}>
        <AllRouter />
      </header>
      </IdleTimer>
    </div>
  );
}
export default App;



