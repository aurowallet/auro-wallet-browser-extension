import FooterPopup from "@/popup/component/FooterPopup";
import IconAdd from "@/popup/component/SVG/icon_add";
import BigNumber from "bignumber.js";
import i18n from "i18next";
import { useCallback, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
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
  const tokenList = useSelector((state) => state.accountInfo.tokenList);

  const [tokenManageStatus, setTokenManageStatus] = useState(false);
  const [tokenIgnoreStatus, setTokenIgnoreStatus] = useState(true);
  const { showCount, showTokenTip, newTokenCount } = useMemo(() => {
    const newTokenCount = 0;
    const showTokenTip = BigNumber(newTokenCount).gt(0);
    const showCount = BigNumber(newTokenCount).gt(99) ? "99+" : newTokenCount;
    return { showCount, showTokenTip, newTokenCount };
  }, []);

  const onClickManage = useCallback(() => {
    setTokenManageStatus(true);
  }, []);
  const onClickIgnore = useCallback(() => {
    setTokenIgnoreStatus(false);
  }, []);
  return (
    <StyledTokenWrapper>
      {!isInModal && (
        <StyledTokenHeaderRow>
          <StyledTokenRowTitle>{i18n.t("tokens")}</StyledTokenRowTitle>
          <TokenManageIcon
            onClickManage={onClickManage}
            showCount={showCount}
            showTokenTip={showTokenTip}
          />
        </StyledTokenHeaderRow>
      )}
      {tokenList.map((token, index) => {
        return <TokenItem key={index} token={token} isInModal={isInModal} />;
      })}

      <FooterPopup
        isOpen={tokenManageStatus}
        onClose={() => setTokenManageStatus(false)}
        title={i18n.t("assetManagement")}
      >
        {tokenIgnoreStatus && (
          <StyledTokenIgnoreRow>
            <StyledTokenTip>
              {i18n.t("newTokenFound", { count: newTokenCount })}
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
  right: -16px;
  top: -4px;
  border-radius: 8px;
  background: #d65a5a;
  padding: 2px 4px;

  color: #fff;
  font-size: 12px;
  font-weight: 400;
`;

export const TokenManageIcon = ({
  showCount,
  showTokenTip,
  onClickManage = () => {},
}) => {
  return (
    <StyledTokenManageWrapper onClick={onClickManage}>
      <IconAdd fill={"rgba(0, 0, 0, 0.8)"} />
      {showTokenTip && <StyledManageTip>{showCount}</StyledManageTip>}
    </StyledTokenManageWrapper>
  );
};

export default TokenListView;
