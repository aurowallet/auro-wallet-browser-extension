import cx from "classnames";
import React from "react";
import { connect } from "react-redux";
import { cointypes } from "../../../../config";
import create_wallet from "../../../assets/images/create_wallet.png";
import import_wallet from "../../../assets/images/import_wallet.png";
import ledger_wallet from "../../../assets/images/ledger_wallet.png";
import option from "../../../assets/images/option.png";
import select_account_no from "../../../assets/images/select_account_no.png";
import select_account_ok from "../../../assets/images/select_account_ok.png";
import { getBalanceBatch } from "../../../background/api";
import { ACCOUNT_NAME_FROM_TYPE } from "../../../constant/pageType";
import { MINA_CHANGE_CURRENT_ACCOUNT, MINA_GET_ALL_ACCOUNT, MINA_SET_UNLOCKED_STATUS } from "../../../constant/types";
import { ACCOUNT_TYPE } from "../../../constant/walletType";
import { getLanguage } from "../../../i18n";
import { updateCurrentAccount } from "../../../reducers/accountReducer";
import { setAccountInfo, setChangeAccountName, updateAccoutType } from "../../../reducers/cache";
import { ENTRY_WITCH_ROUTE, updateEntryWitchRoute } from "../../../reducers/entryRouteReducer";
import { sendMsg } from "../../../utils/commonMsg";
import { addressSlice, amountDecimals } from "../../../utils/utils";
import CustomView from "../../component/CustomView";
import "./index.scss";


class AccountManagePage extends React.Component {
  constructor(props) {
    super(props);
    let address = props.currentAccount.address
    this.state = {
      accountList: [{}, {}],
      currentAddress: address,
      balanceList:[]
    };
    this.isUnMounted = false;
  }

  componentDidMount() {
    sendMsg({
      action: MINA_GET_ALL_ACCOUNT,
    }, (account) => {
      this.callSetState({
        accountList: this.setListFilter(account.accounts),
        currentAddress: account.currentAddress
      },()=>{
        let addressList = this.state.accountList.map((item)=>{
          return item.address
        })
        this.fetchBalance(addressList)
      })
    })
    
  }
  componentWillUnmount(){
    this.isUnMounted = true;
  }
  callSetState=(data,callback)=>{
    if(!this.isUnMounted){
      this.setState({
        ...data
      },()=>{
        callback&&callback()
      })
    }
  }
  setBalance2Account=(accountList,balanceList)=>{
    for (let index = 0; index < accountList.length; index++) {
      const account = accountList[index];
      let accountBalance = balanceList[account.address]
      if(accountBalance.length>0){
        let balance = accountBalance[0].balance.total
        balance = amountDecimals(balance, cointypes.decimals)
        accountList[index].balance = balance
      }
    }
    return accountList
  }
  fetchBalance= async(addressList)=>{
    let balanceList = await getBalanceBatch(addressList)
    let list = this.setBalance2Account(this.state.accountList,balanceList)
    this.callSetState({
      accountList:list,
      balanceList
    })
  }
  setListFilter = (accountList) => {
    let newList = accountList
    let createList = newList.filter((item, index) => {
      return item.type === ACCOUNT_TYPE.WALLET_INSIDE
    })
    let importList = newList.filter((item, index) => {
      return item.type === ACCOUNT_TYPE.WALLET_OUTSIDE
    })
    let ledgerList = newList.filter((item, index) => {
      return item.type === ACCOUNT_TYPE.WALLET_LEDGER
    })
    return [...createList, ...importList,...ledgerList]
  }
  getAccountTypeIndex = (list) => {
    if (list.length === 0) {
      return 1
    } else {
      return parseInt(list[list.length - 1].typeIndex) + 1
    }
  }
  goToCreate = () => {
    let accountTypeList = this.state.accountList.filter((item, index) => {
      return item.type === ACCOUNT_TYPE.WALLET_INSIDE
    })

    let accountCount = this.getAccountTypeIndex(accountTypeList)
    this.props.setChangeAccountName({
      accountCount,
    })
    this.props.updateAccoutType(ACCOUNT_NAME_FROM_TYPE.INSIDE)
    this.props.history.push({
      pathname: "/account_name",
    });
  }
  goImport = () => {
    //在这里处理
    // 传递 账户数量就可以
    let accountTypeList = this.state.accountList.filter((item, index) => {
      return item.type === ACCOUNT_TYPE.WALLET_OUTSIDE
    })
    let accountCount = this.getAccountTypeIndex(accountTypeList)
    this.props.setChangeAccountName({
      accountCount,
    })
    this.props.history.push({
      pathname: "/import_page",
    });
  }
  goAddLedger=()=>{
    let accountTypeList = this.state.accountList.filter((item, index) => {
      return item.type === ACCOUNT_TYPE.WALLET_OUTSIDE
    })
    let accountCount = this.getAccountTypeIndex(accountTypeList)
    this.props.updateAccoutType(ACCOUNT_NAME_FROM_TYPE.LEDGER)
    this.props.setChangeAccountName({
      fromType: ACCOUNT_NAME_FROM_TYPE.LEDGER,
      accountCount
    })
    this.props.history.push({
      pathname: "/account_name",
    });
  }
  onClickAccount = (item) => {
    if (item.address !== this.state.currentAddress) {
      sendMsg({
        action: MINA_CHANGE_CURRENT_ACCOUNT,
        payload: item.address
      }, (account) => {
        if (account.accountList && account.accountList.length > 0) {
          this.props.updateCurrentAccount(account.currentAccount)
          let list = this.setListFilter(account.accountList)
          list = this.setBalance2Account(list,this.state.balanceList)
          this.callSetState({
            accountList: list,
            currentAddress: item.address
          })
        }
      })
    }
  }

  goToAccountInfo = (item) => {
    this.props.setAccountInfo(item)
    this.props.history.push({
      pathname: "/account_info",
    })

  }
  getAccountType=(item)=>{
    let typeText = ""
    switch (item.type) {
      case ACCOUNT_TYPE.WALLET_OUTSIDE:
        typeText = getLanguage('accountImport')
        break;
      case ACCOUNT_TYPE.WALLET_LEDGER:
        typeText = "Ledger"
          break;
      default:
        break;
    }
    return typeText
  }
  renderAcountItem = (item, index) => {
    let showSelect = this.state.currentAddress === item.address
    let imgSource = showSelect ? select_account_ok : select_account_no
    let showImport = this.getAccountType(item)
    let showBalance = item.balance|| 0  
    showBalance = showBalance + " " + cointypes.symbol 
    return (
      <div onClick={() => this.onClickAccount(item)}
        key={index + ""} className={"account-item-container click-cursor"}>
        {/* 左右 */}
        <div >
          <div className={"account-item-top"}>
            <p className={"account-item-name"}>{item.accountName}</p>
            <p className={cx({
              "account-item-type": showImport,
              "account-item-type-none": !showImport,
              "account-ledger-tip" : item.type === ACCOUNT_TYPE.WALLET_LEDGER
            })}>{showImport}</p>
          </div>
          <p className={"account-item-address"}>{addressSlice(item.address)}</p>
          <p className={"account-item-address account-item-balance"}>{showBalance}</p>
        </div>
        <div className={"account-item-right"}>
          <img
            src={imgSource} className={"account-item-select click-cursor"} />
          <div onClick={(e) => {
            this.goToAccountInfo(item)
            e.stopPropagation();
          }} className={"account-item-option-container click-cursor"}>
            <img
              src={option} className={"account-item-option"} />
          </div>
        </div>
      </div>
    )
  }
  renderAccountList = () => {
    return (
      <div className={"account-list-container"}>
        {this.state.accountList.map((item, index) => {
          return this.renderAcountItem(item, index)
        })}
      </div>
    )
  }
  renderImgBtn = (title, imgSource, callback) => {  
    return (<div onClick={() => callback && callback()}
      className={"account-btn-item click-cursor"}>
      <img className={"account-btn-img"} src={imgSource} />
      <p className={"account-btn-title"}>{title}</p>
    </div>)
  }
  renderButtomButton = () => {
    return (
      <div className={"account-btn-container"}>
        {this.renderImgBtn(getLanguage('createAccount'), create_wallet, this.goToCreate)}
        {this.renderImgBtn(getLanguage('importAccont'), import_wallet, this.goImport)}
        {this.renderImgBtn("Ledger", ledger_wallet, this.goAddLedger)}
      </div>
    )
  }
  onClickLock = () => {
    sendMsg({
      action: MINA_SET_UNLOCKED_STATUS,
      payload: false
    }, (res) => { })
    this.props.updateEntryWitchRoute(ENTRY_WITCH_ROUTE.LOCK_PAGE)
    this.props.history.push({
      pathname: "/",
    });
  }
  renderLockBtn = () => {
    return (
      <div onClick={this.onClickLock} className={"account-lock-container click-cursor"}>
        <p className={"account-lock"}>{getLanguage("lockTitle")}</p>
      </div>)
  }
  render() {
    return (
      <CustomView
        title={getLanguage('accountManage')}
        backRoute={"/homepage"}
        history={this.props.history}
        rightComponent={this.renderLockBtn()}>
        <div className={"account-manage-container"}>
          {this.renderAccountList()}
        </div>
        {this.renderButtomButton()}
      </CustomView>)
  }
}

const mapStateToProps = (state) => ({
  currentAccount: state.accountInfo.currentAccount,
});

function mapDispatchToProps(dispatch) {
  return {
    updateCurrentAccount: (account) => {
      dispatch(updateCurrentAccount(account))
    },
    setChangeAccountName: (info) => {
      dispatch(setChangeAccountName(info))
    },
    setAccountInfo: (account) => {
      dispatch(setAccountInfo(account))
    },
    updateEntryWitchRoute: (index) => {
      dispatch(updateEntryWitchRoute(index));
    },
    updateAccoutType:(type)=>{
      dispatch(updateAccoutType(type));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(AccountManagePage);
