import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled, { css, keyframes } from "styled-components";

export interface NftItem {
  id: string | number;
  name: string;
  imageUrl?: string;
}

const StyledNftGrid = styled.div`
  border-top: 0.5px solid rgba(0, 0, 0, 0.1);
  background: #ffffff;
`;

const StyledNftRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 50px;
  padding: 12px 48px 14px;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.1);
`;

const StyledNftItem = styled.div`
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

const StyledNftPreview = styled.div`
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

const StyledNftPreviewInner = styled.div<{ $loading?: boolean }>`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  ${(props) => props.$loading && nftPreviewLoadingCss}
`;

const StyledNftPreviewImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const StyledNftFallbackImg = styled.img`
  width: 60px;
  height: 60px;
  object-fit: contain;
`;

const StyledNftName = styled.div`
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

const NftListView = () => {
  const navigate = useNavigate();
  const nftItems = useMemo<NftItem[]>(
    () =>
      Array.from({ length: 6 }).map((_, index) => ({
        id: index,
        name: "Cool cat",
        imageUrl: "",
      })),
    []
  );
  const nftRows = useMemo(() => {
    const rows: NftItem[][] = [];
    for (let index = 0; index < nftItems.length; index += 2) {
      rows.push(nftItems.slice(index, index + 2));
    }
    return rows;
  }, [nftItems]);

  const onClickNft = useCallback(
    (nft: NftItem) => {
      navigate("/nft_detail", { state: { nft } });
    },
    [navigate]
  );

  return (
    <StyledNftGrid>
      {nftRows.map((row, rowIndex) => (
        <StyledNftRow key={rowIndex}>
          {row.map((item) => (
            <StyledNftItem key={item.id} onClick={() => onClickNft(item)}>
              <NftPreview imageUrl={item.imageUrl} name={item.name} />
              <StyledNftName>{item.name}</StyledNftName>
            </StyledNftItem>
          ))}
        </StyledNftRow>
      ))}
    </StyledNftGrid>
  );
};

const NftPreview = ({ imageUrl, name }: { imageUrl?: string; name: string }) => {
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
    <StyledNftPreview>
      {failed ? (
        <StyledNftFallbackImg src="/img/mina_color.svg" alt={name} />
      ) : (
        <StyledNftPreviewInner $loading={loading}>
          <StyledNftPreviewImg
            src={imageUrl}
            alt={name}
            loading="lazy"
            decoding="async"
            onLoad={onLoad}
            onError={onError}
          />
        </StyledNftPreviewInner>
      )}
    </StyledNftPreview>
  );
};

export default NftListView;
