import ledgerManager, { LedgerDiagnostics } from "@/utils/ledger";
import { ACCOUNT_TYPE, LEDGER_STATUS } from "@/constant/commonType";
import {
  useCallback,
  createContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useContext,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useTranslation } from "react-i18next";
import styled, { css } from "styled-components";
import { useAppSelector } from "@/hooks/useStore";

interface LedgerStatusFloatingContextValue {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

const LedgerStatusFloatingContext = createContext<LedgerStatusFloatingContextValue>({
  enabled: false,
  setEnabled: () => {},
});

export const LedgerStatusFloatingProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [enabled, setEnabled] = useState(false);
  return (
    <LedgerStatusFloatingContext.Provider value={{ enabled, setEnabled }}>
      {enabled && <LedgerStatusFloating />}
      {children}
    </LedgerStatusFloatingContext.Provider>
  );
};

export const useLedgerStatusFloating = (): LedgerStatusFloatingContextValue =>
  useContext(LedgerStatusFloatingContext);

const FloatingContainer = styled.div`
  position: fixed;
  z-index: 1000;
  pointer-events: none;
`;

interface StatusPanelProps {
  $isDragging?: boolean;
}

const StatusPanel = styled.div<StatusPanelProps>`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 168px;
  padding: 8px 10px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.14);
  pointer-events: auto;
  cursor: ${({ $isDragging }) => ($isDragging ? "grabbing" : "grab")};
  touch-action: none;
  user-select: none;
`;

const LedgerIcon = styled.img`
  width: 24px;
  height: 24px;
  flex-shrink: 0;
`;

const Content = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const Title = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  color: #222;
  font-size: 12px;
  font-weight: 600;
`;

interface StatusDotProps {
  $status: string;
}

const StatusDot = styled.span<StatusDotProps>`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #9aa0a6;

  ${({ $status }) =>
    $status === LEDGER_STATUS.READY &&
    css`
      background: #2e9b5f;
    `}

  ${({ $status }) =>
    $status === LEDGER_STATUS.LEDGER_BUSY &&
    css`
      background: #e4b200;
    `}

  ${({ $status }) =>
    $status === LEDGER_STATUS.LEDGER_CONNECT_APP_NOT_OPEN &&
    css`
      background: #d65a5a;
    `}
`;

const Status = styled.div`
  overflow: hidden;
  color: #555;
  font-size: 11px;
  line-height: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StatusDescription = styled.div`
  display: -webkit-box;
  overflow: hidden;
  color: rgba(0, 0, 0, 0.5);
  font-size: 10px;
  line-height: 13px;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
`;

const Detail = styled.div`
  overflow: hidden;
  color: rgba(0, 0, 0, 0.45);
  font-size: 10px;
  line-height: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

function stripTransTags(value: string): string {
  return value.replace(/<\/?[^>]+>/g, "");
}

interface FloatingPosition {
  left: number;
  top: number;
}

const FLOATING_PANEL_WIDTH = 168;
const FLOATING_EDGE_GAP = 8;

function getInitialPosition(): FloatingPosition {
  if (typeof window === "undefined") {
    return { left: FLOATING_EDGE_GAP, top: 64 };
  }
  return {
    left: Math.max(
      FLOATING_EDGE_GAP,
      window.innerWidth - FLOATING_PANEL_WIDTH - FLOATING_EDGE_GAP
    ),
    top: 64,
  };
}

function clampPosition(
  position: FloatingPosition,
  panelWidth: number,
  panelHeight: number
): FloatingPosition {
  if (typeof window === "undefined") return position;
  return {
    left: Math.min(
      Math.max(FLOATING_EDGE_GAP, position.left),
      Math.max(
        FLOATING_EDGE_GAP,
        window.innerWidth - panelWidth - FLOATING_EDGE_GAP
      )
    ),
    top: Math.min(
      Math.max(FLOATING_EDGE_GAP, position.top),
      Math.max(
        FLOATING_EDGE_GAP,
        window.innerHeight - panelHeight - FLOATING_EDGE_GAP
      )
    ),
  };
}

/**
 * Diagnostic-only global Ledger status indicator. The status is sourced from
 * LedgerManager so it also reflects WebHID disconnects and connection retries.
 */
export default function LedgerStatusFloating() {
  const { t } = useTranslation();
  const currentAccount = useAppSelector(
    (state) => state.accountInfo.currentAccount
  );
  const isLedgerAccount =
    currentAccount?.type === ACCOUNT_TYPE.WALLET_LEDGER;
  const [diagnostics, setDiagnostics] = useState<LedgerDiagnostics>(() =>
    ledgerManager.getDiagnostics()
  );
  const [position, setPosition] = useState<FloatingPosition>(getInitialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  useEffect(() => {
    if (!isLedgerAccount) return;

    const syncDiagnostics = () => {
      setDiagnostics(ledgerManager.getDiagnostics());
    };

    ledgerManager.addStatusListener(syncDiagnostics);
    syncDiagnostics();
    return () => ledgerManager.removeStatusListener(syncDiagnostics);
  }, [isLedgerAccount]);

  useEffect(() => {
    if (!isLedgerAccount) return;
    const handleResize = () => {
      const panel = panelRef.current;
      setPosition((current) =>
        clampPosition(
          current,
          panel?.getBoundingClientRect().width || FLOATING_PANEL_WIDTH,
          panel?.getBoundingClientRect().height || 0
        )
      );
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isLedgerAccount]);

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    dragRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
  }, []);

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setPosition(
      clampPosition(
        {
          left: event.clientX - drag.offsetX,
          top: event.clientY - drag.offsetY,
        },
        rect.width,
        rect.height
      )
    );
  }, []);

  const onPointerUp = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setIsDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  // Use LedgerManager as the source of truth for the diagnostic indicator.
  const status = diagnostics.status;
  const statusMessage = useMemo(() => {
    switch (status) {
      case LEDGER_STATUS.READY:
        return t("ledgerConnected");
      case LEDGER_STATUS.LEDGER_BUSY:
        return diagnostics.lastErrorMessage || t("ledgerBusyTip");
      case LEDGER_STATUS.LEDGER_CONNECT_APP_NOT_OPEN:
        return stripTransTags(t("ledgerAppConnectTip"));
      default:
        return stripTransTags(t("ledgerNotConnectTip"));
    }
  }, [status, t]);

  const icon =
    status === LEDGER_STATUS.READY
      ? "/img/icon_ledger_connect.svg"
      : "/img/icon_ledger_disconnect.svg";

  if (!isLedgerAccount) return null;

  return (
    <FloatingContainer
      data-testid="ledger-status-floating"
      aria-live="polite"
      style={{ left: position.left, top: position.top }}
    >
      <StatusPanel
        ref={panelRef}
        $isDragging={isDragging}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <LedgerIcon src={icon} alt="Ledger" />
        <Content>
          <Title>
            <StatusDot $status={status} />
            Ledger
          </Title>
          <Status title={statusMessage}>{status}</Status>
          {status !== LEDGER_STATUS.READY && (
            <StatusDescription>{statusMessage}</StatusDescription>
          )}
          <Detail>
            {diagnostics.appVersion ? `Mina ${diagnostics.appVersion}` : "Mina -"}
            {" · "}
            {diagnostics.deviceOpened ? "HID open" : "HID closed"}
          </Detail>
        </Content>
      </StatusPanel>
    </FloatingContainer>
  );
}
