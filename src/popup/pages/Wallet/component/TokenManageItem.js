import { MAIN_COIN_CONFIG, ZK_DEFAULT_TOKEN_ID } from "@/constant";
import IconAdd from "@/popup/component/SVG/icon_add";
import { addressSlice, amountDecimals, getDisplayAmount } from "@/utils/utils";
import i18n from "i18next";
import { useCallback, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import TokenIcon from "./TokenIcon";

const StyledTokenItemWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  padding: 10px 20px;
  border-top: 0.5px solid rgba(0, 0, 0, 0.1);

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
  cursor: pointer;
`;
const StyledTokenAmount = styled.div`
  color: #808080;
  text-align: center;
  font-size: 12px;
  font-weight: 400;
`;

const TokenManageItem = ({ token }) => {
  const currencyConfig = useSelector((state) => state.currencyConfig);
  const cache = useSelector((state) => state.cache);
  const currentAccount = useSelector(
    (state) => state.accountInfo.currentAccount
  );
  const netAccount = useSelector((state) => state.accountInfo.netAccount);
  const dispatch = useDispatch();

  const [tokenShowStatus, setTokenShowStatus] = useState(false);
  const { tokenUrl, tokenSymbol, showBalanceText, tokenName } = useMemo(() => {
    const isFungibleToken = ZK_DEFAULT_TOKEN_ID !== token.tokenId;

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
    let showBalanceText = i18n.t("balance") + ": " + displayBalance;

    return {
      tokenUrl,
      tokenSymbol,
      showBalanceText,
      tokenName,
    };
  }, [token, currencyConfig, cache, currentAccount, netAccount]);

  const onClickManage = useCallback(() => {
    setTokenShowStatus((state) => !state);
  }, [dispatch, token]);
  return (
    <StyledTokenItemWrapper>
      <StyledTokenLeft>
        <StyledTokenWrapper>
          <TokenIcon iconUrl={tokenUrl} tokenName={tokenName} />
        </StyledTokenWrapper>
        <StyledTokenInfo>
          <StyledTokenSymbolWrapper>
            <StyledTokenSymbol>{tokenSymbol}</StyledTokenSymbol>
          </StyledTokenSymbolWrapper>
          <StyledTokenId>{tokenName}</StyledTokenId>
          <StyledTokenAmount>{showBalanceText}</StyledTokenAmount>
        </StyledTokenInfo>
      </StyledTokenLeft>
      <StyledTokenRight onClick={onClickManage}>
        {tokenShowStatus ? (
          <IconAdd fill={"rgba(0, 0, 0, 0.8)"} />
        ) : (
          <img src="img/icon_hide.svg" />
        )}
      </StyledTokenRight>
    </StyledTokenItemWrapper>
  );
};

export default TokenManageItem;
