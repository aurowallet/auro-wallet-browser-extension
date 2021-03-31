import React from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import addIcon from '../../../assets/images/add.png';
import { getLanguage } from '../../../i18n';
import { getStakingList } from '../../../reducers/stakingReducer';
import { openTab } from "../../../utils/commonMsg";
import Button from '../../component/Button';
import CustomView from "../../component/CustomView";
import Toast from '../../component/Toast';
import NodeItem from "./components/NodeItem";
import {SearchInput} from "./components/SearchInput"
import "./index.scss";
import goNext from "../../../assets/images/goNext.png";

class StakingList extends React.Component {
  constructor(props) {
    super(props);
    let params = props.location?.params || {};
    this.state = {
      selectedNodePublicKey: '',
      delegatedAddress: params.nodeAddress ?? '',
      showMenu: false,
      keywords: ''
    };
    this.fromPage = params.fromPage ?? '';
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
  onConfirm = () => {
    let nodeParams = null;
    if (this.state.delegatedAddress) {
      let node = this.props.stakingList.find(n => n.nodeAddress === this.state.delegatedAddress);
      if (node) {
        nodeParams = node;
      }
    } else if (this.state.selectedNodePublicKey) {
      nodeParams = {
        nodeAddress: this.state.selectedNodePublicKey,
        nodeName: this.state.selectedNodeName
      }
    }
    if (!nodeParams) {
      Toast.info(getLanguage('selectNode'))
      return;
    }
    if (this.fromPage === 'stackingTransfer') {
      this.props.history.replace({
        pathname: "/stacking_transfer",
        params: nodeParams
      });
    } else {
      this.props.history.push({
        pathname: "/stacking_transfer",
        params: nodeParams
      });
    }
  }
  componentDidMount() {
    this.props.dispatch(getStakingList());
  }

  renderBottomBtn = () => {
    return (
      <div className="reset-bottom-container">
        <Button
          content={getLanguage('next')}
          onClick={this.onConfirm}>
        </Button>
      </div>
    )
  }
  onClick = (node) => {
    this.callSetState({
      selectedNodePublicKey: node.nodeAddress,
      selectedNodeName: node.nodeName,
      delegatedAddress: '',
    });
  }
  renderContent() {
    const {keywords} = this.state;
    return <div className={'node-list'}>
      {
        this.props.stakingList.filter((node) => {
          if (keywords) {
            const keywordsLS = keywords.toLowerCase();
            const addressFlag =  node.nodeAddress.toLowerCase().indexOf(keywordsLS) >= 0;
            let nameFlag = false;
            if (node.nodeName) {
              nameFlag = node.nodeName.toLowerCase().indexOf(keywordsLS) >= 0;
            }
            return addressFlag || nameFlag;
          }
          return true;
        }).map((node) => {
          return <NodeItem
            key={node.nodeAddress}
            onClick={() => {
              this.onClick(node);
            }}
            checked={this.state.selectedNodePublicKey === node.nodeAddress || this.state.delegatedAddress === node.nodeAddress}
            node={node}
          />
        })
      }
      <div className={'link-con'}>
        <div className={'manual-add-link click-cursor'} onClick={this.onMenuAdd}>
          {getLanguage('manualAdd')}
          <img className={'double-arrow'} src={goNext} />
        </div>
      </div>
    </div>
  }
  onClickAddNode = (e) => {
    this.callSetState({
      showMenu: true
    });
    e.preventDefault();
    e.stopPropagation();
    const close  = () => {
      document.removeEventListener('click', close);
      this.callSetState({
        showMenu: false
      });
    }
    document.body.addEventListener('click', close);
  }
  onMenuAdd = () => {
    this.callSetState({
      showMenu: false
    });
    this.props.history.push({
      pathname: "/stacking_transfer",
      params: {
        menuAdd: true
      }
    }
    );
  }
  onSubmitNode = () => {
    openTab(this.props.submitBpUrl)
  }
  onChange = (e) => {
    const text = e.target.value;
    this.callSetState({
      keywords: text
    });
  }
  renderAddBtn = () => {
    return null;
    return (
      <div onClick={this.onClickAddNode} className={"node-add-container click-cursor"}>
        <img src={addIcon} className={"node-add-icon"} />
      </div>)
  }
  renderMenu = () => {
    return null;
    if (!this.state.showMenu) {
      return;
    }
    return (<div className={'menu-pos'}>
      <div className={"menu-con"}>
        <div onClick={this.onMenuAdd} className={'add-node-menu-item  click-cursor'}>{getLanguage('manualAdd')}</div>
        <div onClick={this.onSubmitNode} className={'add-node-menu-item  click-cursor'}>{getLanguage('submitNode')}</div>
      </div>
    </div>);
  }
  render() {
    return (
      <CustomView
        className={'stacking-list-page'}
        title={getLanguage('nodeProviders')}
        rightComponent={this.renderAddBtn()}
        history={this.props.history}>
        <div className={'page-content'}>
          <div className={"page-input-container"}>
            <SearchInput onChange={this.onChange}/>
          </div>
          <div className="nodes-container">
            {this.renderContent()}
          </div>
          {this.renderBottomBtn()}
        </div>
        {
          this.renderMenu()
        }
      </CustomView>
    );
  }
}

const mapStateToProps = (state) => ({
  stakingList: state.staking.stakingList,
  submitBpUrl: state.staking.submitBpUrl,
});


export default withRouter(
  connect(mapStateToProps)(StakingList)
);
