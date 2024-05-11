import { MAIN_COIN_CONFIG, ZK_DEFAULT_TOKEN_ID } from "@/constant";
import { updateNextTokenDetail } from "@/reducers/cache";
import {
  addressSlice,
  amountDecimals,
  getAmountForUI,
  getDisplayAmount,
} from "@/utils/utils";
import BigNumber from "bignumber.js";
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
  const cache = useSelector((state) => state.cache);
  const currentAccount = useSelector(
    (state) => state.accountInfo.currentAccount
  );
  const netAccount = useSelector((state) => state.accountInfo.netAccount);

  const dispatch = useDispatch();
  const {
    tokenUrl,
    tokenSymbol,
    displayBalance,
    displayAmount,
    tokenName,
    isFungibleToken,
    delegationText,
    delegationState,
  } = useMemo(() => {
    const isFungibleToken = ZK_DEFAULT_TOKEN_ID !== token.tokenId;

    let delegationState =
      netAccount?.delegate && netAccount?.delegate !== currentAccount.address;
    let delegationText = delegationState
      ? i18n.t("delegated")
      : i18n.t("undelegated");

    let tokenUrl;
    let tokenSymbol = "xx";
    let tokenName = "aaa";
    if (isFungibleToken) {
      tokenName = addressSlice(token.tokenId, 6);
    } else {
      tokenUrl = "img/mina_color.svg";
      tokenSymbol = MAIN_COIN_CONFIG.symbol;
      tokenName = MAIN_COIN_CONFIG.name;
    }

    let amount = amountDecimals(
      token.balance?.total || 0,
      MAIN_COIN_CONFIG.decimals
    );
    let displayBalance = getDisplayAmount(amount);

    let displayAmount = "";
    if (cache.currentPrice) {
      displayAmount = new BigNumber(cache.currentPrice)
        .multipliedBy(amount)
        .toString();
      displayAmount =
        currencyConfig.currentCurrency.symbol +
        " " +
        getAmountForUI(displayAmount, 0, 2);
    }
    return {
      tokenUrl,
      tokenSymbol,
      displayBalance,
      displayAmount,
      tokenName,
      isFungibleToken,
      delegationText,
      delegationState,
    };
  }, [token, currencyConfig, cache, currentAccount, netAccount]);

  const onClickToken = useCallback(() => {
    dispatch(updateNextTokenDetail(token));
    if (isInModal) {
      history.push("send_page");
    } else {
      history.push("token_detail");
    }
  }, [dispatch, token, isInModal]);
  return (
    <StyledTokenItemWrapper onClick={onClickToken}>
      <StyledTokenLeft>
        <StyledTokenWrapper>
          <TokenIcon iconUrl={tokenUrl} tokenName={tokenName} />
        </StyledTokenWrapper>
        <StyledTokenInfo>
          <StyledTokenSymbolWrapper>
            <StyledTokenSymbol>{tokenSymbol}</StyledTokenSymbol>
            {!isFungibleToken && !isInModal && (
              <StyledDelegateStatus $isChecked={delegationState}>
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
