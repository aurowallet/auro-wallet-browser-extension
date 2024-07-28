import cls from "classnames";
import i18n from "i18next";
import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import { WALLET_CREATE_PWD } from "../../../constant/msgTypes";
import { sendMsg } from "../../../utils/commonMsg";
import { matchList as matchRuleList } from "../../../utils/validator";
import BottomBtn from "../../component/BottomBtn";
import CustomView from "../../component/CustomView";
import Input from "../../component/Input";
import { ReminderTip } from "../../component/ReminderTip";
import styles from "./index.module.scss";

const CreatePassword = () => {

  const history = useHistory()
  const welcomeNextRoute = useSelector(state => state.cache.welcomeNextRoute)

  const [inputPwd, setInputPwd] = useState("")
  const [confirmPwd, setConfirmPwd] = useState("")
  const [errorTip, setErrorTip] = useState(false)
  const [btnClick, setBtnClick] = useState(false)
  const [matchList, setMatchList] = useState(matchRuleList)
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

    history.push({
      pathname: nextRoute,
      params: {
        "pwd": confirmPwd,
      },
    })
  }, [welcomeNextRoute, confirmPwd])

  const onPwdConfirmInput = useCallback((e) => {
    setConfirmPwd(e.target.value)
  }, [])

  return (
    <CustomView title={i18n.t('createPassword')}>
      <ReminderTip
        content={i18n.t('createPasswordTip')} />
      <div className={cls(styles.inputContainer)}>
        <Input
          label={i18n.t('password')}
          onChange={onPwdInput}
          value={inputPwd}
          inputType={'password'}
          showBottomTip={inputPwd.length > 0}
          bottomTip={<div >
            {matchRenderList.map((item, index) => {
              let extraStr = ""
              if (index !== matchRenderList.length - 1) {
                extraStr = " / "
              }
              return <span className={cls(styles.checkSpan, {
                [styles.checkSpanSuc]: item.bool
              })} key={index}>{i18n.t(item.text) + extraStr}</span>
            })}
          </div>}
        />

        <Input
          label={i18n.t('confirmPassword')}
          onChange={onPwdConfirmInput}
          value={confirmPwd}
          inputType={'password'}
          showBottomTip={errorTip}
          bottomTip={<>
            <span className={cls(styles.checkSpan, {
              [styles.checkSpanSuc]: !errorTip
            })} >{i18n.t("passwordDifferent")}</span>
          </>}
        />
      </div>
      <BottomBtn
        disable={!btnClick}
        onClick={goToCreate}
        rightBtnContent={i18n.t('next')} />
    </CustomView>
  )
}
export default CreatePassword