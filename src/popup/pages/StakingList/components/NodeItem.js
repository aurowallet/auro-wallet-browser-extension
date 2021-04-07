import React from "react";
import "./NodeItem.scss";
import select_account_ok from "../../../../assets/images/select_account_ok.png"
import select_account_no from "../../../../assets/images/select_account_no.png"
import {getLanguage} from "../../../../i18n";
import {addressSlice} from "../../../../utils/utils";
class NodeItem extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    let imgSource = this.props.checked ? select_account_ok : select_account_no
    return (
      <div className={'node-container  click-cursor'} onClick={this.props.onClick}>
        <div className={'node-info'}>
          <div className={'node-name'}>{this.props.node.nodeName ?? 'Block Producer'}</div>
          <div className={'pubkey'}>{addressSlice(this.props.node.nodeAddress, 10)}</div>
          <div className={'stake'}>{getLanguage('totalStake')}:<span>{this.props.node.totalStake} MINA</span></div>
        </div>
        <div className={"option-img-container"}>
          <img className={"option-img"} src={imgSource} />
        </div>
      </div>
    )
  }
}

export default NodeItem;
