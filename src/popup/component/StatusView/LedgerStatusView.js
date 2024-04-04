import { useMemo } from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { LEDGER_STATUS } from "../../../constant/commonType";

const StyledIconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StyledLedgerIcon = styled.img``;

const LedgerStatusView = () => {
  const ledgerStatus = useSelector((state) => state.ledger.ledgerConnectStatus);
  const ledger = useSelector((state) => state.ledger);
  const { showIcon } = useMemo(() => {
    let showStatus = false;
    let showColor = "#d65a5a";
    let showIcon = "/img/icon_ledger_disconnect.svg";
    if (ledgerStatus === LEDGER_STATUS.READY) {
      showStatus = true;
      showColor = "#0db27c";
      showIcon = "/img/icon_ledger_connect.svg";
    }
    return {
      showIcon,
    };
  }, [ledgerStatus]);

  if (!ledgerStatus) {
    return <></>;
  }
  return (
    <StyledIconWrapper>
      <StyledLedgerIcon src={showIcon} />
    </StyledIconWrapper>
  );
};

export default LedgerStatusView;
