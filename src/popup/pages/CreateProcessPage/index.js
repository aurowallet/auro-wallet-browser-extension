/**
 * the init wallet process , create pwd , show mne , backup mne , success
 */
import Tabs, { TAB_TYPE } from "@/popup/component/Tabs";
import {
  StyledPageInnerContent,
  StyledPageOuterWrapper,
} from "@/popup/style/common";
import { useCallback, useState } from "react";
import styled from "styled-components";
import { ConfirmMneView } from "./ConfirmMneView";
import { CreatePwdView } from "./CreatePwdView";
import { CreateResultView } from "./CreateResultView";
import { MnemonicView } from "./MnemonicView";

const StyledTabContent = styled.div`
  width: calc(100%);
  height: calc(100%);
`;

export const CreateProcessPage = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const onClickNextTab = useCallback(() => {
    setTabIndex((state) => state + 1);
  }, []);
  const onClickPreTab = useCallback(() => {
    setTabIndex((state) => state - 1);
  }, []);
  return (
    <StyledPageOuterWrapper>
      <StyledPageInnerContent>
        <Tabs selected={tabIndex} tabType={TAB_TYPE.STEP}>
          <StyledTabContent id={1}>
            <CreatePwdView onClickNextTab={onClickNextTab} />
          </StyledTabContent>
          <StyledTabContent id={2}>
            <MnemonicView
              onClickNext={onClickNextTab}
              onClickPre={onClickPreTab}
            />
          </StyledTabContent>
          <StyledTabContent id={3}>
            <ConfirmMneView
              onClickNext={onClickNextTab}
              onClickPre={onClickPreTab}
            />
          </StyledTabContent>
          <StyledTabContent id={4}>
            <CreateResultView />
          </StyledTabContent>
        </Tabs>
      </StyledPageInnerContent>
    </StyledPageOuterWrapper>
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
