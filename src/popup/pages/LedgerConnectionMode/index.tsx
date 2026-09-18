import i18n from "i18next";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ledgerManager from "../../../utils/ledger";
import {
  LEDGER_TRANSPORT_MODE,
  getLedgerTransportModeLabel,
  type LedgerTransportMode,
} from "../../../utils/ledgerTransport";
import CustomView from "../../component/CustomView";
import { StyledContentContainer, StyledRowContainer } from "./index.styled";

const LedgerConnectionMode = () => {
  const navigate = useNavigate();
  const [currentMode, setCurrentMode] = useState<LedgerTransportMode>(
    ledgerManager.getTransportMode()
  );
  const hasSelectedMode = useRef(false);

  useEffect(() => {
    let isMounted = true;

    ledgerManager.getStoredTransportMode().then((mode) => {
      if (isMounted && !hasSelectedMode.current) setCurrentMode(mode);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const modeOptions = Object.values(LEDGER_TRANSPORT_MODE);

  const onSelect = useCallback(
    async (mode: LedgerTransportMode) => {
      if (mode === currentMode) {
        navigate(-1);
        return;
      }

      hasSelectedMode.current = true;
      try {
        await ledgerManager.setTransportMode(mode);
        setCurrentMode(mode);
        navigate(-1);
      } catch {
        setCurrentMode(ledgerManager.getTransportMode());
      }
    },
    [currentMode, navigate]
  );

  return (
    <CustomView
      title={i18n.t("ledgerMode")}
      ContentWrapper={StyledContentContainer}
    >
      {modeOptions.map((mode) => (
        <StyledRowContainer key={mode} onClick={() => onSelect(mode)}>
          <span>{getLedgerTransportModeLabel(mode)}</span>
          {currentMode === mode && <img src="/img/icon_checked.svg" />}
        </StyledRowContainer>
      ))}
    </CustomView>
  );
};

export default LedgerConnectionMode;
