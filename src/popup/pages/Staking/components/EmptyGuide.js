import React from "react";
import { Trans } from "react-i18next";
import { connect } from "react-redux";
import reminder from "../../../../assets/images/reminder.png";
import { getCurrentLang, getLanguage, LANG_SUPPORT_LIST } from '../../../../i18n';
import { openTab } from "../../../../utils/commonMsg";
import "./EmptyGuide.scss";
class EmptyGuide extends React.Component {
    constructor(props) {
        super(props);
    }

    onClickGuide = () => {
        const { staking_guide, staking_guide_cn } = this.props.cache
        let lan = getCurrentLang()
        let url = ""
        if (lan === LANG_SUPPORT_LIST.EN) {
            url = staking_guide
        } else if (lan === LANG_SUPPORT_LIST.ZH_CN) {
            url = staking_guide_cn
        }
        if (url) {
            openTab(url)
        }
    }

    renderClickElement = (text) => {
        return (<div>
            <p className={"empty-desc"}>
                <Trans
                    i18nKey={text}
                    components={{ click: <span className={"tips-spical"} onClick={this.onClickGuide} /> }}
                />
            </p>
        </div>)
    }

    render() {
        return <div className={'empty-delegate'}>
            <div className={'empty-title'}>
                {getLanguage('emptyDelegateTitle')}
            </div>
            <p className={'empty-desc'}>
                {getLanguage('emptyDelegateDesc1')}
            </p>
            {this.renderClickElement(getLanguage('emptyDelegateDesc2'))}
        </div>
    }
}
const mapStateToProps = (state) => ({
    cache: state.cache,
});

function mapDispatchToProps(dispatch) {
    return {};
}

export default connect(mapStateToProps, mapDispatchToProps)(EmptyGuide);

