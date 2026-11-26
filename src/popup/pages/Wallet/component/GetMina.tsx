import { NetworkID_MAP } from "@/constant/network";
import { useAppSelector } from "@/hooks/useStore";
import FooterPopup from "@/popup/component/FooterPopup";
import { openTab } from "@/utils/commonMsg";
import BigNumber from "bignumber.js";
import { useTranslation } from "react-i18next";
import { getExchangeDescription, type MinaExchange } from "@/utils/minaExchanges";
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
  font-size: 16px;
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

const StyledExchangeRow = styled.button`
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  padding: 16px 20px;
  border: none;
  background: #ffffff;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: #f2f2f2;
  }
`;

const StyledExchangeIcon = styled.img`
  width: 30px;
  height: 30px;
  object-fit: contain;
  flex-shrink: 0;
  border-radius: 10px;
`;

const StyledExchangePlaceholder = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  border-radius: 10px;
  background: #edeff2;
  color: #808080;
  font-size: 14px;
`;

const ExchangeIcon = ({ src, name }: { src: string; name: string }) => {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <StyledExchangePlaceholder aria-hidden="true">{Array.from(name)[0]}</StyledExchangePlaceholder>
  ) : (
    <StyledExchangeIcon src={src} alt="" crossOrigin="anonymous" onError={() => setFailed(true)} />
  );
};

const StyledExchangeInfo = styled.span`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
`;

const StyledExchangeName = styled.span`
  color: rgba(0, 0, 0, 1);
  font-size: 14px;
`;

const StyledExchangeDescription = styled.span`
  color: #808080;
  font-size: 12px;
`;

const StyledLinkIcon = styled.img`
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
  const { t, i18n } = useTranslation();
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
        <FooterPopup
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title={t("getMinaFrom")}
        >
          {(displayedExchanges ?? exchanges).map((exchange) => {
            const description = getExchangeDescription(exchange, i18n.language);
            return (
              <StyledExchangeRow
                key={exchange.id}
                type="button"
                onClick={() => openTab(exchange.url)}
              >
                <ExchangeIcon key={exchange.iconUrl} src={exchange.iconUrl} name={exchange.name} />
                <StyledExchangeInfo>
                  <StyledExchangeName>{exchange.name}</StyledExchangeName>
                  {description && (
                    <StyledExchangeDescription>
                      {description}
                    </StyledExchangeDescription>
                  )}
                </StyledExchangeInfo>
                <StyledLinkIcon src="/img/icon_link.svg" alt="" />
              </StyledExchangeRow>
            );
          })}
        </FooterPopup>
      )}
    </>
  );
};

export default GetMina;
