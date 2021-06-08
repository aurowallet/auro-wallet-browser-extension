import './App.scss';
import { getAllRouter as AllRouter } from './router';
import IdleTimer from 'react-idle-timer'
import { sendMsg } from '../utils/commonMsg';
import { WALLET_RESET_LAST_ACTIVE_TIME } from '../constant/types';

function setLastActiveTime(){ 
  sendMsg({
    action: WALLET_RESET_LAST_ACTIVE_TIME,
  }, () => {})
}

function App() {
  return (
    <div className="App">
      <IdleTimer onAction={setLastActiveTime} throttle={1000}>
      <header className="App-header">
        <AllRouter />
      </header>
      </IdleTimer>
    </div>
  );
}
export default App;



