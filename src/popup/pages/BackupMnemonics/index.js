import cx from "classnames";
import React from "react";
import { connect } from "react-redux";
import { WALLET_GET_CREATE_MNEMONIC, WALLET_NEW_HD_ACCOUNT } from "../../../constant/types";
import { getLanguage } from "../../../i18n";
import { updateCurrentAccount } from "../../../reducers/accountReducer";
import { ENTRY_WITCH_ROUTE, updateEntryWitchRoute } from "../../../reducers/entryRouteReducer";
import { sendMsg } from "../../../utils/commonMsg";
import Button from "../../component/Button";
import CustomView from "../../component/CustomView";
import Toast from "../../component/Toast";
import "./index.scss";
import Loading from "../../component/Loading";
class BackupMnemonics extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      mnemonic: "",
      list:[],
      selectlist: [],
    };
    this.isUnMounted = false;
  }
  componentDidMount(){
    sendMsg({
      action: WALLET_GET_CREATE_MNEMONIC,
      payload:{
        isNewMne:false
      }
    }, (mnemonic) => { 
        let mneList = mnemonic.split(" ")
        for (let i = 0; i < mneList.length; i++) {
          const index = Math.floor(Math.random() * mneList.length);
          [mneList[i], mneList[index]] = [mneList[index], mneList[i]];
        }
        let list = mneList.map((v) => {
          return {
            name: v,
            selected: false,
          };
        })
      this.callSetState({
        mnemonic: mnemonic,
        list
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
  compareList = () => {
    const { selectlist,mnemonic } = this.state;
    let mneList = mnemonic.split(" ")
    return selectlist.map((v) => v.name).join("") == mneList.join("");
  };
  goToNext = () => {
    const { list } = this.state;
    let bool = this.compareList();
    if (bool) {
      Loading.show()
      sendMsg({
        action: WALLET_NEW_HD_ACCOUNT,
        payload: {
          mne: this.state.mnemonic,
        }
      },
        async (currentAccount) => {
          Loading.hide()
          this.props.updateCurrentAccount(currentAccount)
          this.props.updateEntryWitchRoute(ENTRY_WITCH_ROUTE.HOME_PAGE)
          this.props.history.push({
            pathname: "/backupsuccess",
          })
        })
    } else {
      Toast.info(getLanguage("seed_error"))
      this.callSetState({
        selectlist: [],
        list: list.map(v => {
          v.selected = false;
          return v;
        })
      })
    }
    return

  };
  onClickTopItem = (v, i) => {
    const { list, selectlist } = this.state;
    const bool = v.selected;
    if (bool) {
      const index = list.findIndex((item) => item.name == v.name);
      list[index].selected = !bool;
      selectlist.splice(i, 1);
      this.callSetState({
        list,
        selectlist,
      })
    }
  };
  onClickBottomItem = (v, i) => {
    const { list, selectlist } = this.state;
    const bool = v.selected;
    if (!bool) {
      list[i].selected = !bool;
      selectlist.push(v);
      this.callSetState({
        list,
        selectlist,
      })
    }
  };
  renderSelectedMne = () => {
    return (<div className="mne-container mne-select-container">
      {this.state.selectlist.map((item, index) => {
        return (<p
          key={index + ""}
          onClick={() => this.onClickTopItem(item, index)}
          className={cx({
            "mne-item-common": true,
            "mne-item": true,
            "mne-item-clicked": true,
            "click-cursor": true
          })}>{index + 1 + ". " + item.name}</p>)
      })}
    </div>)
  }
  renderMneList = () => {
    return (
      <div className={"mne-container"}>
        {this.state.list.map((item, index) => {
          return (
            <div
              key={index + ""}
              onClick={() => this.onClickBottomItem(item, index)}
              className={cx({
                "mne-item-select": item.selected,
              })}
            ><p className={cx({
              "mne-item-record": true,
              "mne-item": true,
              "click-cursor": true
            })}>{item.name}</p></div>)
        })
        }
      </div>)
  }
  renderBottonBtn = () => {
    return (
      <div className="bottom-container">
        <Button
          content={getLanguage('next')}
          onClick={this.goToNext}
        />
      </div>
    )
  }
  render() {
    return (
      <CustomView
        title={getLanguage('backTips_title')}
        history={this.props.history}>
        <div className="mne-show-container">
          <p className={"mne-description"}>{getLanguage('confirmMneTip')}</p>
          {this.renderSelectedMne()}
          {this.renderMneList()}
        </div>
        {this.renderBottonBtn()}
      </CustomView>
    )
  }
}

const mapStateToProps = (state) => ({});

function mapDispatchToProps(dispatch) {
  return {
    updateEntryWitchRoute: (index) => {
      dispatch(updateEntryWitchRoute(index));
    },
    updateCurrentAccount: (account) => {
      dispatch(updateCurrentAccount(account))
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(BackupMnemonics);
