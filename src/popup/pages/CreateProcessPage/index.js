/**
 * the init wallet process , create pwd , show mne , backup mne , success
 */
import { WALLET_CREATE_TYPE } from "@/constant/commonType";
import { GET_WALLET_LOCK_STATUS } from "@/constant/msgTypes";
import StepTabs from "@/popup/component/StepTabs";
import { StyledPageInnerContent } from "@/popup/style/common";
import { sendMsg } from "@/utils/commonMsg";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { ConfirmMneView } from "./ConfirmMneView";
import { CreatePwdView } from "./CreatePwdView";
import { CreateResultView } from "./CreateResultView";
import { MnemonicView } from "./MnemonicView";
import { RestoreMneView } from "./RestoreMneView";

const StyledTabContent = styled.div`
  width: 100%;
  height: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
`;

export const CreateProcessPage = ({onClickPre}) => {
  const welcomeNextType = useSelector((state) => state.cache.welcomeNextType);
  const [tabIndex, setTabIndex] = useState(0);
  const [showMore,setShowMore] = useState(false);
  const [hasExistingWallet, setHasExistingWallet] = useState(false);
  
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

  const onSwitchMneCount = useCallback((isShowMore)=>{
    setShowMore(isShowMore)
  },[showRestore])

  useEffect(()=>{
    if(welcomeNextType !== WALLET_CREATE_TYPE.restore){
      setShowMore(false)
    }
  },[welcomeNextType])

  return (
    <StyledPageInnerContent showMore={showMore}>
      <StepTabs selected={tabIndex}>
        <StyledTabContent id={1}>
          <CreatePwdView onClickNextTab={onClickNextTab} onClickPre={onClickPre}/>
        </StyledTabContent>
        {!showRestore && (
          <StyledTabContent id={2}>
            <MnemonicView
              onClickNext={onClickNextTab}
              onClickPre={onClickPreTab}
            />
          </StyledTabContent>
        )}
        {!showRestore && (
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
        <StyledTabContent id={5}>
          <CreateResultView />
        </StyledTabContent>
      </StepTabs>
    </StyledPageInnerContent>
  );
};