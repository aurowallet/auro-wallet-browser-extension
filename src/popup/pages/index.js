import React from 'react';
import { connect } from 'react-redux';
import { languageInit } from '../../i18n';
import { setLanguage } from '../../reducers/appReducer';
import { ENTRY_WITCH_ROUTE, updateEntryWitchRoute } from '../../reducers/entryRouteReducer';
import { updateNetConfig } from '../../reducers/network';
import LockPage from './Lock';
import HomePage from './Main';
import Welcome from './Welcome';

class MainRouter extends React.Component {

  async componentDidMount() {
    let lan = languageInit()
    this.props.setLanguage(lan)
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
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(MainRouter);
