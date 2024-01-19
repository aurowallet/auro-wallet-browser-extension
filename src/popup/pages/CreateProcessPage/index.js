/**
 * the init wallet process , create pwd , show mne , backup mne , success
 */
import { WALLET_CREATE_PWD } from "@/constant/msgTypes";
import Button from "@/popup/component/Button";
import Input from "@/popup/component/Input";
import { ReminderTip } from "@/popup/component/ReminderTip";
import Tabs, { TAB_TYPE } from "@/popup/component/Tabs";
import {
  StyledPageInnerContent,
  StyledPageOuterWrapper,
} from "@/popup/style/common";
import { sendMsg } from "@/utils/commonMsg";
import i18n from "i18next";
import { useCallback, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import styled from "styled-components";
import { matchList as matchRuleList } from "../../../utils/validator";

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
    setTabIndex((state) => state + 1);
  }, []);
  return (
    <StyledPageOuterWrapper>
      <StyledPageInnerContent>
        <Tabs selected={tabIndex} tabType={TAB_TYPE.STEP}>
          <StyledTabContent id={1}>
            <CreatePwdView onClickNextTab={onClickNextTab} />
          </StyledTabContent>
          <StyledTabContent id={2}>test 2</StyledTabContent>
          <StyledTabContent id={3}>test 3</StyledTabContent>
          <StyledTabContent id={4}>test 4</StyledTabContent>
        </Tabs>
      </StyledPageInnerContent>
    </StyledPageOuterWrapper>
  );
};

const StyledPwdContainer = styled.div`
  margin-top: 20px;
`;
const StyledPwdContentContainer = styled.div`
  padding: 40px;
`;
const StyledProcessTitle = styled.div`
  color: var(--Black, #000);
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 40px;
`;
const StyledPwdInputContainer = styled.div`
  margin-top: 20px;
  max-width: 335px;
  > :not(:last-child) {
    margin-bottom: 20px;
  }
`;
const StyledPwdCheckSpan = styled.span`
  font-style: normal;
  font-weight: 600;
  font-size: 12px;
  line-height: 17px;
  color: var(--secondaryRed);
  display: ${(props) => (props.showstatus == "true" ? "none" : "initial")};
`;
const StyledBottomContainer = styled.div`
  position: absolute;
  width: 600px;
  bottom: 30px;
  left: 50%;
  transform: translate(-50%);
`;
const CreatePwdView = ({ onClickNextTab }) => {
  const [inputPwd, setInputPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [errorTip, setErrorTip] = useState(false);
  const [btnClick, setBtnClick] = useState(false);
  const [matchList, setMatchList] = useState(matchRuleList);
  const [matchRenderList, setMatchRenderList] = useState([]);
  const history = useHistory();

  const onPwdInput = useCallback((e) => {
    setInputPwd(e.target.value);
  }, []);
  const onPwdConfirmInput = useCallback((e) => {
    setConfirmPwd(e.target.value);
  }, []);

  const onClickBack = useCallback(() => {
    history.goBack();
  }, []);

  const goToCreate = useCallback(() => {
    sendMsg({
      action: WALLET_CREATE_PWD,
      payload: {
        pwd: confirmPwd,
      },
    });

    onClickNextTab();
  }, [confirmPwd, onClickNextTab]);

  useEffect(() => {
    let currentErrorStatus = errorTip;
    if (confirmPwd.length > 0 && inputPwd !== confirmPwd) {
      setErrorTip(true);
      currentErrorStatus = true;
    } else {
      setErrorTip(false);
      currentErrorStatus = false;
    }

    let errList = matchList.filter((v) => {
      if (!v.bool) {
        return v;
      }
    });
    if (errList.length <= 0 && confirmPwd.length > 0 && !currentErrorStatus) {
      setBtnClick(true);
    } else {
      setBtnClick(false);
    }
  }, [inputPwd, errorTip, matchList, confirmPwd]);

  useEffect(() => {
    let renderList = [];
    let newMatchList = matchList.map((v) => {
      if (v.expression.test(inputPwd)) {
        v.bool = true;
      } else {
        v.bool = false;
        renderList.push(v);
      }
      return v;
    });

    setMatchList(newMatchList);
    setMatchRenderList(renderList);
  }, [inputPwd]);

  return (
    <StyledPwdContainer>
      <BackView onClickBack={onClickBack} />
      <StyledPwdContentContainer>
        <StyledProcessTitle>{i18n.t("createPassword")}</StyledProcessTitle>
        <ReminderTip content={i18n.t("createPasswordTip")} />
        <StyledPwdInputContainer>
          <Input
            label={i18n.t("password")}
            onChange={onPwdInput}
            value={inputPwd}
            inputType={"password"}
            showBottomTip={inputPwd.length > 0}
            bottomTip={
              <div>
                {matchRenderList.map((item, index) => {
                  let extraStr = "";
                  if (index !== matchRenderList.length - 1) {
                    extraStr = " / ";
                  }
                  return (
                    <StyledPwdCheckSpan
                      key={index}
                      showstatus={String(item.bool)}
                    >
                      {i18n.t(item.text) + extraStr}
                    </StyledPwdCheckSpan>
                  );
                })}
              </div>
            }
          />
          <Input
            label={i18n.t("confirmPassword")}
            onChange={onPwdConfirmInput}
            value={confirmPwd}
            inputType={"password"}
            showBottomTip={errorTip}
            bottomTip={
              <>
                <StyledPwdCheckSpan showstatus={String(!errorTip)}>
                  {i18n.t("passwordDifferent")}
                </StyledPwdCheckSpan>
              </>
            }
          />
        </StyledPwdInputContainer>
      </StyledPwdContentContainer>
      <StyledBottomContainer>
        <Button disable={!btnClick} onClick={goToCreate}>
          {i18n.t("next")}
        </Button>
      </StyledBottomContainer>
    </StyledPwdContainer>
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
const BackView = ({ onClickBack }) => {
  return (
    <StyledBackContainer onClick={onClickBack}>
      <StyledBackImg src="/img/icon_back.svg" />
    </StyledBackContainer>
  );
};
