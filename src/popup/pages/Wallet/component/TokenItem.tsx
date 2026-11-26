import { MAIN_COIN_CONFIG } from "@/constant";
import { updateNextTokenDetail } from "@/reducers/cache";
import { addressSlice, getAmountForUI, getBalanceForUI } from "@/utils/utils";
import i18n from "i18next";
import { useCallback, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useStore";
import { useNavigate } from "react-router-dom";
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
const StyledEarnTag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: 4px;
  padding: 2px 4px;
  border-radius: 2px;
  background: #f2f2f2;
  color: #594af1;
  font-size: 12px;
  line-height: 16px;
  white-space: nowrap;
`;
const StyledEarnIcon = styled.img`
  width: 12px;
  height: 12px;
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
interface TokenItemProps {
  token: {
    tokenId: string;
    tokenBaseInfo: {
      isMainToken: boolean;
      isDelegation?: boolean;
      iconUrl?: string;
      showBalance: string;
      showAmount?: string;
      decimals: number;
    };
    tokenNetInfo?: {
      tokenSymbol?: string;
    };
  };
  isInModal?: boolean;
}

const TokenItem = ({ token, isInModal }: TokenItemProps) => {
  const navigate = useNavigate();
  const currencyConfig = useAppSelector((state) => state.currencyConfig);
  const currentNode = useAppSelector((state) => state.network.currentNode);

  const dispatch = useAppDispatch();
  const {
    tokenIconUrl,
    tokenSymbol,
    displayBalance,
    displayAmount,
    tokenName,
    isFungibleToken,
  } = useMemo(() => {
    const isFungibleToken = !token.tokenBaseInfo.isMainToken;

    let tokenIconUrl = token.tokenBaseInfo.iconUrl;
    let tokenSymbol;
    let tokenName;
    if (isFungibleToken) {
      tokenSymbol =
        (token?.tokenNetInfo?.tokenSymbol?.length || 0) > 0
          ? token?.tokenNetInfo?.tokenSymbol
          : "UNKNOWN";
      tokenName = addressSlice(token.tokenId, 6);
    } else {
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
    };
  }, [token, currencyConfig]);

  const onClickToken = useCallback(() => {
    dispatch(updateNextTokenDetail(token));
    if (isInModal) {
      navigate("/send_page", { state: { isFromModal: true } });
    } else {
      navigate("/token_detail");
    }
  }, [dispatch, token, isInModal]);

  const { showStaking } = useMemo(() => {
    const networkID = currentNode.networkID;
    return {
      showStaking: networkID?.startsWith("mina"),
    };
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
              <StyledEarnTag>
                {i18n.t("earn")}
                <StyledEarnIcon src="/img/icon_earn.svg" alt="" />
              </StyledEarnTag>
            )}
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
