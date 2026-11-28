import { useLayoutEffect, useRef, useState } from "react";
import i18n from "i18next";
import { Trans } from "react-i18next";
import Button, { button_size, button_theme } from "@/popup/component/Button";
import Toast from "@/popup/component/Toast";
import NetworkStatusView from "@/popup/component/StatusView/NetworkStatusView";
import { MAIN_COIN_CONFIG } from "@/constant";
import DappWebsite from "@/popup/component/DappWebsite";
import CommonRow from "./CommonRow";
import { addressSlice, amountDecimals, getRealErrorMsg, toNonExponential } from "@/utils/utils";
import { TOKEN_BUILD_URL } from "../../../../config";
import {
  StyledSectionSign,
  StyledTitleRow,
  StyledTitle,
  StyledTitleRight,
  StyledContent,
  StyledWebsiteContainer,
  StyledHighFeeTip,
  StyledBtnGroup,
  StyledNetworkFee,
  StyledFeeRow,
  StyledFeeLabel,
  StyledFeeValue,
  StyledDividedLine,
} from "./index.styled";
import { ConfirmModal } from "@/popup/component/ConfirmModal";
import { LedgerInfoModal } from "@/popup/component/LedgerInfoModal";
import { useAppDispatch, useAppSelector } from "@/hooks/useStore";
import { ACCOUNT_TYPE, LEDGER_STATUS } from "@/constant/commonType";
import ledgerManager from "@/utils/ledger";
import { invalidateNFTLists } from "@/reducers/nft";
import { updateLedgerConnectStatus } from "@/reducers/ledger";
import {
  localTransfer,
  validateWebNFTTransaction,
  localTransferSigningPayload,
} from "@/utils/nftTransfer";
import { clearNFTListCache } from "@/utils/nft";
import type { ILocalTransferJob } from "@/types/nft";
import {
  signZkAppTransaction,
  sendZkAppTransaction,
} from "@/utils/zkAppTransfer";

export default function NFTSign({
  jobId,
  onClose,
}: {
  jobId: string;
  onClose: () => void;
}) {
  const account = useAppSelector((s) => s.accountInfo.currentAccount);
  const network = useAppSelector((s) => s.network.currentNode.networkID);
  const gqlUrl = useAppSelector((s) => s.network.currentNode.url);
  const locked = useAppSelector((s) => s.cache.popupLockStatus);
  const dispatch = useAppDispatch();
  const watchOnly = account.type === ACCOUNT_TYPE.WALLET_WATCH;
  const controller = useRef<AbortController | null>(null),
    inFlight = useRef(false);
  const cancelling = useRef(false);
  const [job, setJob] = useState<ILocalTransferJob>();
  const [reviewing, setReviewing] = useState(true);
  const [busy, setBusy] = useState(false);
  const [waitingDevice, setWaitingDevice] = useState(false),
    [ledgerModal, setLedgerModal] = useState(false);
  const [attempted, setAttempted] = useState(false);
  useLayoutEffect(() => {
    const abort = new AbortController();
    controller.current = abort;
    setJob(undefined);
    setBusy(false);
    setAttempted(false);
    setWaitingDevice(false);
    setLedgerModal(false);
    inFlight.current = false;
    cancelling.current = false;
    setReviewing(!watchOnly && !locked);
    if (watchOnly) onClose();
    if (!watchOnly && !locked)
      void localTransfer
        .review(jobId, abort.signal)
        .then((next) => {
          if (abort.signal.aborted) return;
          localTransferSigningPayload(next, network!, account.address!);
          setJob(next);
        })
        .catch(() => {
          if (!abort.signal.aborted) {
            Toast.info(i18n.t("buildFailed"));
          }
        })
        .finally(() => {
          if (!abort.signal.aborted) setReviewing(false);
        });
    return () => controller.current?.abort();
  }, [
    jobId,
    account.address,
    account.type,
    account.hdPath,
    network,
    gqlUrl,
    locked,
  ]);
  const run = async (task: (signal: AbortSignal) => Promise<void>) => {
    if (inFlight.current || watchOnly || locked || reviewing || !job) return;
    const signal = controller.current!.signal;
    inFlight.current = true;
    setBusy(true);
    try {
      signal.throwIfAborted();
      await task(signal);
    } catch {
      if (!signal.aborted) Toast.info(i18n.t("buildFailed"));
    } finally {
      if (!signal.aborted) {
        inFlight.current = false;
        setBusy(false);
        setWaitingDevice(false);
      }
    }
  };
  const signAndSend = () =>
    run(async (signal) => {
      if (attempted) return;
      await navigator.locks.request(`nft-sign:${jobId}`, async () => {
        signal.throwIfAborted();
        const fresh = await localTransfer.review(jobId, signal);
        signal.throwIfAborted();
        setJob(fresh);
        await validateWebNFTTransaction(fresh, signal);
        signal.throwIfAborted();
        const payload = localTransferSigningPayload(
          fresh,
          network!,
          account.address!,
        );
        const result = await signZkAppTransaction(payload, account, () => {
          signal.throwIfAborted();
          setWaitingDevice(true);
        });
        signal.throwIfAborted();
        if (account.type === ACCOUNT_TYPE.WALLET_LEDGER) {
          dispatch(updateLedgerConnectStatus(ledgerManager.status));
          if (!result) {
            setLedgerModal(true);
            return;
          }
          if (result.rejected) {
            Toast.info(i18n.t("ledgerRejected"));
            return;
          }
          if (result.error) {
            if (ledgerManager.status !== LEDGER_STATUS.READY)
              setLedgerModal(true);
            else
              Toast.info(
                getRealErrorMsg(result.error) || i18n.t("buildFailed"),
              );
            return;
          }
        }
        signal.throwIfAborted();
        setWaitingDevice(false);
        if (result?.error || !result?.data) {
          Toast.info(i18n.t("buildFailed"));
          return;
        }
        await localTransfer.removeBuild(fresh.jobId, signal);
        signal.throwIfAborted();
        setAttempted(true);
        clearNFTListCache(fresh.chain);
        dispatch(invalidateNFTLists(fresh.chain));
        try {
          const sent = await sendZkAppTransaction(result.data.zkappCommand);
          signal.throwIfAborted();
          if (sent.hash && !sent.error) onClose();
          else Toast.info(i18n.t("postFailed"));
        } catch {
          signal.throwIfAborted();
          Toast.info(i18n.t("postFailed"));
        }
      });
    });
  const cancel = async () => {
    if (cancelling.current) return;
    cancelling.current = true;
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    inFlight.current = true;
    setBusy(true);
    setWaitingDevice(false);
    setLedgerModal(false);
    try {
      if (!attempted && job)
        await localTransfer.cancel(job.summary, jobId, abort.signal);
      if (!abort.signal.aborted) onClose();
    } catch {
      if (!abort.signal.aborted) Toast.info(i18n.t("tryAgain"));
    } finally {
      if (!abort.signal.aborted) {
        cancelling.current = false;
        inFlight.current = false;
        setBusy(false);
      }
    }
  };
  const signing = !watchOnly && !locked && !reviewing && !!job && !attempted;
  const reviewed = job?.summary;
  return (
    <StyledSectionSign aria-label={`${i18n.t("send")} NFT`}>
      <StyledTitleRow>
        <StyledTitle>{i18n.t("send")} NFT</StyledTitle>
        <StyledTitleRight>
          <NetworkStatusView />
        </StyledTitleRight>
      </StyledTitleRow>
      <StyledContent>
        <StyledWebsiteContainer>
          {account.type === ACCOUNT_TYPE.WALLET_LEDGER && (
            <StyledHighFeeTip>
              <Trans
                i18nKey="ledgerZkAppBlindSigningTip"
                components={{ b: <b /> }}
              />
            </StyledHighFeeTip>
          )}
          <DappWebsite siteUrl={new URL(TOKEN_BUILD_URL).origin} />
        </StyledWebsiteContainer>
        {reviewing && <p>{i18n.t("loading")}</p>}
        {reviewed && (
          <>
            <CommonRow
              leftTitle={account.accountName || i18n.t("from")}
              leftContent={addressSlice(reviewed.sender, 6, 6)}
              rightTitle={i18n.t("to")}
              rightContent={addressSlice(reviewed.recipient, 6)}
              leftCopyContent={reviewed.sender}
              rightCopyContent={reviewed.recipient}
              showArrow
            />
            <CommonRow
              leftTitle="NFT"
              leftContent={
                reviewed.nftName || addressSlice(reviewed.nftAddress, 6)
              }
            />
            {reviewed.memo && (
              <CommonRow leftTitle="Memo" leftContent={reviewed.memo} />
            )}
            <StyledNetworkFee>
              <StyledFeeRow>
                <StyledFeeLabel>{i18n.t("networkFee")}</StyledFeeLabel>
                <StyledFeeValue>
                  {`${toNonExponential(amountDecimals(reviewed.fee, MAIN_COIN_CONFIG.decimals))} ${MAIN_COIN_CONFIG.symbol}`}
                </StyledFeeValue>
              </StyledFeeRow>
              <StyledDividedLine />
            </StyledNetworkFee>
            {reviewed.collectionTransferFee &&
              reviewed.collectionTransferFee !== "0" && (
                <>
                  <CommonRow
                    leftTitle={i18n.t("nftCollectionTransferFee")}
                    leftContent={`${toNonExponential(amountDecimals(reviewed.collectionTransferFee, MAIN_COIN_CONFIG.decimals))} MINA`}
                  />
                  <CommonRow
                    leftTitle={i18n.t("nftCollectionFeeRecipient")}
                    leftContent={addressSlice(reviewed.feeRecipient, 6)}
                    leftCopyContent={reviewed.feeRecipient}
                  />
                  <CommonRow
                    leftTitle={i18n.t("nftTotalDebit")}
                    leftContent={`${toNonExponential(amountDecimals(reviewed.totalDebit, MAIN_COIN_CONFIG.decimals))} MINA`}
                  />
                </>
              )}
          </>
        )}
      </StyledContent>
      <StyledBtnGroup>
        <Button
          onClick={cancel}
          theme={button_theme.BUTTON_THEME_LIGHT}
          size={button_size.middle}
        >
          {i18n.t("cancel")}
        </Button>
        <Button
          onClick={signAndSend}
          loading={busy}
          disable={!signing}
          size={button_size.middle}
        >
          {i18n.t("confirm")}
        </Button>
      </StyledBtnGroup>
      <ConfirmModal
        modalVisible={waitingDevice && !ledgerModal}
        waitingLedger
      />
      <LedgerInfoModal
        modalVisible={ledgerModal}
        onClickClose={() => setLedgerModal(false)}
        onConfirm={() => {
          setLedgerModal(false);
          void signAndSend();
        }}
      />
    </StyledSectionSign>
  );
}
