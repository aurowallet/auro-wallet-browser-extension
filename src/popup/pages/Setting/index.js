import React from "react";
import { connect } from "react-redux";
import aboutUs from "../../../assets/images/aboutUs.png";
import language from "../../../assets/images/language.png";
import networks from "../../../assets/images/networks.png";
import security from "../../../assets/images/security.png";
import txArrow from "../../../assets/images/txArrow.png";
import { getLanguage } from "../../../i18n";
import "./index.scss";
class Setting extends React.Component {
    constructor(props) {
        super(props);
        this.state = {}
        this.settingList = [{
            name: getLanguage("security"),
            icon: security,
            route: "/security_page",
        },
        {
            name: getLanguage("network"),
            icon: networks,
            route: "/network_page",
        },
        {
            name: getLanguage("language"),
            icon: language,
            route: "/language_management_page"
        }
        ]
    }
    onClickItem = (e) => {
        this.props.params.history.push({
            pathname: e.route,
            params: {
                ...e
            }
        })
    }

    renderCommonConfig = (item, index) => {
        return (
            <div key={item.route + ""} onClick={() => this.onClickItem(item)}
                className={"setting-config-item click-cursor"}>
                <div className={"setting-config-item-left"}>
                    <img className="config-icon" src={item.icon} />
                    <p className={"config-name"}>{item.name}</p>
                </div>
                <img className={"config-arrow"} src={txArrow} />
            </div>)
    }
    renderSettingConfig = () => {
        return (<div className={"setting-config-container"}>
            {this.settingList.map((item, index) => {
                return this.renderCommonConfig(item, index)
            })}
        </div>)
    }
    renderAbout = () => {
        let abount = {
            name: getLanguage("about"),
            icon: aboutUs,
            route: "/about_us"
        }
        return (
            <div className={"setting-config-container setting-config-about"}>
                {this.renderCommonConfig(abount)}
            </div>
        )
    }

    render() {
        return (
            <div className="setting-outter-container">
                <p className={"tab-common-title"}>{getLanguage('setting')}</p>
                {this.renderSettingConfig()}
                {this.renderAbout()}
            </div>
        )
    }
}

const mapStateToProps = (state) => ({});

function mapDispatchToProps(dispatch) {
    return {};
}

export default connect(mapStateToProps, mapDispatchToProps)(Setting);
