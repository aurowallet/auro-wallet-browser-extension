import React, { Component } from "react";
import { connect } from "react-redux";
import "./index.scss";

class ApproveAccountItem extends Component {
    constructor(props) {
        super(props);
    }
    render() {
        const { account } = this.props
        return (<div className={"approve-item-container"}>
            <p className={"item-name"}>{account.accountName}</p>
            <p className={"item-address"}>{account.address}</p>
        </div>)
    }
}

const mapStateToProps = (state) => ({
});

function mapDispatchToProps(dispatch) {
    return {
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(ApproveAccountItem);
