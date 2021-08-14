import React from 'react';
import { connect } from 'react-redux';
import { languageInit } from '../../i18n';
import { setLanguage } from '../../reducers/appReducer';
import { ENTRY_WITCH_ROUTE, updateEntryWitchRoute } from '../../reducers/entryRouteReducer';
import { updateNetConfig } from '../../reducers/network';
import LockPage from './Lock';
import HomePage from './Main';
import Welcome from './Welcome';
import extension from 'extensionizer'
import { FROM_BACK_TO_RECORD, SET_LOCK } from '../../constant/types';
import { getBaseInfo } from '../../background/api';
import { updateExtensionBaseInfo } from '../../reducers/cache';
class MainRouter extends React.Component {

  async componentDidMount() {
    let lan = languageInit()
    this.props.setLanguage(lan)
    this.startListener() 
    this.initBaseInfo()
  }
  initBaseInfo=async ()=>{
    let baseInfo = await getBaseInfo().catch(err => err)
    if(baseInfo.changelog){
      this.props.updateExtensionBaseInfo(baseInfo)
    }
  }
  startListener = () => {
    extension.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
      const { type, action } = message;
      if (type === FROM_BACK_TO_RECORD && action === SET_LOCK) {
        this.props.updateEntryWitchRoute(ENTRY_WITCH_ROUTE.LOCK_PAGE)
        this.props.history.push({
          pathname: "/",
        });
      }
      return true;
    });
  }
  render() { 
    switch (this.props.entryWitchRoute) {
      case ENTRY_WITCH_ROUTE.WELCOME:
        return <Welcome history={this.props.history} />;
      case ENTRY_WITCH_ROUTE.HOME_PAGE:
        return <HomePage history={this.props.history} />;
      case ENTRY_WITCH_ROUTE.LOCK_PAGE:
        return <LockPage history={this.props.history} />;
      default:
        return <></>
    }
  }
}

const mapStateToProps = (state) => ({
  entryWitchRoute: state.entryRouteReducer.entryWitchRoute,
});

function mapDispatchToProps(dispatch) {
  return {
    updateEntryWitchRoute: (index) => {
      dispatch(updateEntryWitchRoute(index));
    },
    updateNetConfig: (config) => {
      dispatch(updateNetConfig(config))
    },
    setLanguage: (lan) => {
      dispatch(setLanguage(lan));
    },
    updateEntryWitchRoute: (page) => {
      dispatch(updateEntryWitchRoute(page))
    },
    updateExtensionBaseInfo: (data) => {
      dispatch(updateExtensionBaseInfo(data))
    },
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(MainRouter);
