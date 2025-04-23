import i18n from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useHistory } from "react-router-dom";
import styled from "styled-components";
import { CredentialMsg } from "../../../../constant/msgTypes";
import { sendMsg } from "../../../../utils/commonMsg";
import { addressSlice } from "../../../../utils/utils";
import CustomView from "../../../component/CustomView";
import { useSelector } from "react-redux";

const StyledJsonView = styled.div`
  overflow-y: auto;
  border-radius: 4px;
  border: 0.5px solid rgba(0, 0, 0, 0.1);
  padding: 10px;
  overflow-y: auto;
  width: calc(100% - 0px);
  overflow-wrap: break-word;
  white-space: pre-wrap;
  margin-bottom: 10px;

  color: #000;
  font-size: 14px;
  font-weight: 400;
  pre {
    word-break: break-all;
    white-space: pre-wrap;
  }
`;
const StyledDelete = styled.p`
  font-weight: 500;
  font-size: 14px;
  line-height: 17px;
  text-align: center;
  color: #d65a5a;
  margin: 0;
  cursor: pointer;
  text-transform: capitalize;
`;

const CredentialDetail = ({}) => {
  const history = useHistory();
  const currentAddress = useSelector(
    (state) => state.accountInfo.currentAccount.address
  );

  const [credential, setCredential] = useState("");

  const credentialId = useMemo(() => {
    let credentialId = history.location?.params?.credentialId ?? "";
    return credentialId;
  }, [history]);

  useEffect(() => {
    sendMsg(
      {
        action: CredentialMsg.target_credential,
        payload: {
          credentialId: credentialId,
          address: currentAddress,
        },
      },
      (targetCredential) => {
        try {
          setCredential(
            JSON.stringify(JSON.parse(targetCredential.credential), null, 2)
          );
        } catch (e) {
          setCredential(targetCredential.credential);
        }
      }
    );
  }, [credentialId, currentAddress]);
  const onClickDelete = useCallback(() => {
    sendMsg(
      {
        action: CredentialMsg.remove_credential_detail,
        payload: {
          credentialId: credentialId,
          address: currentAddress,
        },
      },
      () => {
        history.goBack();
      }
    );
  }, [credentialId, currentAddress]);

  return (
    <CustomView
      title={addressSlice(credentialId, 6)}
      rightComponent={
        <StyledDelete onClick={onClickDelete}>
          {i18n.t("deleteTag")}
        </StyledDelete>
      }
    >
      <StyledJsonView>
        <pre>{credential}</pre>
      </StyledJsonView>
    </CustomView>
  );
};

export default CredentialDetail;
