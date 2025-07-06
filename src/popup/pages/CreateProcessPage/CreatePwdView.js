import { WALLET_CREATE_PWD } from "@/constant/msgTypes";
import Button from "@/popup/component/Button";
import Input from "@/popup/component/Input";
import { ReminderTip } from "@/popup/component/ReminderTip";
import { sendMsg } from "@/utils/commonMsg";
import i18n from "i18next";
import { useCallback, useState } from "react";
import { useHistory } from "react-router-dom";
import styled from "styled-components";
import { BackView } from ".";
import { PasswordValidationList } from "../../../utils/utils";

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
export const CreatePwdView = ({ onClickNextTab, onClickPre }) => {
  const [inputPwd, setInputPwd] = useState("");

  const [rulesMet, setRulesMet] = useState(
    PasswordValidationList.map((rule) => ({ ...rule, bool: false }))
  );

  const [confirmPwd, setConfirmPwd] = useState("");
  const [passwordsMatch, setPasswordsMatch] = useState(true);

  const history = useHistory();

  const onPwdInput = useCallback(
    (e) => {
      const newPassword = e.target.value;
      setInputPwd(newPassword);

      setRulesMet(
        rulesMet.map((rule) => ({
          ...rule,
          bool: rule.expression.test(newPassword),
        }))
      );
      if (confirmPwd.length > 0) {
        setPasswordsMatch(confirmPwd === inputPwd);
      }
    },
    [rulesMet, confirmPwd]
  );

  const onPwdConfirmInput = useCallback(
    (e) => {
      const newConfirmedPassword = e.target.value;
      setConfirmPwd(newConfirmedPassword);

      setPasswordsMatch(newConfirmedPassword === inputPwd);
    },
    [inputPwd]
  );

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

  const isButtonEnabled = () => {
    const allRulesMet = rulesMet.every((rule) => rule.bool);
    return (
      allRulesMet &&
      passwordsMatch &&
      inputPwd.length > 0 &&
      confirmPwd.length > 0
    );
  };

  const getFeedbackText = () => {
    const unmetRules = rulesMet.filter((rule) => !rule.bool);
    return unmetRules.map((rule) => i18n.t(rule.text)).join(" / ");
  };

  const getConfirmFeedbackText = () => {
    let txt = "";
    if (!passwordsMatch) {
      txt = i18n.t("passwordDifferent");
    }
    return txt;
  };
  return (
    <StyledPwdContainer>
      <BackView onClickBack={onClickPre} />
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
              <StyledPwdCheckSpan>{getFeedbackText()}</StyledPwdCheckSpan>
            }
          />
          <Input
            label={i18n.t("confirmPassword")}
            onChange={onPwdConfirmInput}
            value={confirmPwd}
            inputType={"password"}
            showBottomTip={!passwordsMatch}
            bottomTip={
              <StyledPwdCheckSpan>
                {getConfirmFeedbackText()}
              </StyledPwdCheckSpan>
            }
          />
        </StyledPwdInputContainer>
      </StyledPwdContentContainer>
      <StyledBottomContainer>
        <Button disable={!isButtonEnabled()} onClick={goToCreate}>
          {i18n.t("next")}
        </Button>
      </StyledBottomContainer>
    </StyledPwdContainer>
  );
};
