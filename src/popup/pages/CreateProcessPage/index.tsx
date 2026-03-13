/**
 * the init wallet process , create pwd , show mne , backup mne , success
 */
import { WALLET_CREATE_TYPE } from "@/constant/commonType";
import {
  WALLET_CLEAR_CREATE_MNEMONIC,
  WALLET_GET_CREATE_FLOW_STATE,
  FROM_BACK_TO_RECORD,
  WORKER_ACTIONS,
} from "@/constant/msgTypes";
import browser from "webextension-polyfill";
import StepTabs from "@/popup/component/StepTabs";
import { StyledPageInnerContent } from "@/popup/style/common";
import { sendMsg } from "@/utils/commonMsg";
import { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import type { VoidCallback } from "../../types/common";
import { useAppSelector } from "@/hooks/useStore";
import { useNavigate } from "react-router-dom";
import { ConfirmMneView } from "./ConfirmMneView";
import { CreatePwdView } from "./CreatePwdView";
import { CreateResultView } from "./CreateResultView";
import { MnemonicView } from "./MnemonicView";
import { RestoreMneView } from "./RestoreMneView";
import { LedgerPage } from "../LedgerPage";

interface CreateProcessPageProps {
  onClickPre?: VoidCallback;
}

interface StyledTabContentProps {
  id?: number;
}

const StyledTabContent = styled.div<StyledTabContentProps>`
  width: 100%;
  height: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
`;

interface CreateFlowState {
  hasExistingWallet: boolean;
  isUnlocked: boolean;
}

export const CreateProcessPage = ({onClickPre}: CreateProcessPageProps) => {
  const welcomeNextType = useAppSelector((state) => state.cache.welcomeNextType);
  const [tabIndex, setTabIndex] = useState(0);
  const [showMore,setShowMore] = useState(false);
  const [hasExistingWallet, setHasExistingWallet] = useState(false);
  const [ledgerStep, setLedgerStep] = useState(0);
  const navigate = useNavigate();

  const showRestore = useMemo(() => {
    return welcomeNextType === WALLET_CREATE_TYPE.restore;
  }, [welcomeNextType]);

  const showLedger = useMemo(() => {
    return welcomeNextType === WALLET_CREATE_TYPE.ledger;
  }, [welcomeNextType]);

  const isCreateMnemonicFlow = !showRestore && !showLedger;

  const clearTempCreateMnemonic = useCallback(() => {
    sendMsg({ action: WALLET_CLEAR_CREATE_MNEMONIC });
  }, []);

  useEffect(() => {
    sendMsg({ action: WALLET_GET_CREATE_FLOW_STATE }, (state: CreateFlowState) => {
      if (state.hasExistingWallet) {
        setHasExistingWallet(true);
        setTabIndex((prev) => (prev === 0 ? 1 : prev)); 
        if (!state.isUnlocked) {
          navigate("/lock_page", { replace: true });
        }
      } else {
        setHasExistingWallet(false);
      }
    });
  }, [navigate]);

  useEffect(() => {
    if (!hasExistingWallet) return;
    const onLockMessage = (
      message: { type?: string; action?: string; payload?: boolean },
    ) => {
      if (
        message?.type === FROM_BACK_TO_RECORD &&
        message?.action === WORKER_ACTIONS.SET_LOCK &&
        !message.payload
      ) {
        navigate("/lock_page", { replace: true });
      }
    };
    browser.runtime.onMessage.addListener(onLockMessage as Parameters<typeof browser.runtime.onMessage.addListener>[0]);
    return () => {
      browser.runtime.onMessage.removeListener(onLockMessage as Parameters<typeof browser.runtime.onMessage.removeListener>[0]);
    };
  }, [hasExistingWallet, navigate]);
  
  const onClickNextTab = useCallback(() => {
    setTabIndex((state) => state + 1);
  }, []);
  const onClickPreTab = useCallback(() => {
    if (hasExistingWallet && tabIndex === 1) {
      clearTempCreateMnemonic();
      onClickPre && onClickPre();
      return;
    }
    setTabIndex((state) => Math.max(0, state - 1));
  }, [hasExistingWallet, tabIndex, onClickPre, clearTempCreateMnemonic]);

  useEffect(() => {
    if (!isCreateMnemonicFlow) return;
    clearTempCreateMnemonic();
    return () => {
      clearTempCreateMnemonic();
    };
  }, [isCreateMnemonicFlow, clearTempCreateMnemonic]);

  const onClickPreFromCreatePwd = useCallback(() => {
    if (isCreateMnemonicFlow) {
      clearTempCreateMnemonic();
    }
    onClickPre?.();
  }, [isCreateMnemonicFlow, clearTempCreateMnemonic, onClickPre]);

  const onLedgerStepChange = useCallback((step: number) => {
    setLedgerStep(step);
  }, []);

  const combinedTabIndex = useMemo(() => {
    if (showLedger && tabIndex === 1) {
      return hasExistingWallet ? ledgerStep : 1 + ledgerStep;
    }
    return tabIndex;
  }, [showLedger, tabIndex, ledgerStep, hasExistingWallet]);

  const totalSteps = useMemo(() => {
    if (showLedger) {
      return hasExistingWallet ? 3 : 4;
    }
    if (showRestore) return 3;
    return 4;
  }, [showLedger, showRestore, hasExistingWallet]);

  const onSwitchMneCount = useCallback((isShowMore: boolean)=>{
    setShowMore(isShowMore)
  },[])

  useEffect(()=>{
    if(welcomeNextType !== WALLET_CREATE_TYPE.restore){
      setShowMore(false)
    }
  },[welcomeNextType])

  return (
    <StyledPageInnerContent $showMore={showMore}>
      <StepTabs selected={tabIndex} totalSteps={totalSteps} progressIndex={combinedTabIndex}>
        <StyledTabContent id={1}>
          <CreatePwdView onClickNextTab={onClickNextTab} onClickPre={onClickPreFromCreatePwd}/>
        </StyledTabContent>
        {showLedger && (
          <StyledTabContent id={2}>
            <LedgerPage onClickPre={onClickPreTab} isEmbedded={true} onStepChange={onLedgerStepChange} />
          </StyledTabContent>
        )}
        {!showRestore && !showLedger && (
          <StyledTabContent id={2}>
            <MnemonicView onClickNext={onClickNextTab} onClickPre={onClickPreTab} />
          </StyledTabContent>
        )}
        {!showRestore && !showLedger && (
          <StyledTabContent id={3}>
            <ConfirmMneView
              onClickNext={onClickNextTab}
              onClickPre={onClickPreTab}
              isActive={tabIndex === 2}
            />
          </StyledTabContent>
        )}
        {showRestore && (
          <StyledTabContent id={4}>
            <RestoreMneView
              onClickNext={onClickNextTab}
              onClickPre={onClickPreTab}
              onSwitchMneCount={onSwitchMneCount}
            />
          </StyledTabContent>
        )}
        {!showLedger && (
          <StyledTabContent id={5}>
            <CreateResultView />
          </StyledTabContent>
        )}
      </StepTabs>
    </StyledPageInnerContent>
  );
};