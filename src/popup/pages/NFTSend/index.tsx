import { useLayoutEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import i18n from "i18next";
import BigNumber from "bignumber.js";
import CustomView from "@/popup/component/CustomView";
import Button from "@/popup/component/Button";
import Input from "@/popup/component/Input";
import Toast from "@/popup/component/Toast";
import RecipientInput from "./RecipientInput";
import NetworkFee from "@/popup/component/NetworkFee";
import {
  StyledContainer,
  StyledContentContainer,
  StyledInputContainer,
  StyledBottomContainer,
} from "./index.styled";
import { useAppDispatch, useAppSelector } from "@/hooks/useStore";
import { useFeeValidation } from "@/hooks/useFeeValidation";
import { MAIN_COIN_CONFIG, TRANSACTION_FEE } from "@/constant";
import { ACCOUNT_TYPE } from "@/constant/commonType";
import { addressValid, isNaturalNumber, isNumber, trimSpace } from "@/utils/utils";
import { updateNFTDetail } from "@/reducers/nft";
import {
  loadLocalNFT,
  type ILocalNFTItem,
  nftTransferBlock,
  clearNFTListCache,
} from "@/utils/nft";

import { localTransfer } from "@/utils/nftTransfer";
import type { ILocalTransferRequest } from "@/types/nft";

export default function NFTSend() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const nft = (state as { nft?: ILocalNFTItem } | null)?.nft;
  const account = useAppSelector((s) => s.accountInfo.currentAccount);
  const network = useAppSelector((s) => s.network.currentNode.networkID);
  const gqlUrl = useAppSelector((s) => s.network.currentNode.url);
  const locked = useAppSelector((s) => s.cache.popupLockStatus);
  const dispatch = useAppDispatch();
  const address = account.address || "";
  const controller = useRef<AbortController | null>(null);
  const inFlight = useRef(false);
  const [recipient, setRecipient] = useState("");
  const { feeConfig } = useFeeValidation();
  const [advanceInputFee, setAdvanceInputFee] = useState("");
  const fee =
    isNumber(advanceInputFee) && Number(advanceInputFee) > 0
      ? advanceInputFee
      : String(feeConfig?.transactionFee?.medium || TRANSACTION_FEE);
  const [memo, setMemo] = useState("");
  const [nonce, setNonce] = useState("");
  const [busy, setBusy] = useState(false);
  const watchOnly = account.type === ACCOUNT_TYPE.WALLET_WATCH;

  useLayoutEffect(() => {
    const abort = new AbortController();
    controller.current = abort;
    setRecipient("");
    setMemo("");
    setAdvanceInputFee("");
    setNonce("");
    setBusy(false);
    inFlight.current = false;
    return () => abort.abort();
  }, [
    network,
    gqlUrl,
    address,
    account.type,
    locked,
    nft?.collectionAddress,
    nft?.nftAddress,
  ]);
  const run = async (task: (signal: AbortSignal) => Promise<void>) => {
    if (inFlight.current || watchOnly || locked) return;
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
      }
    }
  };
  const prepare = () =>
    run(async (signal) => {
      if (!addressValid(recipient.trim()) || recipient.trim() === address) {
        Toast.info(i18n.t("sendAddressError"));
        return;
      }
      const requestedFee = trimSpace(fee) as string;
      if (!isNumber(requestedFee)) {
        Toast.info(i18n.t("inputFeeError"));
        return;
      }
      const requestedNonce = trimSpace(nonce) as string;
      if (requestedNonce && !isNaturalNumber(requestedNonce)) {
        Toast.info(i18n.t("inputNonceError", { nonce: "Nonce" }));
        return;
      }
      const request: ILocalTransferRequest = {
        chain: nft!.network,
        gqlUrl,
        collectionAddress: nft!.collectionAddress,
        nftAddress: nft!.nftAddress,
        sender: address,
        recipient: recipient.trim(),
        fee: new BigNumber(requestedFee)
          .multipliedBy(new BigNumber(10).pow(MAIN_COIN_CONFIG.decimals))
          .toFixed(0),
        memo,
        ...(requestedNonce ? { nonce: requestedNonce } : {}),
      };
      signal.throwIfAborted();
      const latest = await loadLocalNFT(network!, nft!, signal, gqlUrl);
      signal.throwIfAborted();
      clearNFTListCache(network);
      dispatch(updateNFTDetail(latest));
      const reason = nftTransferBlock(latest, address);
      if (reason) {
        if (reason.code === "NOT_OWNER") {
          Toast.info(i18n.t("nftNotOwned"));
        } else {
          Toast.info(i18n.t("nftTransferPermissionDenied"));
        }
        return;
      }
      const checked = await localTransfer.preflight(request, signal);
      signal.throwIfAborted();
      await localTransfer.prepare({ ...checked, nftName: latest.name }, signal);
      signal.throwIfAborted();
      navigate("/nft_detail", { replace: true, state: { nft } });
    });
  return (
    <CustomView
      title={`${i18n.t("send")} NFT`}
      ContentWrapper={StyledContainer}
    >
      <StyledContentContainer>
        <StyledInputContainer>
          <RecipientInput
            value={recipient}
            onChange={(event) => setRecipient(event.target.value)}
          />
          <Input
            label={i18n.t("memo")}
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
          />
        </StyledInputContainer>
        <NetworkFee
          currentFee={fee}
          currentNonce={nonce}
          advanceFee={advanceInputFee}
          advanceNonce={nonce}
          feeConfig={feeConfig}
          onAdvanceConfirm={(value, nextNonce) => {
            setAdvanceInputFee(value);
            setNonce(nextNonce);
          }}
        />
      </StyledContentContainer>
      <StyledBottomContainer>
        <Button
          disable={watchOnly || locked || busy || !recipient.trim()}
          loading={busy}
          onClick={prepare}
        >
          {i18n.t("next")}
        </Button>
      </StyledBottomContainer>
    </CustomView>
  );
}
