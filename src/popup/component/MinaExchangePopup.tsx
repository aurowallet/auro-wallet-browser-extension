import FooterPopup from "@/popup/component/FooterPopup";
import { openTab } from "@/utils/commonMsg";
import { getExchangeDescription, type MinaExchange } from "@/utils/minaExchanges";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";

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

  & + & {
    border-top: 1px solid rgba(0, 0, 0, 0.1);
  }

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

interface MinaExchangePopupProps {
  exchanges: MinaExchange[];
  onClose: () => void;
}

const MinaExchangePopup = ({ exchanges, onClose }: MinaExchangePopupProps) => {
  const { t, i18n } = useTranslation();
  return (
    <FooterPopup
      isOpen={true}
      onClose={onClose}
      title={t("getMinaFrom")}
    >
      {exchanges.map((exchange) => {
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
  );
};

export default MinaExchangePopup;
