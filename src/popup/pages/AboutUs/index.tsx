import i18n from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";

interface FollowUsItem {
  name: string;
  website?: string;
}

interface BaseAboutInfo {
  terms_and_contions: string;
  terms_and_contions_cn: string;
  privacy_policy: string;
  privacy_policy_cn: string;
  changelog: string;
  followus: FollowUsItem[];
  error?: string;
}
import pkg from "../../../../package.json";
import { getBaseInfo } from "../../../background/api";
import { LANG_SUPPORT_LIST } from "../../../i18n";
import CustomView from "../../component/CustomView";
import Toast from "../../component/Toast";
import { useNavigate } from "react-router-dom";
import {
  StyledAboutContainer,
  StyledDevWrapper,
  StyledIcon,
  StyledWalletName,
  StyledWalletVersion,
  StyledWalletTip,
  StyledLinkContainer,
  StyledLinkContent,
  StyledFollowTitle,
  StyledFollowListContainer,
  StyledFollowItemContainer,
  StyledIconContainer,
  StyledFollowItemTitle,
} from "./index.styled";

const AboutUs = () => {

  const navigate = useNavigate();

  const [baseAboutInfo, setBaseAboutInfo] = useState<BaseAboutInfo>({
    terms_and_contions: "",
    terms_and_contions_cn: "",
    privacy_policy: "",
    privacy_policy_cn: "",
    changelog: "",
    followus: [],
  });
  const fetchBaseInfo = useCallback(async () => {
    let baseInfo = await getBaseInfo().catch((err) => err) as BaseAboutInfo;
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
    const getFollowListLink = (type: string) => {
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

    const getCurrentUrl = (type: string) => {
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
    navigate("/devpage");
  }, []);

  return (
    <CustomView
      title={i18n.t("about")}
      ContentWrapper={StyledAboutContainer}
    >
      <StyledDevWrapper onDoubleClick={onClickIcon}>
        <StyledIcon src="/img/logo/128.png" />
      </StyledDevWrapper>
      <StyledWalletName>{i18n.t("walletName")}</StyledWalletName>
      <StyledWalletVersion>{"V" + pkg.version}</StyledWalletVersion>
      <StyledWalletTip>{i18n.t("walletAbout")}</StyledWalletTip>
      <StyledLinkContainer>
        {linkInfoList.map((info, index) => {
          return (
            <StyledLinkContent href={info.link} target="_blank" key={index}>
              {info.title}
            </StyledLinkContent>
          );
        })}
      </StyledLinkContainer>
      <StyledFollowTitle>{i18n.t("followUs")}</StyledFollowTitle>
      <StyledFollowListContainer>
        {followList.map((follow, index) => {
          return (
            <StyledFollowItemContainer
              href={follow.link}
              target="_blank"
              key={index}
            >
              <StyledIconContainer>
                <img src={follow.icon} />
              </StyledIconContainer>
              <StyledFollowItemTitle>{follow.title}</StyledFollowItemTitle>
            </StyledFollowItemContainer>
          );
        })}
      </StyledFollowListContainer>
    </CustomView>
  );
};

export default AboutUs;
