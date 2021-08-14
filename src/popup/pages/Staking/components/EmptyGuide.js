import React from "react";
import { getCurrentLang, getLanguage } from '../../../../i18n';
import "./EmptyGuide.scss";
import reminder from "../../../../assets/images/reminder.png";
import { specialSplit } from "../../../../utils/utils";
import { connect } from "react-redux";
import { openTab } from "../../../../utils/commonMsg";
class EmptyGuide extends React.Component {
    constructor(props) {
        super(props);
    }

    onClickGuide=()=>{
        const { staking_guide, staking_guide_cn } = this.props.cache
        let lan = getCurrentLang()
        let url = ""
        if(lan === "en"){
            url = staking_guide
        }else if(lan === "zh_CN"){
            url = staking_guide_cn
        }
        if(url){
            openTab(url)
        }
    }

    renderClickElement=(text)=>{
        let list = specialSplit(text)
        return (<div>
            <p className={"empty-desc"}>
            {list.map((item,index)=>{
                if(item.type === "common"){
                    return(<span key={index+""}>{item.showStr}</span>)
                }else{
                    return(<span key={index+""} className={"tips-spical"} onClick={this.onClickGuide}>{item.showStr}</span>)
                }
            })}
            </p>
        </div>)
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

