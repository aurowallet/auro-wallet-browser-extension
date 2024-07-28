import { useMemo } from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import TokenManageItem from "./TokenManageItem";

const StyledTokenWrapper = styled.div`
  background-color: white;
`;
const StyledTokenInfoRow = styled.div`
  padding: 10px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-top: 0.5px solid rgba(0, 0, 0, 0.1);
`;
const StyledTokenInfo = styled.a`
  color: rgba(0, 0, 0, 0.3);
  text-align: center;
  font-size: 12px;
  font-weight: 400;

  text-decoration: none;
`;

const TokenManageList = ({}) => {
  const tokenList = useSelector((state) => state.accountInfo.tokenList);
  const manageTokenList = useMemo(()=>{
    return tokenList.filter((tokenItem)=>{
      return !tokenItem?.tokenBaseInfo?.isMainToken
    },[])
  },[tokenList])
  return (
    <StyledTokenWrapper>
      {manageTokenList.map((token, index) => {
        return <TokenManageItem key={index} token={token} />;
      })}
      <StyledTokenInfoRow>
        {/* <StyledTokenInfo href={TokenLaunch} target="_blank">
          {i18n.t("updateTokenInfo")}
        </StyledTokenInfo> */}
      </StyledTokenInfoRow>
    </StyledTokenWrapper>
  );
};

export default TokenManageList;
