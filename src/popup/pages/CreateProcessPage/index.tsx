/**
 * the init wallet process , create pwd , show mne , backup mne , success
 */
import { WALLET_CREATE_TYPE } from "@/constant/commonType";
import { GET_WALLET_LOCK_STATUS } from "@/constant/msgTypes";
import StepTabs from "@/popup/component/StepTabs";
import { StyledPageInnerContent } from "@/popup/style/common";
import { sendMsg } from "@/utils/commonMsg";
import { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import type { VoidCallback } from "../../types/common";
import { useAppSelector } from "@/hooks/useStore";

interface CreateProcessPageProps {
  onClickPre?: VoidCallback;
}

interface StyledTabContentProps {
  id?: number;
}
import { ConfirmMneView } from "./ConfirmMneView";
import { CreatePwdView } from "./CreatePwdView";
import { CreateResultView } from "./CreateResultView";
import { MnemonicView } from "./MnemonicView";
import { RestoreMneView } from "./RestoreMneView";
import { LedgerPage } from "../LedgerPage";

const StyledTabContent = styled.div<StyledTabContentProps>`
  width: 100%;
  height: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
`;

export const CreateProcessPage = ({onClickPre}: CreateProcessPageProps) => {
  const welcomeNextType = useAppSelector((state) => state.cache.welcomeNextType);
  const [tabIndex, setTabIndex] = useState(0);
  const [showMore,setShowMore] = useState(false);
  const [hasExistingWallet, setHasExistingWallet] = useState(false);
  const [ledgerStep, setLedgerStep] = useState(0);
  
  useEffect(() => {
    // Check if wallet already exists (user is unlocked means wallet exists)
    sendMsg({ action: GET_WALLET_LOCK_STATUS }, (isUnlocked) => {
      if (isUnlocked) {
        setHasExistingWallet(true);
        // Skip password creation step for existing wallets
        setTabIndex(1);
      }
    });
  }, []);
  
  const onClickNextTab = useCallback(() => {
    setTabIndex((state) => state + 1);
  }, []);
  const onClickPreTab = useCallback(() => {
    // For existing wallets, don't go back to password step
    if (hasExistingWallet && tabIndex === 1) {
      onClickPre && onClickPre();
      return;
    }
    setTabIndex((state) => state - 1);
  }, [hasExistingWallet, tabIndex, onClickPre]);

  const showRestore = useMemo(() => {
    return welcomeNextType === WALLET_CREATE_TYPE.restore;
  }, []);

  const showLedger = useMemo(() => {
    return welcomeNextType === WALLET_CREATE_TYPE.ledger;
  }, []);

  const onLedgerStepChange = useCallback((step: number) => {
    setLedgerStep(step);
  }, []);

  // Calculate combined progress for Ledger flow
  const combinedTabIndex = useMemo(() => {
    if (showLedger && tabIndex === 1) {
      // For existing wallet, ledgerStep starts from 0 directly
      // For new wallet, password(1) + ledgerStep
      return hasExistingWallet ? ledgerStep : 1 + ledgerStep;
    }
    return tabIndex;
  }, [showLedger, tabIndex, ledgerStep, hasExistingWallet]);

  // Total steps for progress bar
  const totalSteps = useMemo(() => {
    if (showLedger) {
      // Existing wallet: 3 ledger steps only (connect, name, success)
      // New wallet: password + 3 ledger steps = 4
      return hasExistingWallet ? 3 : 4;
    }
    if (showRestore) return 2; // password + restore
    return 4; // password + mnemonic + confirm + success
  }, [showLedger, showRestore, hasExistingWallet]);

  const onSwitchMneCount = useCallback((isShowMore: boolean)=>{
    setShowMore(isShowMore)
  },[showRestore])

  useEffect(()=>{
    if(welcomeNextType !== WALLET_CREATE_TYPE.restore){
      setShowMore(false)
    }
  },[welcomeNextType])

  return (
    <StyledPageInnerContent $showMore={showMore}>
      <StepTabs selected={tabIndex} totalSteps={totalSteps} progressIndex={combinedTabIndex}>
        <StyledTabContent id={1}>
          <CreatePwdView onClickNextTab={onClickNextTab} onClickPre={onClickPre}/>
        </StyledTabContent>
        {showLedger && (
          <StyledTabContent id={2}>
            <LedgerPage onClickPre={onClickPreTab} isEmbedded={true} onStepChange={onLedgerStepChange} />
          </StyledTabContent>
        )}
        {!showRestore && !showLedger && (
          <StyledTabContent id={2}>
            <MnemonicView
              onClickNext={onClickNextTab}
              onClickPre={onClickPreTab}
            />
          </StyledTabContent>
        )}
        {!showRestore && !showLedger && (
          <StyledTabContent id={3}>
            <ConfirmMneView
              onClickNext={onClickNextTab}
              onClickPre={onClickPreTab}
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