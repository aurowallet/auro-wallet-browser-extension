import React from "react";
import "./index.scss";
import PropTypes from 'prop-types'
export default class Tabs extends React.Component {
  constructor(props) {
    super(props);
    let index = props.currentActiveIndex || 0
    this.state = {
      currentIndex: index,
    };
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.currentActiveIndex !== this.props.currentActiveIndex) {
      this.setState({
        currentIndex: nextProps.currentActiveIndex
      })
    }
  }
  detailClickHandler(index) {
    let { onChangeIndex } = this.props
    onChangeIndex(index)
  }
  check_title_index = (index) => {
    return this.state.currentIndex === index ? "tab_title home-active click-cursor" : "tab_title home-unactive click-cursor";
  };
  check_item_index = (index) => {
    return this.state.currentIndex === index ? "show" : "hide";
  };
  render() {
    return (
      <div className="tab_container">
        <ul className="tab_content_wrap">
          {React.Children.map(this.props.children, (ele, index) => {
            let key = ele.props.lable
            return (
              <li key={key} className={this.check_item_index(index)}>
                {ele.props.children}
              </li>
            );
          })}
        </ul>
        <ul className="tab_title_wrap">
          {React.Children.map(this.props.children, (ele, index) => {
            let commonSource = ele.props.commonSource
            let activeSource = ele.props.activeSource
            let imgSource = this.state.currentIndex === index ? activeSource : commonSource
            return (
              <li
                key={index + ""}
                className={this.check_title_index(index)}
                onClick={this.detailClickHandler.bind(this, index)}
              >
                <img className="home-tab-img" src={imgSource}></img>
                {ele.props.lable}
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
}