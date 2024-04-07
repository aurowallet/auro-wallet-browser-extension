import { useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { ACCOUNT_TYPE, LEDGER_STATUS } from "../../../constant/commonType";
import Tooltip from "../ToolTip/Tooltip";
import i18n from "i18next";

const StyledIconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StyledLedgerIcon = styled.img``;

const LedgerStatusView = () => {
  const ledgerStatus = useSelector((state) => state.ledger.ledgerConnectStatus);
  const currentAccount = useSelector(
    (state) => state.accountInfo.currentAccount
  );
  const { showIcon,toolTipContent } = useMemo(() => {
    let toolTipContent = i18n.t('ledgerNotConnected')
    let showIcon = "/img/icon_ledger_disconnect.svg";
    if (ledgerStatus === LEDGER_STATUS.READY) {
      showIcon = "/img/icon_ledger_connect.svg";
      toolTipContent = i18n.t('ledgerConnected')
    }
    return {
      showIcon,toolTipContent
    };
  }, [ledgerStatus,i18n]);

  if (currentAccount.type !== ACCOUNT_TYPE.WALLET_LEDGER) {
    return <></>;
  }
  return (
    <StyledIconWrapper>
      <Tooltip text={toolTipContent}>
        <StyledLedgerIcon src={showIcon} />
      </Tooltip>
    </StyledIconWrapper>
  );
};

export default LedgerStatusView;
