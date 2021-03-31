import React from "react";
import { connect } from "react-redux";
import CustomView from "../../component/CustomView";
import "./index.scss";

class InfoPage extends React.Component {
  constructor(props) {
    super(props);
    const title = props.location.params?.title ?? ""
    const content = props.location.params?.content ?? ""
    this.state = {
      title,
      content
    };
  }
  renderTip = () => {
    return (
      <p className="wallet-tip-description">{this.state.content}</p>
    )
  }

  render() {
    return (
      <CustomView
        backRoute={"/homepage"}
        title={this.state.title}
        history={this.props.history}>
        <div className="mne-show-container">
          {this.renderTip()}
        </div>
      </CustomView>)
  }
}

const mapStateToProps = (state) => ({});

function mapDispatchToProps(dispatch) {
  return {};
}

export default connect(mapStateToProps, mapDispatchToProps)(InfoPage);
