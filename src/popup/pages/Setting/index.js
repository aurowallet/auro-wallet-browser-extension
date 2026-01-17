import i18n from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getLocal } from "../../../background/localStorage";
import {
  CredentialMsg,
  DAPP_CONNECTION_LIST,
} from "../../../constant/msgTypes";
import { ADDRESS_BOOK_CONFIG } from "../../../constant/storageKey";
import { updateAddressBookFrom } from "../../../reducers/cache";
import { sendMsg } from "../../../utils/commonMsg";
import { showNameSlice } from "../../../utils/utils";
import CustomView from "../../component/CustomView";
import {
  StyledContentContainer,
  StyledCustomTitle,
  StyledRowContainer,
  StyledRowLeft,
  StyledRowTitle,
  StyledIconContainer,
  StyledRowContent,
  StyledDividedLine,
} from "./index.styled";

const Setting = ({}) => {
  const currentNode = useSelector((state) => state.network.currentNode);
  const currentAddress = useSelector(
    (state) => state.accountInfo.currentAccount.address
  );

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [connectCount, setConnectCount] = useState(0);

  const [credentialCount, setCredentialCount] = useState(0);


  useEffect(() => {
    sendMsg(
      {
        action: DAPP_CONNECTION_LIST,
        payload: {
          address: currentAddress,
        },
      },
      (list) => {
        let connectTabId = Object.keys(list);
        setConnectCount(connectTabId.length);
      }
    );
  }, []);

  useEffect(() => {
    sendMsg(
      {
        action: CredentialMsg.ID_LIST,
        payload: currentAddress,
      },
      (credentialsIds) => {
        setCredentialCount(credentialsIds.length);
      }
    );
  }, [currentAddress]);

  const { routeList, rowAbout } = useMemo(() => {
    const getNetwork = () => {
      return showNameSlice(currentNode.name, 12);
    };
    const getAddressBook = () => {
      let list = getLocal(ADDRESS_BOOK_CONFIG);

      if (list) {
        list = JSON.parse(list);
      } else {
        list = [];
      }
      return list.length;
    };

    const addressBookAction = () => {
      dispatch(updateAddressBookFrom(""));
    };
    let routeList = [
      {
        icon: "/img/ic_preference.svg",
        title: i18n.t("preferences"),
        targetRoute: "/preferences_page",
      },
      {
        icon: "/img/icon_security.svg",
        title: i18n.t("security"),
        targetRoute: "/security_page",
      },
      {
        icon: "/img/icon_connect.svg",
        title: i18n.t("appConnection"),
        targetRoute: "/app_connection",
        rightContent: connectCount,
      },
      {
        icon: "/img/ic_credentials.svg",
        title: i18n.t("credentialsTitle"),
        targetRoute: "/credential_manage",
        rightContent: credentialCount,
      },
      {
        icon: "/img/icon_network.svg",
        title: i18n.t("network"),
        targetRoute: "/network_page",
        rightContent: getNetwork(),
      },
      {
        icon: "/img/icon_addressBook.svg",
        title: i18n.t("addressBook"),
        targetRoute: "/address_book",
        rightContent: getAddressBook(),
        action: addressBookAction,
      },
    ];
    const rowAbout = {
      icon: "/img/icon_about.svg",
      title: i18n.t("about"),
      targetRoute: "/about_us",
    };
    return {
      routeList,
      rowAbout,
    };
  }, [i18n, currentNode, dispatch, connectCount, credentialCount]);

  const onClickTitle = useCallback(() => {
    navigate(-1);
  }, []);

  return (
    <CustomView
      title={i18n.t("setting")}
      TitleWrapper={StyledCustomTitle}
      onClickTitle={onClickTitle}
      rightHoverContent={i18n.t("popOutWindow")}
      ContentWrapper={StyledContentContainer}
    >
      {routeList.map((routeItem, index) => {
        return (
          <RowItem
            key={index}
            action={routeItem.action}
            icon={routeItem.icon}
            title={routeItem.title}
            targetRoute={routeItem.targetRoute}
            rightContent={routeItem.rightContent}
          />
        );
      })}
      <StyledDividedLine />
      <RowItem
        icon={rowAbout.icon}
        title={rowAbout.title}
        targetRoute={rowAbout.targetRoute}
      />
    </CustomView>
  );
};

const RowItem = ({
  icon = "",
  title = "",
  targetRoute = "",
  rightContent = "",
  action,
}) => {
  const navigate = useNavigate();
  const onClick = useCallback(() => {
    if (action) {
      action();
    }
    navigate(targetRoute);
  }, [action, targetRoute]);
  return (
    <StyledRowContainer onClick={onClick}>
      <StyledRowLeft>
        <StyledIconContainer>
          {icon && <img src={icon} />}
        </StyledIconContainer>
        <StyledRowTitle>{title}</StyledRowTitle>
      </StyledRowLeft>
      <StyledRowLeft>
        <StyledRowContent>{rightContent}</StyledRowContent>
        <img src="/img/icon_arrow.svg" />
      </StyledRowLeft>
    </StyledRowContainer>
  );
};

export default Setting;
