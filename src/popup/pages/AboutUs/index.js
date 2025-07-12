import i18n from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import pkg from "../../../../package.json";
import { getBaseInfo } from "../../../background/api";
import { LANG_SUPPORT_LIST } from "../../../i18n";
import CustomView from "../../component/CustomView";
import Toast from "../../component/Toast";
import styles from "./index.module.scss";
import styled from "styled-components";
import { useHistory } from "react-router-dom";

const StyledDevWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;
const AboutUs = ({}) => {
  const history = useHistory();

  const [baseAboutInfo, setBaseAboutInfo] = useState({
    terms_and_contions: "",
    terms_and_contions_cn: "",
    privacy_policy: "",
    privacy_policy_cn: "",
    changelog: "",
    followus: [],
  });
  const fetchBaseInfo = useCallback(async () => {
    let baseInfo = await getBaseInfo().catch((err) => err);
    if (baseInfo.error) {
      Toast.info(baseInfo.error);
      return;
    }

    setBaseAboutInfo({
      terms_and_contions: baseInfo.terms_and_contions,
      terms_and_contions_cn: baseInfo.terms_and_contions_cn,
      privacy_policy: baseInfo.privacy_policy,
      privacy_policy_cn: baseInfo.privacy_policy_cn,
      changelog: baseInfo.changelog,
      followus: baseInfo.followus,
    });
  }, []);

  useEffect(() => {
    fetchBaseInfo();
  }, []);

  const { followList, linkInfoList } = useMemo(() => {
    const getFollowListLink = (type) => {
      let followItem = baseAboutInfo.followus.filter((item) => {
        return type === item.name;
      });
      return followItem[0]?.website || "";
    };

    const followList = [
      {
        title: "Website",
        icon: "/img/icon_website.svg",
        link: getFollowListLink("website"),
      },
      {
        title: "X",
        icon: "/img/icon_x.svg",
        link: getFollowListLink("twitter"),
      },
      {
        title: "Telegram",
        icon: "/img/icon_telegram.svg",
        link: getFollowListLink("telegram"),
      },
    ];

    const getCurrentUrl = (type) => {
      let lan = i18n.language;
      let url = "";
      if (lan === LANG_SUPPORT_LIST.zh_CN) {
        url =
          type == "terms"
            ? baseAboutInfo.terms_and_contions_cn
            : baseAboutInfo.privacy_policy_cn;
      } else {
        url =
          type == "terms"
            ? baseAboutInfo.terms_and_contions
            : baseAboutInfo.privacy_policy;
      }
      return url;
    };

    const linkInfoList = [
      {
        title: i18n.t("termsAndConditions"),
        link: getCurrentUrl("terms"),
      },
      {
        title: i18n.t("privacyPolicy"),
        link: getCurrentUrl("privacy"),
      },
      {
        title: i18n.t("checkOnGithub"),
        link: baseAboutInfo.changelog,
      },
    ];
    return { followList, linkInfoList };
  }, [i18n, baseAboutInfo]);

  const onClickIcon = useCallback(() => {
    history.push("devpage");
  }, []);

  return (
    <CustomView
      title={i18n.t("about")}
      contentClassName={styles.aboutContainer}
    >
      <StyledDevWrapper onDoubleClick={onClickIcon}>
        <img src="/img/logo/128.png" className={styles.icon} />
      </StyledDevWrapper>
      <p className={styles.walletName}>{i18n.t("walletName")}</p>
      <p className={styles.walletVersion}>{"V" + pkg.version}</p>
      <p className={styles.walletTip}>{i18n.t("walletAbout")}</p>
      <div className={styles.linkContainer}>
        {linkInfoList.map((info, index) => {
          return (
            <LinkContent title={info.title} key={index} link={info.link} />
          );
        })}
      </div>
      <p className={styles.followTitle}>{i18n.t("followUs")}</p>
      <div className={styles.followListContainer}>
        {followList.map((follow, index) => {
          return (
            <a
              className={styles.followItemContainer}
              href={follow.link}
              target="_blank"
              key={index}
            >
              <div className={styles.iconContainer}>
                <img src={follow.icon} />
              </div>
              <p className={styles.followItemTitle}>{follow.title}</p>
            </a>
          );
        })}
      </div>
    </CustomView>
  );
};

const LinkContent = ({ title, link }) => {
  return (
    <div>
      <a href={link} target="_blank" className={styles.linkContent}>
        {title}
      </a>
    </div>
  );
};
export default AboutUs;
