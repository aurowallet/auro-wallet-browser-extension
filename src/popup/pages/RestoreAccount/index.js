import { wordlists } from "bip39";
import i18n from "i18next";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useHistory } from 'react-router-dom';
import { validateMnemonic } from "../../../background/accountService";
import { WALLET_NEW_HD_ACCOUNT } from "../../../constant/msgTypes";
import { updateCurrentAccount } from "../../../reducers/accountReducer";
import { ENTRY_WITCH_ROUTE, updateEntryWitchRoute } from "../../../reducers/entryRouteReducer";
import { sendMsg } from "../../../utils/commonMsg";
import { trimSpace } from "../../../utils/utils";
import BottomBtn from "../../component/BottomBtn";
import CustomView from "../../component/CustomView";
import TextArea from "../../component/TextArea";
import styles from "./index.module.scss";

const RestoreAccount = () => {
  const [mneInput, setMneInput] = useState("")
  const [similarWordList, setSimilarWordList] = useState([])
  const [btnLoading, setBtnLoading] = useState(false)
  const [bottomTipError, setBottomTipError] = useState("")

  const [btnDisableStatus,setBtnDisableStatus] = useState(true)
  const childRef = useRef();


  const dispatch = useDispatch()
  const history = useHistory()

  const getNeedMatchWord = useCallback((mneList) => {
    let targetMne = mneList[mneList.length - 1]
    return targetMne
  }, [])

  const getSimilarWord = useCallback(() => {
    let lowMne = mneInput.toLowerCase()
    let mneList = lowMne.split(" ")
    let position = childRef.current.getCurrentCaretPosition()

    if (mneList.length > 0) {
      let targetMne = getNeedMatchWord(mneList)
      if (lowMne.indexOf(targetMne) <= position) {
        if (targetMne.length >= 1) {
          let list = wordlists.english.filter((item) => {
            return item.indexOf(targetMne) === 0;
          });
          list = list.slice(0, 10)
          setSimilarWordList(list)
        }
      }
    } else {
      setSimilarWordList([])
    }

  }, [mneInput])

  useEffect(() => {
    getSimilarWord()
  }, [mneInput])

  const onInput = useCallback((e) => {
    if (bottomTipError) {
      setBottomTipError("")
    }
    setSimilarWordList([])
    let mnemonic = e.target.value;
    let _mnemonic = mnemonic.replace(/\s/g, ' ');
    _mnemonic = _mnemonic.replace(/[\r\n]/g, "")
    setMneInput(_mnemonic)
  }, [bottomTipError])

  const onClickSimilarWord = useCallback((similarWord) => {
    let mneList = mneInput.split(" ")
    mneList[mneList.length - 1] = similarWord
    let newInput = mneList.join(" ")
    newInput = newInput + " "
    setMneInput(newInput)
    setSimilarWordList([])

    childRef.current.setFocus();

  }, [mneInput])

  const goToCreate = useCallback(() => {
    let mnemonic = mneInput

    mnemonic = trimSpace(mnemonic)
    mnemonic = mnemonic.toLocaleLowerCase()


    let mnemonicVaild = validateMnemonic(mnemonic)
    if (!mnemonicVaild) {
      setBottomTipError(i18n.t('seed_error'))
      return
    }
    setBtnLoading(true)
    sendMsg({
      action: WALLET_NEW_HD_ACCOUNT,
      payload: {
        mne: mnemonic
      }
    },
      async (currentAccount) => {
        setBtnLoading(false)
        dispatch(updateCurrentAccount(currentAccount))
        dispatch(updateEntryWitchRoute(ENTRY_WITCH_ROUTE.HOME_PAGE))
        history.push({
          pathname: "/backupsuccess",
          params: { type: "restore" }
        })
      })
  }, [mneInput, i18n])

  useEffect(()=>{
    if(trimSpace(mneInput).length>0){
      setBtnDisableStatus(false)
    }else{
      setBtnDisableStatus(true)
    }
  },[mneInput])

  return (
    <CustomView title={i18n.t('restoreWallet')}>
      <p className={styles.restoreTip}>
        {i18n.t('inputSeed')}
      </p>
      <div className={styles.textAreaContainer}>
        <TextArea
          onChange={onInput}
          value={mneInput}
          childRef={childRef}
          showBottomTip={true}
          bottomErrorTip={bottomTipError}
        />
      </div>
      <div className={styles.similarWordOuter}>
        <div className={styles.similarWordContainer}>
          {
            similarWordList.map((similarWord, index) => {
              return <div
                onClick={() => onClickSimilarWord(similarWord)}
                key={index}
                className={styles.similarWordItem}
              >
                {similarWord}
              </div>
            })
          }
        </div>
      </div>
      <BottomBtn
        disable={btnDisableStatus}
        rightLoadingStatus={btnLoading}
        onClick={goToCreate}
        rightBtnContent={i18n.t('confirm')}
      />
    </CustomView>
  )
}
export default RestoreAccount