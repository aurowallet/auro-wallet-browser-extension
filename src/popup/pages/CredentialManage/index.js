import { getCredentialDisplayData } from "@/utils/utils";
import { getSimplifyCredentialData } from "@/utils/o1jsUtils";
import i18n from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { CredentialMsg } from "../../../constant/msgTypes";
import { sendMsg } from "../../../utils/commonMsg";
import CustomView from "../../component/CustomView";
import styles from "./index.module.scss";

const StyledContentWrapper = styled.div`
  flex: 1;
`;
const StyledItemWrapper = styled.div`
  margin: 0px 20px 10px;
  padding: 10px 0px 10px 20px;
  cursor: pointer;
  min-height: 40px;
  display: flex;
  align-items: center;
  border-radius: 10px;
  border: 0.5px solid rgba(0, 0, 0, 0.1);
  background: #f9fafc;

  display: flex;
  justify-content: space-between;
  align-items: center;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
`;

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
      contentClassName={styles.addressBookContainer}
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

const StyledItemContent = styled.div`
  color: rgba(0, 0, 0, 0.8);
  font-size: 14px;
  font-weight: 500;
  div{
    word-break: break-all;
    white-space: pre-wrap;
  }

  > :not(:first-child) {
    margin-top: 8px;
  }
`;
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

const StyledEmptyContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  img {
    display: block;
  }
`;
const StyledEmptyTip = styled.p`
  font-size: 12px;
  line-height: 14px;
  color: rgba(0, 0, 0, 0.3);
  margin: 10px 0px 0px;
`;
const EmptyView = () => {
  return (
    <StyledEmptyContainer>
      <img src="/img/icon_empty.svg" className={styles.emptyIcon} />
      <StyledEmptyTip>{i18n.t("noCredentials")}</StyledEmptyTip>
    </StyledEmptyContainer>
  );
};

export default CredentialManage;
