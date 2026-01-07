import { WALLET_CREATE_PWD } from "@/constant/msgTypes";
import Button from "@/popup/component/Button";
import Input from "@/popup/component/Input";
import ProcessLayout from "@/popup/component/ProcessLayout";
import { ReminderTip } from "@/popup/component/ReminderTip";
import { sendMsg } from "@/utils/commonMsg";
import i18n from "i18next";
import { useCallback, useState } from "react";
import styled from "styled-components";
import { PasswordValidationList } from "../../../utils/utils";

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
export const CreatePwdView = ({ onClickNextTab, onClickPre }) => {
  const [inputPwd, setInputPwd] = useState("");

  const [rulesMet, setRulesMet] = useState(
    PasswordValidationList.map((rule) => ({ ...rule, bool: false }))
  );

  const [confirmPwd, setConfirmPwd] = useState("");
  const [passwordsMatch, setPasswordsMatch] = useState(true);


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
    <ProcessLayout
      onClickBack={onClickPre}
      title={i18n.t("createPassword")}
      bottomContent={
        <Button disable={!isButtonEnabled()} onClick={goToCreate}>
          {i18n.t("next")}
        </Button>
      }
    >
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
    </ProcessLayout>
  );
};
