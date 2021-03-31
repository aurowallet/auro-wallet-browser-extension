import cx from "classnames";
import React, { Component } from "react";
import "./index.scss";

import loadingCommon from "../../../assets/images/loadingCommon.gif";

export default class Loading extends Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: false
        };
    }
    show = () => {
        this.setState({ loading: true })
    }
    hide = () => {
        this.setState({ loading: false })
    }
    render() { 
        return (
            <div className={
                cx({
                    "loading-container": this.state.loading
                })
            }>
                <figure className={
                    cx({
                        "figure-show": this.state.loading,
                        "figure-hide": !this.state.loading
                    })
                }>
                    <img src={loadingCommon} className={"common-loading"}/>
                </figure>
            </div>
        )
    }
}