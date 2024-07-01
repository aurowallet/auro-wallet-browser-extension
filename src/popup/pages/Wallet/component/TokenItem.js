import { MAIN_COIN_CONFIG } from "@/constant";
import { updateNextTokenDetail } from "@/reducers/cache";
import { addressSlice, getAmountForUI, getBalanceForUI } from "@/utils/utils";
import i18n from "i18next";
import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import styled from "styled-components";
import TokenIcon from "./TokenIcon";

const StyledTokenItemWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  padding: 10px 20px;
  border-top: 0.5px solid rgba(0, 0, 0, 0.1);
  cursor: pointer;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
`;

const StyledTokenLeft = styled.div`
  display: flex;
  align-items: center;
`;
const StyledTokenWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;
const StyledTokenInfo = styled.div`
  margin-left: 16px;
`;
const StyledTokenSymbolWrapper = styled.div`
  display: flex;
  align-items: center;
`;
const StyledTokenSymbol = styled.div`
  color: rgba(0, 0, 0, 0.8);
  font-size: 14px;
  font-weight: 500;
`;
const StyledDelegateStatus = styled.div`
  display: flex;
  padding: 0px 4px;
  justify-content: center;
  align-items: center;
  border-radius: 4px;
  color: #fff;
  text-align: center;
  font-size: 14px;
  font-weight: 500;

  margin-left: 4px;
  background-color: ${(props) =>
    props.$isChecked ? "#594AF1" : "rgba(0, 0, 0, 0.30)"};
`;
const StyledScamTag = styled.div`
  font-weight: 500;
  font-size: 12px;
  line-height: 14px;
  color: #d65a5a;

  border: 1px solid #d65a5a;
  border-radius: 2px;
  margin-left: 4px;
`;
const StyledTokenId = styled.div`
  color: #808080;
  font-size: 12px;
  font-weight: 400;
  margin-top: 4px;
`;
const StyledTokenRight = styled.div`
  display: flex;
  align-items: flex-end;
  flex-direction: column;
`;
const StyledTokenAmount = styled.div`
  color: rgba(0, 0, 0, 0.8);
  text-align: right;
  font-size: 16px;
  font-weight: 500;
`;
const StyledTokenBalance = styled.div`
  color: #808080;
  text-align: right;
  font-size: 12px;
  font-weight: 500;
  margin-top: 4px;
`;
const TokenItem = ({ token, isInModal }) => {
  const history = useHistory();

  const currencyConfig = useSelector((state) => state.currencyConfig);
  const currentAccount = useSelector(
    (state) => state.accountInfo.currentAccount
  );
  const currentNode = useSelector((state) => state.network.currentNode);

  const dispatch = useDispatch();
  const {
    tokenIconUrl,
    tokenSymbol,
    displayBalance,
    displayAmount,
    tokenName,
    isFungibleToken,
    delegationText,
  } = useMemo(() => {

    const isFungibleToken = !token.tokenBaseInfo.isMainToken;

    let delegationText = token.tokenBaseInfo.isDelegation
      ? i18n.t("delegated")
      : i18n.t("undelegated");

    let tokenIconUrl;
    let tokenSymbol;
    let tokenName;
    if (isFungibleToken) {
      tokenSymbol = token?.tokenNetInfo?.tokenSymbol;
      tokenName = addressSlice(token.tokenId, 6);
    } else {
      tokenIconUrl = "img/mina_color.svg";
      tokenSymbol = MAIN_COIN_CONFIG.symbol;
      tokenName = MAIN_COIN_CONFIG.name;
    }
    let displayBalance = getBalanceForUI(token.tokenBaseInfo.showBalance);

    let displayAmount = "";
    if (token.tokenBaseInfo.showAmount) {
      displayAmount =
        currencyConfig.currentCurrency.symbol +
        " " +
        getAmountForUI(token.tokenBaseInfo.showAmount, 0, 2);
    }
    return {
      tokenIconUrl,
      tokenSymbol,
      displayBalance,
      displayAmount,
      tokenName,
      isFungibleToken,
      delegationText,
    };
  }, [token, currencyConfig, currentAccount]);

  const onClickToken = useCallback(() => {
    dispatch(updateNextTokenDetail(token));
    if (isInModal) {
      history.push("send_page");
    } else {
      history.push("token_detail");
    }
  }, [dispatch, token, isInModal]);

  const {showStaking} = useMemo(() => {
    const networkID = currentNode.networkID;
    let showStaking = networkID.startsWith("mina");
    return {
      showStaking
    }
  }, [currentNode.networkID]);
  return (
    <StyledTokenItemWrapper onClick={onClickToken}>
      <StyledTokenLeft>
        <StyledTokenWrapper>
          <TokenIcon iconUrl={tokenIconUrl} tokenSymbol={tokenSymbol} />
        </StyledTokenWrapper>
        <StyledTokenInfo>
          <StyledTokenSymbolWrapper>
            <StyledTokenSymbol>{tokenSymbol}</StyledTokenSymbol>
            {!isFungibleToken && !isInModal && showStaking && (
              <StyledDelegateStatus
                $isChecked={token.tokenBaseInfo.isDelegation}
              >
                {delegationText}
              </StyledDelegateStatus>
            )}
            {/* scam status */}
            {/*  {!isInModal && <StyledScamTag>{i18n.t("scam")}</StyledScamTag>} */}
          </StyledTokenSymbolWrapper>
          <StyledTokenId>{tokenName}</StyledTokenId>
        </StyledTokenInfo>
      </StyledTokenLeft>
      <StyledTokenRight>
        <StyledTokenAmount>{displayBalance}</StyledTokenAmount>
        <StyledTokenBalance>{displayAmount}</StyledTokenBalance>
      </StyledTokenRight>
    </StyledTokenItemWrapper>
  );
};

export default TokenItem;
