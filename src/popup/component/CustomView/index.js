import cx from "classnames";
import React from "react";
import { connect } from "react-redux";
import back_arrow from "../../../assets/images/back_arrow.png";
import back_arrow_white from "../../../assets/images/back_arrow_white.png";
import "./index.scss";
import PropTypes from 'prop-types'
class CustomView extends React.Component {
    constructor(props) {
        super(props);
        this.state = {

        };
    }
    goBack = () => {
        const { backRoute, onGoBack } = this.props
        if (onGoBack && onGoBack()) {
            return;
        }
        if (backRoute) {
            this.props.history.push({
                pathname: backRoute,
            })
        } else {
            this.props.history.goBack()
        }

    }
    render() {
        const { title, backRoute, noi18n, noBack, isReceive, className } = this.props
        let realTitle = title
        let backImage = isReceive ? back_arrow_white : back_arrow
        return (
            <div className={cx({
                "custom-container": true,
                "custom-container-image": isReceive
            }, className)}>
                <div className="top-bar-container">
                    <p className={cx({
                        "custom-header-title": true,
                        "custom-header-title-bg": isReceive
                    })
                    }>{realTitle}</p>
                    <div onClick={this.goBack} className={"back-img-container click-cursor"}>
                        <img
                            className={cx({
                                "back-img": true,
                                "back-img-hide": noBack
                            })}
                            src={backImage} />
                    </div>
                    <div className={
                        cx({
                            "custom-right-container": this.props.rightComponent,
                            "custom-right-container-none": !this.props.rightComponent,
                        })
                    }>
                        {this.props.rightComponent}
                    </div>
                </div>
                {this.props.children}
            </div>
        );
    }
}
export default CustomView

CustomView.defaultProps = {
    title:"", 
    backRoute:"", 
    noBack:false, 
    isReceive:false, 
    className:"",
    onGoBack:"",
    rightComponent:"",
    children:""
}
CustomView.propTypes = {
    title:PropTypes.string, 
    backRoute:PropTypes.string, 
    noBack:PropTypes.bool, 
    isReceive:PropTypes.bool, 
    className:PropTypes.string,
    onGoBack:PropTypes.func,
    rightComponent:PropTypes.element,
    children:PropTypes.element
}