import { useAppSelector } from "@/hooks/useStore";
import styled from "styled-components";
import { LoadingView } from "./StatusView";
import TokenItem from "./TokenItem";

const StyledTokenWrapper = styled.div`
  background-color: white;
`;

const TokenListView = ({ isInModal = false }) => {
  const tokenList = useAppSelector((state) => state.accountInfo.tokenList);
  const tokenShowList = useAppSelector((state) => state.accountInfo.tokenShowList);
  const shouldRefresh = useAppSelector((state) => state.accountInfo.shouldRefresh);
  const isSilentRefresh = useAppSelector(
    (state) => state.accountInfo.isSilentRefresh
  );

  type TokenListItem = { tokenId: string };

  return (
    <StyledTokenWrapper>
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
    </StyledTokenWrapper>
  );
};

export default TokenListView;
