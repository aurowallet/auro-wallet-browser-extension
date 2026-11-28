import { getLocal, saveLocal } from "@/background/localStorage";
import { STABLE_LOCAL_ACCOUNT_CACHE_KEYS } from "@/constant/storageKey";
import { useAppDispatch, useAppSelector } from "@/hooks/useStore";
import FooterPopup from "@/popup/component/FooterPopup";
import SvgIcon from "@/popup/component/SvgIcon";
import { updateLocalShowedTokenId } from "@/reducers/accountReducer";
import BigNumber from "bignumber.js";
import i18n from "i18next";
import { useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";
import NFTListView from "./NFTListView";
import TokenListView from "./TokenListView";
import TokenManageList from "./TokenManageList";

type AssetTab = "tokens" | "nfts";
type AssetRouteState = { walletAssetTab?: AssetTab };

const StyledAssetWrapper = styled.div<{ $isLoading: boolean }>`
  display: flex;
  flex-direction: column;
  flex: ${({ $isLoading }) => $isLoading ? "1 0 auto" : "0 0 auto"};
  background-color: #ffffff;
`;

const StyledAssetHeaderRow = styled.div`
  padding: 0px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 35px;
  flex-shrink: 0;
`;

const StyledAssetTabRow = styled.div`
  display: flex;
  align-items: center;

  > :not(:first-child) {
    margin-left: 10px;
  }
`;

const StyledAssetTabTitle = styled.div<{ $active?: boolean }>`
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  color: ${(props) => (props.$active ? "#000000" : "#808080")};
  text-transform: uppercase;
  cursor: pointer;
`;

const StyledTokenIgnoreRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.1);
  background: #f9fafc;
`;

const StyledTokenTip = styled.div`
  color: #808080;
  font-size: 12px;
  font-weight: 500;
`;

const StyledIgnoreContent = styled(StyledTokenTip)`
  cursor: pointer;
`;

const StyledTokenManageWrapper = styled.div`
  position: relative;
  cursor: pointer;
`;

const StyledManageTip = styled.div`
  position: absolute;
  right: 0px;
  top: -4px;
  border-radius: 8px;
  background: #d65a5a;
  padding: 2px 4px;
  min-width: 18px;
  text-align: center;
  color: #fff;
  font-size: 12px;
  font-weight: 400;
`;

const AssetListView = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const tokenList = useAppSelector((state) => state.accountInfo.tokenList);
  const shouldRefresh = useAppSelector((state) => state.accountInfo.shouldRefresh);
  const isSilentRefresh = useAppSelector(
    (state) => state.accountInfo.isSilentRefresh
  );
  const newTokenCount = useAppSelector((state) => state.accountInfo.newTokenCount);
  const localShowedTokenIds = useAppSelector(
    (state) => state.accountInfo.localShowedTokenIds
  );
  const currentAccount = useAppSelector(
    (state) => state.accountInfo.currentAccount
  );
  const [tokenManageStatus, setTokenManageStatus] = useState(false);
  const activeAssetTab = useMemo<AssetTab>(() => {
    const routeState = location.state as AssetRouteState | null;
    return routeState?.walletAssetTab === "nfts" ? "nfts" : "tokens";
  }, [location.state]);
  const isLoading = activeAssetTab === "tokens" && shouldRefresh && !isSilentRefresh && tokenList.length === 0;

  const { showCount, showTokenTip } = useMemo(() => {
    const showTokenTip = BigNumber(newTokenCount).gt(0);
    const showCount = BigNumber(newTokenCount).gt(99) ? "99+" : newTokenCount;
    return { showCount, showTokenTip };
  }, [newTokenCount]);

  const showTokenManageIcon = useMemo(() => {
    return tokenList.length > 1;
  }, [tokenList]);

  const onClickManage = useCallback(() => {
    setTokenManageStatus(true);
  }, []);

  const onChangeAssetTab = useCallback(
    (tab: AssetTab) => {
      navigate(".", {
        replace: true,
        state: {
          ...((location.state as AssetRouteState | null) || {}),
          walletAssetTab: tab,
        },
      });
    },
    [location.state, navigate]
  );

  type TokenListItem = { tokenId: string };
  const onClickIgnore = useCallback(() => {
    const showedTokenIdList = (tokenList as TokenListItem[]).map(
      (item: TokenListItem) => item.tokenId
    );
    const newIdList = [
      ...new Set([...showedTokenIdList, ...localShowedTokenIds]),
    ];
    let existingShowedToken = {};
    try {
      existingShowedToken = JSON.parse(
        getLocal(STABLE_LOCAL_ACCOUNT_CACHE_KEYS.SHOWED_TOKEN) || "{}"
      );
    } catch (e) {
      // corrupted localStorage
    }
    if (
      !existingShowedToken ||
      typeof existingShowedToken !== "object" ||
      Array.isArray(existingShowedToken)
    ) {
      existingShowedToken = {};
    }
    saveLocal(
      STABLE_LOCAL_ACCOUNT_CACHE_KEYS.SHOWED_TOKEN,
      JSON.stringify({
        ...existingShowedToken,
        [currentAccount.address || ""]: newIdList,
      })
    );
    dispatch(updateLocalShowedTokenId(newIdList));
  }, [tokenList, currentAccount, localShowedTokenIds]);

  return (
    <StyledAssetWrapper $isLoading={isLoading}>
      <StyledAssetHeaderRow>
        <StyledAssetTabRow>
          <StyledAssetTabTitle
            $active={activeAssetTab === "tokens"}
            onClick={() => onChangeAssetTab("tokens")}
          >
            {i18n.t("tokens")}
          </StyledAssetTabTitle>
          <StyledAssetTabTitle
            $active={activeAssetTab === "nfts"}
            onClick={() => onChangeAssetTab("nfts")}
          >
            NFTs
          </StyledAssetTabTitle>
        </StyledAssetTabRow>
        {showTokenManageIcon && activeAssetTab === "tokens" && (
          <TokenManageIcon
            onClickManage={onClickManage}
            showCount={showCount}
            showTokenTip={showTokenTip}
          />
        )}
      </StyledAssetHeaderRow>
      {activeAssetTab === "tokens" ? <TokenListView /> : <NFTListView />}

      <FooterPopup
        isOpen={tokenManageStatus}
        onClose={() => setTokenManageStatus(false)}
        title={i18n.t("assetManagement")}
      >
        {showTokenTip && (
          <StyledTokenIgnoreRow>
            <StyledTokenTip>
              {i18n.t("newTokenFound", { count: Number(newTokenCount) })}
            </StyledTokenTip>
            <StyledIgnoreContent onClick={onClickIgnore}>
              {i18n.t("ignore")}
            </StyledIgnoreContent>
          </StyledTokenIgnoreRow>
        )}
        <TokenManageList />
      </FooterPopup>
    </StyledAssetWrapper>
  );
};

interface TokenManageIconProps {
  showCount?: string | number;
  showTokenTip?: boolean;
  onClickManage?: () => void;
}

const TokenManageIcon = ({
  showCount,
  showTokenTip,
  onClickManage = () => {},
}: TokenManageIconProps) => {
  return (
    <StyledTokenManageWrapper onClick={onClickManage}>
      <SvgIcon src="/img/icon_circle_plus.svg" color="rgba(0, 0, 0, 0.8)" />
      {showTokenTip && <StyledManageTip>{showCount}</StyledManageTip>}
    </StyledTokenManageWrapper>
  );
};

export default AssetListView;
