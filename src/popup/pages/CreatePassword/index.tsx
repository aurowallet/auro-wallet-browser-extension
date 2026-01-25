import i18n from "i18next";
import { useCallback, useEffect, useState } from "react";
import { useAppSelector } from "@/hooks/useStore";
import { useNavigate } from "react-router-dom";
import { WALLET_CREATE_PWD } from "../../../constant/msgTypes";
import { sendMsg } from "../../../utils/commonMsg";
import BottomBtn from "../../component/BottomBtn";
import CustomView from "../../component/CustomView";
import Input from "../../component/Input";
import { ReminderTip } from "../../component/ReminderTip";
import { PasswordValidationList } from "../../../utils/utils";
import { StyledInputContainer, StyledCheckSpan } from "./index.styled";

const CreatePassword = () => {

  const navigate = useNavigate()
  const welcomeNextRoute = useAppSelector((state) => state.cache.welcomeNextRoute)

  const [inputPwd, setInputPwd] = useState("")
  const [confirmPwd, setConfirmPwd] = useState("")
  const [errorTip, setErrorTip] = useState(false)
  const [btnClick, setBtnClick] = useState(false)
  const [matchList, setMatchList] = useState(PasswordValidationList)
  const [matchRenderList, setMatchRenderList] = useState<typeof PasswordValidationList>([])

  useEffect(() => {
    let currentErrorStatus = errorTip
    if (confirmPwd.length > 0 && inputPwd !== confirmPwd) {
      setErrorTip(true)
      currentErrorStatus = true
    } else {
      setErrorTip(false)
      currentErrorStatus = false
    }


    const errList = matchList.filter((v) => !v.bool)
    if (errList.length <= 0 && confirmPwd.length > 0 && !currentErrorStatus) {
      setBtnClick(true)
    } else {
      setBtnClick(false)
    }
  }, [inputPwd, errorTip, matchList, confirmPwd])



  useEffect(() => {
    let renderList: typeof PasswordValidationList = []
    let newMatchList = matchList.map(v => {
      if (v.expression.test(inputPwd)) {
        v.bool = true;
      } else {
        v.bool = false;
        renderList.push(v)
      }
      return v;
    })

    setMatchList(newMatchList)
    setMatchRenderList(renderList)
  }, [inputPwd])

  const onPwdInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputPwd(e.target.value)
  }, [])

  const goToCreate = useCallback(() => {
    sendMsg({
      action: WALLET_CREATE_PWD,
      payload: {
        pwd: confirmPwd,
      }
    }, (res) => { })
    let nextRoute = welcomeNextRoute

    navigate(nextRoute, { state: { pwd: confirmPwd } })
  }, [welcomeNextRoute, confirmPwd])

  const onPwdConfirmInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPwd(e.target.value)
  }, [])

  return (
    <CustomView title={i18n.t("createPassword")}>
      <ReminderTip content={i18n.t("createPasswordTip")} />
      <StyledInputContainer>
        <Input
          label={i18n.t("password")}
          onChange={onPwdInput}
          value={inputPwd}
          inputType={"password"}
          showBottomTip={inputPwd.length > 0}
          bottomTip={matchRenderList.map((item) => i18n.t(item.text)).join(" / ")}
        />
        <Input
          label={i18n.t("confirmPassword")}
          onChange={onPwdConfirmInput}
          value={confirmPwd}
          inputType={"password"}
          showBottomTip={errorTip}
          bottomTip={i18n.t("passwordDifferent")}
        />
      </StyledInputContainer>
      <BottomBtn
        disable={!btnClick}
        onClick={goToCreate}
        rightBtnContent={i18n.t("next")}
      />
    </CustomView>
  );
};

export default CreatePassword;