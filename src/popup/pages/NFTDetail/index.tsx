import CustomViewV2 from "@/popup/component/CustomViewV2";
import i18n from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppSelector } from "@/hooks/useStore";
import { useLocation, useNavigate } from "react-router-dom";
import { ACCOUNT_TYPE } from "@/constant/commonType";
import styled from "styled-components";
import { addressSlice } from "@/utils/utils";
import type { NFTItem } from "../Wallet/component/NFTListView";
import Button, { button_size, button_theme } from "@/popup/component/Button";
import Toast from "@/popup/component/Toast";
import { copyText } from "@/utils/browserUtils";

const StyledTopWrapper = styled.div`
  flex-shrink: 0;
  background: #f9fafc;
  display: flex;
  align-items: center;
  flex-direction: column;
  padding: 24px 20px 30px;
`;

const StyledNFTPreview = styled.div`
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  overflow: hidden;
`;

const StyledNFTPreviewImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const StyledNFTFallbackImg = styled.img`
  width: 60px;
  height: 60px;
  object-fit: contain;
`;

const StyledNFTDescription = styled.p`
  margin: 16px 0 0;
  max-width: 100%;
  color: #808080;
  font-size: 12px;
  line-height: 18px;
  max-height: 36px;
  flex-shrink: 0;
  text-align: center;
  overflow-wrap: anywhere;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
`;

const StyledDetails = styled.div`
  padding: 0 20px 100px;
  flex-shrink: 0;
`;

const StyledSection = styled.section`
  padding: 20px 0;
  & + & {
    border-top: 1px solid #f2f2f2;
  }
`;

const StyledSectionTitle = styled.h2`
  margin: 0 0 16px;
  font-size: ${({ theme }) => theme.typography.fontSizeContent};
  font-weight: ${({ theme }) => theme.typography.fontWeightSemiBold};
  color: ${({ theme }) => theme.colors.textBlack};
`;

const StyledRowTitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSizeDesc};
  line-height: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
`;

const StyledRowContent = styled.p`
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
  font-size: ${({ theme }) => theme.typography.fontSizeContent};
  line-height: 16px;
  color: ${({ theme }) => theme.colors.textBlack};
  margin: 0;
  word-wrap: break-word;
`;

const StyledInfoRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.5fr);
  align-items: start;
  gap: 16px;
  & + & {
    margin-top: 16px;
  }
  ${StyledRowTitle}, ${StyledRowContent} {
    min-width: 0;
    line-height: 18px;
    max-height: 36px;
    overflow-wrap: anywhere;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
  }
  ${StyledRowContent} {
    text-align: right;
    overflow-wrap: anywhere;
    font-weight: 400;
  }
`;

const StyledAttributeMore = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 20px;
`;

const StyledSendFooter = styled.div`
  padding: 12px 38px 20px;
  position: fixed;
  bottom: 0;
  width: 100%;
  background-color: white;
  max-width: 375px;
  z-index: 1;
`;

const StyledCopyButton = styled.button`
  border: 0;
  padding: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
  overflow-wrap: anywhere;
  img {
    width: 12px;
    height: 12px;
    margin-left: 4px;
    vertical-align: middle;
  }
`;

const NFTDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const accountType = useAppSelector(
    (state) => state.accountInfo.currentAccount.type,
  );
  const nft = (location.state as { nft?: NFTItem } | null)?.nft;
  const watchOnly = accountType === ACCOUNT_TYPE.WALLET_WATCH;
  const toSend = () => navigate("/nft_send", { state: { nft } });
  const description =
    nft?.description?.trim().replace(/\s+/g, " ") ||
    `${i18n.t("nftCollection")} · ${nft?.collectionName?.trim() || addressSlice(nft?.collectionAddress, 8) || ""}`;
  return (
    <CustomViewV2 title={nft?.name || ""} truncateTitle>
      <StyledTopWrapper>
        <NFTDetailPreview imageUrl={nft?.imageUrl} name={nft?.name || ""} />
        <StyledNFTDescription>{description}</StyledNFTDescription>
      </StyledTopWrapper>
      <StyledDetails>
        <StyledSection aria-label={i18n.t("details")}>
          <InfoRow
            label={i18n.t("nftCollectionContract")}
            value={nft?.collectionAddress}
            copy
          />
          <InfoRow label={i18n.t("nftAddress")} value={nft?.nftAddress} copy />
          <InfoRow label={i18n.t("nftTokenId")} value={nft?.tokenId} copy />
        </StyledSection>
        {nft?.collectionName?.trim() && (
          <StyledSection aria-label={i18n.t("nftCollection")}>
            <StyledSectionTitle>{i18n.t("nftCollection")}</StyledSectionTitle>
            <InfoRow
              label={i18n.t("nftCollectionName")}
              value={nft?.collectionName}
            />
          </StyledSection>
        )}
        {!!nft?.attributes?.length && (
          <NFTAttributes key={nft?.id} attributes={nft?.attributes} />
        )}
      </StyledDetails>
      <StyledSendFooter>
        <Button onClick={toSend} disable={watchOnly}>
          {i18n.t("send")}
        </Button>
      </StyledSendFooter>
    </CustomViewV2>
  );
};

const NFTDetailPreview = ({
  imageUrl,
  name,
}: {
  imageUrl?: string;
  name: string;
}) => {
  const [failed, setFailed] = useState(!imageUrl);

  useEffect(() => {
    setFailed(!imageUrl);
  }, [imageUrl]);

  const onError = useCallback(() => {
    setFailed(true);
  }, []);

  return (
    <StyledNFTPreview>
      {failed ? (
        <StyledNFTFallbackImg src="/img/mina_color.svg" alt={name} />
      ) : (
        <StyledNFTPreviewImg
          src={imageUrl}
          alt={name}
          crossOrigin="anonymous"
          onError={onError}
        />
      )}
    </StyledNFTPreview>
  );
};

const InfoRow = ({
  label,
  value,
  copy = false,
}: {
  label: string;
  value?: string;
  copy?: boolean;
}) => {
  if (!value) return null;
  const onCopy = () =>
    copyText(value).then(() => Toast.info(i18n.t("copySuccess")));
  return (
    <StyledInfoRow>
      <StyledRowTitle>{label}</StyledRowTitle>
      <StyledRowContent>
        {copy ? (
          <StyledCopyButton onClick={onCopy} aria-label={label}>
            {addressSlice(value, 6, 6)}
            <img src="/img/icon_copy_black.svg" alt="" />
          </StyledCopyButton>
        ) : (
          value
        )}
      </StyledRowContent>
    </StyledInfoRow>
  );
};

const NFTAttributes = ({
  attributes,
}: {
  attributes: NonNullable<NFTItem["attributes"]>;
}) => {
  const [expanded, setExpanded] = useState(false);
  const sorted = useMemo(() => {
    const names = new Intl.Collator("zh-CN", {
      numeric: true,
      sensitivity: "variant",
    });
    return [...attributes].sort(
      (a, b) =>
        names.compare(a.name, b.name) ||
        names.compare(a.value, b.value) ||
        (a.name < b.name
          ? -1
          : a.name > b.name
            ? 1
            : a.value < b.value
              ? -1
              : a.value > b.value
                ? 1
                : 0),
    );
  }, [attributes]);
  return (
    <StyledSection aria-label={i18n.t("nftAttributes")}>
      <StyledSectionTitle>{i18n.t("nftAttributes")}</StyledSectionTitle>
      {(expanded ? sorted : sorted.slice(0, 12)).map((attribute, index) => (
        <InfoRow key={index} label={attribute.name} value={attribute.value} />
      ))}
      {!expanded && sorted.length > 12 && (
        <StyledAttributeMore>
          <Button
            theme={button_theme.BUTTON_THEME_LIGHT}
            size={button_size.small}
            onClick={() => setExpanded(true)}
          >
            {i18n.t("showMore")}
          </Button>
        </StyledAttributeMore>
      )}
    </StyledSection>
  );
};

export default NFTDetail;
