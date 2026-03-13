import { WALLET_CREATE_PWD } from "@/constant/msgTypes";
import Button from "@/popup/component/Button";
import Input from "@/popup/component/Input";
import ProcessLayout from "@/popup/component/ProcessLayout";
import { ReminderTip } from "@/popup/component/ReminderTip";
import Toast from "@/popup/component/Toast";
import { sendMsg } from "@/utils/commonMsg";
import i18n from "i18next";
import { useCallback, useState } from "react";
import styled from "styled-components";
import { PasswordValidationList } from "../../../utils/utils";
import type { InputChangeEvent, ProcessViewProps } from "../../types/common";

const StyledPwdInputContainer = styled.div`
  margin-top: 20px;
  max-width: 335px;
  > :not(:last-child) {
    margin-bottom: 20px;
  }
`;
interface StyledPwdCheckSpanProps {
  $showStatus?: boolean;
}
const StyledPwdCheckSpan = styled.span<StyledPwdCheckSpanProps>`
  font-style: normal;
  font-weight: 600;
  font-size: 12px;
  line-height: 17px;
  color: var(--secondaryRed);
  display: ${(props) => (props.$showStatus ? "none" : "initial")};
`;
export const CreatePwdView = ({
  onClickNextTab,
  onClickPre,
}: ProcessViewProps) => {
  const [inputPwd, setInputPwd] = useState("");

  const [rulesMet, setRulesMet] = useState(
    PasswordValidationList.map((rule) => ({ ...rule, bool: false })),
  );

  const [confirmPwd, setConfirmPwd] = useState("");
  const [passwordsMatch, setPasswordsMatch] = useState(true);

  const onPwdInput = useCallback(
    (e: InputChangeEvent) => {
      const newPassword = e.target.value;
      setInputPwd(newPassword);

      setRulesMet((prev) =>
        prev.map((rule) => ({
          ...rule,
          bool: rule.expression.test(newPassword),
        })),
      );
      if (confirmPwd.length > 0) {
        setPasswordsMatch(confirmPwd === newPassword);
      }
    },
    [confirmPwd],
  );

  const onPwdConfirmInput = useCallback(
    (e: InputChangeEvent) => {
      const newConfirmedPassword = e.target.value;
      setConfirmPwd(newConfirmedPassword);

      setPasswordsMatch(newConfirmedPassword === inputPwd);
    },
    [inputPwd],
  );

  const goToCreate = useCallback(() => {
    if (!isButtonEnabled()) return;
    sendMsg(
      {
        action: WALLET_CREATE_PWD,
        payload: {
          pwd: confirmPwd,
        },
      },
      (res: { success?: boolean }) => {
        if (res?.success) {
          onClickNextTab?.();
          return;
        }
        Toast.info(i18n.t("tryAgain"));
      },
      () => {
        Toast.info(i18n.t("tryAgain"));
      },
    );
  }, [confirmPwd, onClickNextTab, inputPwd, rulesMet, passwordsMatch]);

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
          bottomTip={getFeedbackText()}
        />
        <Input
          label={i18n.t("confirmPassword")}
          onChange={onPwdConfirmInput}
          value={confirmPwd}
          inputType={"password"}
          showBottomTip={!passwordsMatch}
          bottomTip={getConfirmFeedbackText()}
        />
      </StyledPwdInputContainer>
    </ProcessLayout>
  );
};
