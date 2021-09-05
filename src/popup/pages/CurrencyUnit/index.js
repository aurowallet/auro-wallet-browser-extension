import React from "react";
import { connect } from "react-redux";
import select_account_no from "../../../assets/images/select_account_no.png";
import select_account_ok from "../../../assets/images/select_account_ok.png";
import { saveLocal } from "../../../background/localStorage";
import { CURRENCY_UNIT_CONFIG } from "../../../constant/storageKey";
import { getLanguage } from "../../../i18n";
import { updateShouldRequest } from "../../../reducers/accountReducer";
import { updateCurrencyConfig } from "../../../reducers/currency";
import CustomView from "../../component/CustomView";
import "./index.scss";

class CurrencyUnit extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  changeCurrencyOption = (clickItem) => {
    const { currencyList } = this.props
    if (!clickItem.isSelect) {
      let list = currencyList.map((item, index) => {
        let newItem = { ...item }
        if (newItem.key === clickItem.key) {
          newItem.isSelect = true
          return newItem
        } else {
          newItem.isSelect = false
          return newItem
        }
      })
      this.props.updateCurrencyConfig(list);
      this.props.updateShouldRequest(true);
      saveLocal(CURRENCY_UNIT_CONFIG, JSON.stringify(clickItem.key))
    }
  }
  renderOptionItem = (item, index) => {
    let imgSource = item.isSelect ? select_account_ok : select_account_no
    return (
      <div onClick={() => this.changeCurrencyOption(item)} className={"lang-option-item click-cursor"} key={item.key + ""}>
        <p className={"lang-option-title"}>{item.value}</p>
        <div className={"lang-option-img-container"} >
          <img className={"lang-option-img"} src={imgSource} />
        </div>
      </div>
    )
  }
  renderLangOption = () => {
    const { currencyList } = this.props
    return (
      <div className={"lang-option-container"}>
        {currencyList.map((item, index) => {
          return this.renderOptionItem(item)
        })}
      </div>
    )
  }

  render() {
    return (
      <CustomView
        title={getLanguage("currency")}
        history={this.props.history}>
        {this.renderLangOption()}
      </CustomView>)
  }
}

const mapStateToProps = (state) => ({
  currencyList: state.currencyConfig.currencyList,
});

function mapDispatchToProps(dispatch) {
  return {
    updateCurrencyConfig: (currencyList) => {
      dispatch(updateCurrencyConfig(currencyList));
    },
    updateShouldRequest: (shouldRefresh) => {
      dispatch(updateShouldRequest(shouldRefresh))
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(CurrencyUnit);
