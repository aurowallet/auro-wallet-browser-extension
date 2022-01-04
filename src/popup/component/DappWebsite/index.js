import cx from "classnames";
import React, { Component } from "react";
import "./index.scss";

export default class DappWebsite extends Component {
  constructor(props) {
    super(props);
    let url = props.siteUrl
    let showToolTip = url.length >= 100 
    let showRowIcon = props.type === "signConfirm"
    let webIcon = props.siteIcon
    this.state = {
      webIcon,
      siteUrl:url,
      showToolTip,
      showRowIcon
    };
  }

  render() {
    let { siteUrl, webIcon, showRowIcon ,showToolTip} = this.state
    return (
      <div className={cx("approve-top-con", {
        "approve-top-con-row": showRowIcon,
        "approve-top-con-column": !showRowIcon
      })}>
        <div className={'approve-page-icon-con'}>
          <img className={cx({
            "approve-page-icon-row": showRowIcon,
            "approve-top-icon-column": !showRowIcon
          })}
            ref={this.webIconRef}
            src={webIcon}
          />
        </div>
        <div className={"approve-page-url-con"}>
          <p className={cx('baseUrlDesc', {
            "approve-page-url": !showRowIcon,
            "approve-page-url-row": showRowIcon,
          })}>{siteUrl}</p>
          {showToolTip && <span className="baseTip tooltiptext">{siteUrl}</span>}
        </div>
      </div>
    )
  }
}