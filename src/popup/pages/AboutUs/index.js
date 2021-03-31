import React from "react";
import { connect } from "react-redux";
import home_logo from "../../../assets/images/home_logo.png";
import telegram from "../../../assets/images/telegram.png";
import twitter from "../../../assets/images/twitter.png";
import website from "../../../assets/images/website.png";
import wechat from "../../../assets/images/wechat.png";
import { getAboutInfo } from "../../../background/api";
import { VERSION_CONFIG } from "../../../../config";
import { getLanguage } from "../../../i18n";
import { openTab } from "../../../utils/commonMsg";
import CustomView from "../../component/CustomView";
import Toast from "../../component/Toast";
import "./index.scss";


const followSource = {
  "website": website,
  "twitter": twitter,
  "telegram": telegram,
  "wechat": wechat,
}
class AboutUs extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      changelog: "",
      followus: []
    };
    this.isUnMounted = false;
  }
  componentDidMount() {
    this.fetchAboutInfo()
  }
  componentWillUnmount(){
    this.isUnMounted = true;
  }
  callSetState=(data,callback)=>{
    if(!this.isUnMounted){
      this.setState({
        ...data
      },()=>{
        callback&&callback()
      })
    }
  }
  fetchAboutInfo = async () => {
    let aboutInfo = await getAboutInfo().catch(err => err)
    if (aboutInfo.error) {
      Toast.info(aboutInfo.error)
      return
    }
    let changelog = aboutInfo.changelog ? aboutInfo.changelog : ""
    let followus = aboutInfo.followus && aboutInfo.followus.length > 0 ? aboutInfo.followus : []
    followus = followus.map((item, index) => {
      item.source = followSource[item.name]
      return item
    })
    this.callSetState({
      changelog,
      followus
    })
  }
  renderTopInfo = () => {
    return (<div className={'about-top-container'}>
      <img src={home_logo} className={"about-home-logo"} />
      <p className={"about-wallet-name"}>{getLanguage('minaWallet')}</p>
      <p className={"about-wallet-version"}>{VERSION_CONFIG}</p>
    </div>)
  }
  renderTopMinaDesc = () => {
    return (<p className="about-tip-description">{getLanguage('minaAbout')}</p>)
  }
  renderTopMinaGit = () => {
    if (!this.state.changelog) {
      return <></>
    }
    let showLog = "mina-wallet-chrome-extension"//VERSION_CONFIG
    return (
      <div className={"about-item-container"}>
        <p className={"about-item-title"}>{getLanguage('versionInfo')}</p>
        <p onClick={() => this.onClick(this.state.changelog)} className={"about-item-content click-cursor"}>{showLog}</p>
      </div>
    )
  }
  onClick = (url) => {
    openTab(url)
  }
  renderTopMinaFollow = () => {
    if (this.state.followus.length <= 0) {
      return <></>
    }
    return (
      <div className={"about-item-container"}>
        <p className={"about-item-title"}>{getLanguage('followUs')}</p>
        <div className={"about-follow-container"}>
          {this.state.followus.map((item) => {
            return <img
              key={item.name}
              src={item.source}
              onClick={() => this.onClick(item.website)}
              className={"about-follow-icon click-cursor"} />
          })}

        </div>
      </div>
    )
  }
  render() {
    return (
      <CustomView
        title={getLanguage('about')}
        history={this.props.history}>
        <div className="about-container">
          {this.renderTopInfo()}
          {this.renderTopMinaDesc()}
          {this.renderTopMinaGit()}
          {this.renderTopMinaFollow()}
        </div>
      </CustomView>)
  }
}

const mapStateToProps = (state) => ({});

function mapDispatchToProps(dispatch) {
  return {};
}

export default connect(mapStateToProps, mapDispatchToProps)(AboutUs);
