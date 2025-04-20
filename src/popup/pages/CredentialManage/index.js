import i18n from "i18next";
import { useCallback, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import styled from "styled-components";
import { CredentialMsg } from "../../../constant/msgTypes";
import { sendMsg } from "../../../utils/commonMsg";
import CustomView from "../../component/CustomView";
import styles from "./index.module.scss";

const StyledContentWrapper = styled.div`
  flex: 1;
`;
const StyledItemWrapper = styled.div`
  padding: 10px 20px;
  cursor: pointer;
  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
`;
const StyledItemContent = styled.p`
  font-weight: 500;
  font-size: 14px;
  line-height: 100%;
  color: rgba(0, 0, 0, 0.3);
  margin: 4px 0px 0px;
  word-break: break-all;
`;
const StyledItemDividedLine = styled.div`
  height: 0.5px;
  background-color: rgba(0, 0, 0, 0.1);
  margin: 10px 20px;
`;
const CredentialManage = ({}) => {
  const history = useHistory();

  const [credentialList, setCredentialList] = useState([]);

  useEffect(() => {
    sendMsg(
      {
        action: CredentialMsg.ID_LIST,
      },
      (credentials) => {
        setCredentialList(credentials);
      }
    );
  }, []);

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
                {index !== credentialList.length - 1 && (
                  <StyledItemDividedLine />
                )}
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
