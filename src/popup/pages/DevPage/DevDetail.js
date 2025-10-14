import i18n from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import styled from "styled-components";
import {
  getAllTxHistory,
  getPendingTxList,
  getZkAppPendingTx,
} from "../../../background/api";
import { ZK_DEFAULT_TOKEN_ID } from "../../../constant";
import useFetchAccountData from "../../../hooks/useUpdateAccount";
import { copyText } from "../../../utils/browserUtils";
import Button from "../../component/Button";
import CustomView from "../../component/CustomView";
import Toast from "../../component/Toast";
import { LoadingView } from "../Wallet/component/StatusView";

const StyledDelete = styled.p`
  font-weight: 500;
  font-size: 14px;
  line-height: 17px;
  text-align: center;
  color: #594af1;
  margin: 0;
  cursor: pointer;
  text-transform: capitalize;
`;
const StyledContentWrapper = styled.div`
  margin-bottom: 80px;
`;

const StyledRowAddress = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  cursor: pointer;
  margin: 10px 0px;
`;
const StyledDividedLine = styled.div`
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.1);
`;
const StyledRowAddressTitle = styled.div`
  font-weight: 600;
  font-size: 16px;
  line-height: 100%;
  color: #000000;
`;
const StyledRowAddressContent = styled.div`
  font-weight: 500;
  font-size: 14px;
  line-height: 17px;
  color: rgba(0, 0, 0, 0.3);
  word-wrap: break-word;
  margin-top: 10px;
`;

const StyledBottomOuterContainer = styled.div`
  padding: 12px 38px 20px;
  position: fixed;
  bottom: 0;
  width: calc(100%);
  background-color: white;
  max-width: 375px;
  left: 0;
`;
const StyledBottomContainer = styled.div`
  display: flex;
  align-items: center;
`;
const DevDetail = ({}) => {
  const history = useHistory();
  const currentAccount = useSelector(
    (state) => state.accountInfo.currentAccount
  );
  const { fetchAccountData } = useFetchAccountData(currentAccount, true);
  const [isLoading, setIsLoading] = useState(false);
  const [responseBody, setResponseBody] = useState("");

  const { pageType, title } = useMemo(() => {
    const pageType = history.location?.params?.pageType ?? "";
    const title = history.location?.params?.title ?? "";
    return { pageType, title };
  }, [history]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    if (pageType === "transaction") {
      let fullTxRequestResponse = await getAllTxHistory(
        currentAccount.address,
        ZK_DEFAULT_TOKEN_ID
      ).catch((err) => err);
      setResponseBody(fullTxRequestResponse);
      setIsLoading(false);
    } else if (pageType === "pendingTx") {
      let pendingTxResponse = await getPendingTxList(
        currentAccount.address
      ).catch((err) => err);
      setResponseBody(pendingTxResponse);
      setIsLoading(false);
    } else if (pageType === "pendingZkTx") {
      let zkAppPendingResponse = await getZkAppPendingTx(
        currentAccount.address,
        ZK_DEFAULT_TOKEN_ID
      ).catch((err) => err);
      setResponseBody(zkAppPendingResponse);
      setIsLoading(false);
    } else if (pageType === "balance") {
      let balanceResponse = await fetchAccountData().catch((err) => err);
      setResponseBody(balanceResponse);
      setIsLoading(false);
    }
  }, [pageType, currentAccount, fetchAccountData]);
  useEffect(() => {
    if (pageType) {
      fetchData();
    }
  }, [pageType]);

  const onClickCopy = useCallback(() => {
    copyText(
      JSON.stringify({
        address: currentAccount.address,
        responseBody: responseBody,
        pageType: pageType.toString(),
      })
    ).then(() => {
      Toast.info(i18n.t("copySuccess"));
    });
  }, [responseBody, currentAccount, pageType]);

  const onClickRetry = useCallback(() => {
    setResponseBody("");
    fetchData();
  }, []);
  return (
    <CustomView
      title={title ?? "UNKNOWN"}
      rightComponent={
        <StyledDelete onClick={onClickCopy}>{i18n.t("copy")}</StyledDelete>
      }
    >
      <StyledContentWrapper>
        <StyledRowAddress>
          <StyledRowAddressTitle>
            {i18n.t("accountAddress")}
          </StyledRowAddressTitle>
          <StyledRowAddressContent>
            {currentAccount.address}
          </StyledRowAddressContent>
        </StyledRowAddress>
        <StyledDividedLine />
        <StyledRowAddress>
          <StyledRowAddressTitle>{i18n.t("response")}</StyledRowAddressTitle>
          {isLoading ? (
            <LoadingView />
          ) : (
            <StyledRowAddressContent>
              {JSON.stringify(responseBody, null, 2)}
            </StyledRowAddressContent>
          )}
        </StyledRowAddress>
      </StyledContentWrapper>
      <StyledBottomOuterContainer>
        <Button onClick={onClickRetry}>
          <StyledBottomContainer>{i18n.t("retry")}</StyledBottomContainer>
        </Button>
      </StyledBottomOuterContainer>
    </CustomView>
  );
};

export default DevDetail;
