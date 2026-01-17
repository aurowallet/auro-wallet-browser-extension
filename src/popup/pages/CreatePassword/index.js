import i18n from "i18next";
import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
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
  const welcomeNextRoute = useSelector(state => state.cache.welcomeNextRoute)

  const [inputPwd, setInputPwd] = useState("")
  const [confirmPwd, setConfirmPwd] = useState("")
  const [errorTip, setErrorTip] = useState(false)
  const [btnClick, setBtnClick] = useState(false)
  const [matchList, setMatchList] = useState(PasswordValidationList)
  const [matchRenderList, setMatchRenderList] = useState([])

  useEffect(() => {
    let currentErrorStatus = errorTip
    if (confirmPwd.length > 0 && inputPwd !== confirmPwd) {
      setErrorTip(true)
      currentErrorStatus = true
    } else {
      setErrorTip(false)
      currentErrorStatus = false
    }


    let errList = matchList.filter(v => {
      if (!v.bool) {
        return v
      }
    })
    if (errList.length <= 0 && confirmPwd.length > 0 && !currentErrorStatus) {
      setBtnClick(true)
    } else {
      setBtnClick(false)
    }
  }, [inputPwd, errorTip, matchList, confirmPwd])



  useEffect(() => {
    let renderList = []
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

  const onPwdInput = useCallback((e) => {
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

  const onPwdConfirmInput = useCallback((e) => {
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
          bottomTip={
            <div>
              {matchRenderList.map((item, index) => {
                let extraStr = "";
                if (index !== matchRenderList.length - 1) {
                  extraStr = " / ";
                }
                return (
                  <StyledCheckSpan $hidden={item.bool} key={index}>
                    {i18n.t(item.text) + extraStr}
                  </StyledCheckSpan>
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
            <StyledCheckSpan $hidden={!errorTip}>
              {i18n.t("passwordDifferent")}
            </StyledCheckSpan>
          }
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