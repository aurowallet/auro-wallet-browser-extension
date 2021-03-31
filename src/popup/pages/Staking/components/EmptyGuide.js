import React from "react";
import { getLanguage } from '../../../../i18n';
import "./EmptyGuide.scss";
import reminder from "../../../../assets/images/reminder.png";
class EmptyGuide extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return <div className={'empty-delegate'}>
            <div className={'empty-title'}>
                <img src={reminder} className={"empty-reminder-img"} />
                {getLanguage('emptyDelegateTitle')}
            </div>
            <p className={'empty-desc'}>
                {getLanguage('emptyDelegateDesc1')}
            </p>
            <p className={'empty-desc'}>
                {getLanguage('emptyDelegateDesc2')}
            </p>
        </div>
    }
}
export default EmptyGuide;
