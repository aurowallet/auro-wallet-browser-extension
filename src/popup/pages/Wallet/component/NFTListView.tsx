import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import i18n from "i18next";
import { useAppDispatch, useAppSelector } from "@/hooks/useStore";
import {
  type ILocalNFTItem,
  groupOwnedNFTs,
  readNFTListCache,
} from "@/utils/nft";

import styled, { css, keyframes } from "styled-components";

import { nftListKey, initNFTList } from "@/reducers/nft";
import { LoadingView } from "./StatusView";

export type NFTItem = ILocalNFTItem;

const StyledNFTGrid = styled.div`
  border-top: 0.5px solid rgba(0, 0, 0, 0.1);
  background: #ffffff;
`;

const StyledNFTRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 50px;
  padding: 12px 48px 14px;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.1);
`;

const StyledNFTItem = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
`;

const nftPreviewShimmer = keyframes`
  0% { background-position: -144px 0; }
  100% { background-position: 144px 0; }
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

const nftPreviewLoadingCss = css`
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 144px 100%;
  animation: ${nftPreviewShimmer} 1.2s ease-in-out infinite;
`;

const StyledNFTPreviewInner = styled.div<{ $loading?: boolean }>`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  ${(props) => props.$loading && nftPreviewLoadingCss}
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

const StyledNFTName = styled.div`
  max-width: 100%;
  margin-top: 6px;
  color: rgba(0, 0, 0, 0.8);
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledNFTOwnedCount = styled.div`
  font-size: 12px;
  color: #808080;
  margin-top: 4px;
`;

const NFTListView = () => {
  const navigate = useNavigate();
  const owner = useAppSelector(
    (state) => state.accountInfo.currentAccount.address,
  );
  const network = useAppSelector(
    (state) => state.network.currentNode.networkID,
  );
  const dispatch = useAppDispatch();
  const key = nftListKey(network || "", owner || "");
  const entry = useAppSelector((state) => state.nft.lists[key]);
  const cached = useMemo(
    () => (entry?.loaded ? undefined : readNFTListCache(key)),
    [key, entry],
  );
  const result = entry?.loaded
    ? entry
    : cached
      ? { ...cached, loaded: true, status: entry?.status || "ready" }
      : entry;
  const canQuery = !!network && !!owner;
  const loading =
    canQuery &&
    (!result || result.status === "loading" || result.status === "idle");
  const revision = entry?.revision;
  const hasResult = !!entry;
  useEffect(() => {
    if (canQuery) dispatch(initNFTList(network, owner));
  }, [key, canQuery, network, owner, revision, hasResult, dispatch]);
  const groups = useMemo(() => {
    const names = new Intl.Collator(i18n.language?.replace("_", "-") || "en", {
      numeric: true,
      sensitivity: "base",
    });
    return groupOwnedNFTs(result?.items || [], network || "", owner || "").sort(
      (a, b) =>
        names.compare(a.representative.name, b.representative.name) ||
        (a.key < b.key ? -1 : a.key > b.key ? 1 : 0),
    );
  }, [result?.items, network, owner, i18n.language]);
  const nftRows = [];
  for (let index = 0; index < groups.length; index += 2)
    nftRows.push(groups.slice(index, index + 2));
  const onClickNFT = useCallback(
    (nft: NFTItem) => {
      navigate("/nft_detail", { state: { nft } });
    },
    [navigate],
  );

  if (loading && !result?.loaded)
    return (
      <StyledNFTGrid>
        <LoadingView />
      </StyledNFTGrid>
    );
  return (
    <StyledNFTGrid>
      {nftRows.map((row, rowIndex) => (
        <StyledNFTRow key={rowIndex}>
          {row.map((group) => (
            <StyledNFTItem key={group.key} onClick={() => onClickNFT(group.representative)}>
              <NFTPreview imageUrl={group.representative.imageUrl} name={group.representative.name} />
              <StyledNFTName>{group.representative.name}</StyledNFTName>
              <StyledNFTOwnedCount>
                {i18n.t("nftOwnedCount", { count: group.items.length })}
              </StyledNFTOwnedCount>
            </StyledNFTItem>
          ))}
        </StyledNFTRow>
      ))}
    </StyledNFTGrid>
  );
};

const NFTPreview = ({
  imageUrl,
  name,
}: {
  imageUrl?: string;
  name: string;
}) => {
  const [loading, setLoading] = useState(!!imageUrl);
  const [failed, setFailed] = useState(!imageUrl);

  useEffect(() => {
    setLoading(!!imageUrl);
    setFailed(!imageUrl);
  }, [imageUrl]);

  const onLoad = useCallback(() => {
    setLoading(false);
  }, []);

  const onError = useCallback(() => {
    setLoading(false);
    setFailed(true);
  }, []);

  return (
    <StyledNFTPreview>
      {failed ? (
        <StyledNFTFallbackImg src="/img/mina_color.svg" alt={name} />
      ) : (
        <StyledNFTPreviewInner $loading={loading}>
          <StyledNFTPreviewImg
            src={imageUrl}
            alt={name}
            loading="lazy"
            decoding="async"
            crossOrigin="anonymous"
            onLoad={onLoad}
            onError={onError}
          />
        </StyledNFTPreviewInner>
      )}
    </StyledNFTPreview>
  );
};

export default NFTListView;
