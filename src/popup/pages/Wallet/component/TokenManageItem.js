import { MAIN_COIN_CONFIG } from "@/constant";
import IconAdd from "@/popup/component/SVG/icon_add";
import { updateLocalTokenConfig } from "@/reducers/accountReducer";
import { addressSlice, getDisplayAmount } from "@/utils/utils";
import i18n from "i18next";
import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import TokenIcon from "./TokenIcon";
import { LOCAL_CACHE_KEYS } from "@/constant/storageKey";
import { saveLocal } from "@/background/localStorage";

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
  text-align: left;
  font-size: 12px;
  font-weight: 400;
`;
const TokenManageItem = ({ token }) => {
  const currencyConfig = useSelector((state) => state.currencyConfig);
  const tokenList = useSelector((state) => state.accountInfo.tokenList);
  const localTokenConfig = useSelector((state) => state.accountInfo.localTokenConfig);

  
  const currentAccount = useSelector(
    (state) => state.accountInfo.currentAccount
  );
  const dispatch = useDispatch();
  const {
    tokenIconUrl,
    tokenSymbol,
    showBalanceText,
    tokenName,
  } = useMemo(() => {
    const isFungibleToken = !token.tokenBaseInfo.isMainToken;

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

    let displayBalance = getDisplayAmount(token.tokenBaseInfo.showBalance);
    let showBalanceText = i18n.t("balance") + ": " + displayBalance;

    return {
      tokenIconUrl,
      tokenSymbol,
      showBalanceText,
      tokenName,
    };
  }, [token, currencyConfig]);

  const onClickManage = useCallback(() => {
    // {
    //   [tokenId]:{
    //     config
    //   }
    // }
    let tempConfig = {
      ...localTokenConfig
    }
    let currentTokenConfig = tempConfig[token.tokenId]
    if(currentTokenConfig){
      let lastTokenConfig = {
        ...currentTokenConfig,
        hideToken:!currentTokenConfig.hideToken
      }
      tempConfig[token.tokenId] = lastTokenConfig
    }else{
      tempConfig[token.tokenId] = {
        hideToken:true
      }
    }
    saveLocal(LOCAL_CACHE_KEYS.TOKEN_CONFIG, JSON.stringify({ [currentAccount.address]: tempConfig }))
    dispatch(updateLocalTokenConfig(tempConfig))
  }, [token, tokenList, currentAccount,localTokenConfig]);

  return (
    <StyledTokenItemWrapper>
      <StyledTokenLeft>
        <StyledTokenWrapper>
          <TokenIcon iconUrl={tokenIconUrl} tokenSymbol={tokenSymbol} />
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
        {token.localConfig?.hideToken ? (
          <IconAdd fill={"rgba(0, 0, 0, 0.8)"} />
        ) : (
          <img src="img/icon_hide.svg" />
        )}
      </StyledTokenRight>
    </StyledTokenItemWrapper>
  );
};

export default TokenManageItem;
