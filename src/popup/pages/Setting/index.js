import React from "react";
import { connect } from "react-redux";
import aboutUs from "../../../assets/images/aboutUs.png";
import language from "../../../assets/images/language.png";
import networks from "../../../assets/images/networks.png";
import security from "../../../assets/images/security.png";
import txArrow from "../../../assets/images/txArrow.png";
import userTerms from "../../../assets/images/userTerms.svg";
import userPrivacy from "../../../assets/images/userPrivacy.svg";
import currency from "../../../assets/images/currency.svg";
import addressBook from "../../../assets/images/addressBook.svg";

import { getCurrentLang, getLanguage } from "../../../i18n";
import "./index.scss";
import { openTab } from "../../../utils/commonMsg";
import { updateAddressBookFrom } from "../../../reducers/cache";
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
        },
        {
            name: getLanguage("currency"),
            icon: currency,
            route: "/currency_unit"
        },
        {
            name: getLanguage("addressBook"),
            action: this.addressBookAction,
            icon: addressBook,
            route: "/address_book"
        },


        ]
        this.aboutList = [{
            name: getLanguage("about"),
            icon: aboutUs,
            route: "/about_us"
        },
        {
            name: getLanguage("settingTerms"),
            icon: userTerms,
            onClick:()=>this.onTermsClick("terms"),
            isHideBtn:true
        },
        {
            name: getLanguage("settingPrivacy"),
            icon: userPrivacy,
            onClick:()=>this.onTermsClick("privacy"),
            isHideBtn:true
        }
    ]
    }
    onTermsClick=(type)=>{
        const { terms_and_contions, terms_and_contions_cn, privacy_policy, privacy_policy_cn } = this.props.cache
        let lan = getCurrentLang()
        let url = ""
        if (lan === "en") {
          url = type == "terms" ? terms_and_contions : privacy_policy
        } else if (lan === "zh_CN") {
          url = type == "terms" ? terms_and_contions_cn : privacy_policy_cn
        }
        if (url) {
          openTab(url)
        }

    }
    onClickItem = (e) => {
        if(e.onClick){
            e.onClick()
        }else{
            if (e.action) {
                e.action && e.action()
            }
            this.props.params.history.push({
                pathname: e.route,
                params: {
                    ...e
                }
            })
        }

    }
    addressBookAction = () => {
        this.props.updateAddressBookFrom("")
    }
    renderCommonConfig = (item, index) => {
        return (
            <div key={index + ""} onClick={() => this.onClickItem(item)}
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
        return (
            <div className={"setting-config-container setting-config-about"}>
                {this.aboutList.map((item, index) => {
                return this.renderCommonConfig(item, index)
            })}
            </div>
        )
    }

    render() {
        return (
            <div >
                <p className={"tab-common-title"}>{getLanguage('setting')}</p>
                <div className="setting-outter-container">
                {this.renderSettingConfig()}
                {this.renderAbout()}
                </div>
            </div>
        )
    }
}

const mapStateToProps = (state) => ({
    cache: state.cache,
});

function mapDispatchToProps(dispatch) {
    return {
        updateAddressBookFrom: (from) => {
            dispatch(updateAddressBookFrom(from))
        },
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(Setting);
