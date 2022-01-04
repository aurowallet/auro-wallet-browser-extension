import cx from "classnames";
import React, { Component } from "react";
import backImage from "../../../assets/images/back_arrow.png";
import "./index.scss";
export default class SignContent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showMoreContent: false,
      isOpenAllContent: false,
    };
    this.isUnMounted = false
    this.signContent = React.createRef();
    this.signContainer = React.createRef();
  }

  componentDidMount() {
    this.checkOverflow()
  }
  componentWillUnmount() {
    this.isUnMounted = true;
  }
  callSetState = (data, callback) => {
    if (!this.isUnMounted) {
      this.setState({
        ...data
      }, () => {
        callback && callback()
      })
    }
  }
  checkOverflow = () => {
    let signContentHeight = this.signContent.current?.offsetHeight || 0
    let signContainerHeight = this.signContainer.current?.offsetHeight || 0
    if (signContentHeight > signContainerHeight) {
      this.callSetState({
        showMoreContent: true
      })
    } else {
      this.callSetState({
        showMoreContent: false
      })
    }
  }
  openAllContent = () => {
    this.callSetState({
      isOpenAllContent: true,
      showMoreContent: false
    }, () => {
      this.signContainer.current.scrollTo({
        top: this.signContainer.current.scrollHeight,
        behavior: "smooth"
      });
    })
  }
  render() {
    const { content,nextClass } = this.props
    return (
      <>
        <div ref={this.signContainer} className={cx("sign-info-detail-content",
          nextClass,
          this.state.isOpenAllContent ? "sign-info-detail-content-all" : {},
        )}>
          <span ref={this.signContent} className={"sign-info-detail-txt"}>{content}</span>
        </div>
        {this.state.showMoreContent && <div className={"sign-info-detail-all click-cursor"} onClick={this.openAllContent}>
          <img src={backImage} className={"sign-info-detail-arrow"} />
        </div>}
      </>
    )
  }
}