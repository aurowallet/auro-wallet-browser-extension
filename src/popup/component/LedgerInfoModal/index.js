import cls from "classnames";
import browser from "webextension-polyfill";
import i18n from "i18next";
import { useCallback, useMemo } from "react";
import { Trans } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { LEDGER_PAGE_TYPE, LEDGER_STATUS } from "../../../constant/commonType";
import { updateLedgerConnectStatus } from "../../../reducers/ledger";
import { getLedgerStatus } from "../../../utils/ledger";
import Button from "../Button";
import styles from "./index.module.scss";
import styled, { keyframes } from "styled-components";

const openModal = keyframes`
  from {
    bottom: -50%;
  }
  to {
    bottom: 0;
  }
`;

const StyledInnerContent = styled.div`
  background: #ffffff;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  width: 100%;
  position: absolute;
  bottom: 0;
  animation: ${openModal} 0.35s;
  animation-fill-mode: forwards;
  min-height: 358px;
`;
const StyledBottonWrapper = styled.div`
  padding: 12px 38px 20px;
  position: fixed;
  bottom: 0;
  width: calc(100%);
  background-color: white;

  animation: ${openModal} 0.35s;
  animation-fill-mode: forwards;
`;
const StyledReminderContainer = styled.div`
  animation: ${openModal} 0.35s;
  animation-fill-mode: forwards;
  position: fixed;
  z-index: 2;
  margin: 0px 20px 90px;

  background: rgba(214, 90, 90, 0.1);
  border: 1px solid #d65a5a;
  border-radius: 10px;
  font-weight: 400;
  font-size: 14px;
  line-height: 17px;
  color: #d65a5a;
  padding: 12px 10px;
`;
export const LedgerInfoModal = ({
  modalVisible = false,
  title = "",
  onConfirm = () => {},
  onClickClose = () => {},
}) => {
  const dispatch = useDispatch();

  const ledgerStatus = useSelector((state) => state.ledger.ledgerConnectStatus);

  const { nextLedgerTip } = useMemo(() => {
    let nextLedgerTip = "";
    switch (ledgerStatus) {
      case LEDGER_STATUS.LEDGER_DISCONNECT:
        nextLedgerTip = "ledgerNotConnectTip";
        break;
      case LEDGER_STATUS.LEDGER_CONNECT_APP_NOT_OPEN:
        nextLedgerTip = "ledgerAppConnectTip";
        break;
      default:
        break;
    }
    return {
      nextLedgerTip,
    };
  }, [ledgerStatus]);

  const onClickReminder = useCallback(() => {
    const ledgerPageType = LEDGER_PAGE_TYPE.permissionGrant;
    let openParams = new URLSearchParams({ ledgerPageType }).toString();
    browser.tabs.create({
      url: "popup.html#/ledger_page?" + openParams,
    });
  }, [ledgerStatus]);

  const onClickConfirm = useCallback(async () => {
    const ledger = await getLedgerStatus();
    dispatch(updateLedgerConnectStatus(ledger.status));
    if (ledger.status === LEDGER_STATUS.READY) {
      onConfirm(ledger);
    }
  }, [onConfirm]);

  return (
    <>
      {modalVisible && (
        <div className={styles.outerContainer}>
          <StyledInnerContent>
            <div className={styles.contentContainer}>
              <div className={styles.titleRow}>
                <span className={styles.rowTitle}>
                  {title || i18n.t("connectHardwareWallet")}
                </span>

                <div className={styles.rightRow}>
                  <img
                    onClick={onClickClose}
                    className={styles.rowClose}
                    src="/img/icon_nav_close.svg"
                  />
                </div>
              </div>
            </div>
            <div className={styles.dividedLine} />
            <div className={styles.stepOuterContainer}>
              <div className={styles.stepContainer}>
                <div className={styles.stepNumber}>1</div>
                <span className={styles.stepContent}>
                  {i18n.t("ledgerConnect_1")}
                </span>
              </div>
              <div className={styles.stepContainer}>
                <div className={styles.stepNumber}>2</div>
                <span className={styles.stepContent}>
                  <Trans
                    i18nKey={"ledgerConnect_2"}
                    components={{
                      b: <span className={styles.stepContentLight} />,
                    }}
                  />
                </span>
              </div>
            </div>
            {nextLedgerTip && (
              <StyledReminderContainer>
                <Trans
                  i18nKey={nextLedgerTip}
                  components={{
                    click: (
                      <span
                        onClick={onClickReminder}
                        className={styles.clickItem}
                      />
                    ),
                  }}
                />
              </StyledReminderContainer>
            )}
            <StyledBottonWrapper>
              <Button onClick={onClickConfirm}>{i18n.t("confirm")}</Button>
            </StyledBottonWrapper>
          </StyledInnerContent>
        </div>
      )}
    </>
  );
};
