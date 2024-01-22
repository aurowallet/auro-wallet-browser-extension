/**
 * the init wallet process , create pwd , show mne , backup mne , success
 */
import { WALLET_CREATE_TYPE } from "@/constant/commonType";
import Tabs, { TAB_TYPE } from "@/popup/component/Tabs";
import { StyledPageInnerContent } from "@/popup/style/common";
import { useCallback, useMemo, useState } from "react";
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
`;

export const CreateProcessPage = ({onClickPre}) => {
  const welcomeNextType = useSelector((state) => state.cache.welcomeNextType);
  const [tabIndex, setTabIndex] = useState(0);
  const onClickNextTab = useCallback(() => {
    setTabIndex((state) => state + 1);
  }, []);
  const onClickPreTab = useCallback(() => {
    setTabIndex((state) => state - 1);
  }, []);

  const showRestore = useMemo(() => {
    return welcomeNextType === WALLET_CREATE_TYPE.restore;
  }, []);

  return (
    <StyledPageInnerContent>
      <Tabs selected={tabIndex} tabType={TAB_TYPE.STEP}>
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
            />
          </StyledTabContent>
        )}
        <StyledTabContent id={5}>
          <CreateResultView />
        </StyledTabContent>
      </Tabs>
    </StyledPageInnerContent>
  );
};

const StyledBackContainer = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
  width: fit-content;
  margin-left: 20px;
`;
const StyledBackImg = styled.img`
  width: 30px;
  height: 30px;
`;
export const BackView = ({ onClickBack }) => {
  return (
    <StyledBackContainer onClick={onClickBack}>
      <StyledBackImg src="/img/icon_back.svg" />
    </StyledBackContainer>
  );
};
