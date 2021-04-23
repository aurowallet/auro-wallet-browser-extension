import cx from "classnames";
import React, { Component } from "react";
import downArrow from "../../../assets/images/downArrow.png";
import "./index.scss";
import PropTypes from 'prop-types'

export default class Select extends Component {
  constructor(props) {
    super(props);
    this.state = { isOpen: false, value: "" };
    this.toggleContainer = React.createRef();
  }
  componentDidMount() {
    window.addEventListener("click", this.onClickOutsideHandler);
  }

  componentWillUnmount() {
    window.removeEventListener("click", this.onClickOutsideHandler);
  }

  onClickHandler = () => {
    this.setState(currentState => ({
      isOpen: !currentState.isOpen
    }));
  };

  onClickOutsideHandler = event => {
    if (
      this.state.isOpen &&
      !this.toggleContainer.current.contains(event.target)
    ) {
      this.setState({ isOpen: false });
    }
  };

  onChange = item => {
    this.setState({
      value: item.value,
      isOpen: false
    });
    this.props.onChange(item);
  };
  render() {
    const { isOpen, value } = this.state;
    const { label, options, defaultValue } = this.props;
    return (
      <div className="select-box">
        {label && <label className="label">{label}:</label>}

        <div className="select" ref={this.toggleContainer}>
          <div
            onClick={this.onClickHandler}
            className={cx({
              "self-input": true,
              "input-hover": isOpen,
              "click-cursor": true
            })}>
            <p style={{
              margin: 0,
            }}>
              {value || defaultValue}
            </p>
          </div>
          <img className={cx({
            "select-arrow": true,
            up: isOpen,
            down: !isOpen
          })} src={downArrow}></img>
          <div
            className="options"
            className={cx({
              options: true,
              "options-hidden": !isOpen
            })}
          >
            {options &&
              options.map((item) => {
                return (
                  <div
                    key={item.key}
                    className="item click-cursor"
                    onClick={this.onChange.bind(this, item)}
                  >
                    {item.value}
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    );
  }
}


Select.defaultProps = {
  label:"", 
  options:[], 
  defaultValue:"",
  onChange:()=>{}
}
Select.propTypes = {
  label:PropTypes.string, 
  options:PropTypes.array, 
  defaultValue:PropTypes.string,
  onChange:PropTypes.func
}