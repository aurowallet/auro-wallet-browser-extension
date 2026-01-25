import { saveLocal } from "@/background/localStorage";
import { STABLE_LOCAL_ACCOUNT_CACHE_KEYS } from "@/constant/storageKey";
import FooterPopup from "@/popup/component/FooterPopup";
import IconAdd from "@/popup/component/SVG/icon_add";
import { updateLocalShowedTokenId } from "@/reducers/accountReducer";
import BigNumber from "bignumber.js";
import i18n from "i18next";
import { useCallback, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useStore";
import styled from "styled-components";
import { LoadingView } from "./StatusView";
import TokenItem from "./TokenItem";
import TokenManageList from "./TokenManageList";

const StyledTokenWrapper = styled.div`
  background-color: white;
`;
const StyledTokenHeaderRow = styled.div`
  padding: 0px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 35px;
`;
const StyledTokenRowTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  color: #000000;
  text-transform: uppercase;
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

const TokenListView = ({ isInModal = false }) => {
  const dispatch = useAppDispatch();
  const tokenList = useAppSelector((state) => state.accountInfo.tokenList);
  const tokenShowList = useAppSelector((state) => state.accountInfo.tokenShowList);
  const shouldRefresh = useAppSelector((state) => state.accountInfo.shouldRefresh);
  const newTokenCount = useAppSelector((state) => state.accountInfo.newTokenCount);
  const localShowedTokenIds = useAppSelector(
    (state) => state.accountInfo.localShowedTokenIds
  );
  const isSilentRefresh = useAppSelector(
    (state) => state.accountInfo.isSilentRefresh
  );
  const currentAccount = useAppSelector(
    (state) => state.accountInfo.currentAccount
  );
  const [tokenManageStatus, setTokenManageStatus] = useState(false);
  const { showCount, showTokenTip } = useMemo(() => {
    const showTokenTip = BigNumber(newTokenCount).gt(0);
    const showCount = BigNumber(newTokenCount).gt(99) ? "99+" : newTokenCount;
    return { showCount, showTokenTip };
  }, [newTokenCount]);

  const showTokenManageIcon = useMemo(()=>{
    return tokenList.length > 1 // main token do not show icon 
  },[tokenList])
  const onClickManage = useCallback(() => {
    setTokenManageStatus(true);
  }, []);

  type TokenListItem = { tokenId: string };
  const onClickIgnore = useCallback(() => {
    const showedTokenIdList = (tokenList as TokenListItem[]).map((item: TokenListItem) => {
      return item.tokenId;
    });
    const newIdList = [
      ...new Set([...showedTokenIdList, ...localShowedTokenIds]),
    ];
    saveLocal(
      STABLE_LOCAL_ACCOUNT_CACHE_KEYS.SHOWED_TOKEN,
      JSON.stringify({ [currentAccount.address || ""]: newIdList })
    );
    dispatch(updateLocalShowedTokenId(newIdList));
  }, [tokenList, currentAccount, localShowedTokenIds]);
  return (
    <StyledTokenWrapper>
      {!isInModal && (
        <StyledTokenHeaderRow>
          <StyledTokenRowTitle>{i18n.t("tokens")}</StyledTokenRowTitle>
            {showTokenManageIcon  && <TokenManageIcon
              onClickManage={onClickManage}
              showCount={showCount}
              showTokenTip={showTokenTip}
            />}
        </StyledTokenHeaderRow>
      )}
      {shouldRefresh &&
      !isSilentRefresh &&
      tokenList.length == 0 &&
      !isInModal ? (
        <LoadingView />
      ) : (
        (tokenShowList as TokenListItem[]).map((token: TokenListItem, index: number) => {
          return <TokenItem key={index} token={token as Parameters<typeof TokenItem>[0]["token"]} isInModal={isInModal} />;
        })
      )}

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
    </StyledTokenWrapper>
  );
};

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

interface TokenManageIconProps {
  showCount?: string | number;
  showTokenTip?: boolean;
  onClickManage?: () => void;
}

export const TokenManageIcon = ({
  showCount,
  showTokenTip,
  onClickManage = () => {},
}: TokenManageIconProps) => {
  return (
    <StyledTokenManageWrapper onClick={onClickManage}>
      <IconAdd fill={"rgba(0, 0, 0, 0.8)"} />
      {showTokenTip && <StyledManageTip>{showCount}</StyledManageTip>}
    </StyledTokenManageWrapper>
  );
};

export default TokenListView;
