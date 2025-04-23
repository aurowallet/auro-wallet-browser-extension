import i18n from "i18next";
import { useCallback, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import styled from "styled-components";
import { CredentialMsg } from "../../../constant/msgTypes";
import { sendMsg } from "../../../utils/commonMsg";
import CustomView from "../../component/CustomView";
import styles from "./index.module.scss";
import { useSelector } from "react-redux";

const StyledContentWrapper = styled.div`
  flex: 1;
`;
const StyledItemWrapper = styled.div`
  padding: 10px 20px;
  cursor: pointer;
  min-height: 54px;
  display: flex;
  align-items: center;
  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
`;
const StyledItemContent = styled.p`
  line-height: 100%;
  margin: 4px 0px 0px;
  word-break: break-all;
  font-weight: 600;
  font-size: 14px;
  color: #000000;
  word-break: break-all;
`;
const CredentialManage = ({}) => {
  const history = useHistory();
  const currentAddress = useSelector(
    (state) => state.accountInfo.currentAccount.address
  );

  const [credentialList, setCredentialList] = useState([]);

  useEffect(() => {
    sendMsg(
      {
        action: CredentialMsg.ID_LIST,
        payload: currentAddress,
      },
      (credentials) => {
        setCredentialList(credentials);
      }
    );
  }, [currentAddress]);

  const onClickCredentialItem = useCallback((credentialId) => {
    history.push({
      pathname: "credential_detail",
      params: {
        credentialId: credentialId,
      },
    });
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
          {credentialList.map((credentialId, index) => {
            return (
              <div key={credentialId}>
                <StyledItemWrapper
                  onClick={() => onClickCredentialItem(credentialId)}
                >
                  <StyledItemContent>{credentialId}</StyledItemContent>
                </StyledItemWrapper>
              </div>
            );
          })}
        </StyledContentWrapper>
      )}
    </CustomView>
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
