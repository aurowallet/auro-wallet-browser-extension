import { NetworkID_MAP } from "@/constant/network";
import { useAppSelector } from "@/hooks/useStore";
import MinaExchangePopup from "@/popup/component/MinaExchangePopup";
import BigNumber from "bignumber.js";
import { useTranslation } from "react-i18next";
import type { MinaExchange } from "@/utils/minaExchanges";
import { useEffect, useState } from "react";
import styled from "styled-components";

const StyledGetMinaButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  flex-shrink: 0;
  width: 100%;
  height: 48px;
  padding: 0 20px;
  border: none;
  border-radius: 8px 8px 0 0;
  background: #ffffff;
  color: #594af1;
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background: #f2f2f2;
  }
`;

const StyledGetMinaIcon = styled.img`
  display: block;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
`;

const GetMina = () => {
  const address = useAppSelector((state) => state.accountInfo.currentAccount.address);
  const currentNode = useAppSelector((state) => state.network.currentNode);
  return <GetMinaContent key={JSON.stringify([address, currentNode.networkID, currentNode.url])} />;
};

const GetMinaContent = () => {
  const { t } = useTranslation();
  const config = useAppSelector((state) => state.cache.minaExchangesConfig);
  const exchanges = config?.enabled ? config.exchanges.filter((exchange) => exchange.enabled) : [];
  const currentNode = useAppSelector((state) => state.network.currentNode);
  const address = useAppSelector(
    (state) => state.accountInfo.currentAccount.address
  );
  const balance = useAppSelector(
    (state) => state.accountInfo.mainTokenNetInfo?.balance.total
  );
  const isCheckingBalance = useAppSelector(
    (state) => state.accountInfo.shouldRefresh && !state.accountInfo.isSilentRefresh
  );
  const [isOpen, setIsOpen] = useState(false);
  const [displayedExchanges, setDisplayedExchanges] = useState<MinaExchange[] | null>(null);
  const showGetMina =
    currentNode.networkID === NetworkID_MAP.mainnet &&
    !!address &&
    !isCheckingBalance &&
    balance !== undefined &&
    new BigNumber(balance).isZero() &&
    exchanges.length > 0;

  useEffect(() => {
    if (!displayedExchanges && showGetMina) {
      setDisplayedExchanges(exchanges);
    }
  }, [displayedExchanges, showGetMina, config]);

  if (!displayedExchanges && !showGetMina) return null;

  return (
    <>
      <StyledGetMinaButton type="button" onClick={() => setIsOpen(true)}>
        <StyledGetMinaIcon src="/img/icon_buy.svg" alt="" />
        {t("getMina")}
      </StyledGetMinaButton>
      {isOpen && (
        <MinaExchangePopup
          exchanges={displayedExchanges ?? exchanges}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default GetMina;
