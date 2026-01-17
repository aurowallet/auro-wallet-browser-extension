import { getCredentialDisplayData } from "@/utils/utils";
import { getSimplifyCredentialData } from "@/utils/o1jsUtils";
import i18n from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { CredentialMsg } from "../../../constant/msgTypes";
import { sendMsg } from "../../../utils/commonMsg";
import CustomView from "../../component/CustomView";
import {
  StyledContainer,
  StyledContentWrapper,
  StyledItemWrapper,
  StyledItemContent,
  StyledEmptyContainer,
  StyledEmptyTip,
} from "./index.styled";

const CredentialManage = ({}) => {

  const navigate = useNavigate();
  const currentAddress = useSelector(
    (state) => state.accountInfo.currentAccount.address
  );

  const [credentialList, setCredentialList] = useState([]);

  useEffect(() => {
    sendMsg(
      {
        action: CredentialMsg.get_credentials,
        payload: currentAddress,
      },
      (credentials) => {
        let list = [];
        for (let index = 0; index < credentials.length; index++) {
          const credential = credentials[index];
          const displayCredentialData = getSimplifyCredentialData(JSON.parse(credential.credential));
          const parseCredential = getCredentialDisplayData(
            displayCredentialData
          );
          list.push({
            ...credential,
            displayCredentialData,
            parseCredential,
          });
        }
        setCredentialList(list);
      }
    );
  }, [currentAddress]);

  const onClickCredentialItem = useCallback((credentialId) => {
    navigate("/credential_detail", { state: { credentialId: credentialId } });
  }, []);

  return (
    <CustomView
      title={i18n.t("credentialsTitle")}
      ContentWrapper={StyledContainer}
    >
      {credentialList.length === 0 ? (
        <EmptyView />
      ) : (
        <StyledContentWrapper>
          {credentialList.map((credentialData, index) => {
            return (
              <div key={index}>
                <StyledItemWrapper
                  onClick={() => onClickCredentialItem(credentialData.id)}
                >
                  <CredentialView data={credentialData.parseCredential} />
                  <img src="/img/icon_arrow.svg" />
                </StyledItemWrapper>
              </div>
            );
          })}
        </StyledContentWrapper>
      )}
    </CustomView>
  );
};

const CredentialView = (data) => {
  const profileData = useMemo(() => {
    const nextData = data.data;
    const availablePairs = Object.entries(nextData).filter(
      ([_, value]) => value !== ""
    );
    const stableKeys = availablePairs.slice(0, 3).map(([key]) => key);
    const profileData = stableKeys.map((key, index) => ({
      key: key.charAt(0).toUpperCase() + key.slice(1),
      value: nextData[key] || "",
    }));
    return profileData;
  }, [data]);
  return (
    <StyledItemContent>
      {profileData.map((item, index) => (
        <div key={index}>
          {item.key}: {item.value}
        </div>
      ))}
    </StyledItemContent>
  );
};

const EmptyView = () => {
  return (
    <StyledEmptyContainer>
      <img src="/img/icon_empty.svg" />
      <StyledEmptyTip>{i18n.t("noCredentials")}</StyledEmptyTip>
    </StyledEmptyContainer>
  );
};

export default CredentialManage;
