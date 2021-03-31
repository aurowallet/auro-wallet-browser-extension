import cx from "classnames";
import React from "react";
import { connect } from "react-redux";
import { MINA_NEW_HD_ACCOUNT } from "../../../constant/types";
import { getLanguage } from "../../../i18n";
import { updateCurrentAccount } from "../../../reducers/accountReducer";
import { ENTRY_WITCH_ROUTE, updateEntryWitchRoute } from "../../../reducers/entryRouteReducer";
import { sendMsg } from "../../../utils/commonMsg";
import Button from "../../component/Button";
import CustomView from "../../component/CustomView";
import Toast from "../../component/Toast";
import "./index.scss";
class BackupMnemonics extends React.Component {
  constructor(props) {
    super(props);
    const password = props.location.params?.password ?? "";
    let mnemonic = props.location.params?.mnemonic ?? ""
    let mneList = mnemonic.split(" ")
    for (let i = 0; i < mneList.length; i++) {
      const index = Math.floor(Math.random() * mneList.length);
      [mneList[i], mneList[index]] = [mneList[index], mneList[i]];
    }
    this.state = {
      password: password,
      mnemonic: mnemonic,
      list: mneList.map((v) => {
        return {
          name: v,
          selected: false,
        };
      }),
      selectlist: [],
    };
    this.isUnMounted = false;
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
    const { selectlist } = this.state;
    let mnemonic = this.props.location.params?.mnemonic ?? "";
    let mneList = mnemonic.split(" ")
    return selectlist.map((v) => v.name).join("") == mneList.join("");
  };
  goToNext = () => {
    const { list } = this.state;
    let bool = this.compareList();
    if (bool) {
      sendMsg({
        action: MINA_NEW_HD_ACCOUNT,
        payload: {
          pwd: this.state.password,
          mne: this.state.mnemonic,
        }
      },
        async (currentAccount) => {
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
          <p className={"mne-description"}>{getLanguage('show_seed_content')}</p>
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
