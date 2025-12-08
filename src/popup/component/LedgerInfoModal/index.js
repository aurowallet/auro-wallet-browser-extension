import ledgerManager from "@/utils/ledger";
import i18n from "i18next";
import { useCallback, useMemo } from "react";
import { Trans } from "react-i18next";
import { useSelector } from "react-redux";
import styled, { keyframes } from "styled-components";
import browser from "webextension-polyfill";
import { LEDGER_PAGE_TYPE, LEDGER_STATUS } from "../../../constant/commonType";
import Button from "../Button";

const slideUp = keyframes`
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 10;
`;

const ModalContainer = styled.div`
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 11;
  background: #ffffff;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  max-height: 90vh;
  overflow-y: auto;
  animation: ${slideUp} 0.35s cubic-bezier(0.22, 0.61, 0.36, 1) forwards;

  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 8px;
  flex-shrink: 0;
`;

const Title = styled.div`
  font-weight: 600;
  font-size: 18px;
  color: #222;
`;

const CloseBtn = styled.img`
  width: 24px;
  height: 24px;
  cursor: pointer;
`;

const Divider = styled.div`
  height: 0.5px;
  background: #f2f2f2;
  margin: 0 20px;
`;

const Steps = styled.div`
  padding: 20px 20px 16px;
  flex: 1;
`;

const Step = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  &:last-child {
    margin-bottom: 0;
  }
`;

const StepNumber = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #594af1;
  color: white;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const StepText = styled.div`
  margin-left: 12px;
  font-size: 15px;
  color: #333;
  line-height: 1.5;
  b {
    font-weight: 700;
  }
`;

const Reminder = styled.div`
  margin: 0 20px 30px;
  padding: 12px;
  background: rgba(214, 90, 90, 0.1);
  border: 1px solid #d65a5a;
  border-radius: 10px;
  font-size: 14px;
  color: #d65a5a;
  line-height: 1.5;
`;

const Clickable = styled.span`
  color: #594af1;
  cursor: pointer;
  text-decoration: underline;
`;

const ButtonArea = styled.div`
  padding: 12px 20px 30px;
  background: #ffffff;
  margin-top: auto;
  flex-shrink: 0;
`;

export const LedgerInfoModal = ({
  modalVisible = false,
  title = "",
  onConfirm = () => {},
  onClickClose = () => {},
}) => {
  const ledgerStatus = useSelector((state) => state.ledger.ledgerConnectStatus);

  const { nextLedgerTip } = useMemo(() => {
    let tip = "";

    if (ledgerStatus === LEDGER_STATUS.LEDGER_DISCONNECT) {
      tip = "ledgerNotConnectTip";
    }
    if (ledgerStatus === LEDGER_STATUS.LEDGER_CONNECT_APP_NOT_OPEN) {
      tip = "ledgerAppConnectTip";
    }
    return { nextLedgerTip: tip };
  }, [ledgerStatus]);

  const onClickReminder = useCallback(() => {
    const params = new URLSearchParams({
      ledgerPageType: LEDGER_PAGE_TYPE.permissionGrant,
    });
    browser.tabs.create({ url: `popup.html#/ledger_page?${params}` });
  }, []);

  const onClickConfirm = async () => {
    const { status } = await ledgerManager.ensureConnect();
    if (status === LEDGER_STATUS.READY) {
      onConfirm();
    }
  };

  if (!modalVisible) return null;

  return (
    <>
      <Overlay onClick={onClickClose} />

      <ModalContainer>
        <Header>
          <Title>{title || i18n.t("connectHardwareWallet")}</Title>
          <CloseBtn
            src="/img/icon_nav_close.svg"
            onClick={onClickClose}
            alt="close"
          />
        </Header>

        <Divider />

        <Steps>
          <Step>
            <StepNumber>1</StepNumber>
            <StepText>{i18n.t("ledgerConnect_1")}</StepText>
          </Step>
          <Step>
            <StepNumber>2</StepNumber>
            <StepText>
              <Trans i18nKey="ledgerConnect_2" components={{ b: <b /> }} />
            </StepText>
          </Step>
        </Steps>

        {nextLedgerTip && (
          <Reminder>
            <Trans
              i18nKey={nextLedgerTip}
              components={{ click: <Clickable onClick={onClickReminder} /> }}
            />
          </Reminder>
        )}

        <ButtonArea>
          <Button onClick={onClickConfirm} fullWidth>
            {i18n.t("confirm")}
          </Button>
        </ButtonArea>
      </ModalContainer>
    </>
  );
};
