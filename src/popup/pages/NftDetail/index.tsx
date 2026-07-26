import CustomViewV2 from "@/popup/component/CustomViewV2";
import i18n from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useStore";
import { useLocation, useNavigate } from "react-router-dom";
import styled, { css } from "styled-components";
import { addressSlice } from "@/utils/utils";
import { updateNextTokenDetail } from "@/reducers/cache";
import type { NftItem } from "../Wallet/component/NftListView";

const MOCK_NFT_ADDRESS =
  "wqeFF8x9wHxKM6TqZLTm9ZLC3456Sq7R1n2QmF8N7EC3456";

const StyledTopWrapper = styled.div`
  background: #f9fafc;
  display: flex;
  align-items: center;
  flex-direction: column;
  padding: 24px 20px 30px;
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

const StyledActionRow = styled.div`
  margin-top: 24px;
  display: flex;
  align-items: center;

  > :not(:first-child) {
    margin-left: 34px;
  }
`;

const rotateCss = css`
  -webkit-transform: rotate(180deg);
  -moz-transform: rotate(180deg);
  -o-transform: rotate(180deg);
  -ms-transform: rotate(180deg);
  transform: rotate(180deg);
`;

const StyledActionIcon = styled.div<{ $rotate?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  ${(props) => props.$rotate && rotateCss}
`;

const StyledActionTitle = styled.div`
  color: #594af1;
  text-align: center;
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;
  margin-top: 6px;
`;

const StyledActionItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 50px;
  padding: 4px 0px;
  cursor: pointer;

  &:hover {
    ${StyledActionIcon} {
      border-radius: 100%;
      filter: brightness(95%);
    }

    ${StyledActionTitle} {
      color: #5045c7;
    }
  }
`;

const NftDetail = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const currentAccount = useAppSelector(
    (state) => state.accountInfo.currentAccount
  );
  const tokenList = useAppSelector((state) => state.accountInfo.tokenList);
  const nft = (location.state as { nft?: NftItem } | null)?.nft;
  const nftName = nft?.name || "Cool cat";
  const nftAddress = currentAccount.address || MOCK_NFT_ADDRESS;
  const showAddress = addressSlice(nftAddress, 6);
  const mainToken = useMemo(() => {
    return tokenList.find((token) => token.tokenBaseInfo?.isMainToken);
  }, [tokenList]);

  const toSend = useCallback(() => {
    if (mainToken) {
      dispatch(updateNextTokenDetail(mainToken));
    }
    navigate("/send_page");
  }, [dispatch, mainToken, navigate]);

  const toReceive = useCallback(() => {
    navigate("/receive_page");
  }, [navigate]);

  return (
    <CustomViewV2
      title={nftName}
      subTitle={showAddress}
      copyContent={nftAddress}
    >
      <StyledTopWrapper>
        <NftDetailPreview imageUrl={nft?.imageUrl} name={nftName} />
        <StyledActionRow>
          <ActionItem title={i18n.t("send")} onClick={toSend} />
          <ActionItem title={i18n.t("receive")} onClick={toReceive} rotate />
        </StyledActionRow>
      </StyledTopWrapper>
    </CustomViewV2>
  );
};

const NftDetailPreview = ({
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
    <StyledNftPreview>
      {failed ? (
        <StyledNftFallbackImg src="/img/mina_color.svg" alt={name} />
      ) : (
        <StyledNftPreviewImg src={imageUrl} alt={name} onError={onError} />
      )}
    </StyledNftPreview>
  );
};

const ActionItem = ({
  title,
  rotate,
  onClick,
}: {
  title: string;
  rotate?: boolean;
  onClick: () => void;
}) => {
  return (
    <StyledActionItem onClick={onClick}>
      <StyledActionIcon $rotate={rotate}>
        <img src="img/tx_send2.svg" />
      </StyledActionIcon>
      <StyledActionTitle>{title}</StyledActionTitle>
    </StyledActionItem>
  );
};

export default NftDetail;
