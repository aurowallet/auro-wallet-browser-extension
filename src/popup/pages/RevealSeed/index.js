import React from "react";
import { connect } from "react-redux";
import { getLanguage } from "../../../i18n";
import CustomView from "../../component/CustomView";
class RevealSeedPage extends React.Component {
  constructor(props) {
    super(props);
    let mnemonic = props.location.params?.mnemonic ?? ""
    this.state = {
      mnemonic: mnemonic
    };
  }


  renderInput = () => {
    return (
      <textarea
        className={"text-area-input"}
        value={this.state.mnemonic}
        readOnly="readOnly" />
    )
  }


  render() {
    return (
      <CustomView
        title={getLanguage('backTips_title')}
        history={this.props.history}>
        <div className="import-container">
          <p className={"import-title"}>{getLanguage('show_seed_content')}</p>
          {this.renderInput()}
        </div>
      </CustomView>)
  }
}

const mapStateToProps = (state) => ({});

function mapDispatchToProps(dispatch) {
  return {};
}

export default connect(mapStateToProps, mapDispatchToProps)(RevealSeedPage);
