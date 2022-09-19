import i18n from "i18next";
import { useCallback, useEffect, useState } from "react";
import { Trans } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from 'react-router-dom';
import { getLocal, saveLocal } from "../../../background/localStorage";
import { POWER_BY } from "../../../constant";
import { USER_AGREEMENT } from "../../../constant/storageKey";
import { getCurrentLang, LANG_SUPPORT_LIST } from "../../../i18n";
import { setWelcomeNextRoute } from "../../../reducers/cache";
import { openTab } from "../../../utils/commonMsg";
import Button, { button_theme } from "../../component/Button";
import { PopupModal } from "../../component/PopupModal";
import styles from "./index.module.scss";

const type_conditions = "conditions"
const type_policy = "policy"

const Welcome = () => {

  const cache = useSelector(state => state.cache)
  const dispatch = useDispatch()
  const history = useHistory()

  const [isGotoProtocol, setIsGotoProtocol] = useState(true)
  const [popupModalStatus, setPopupModalStatus] = useState(false)

  const [nextRoute, setNextRoute] = useState('')


  const onClickGuide = useCallback(() => {
    const { terms_and_contions, terms_and_contions_cn, privacy_policy, privacy_policy_cn } = cache
    let lan = getCurrentLang()
    let url = ""
    if (lan === LANG_SUPPORT_LIST.EN) {
      url = type === type_conditions ? terms_and_contions : privacy_policy
    } else if (lan === LANG_SUPPORT_LIST.ZH_CN) {
      url = type === type_conditions ? terms_and_contions_cn : privacy_policy_cn
    }
    if (url) {
      openTab(url)
    }
  }, [cache])


  const onConfirmProtocol = useCallback((route) => {
    setPopupModalStatus(true)
    setNextRoute(route)
  }, [])

  const goPage = useCallback((route, type) => {
    if (type === "saveProtocol") {
      saveLocal(USER_AGREEMENT, "true")
    }
    dispatch(setWelcomeNextRoute(route))
    history.push("/createpassword")
  }, [])

  const goNextRoute = useCallback((route) => {
    if (isGotoProtocol) {
      onConfirmProtocol(route)
    } else {
      goPage(route)
    }
  }, [isGotoProtocol, nextRoute])

  const onCloseModal = useCallback(() => {
    setPopupModalStatus(false)
  }, [])

  const initLocal = useCallback(() => {
    let agreeStatus = getLocal(USER_AGREEMENT)
    if (agreeStatus) {
      setIsGotoProtocol(false)
    }
  }, [])

  useEffect(() => {
    initLocal()
  }, [])



  return (<div className={styles.container}>
    <div className={styles.logoContainer}>
      <img src="/img/colorful_logo.svg" className={styles.logo} />
    </div>

    <div className={styles.btnContainer}>
      <Button
        leftIcon={"/img/icon_add.svg"}
        onClick={() => { goNextRoute("/backup_tips") }}
      >
        {i18n.t('createWallet')}
      </Button>

      <Button
        theme={button_theme.BUTTON_THEME_LIGHT}
        leftIcon={"/img/icon_download.svg"}
        onClick={() => { goNextRoute("/restore_account") }}
      >
        {i18n.t('importAccount')}
      </Button>
    </div>

    <p className={styles.bottomTipLedger}>{i18n.t("ledgerUserTip")}</p>
    <p className={styles.bottomUrl}>{POWER_BY}</p>

    <PopupModal
      title={i18n.t('termsAndPrivacy')}
      leftBtnContent={i18n.t('refuse')}
      rightBtnContent={i18n.t("agree")}
      onLeftBtnClick={onCloseModal}
      onRightBtnClick={() => {
        onCloseModal()
        goPage(nextRoute, "saveProtocol")
      }}
      componentContent={
        <div>
          <p className={styles.confirmContent_1}>{i18n.t('termsAndPrivacy_0')}</p>
          <p className={styles.confirmContent_2}>
            <Trans
              i18nKey={i18n.t('termsAndPrivacy_1')}
              components={{
                conditions: <span className={styles.tipsSpical} onClick={() => onClickGuide(type_conditions)} />,
                policy: <span className={styles.tipsSpical} onClick={() => onClickGuide(type_policy)} />
              }}
            />
          </p>
        </div>
      }
      modalVisable={popupModalStatus}
      onCloseModal={onCloseModal} />
  </div>)
}
export default Welcome