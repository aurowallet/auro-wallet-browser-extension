import cls from 'classnames';
import i18n from "i18next";
import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useHistory } from 'react-router-dom';
import { WALLET_GET_CREATE_MNEMONIC, WALLET_NEW_HD_ACCOUNT } from "../../../constant/msgTypes";
import { updateCurrentAccount } from "../../../reducers/accountReducer";
import { ENTRY_WITCH_ROUTE, updateEntryWitchRoute } from "../../../reducers/entryRouteReducer";
import { sendMsg } from "../../../utils/commonMsg";
import BottomBtn from '../../component/BottomBtn';
import CustomView from "../../component/CustomView";
import Toast from "../../component/Toast";
import { MneItem } from "../ShowMnemonic";
import styles from "./index.module.scss";


export const BackupMnemonics = () => {

  const [currentMnelength, setCurrentMnelength] = useState(12)
  const [mnemonicRandomList, setMnemonicRandomList] = useState([])
  const [mneSelectList, setMneSelectList] = useState(Array(currentMnelength).fill(''))

  const [sourceMne, setSourceMne] = useState("")
  const [btnClick, setBtnClick] = useState(false)
  const [loadingStatus, setLoadingStatus] = useState(false)

  const dispatch = useDispatch()
  let history = useHistory();

  useEffect(() => {
    sendMsg({
      action: WALLET_GET_CREATE_MNEMONIC,
      payload: {
        isNewMne: false
      }
    }, (mnemonic) => {
      let mneList = mnemonic.split(" ")
      for (let i = 0; i < mneList.length; i++) {
        const index = Math.floor(Math.random() * mneList.length);
        [mneList[i], mneList[index]] = [mneList[index], mneList[i]];
      }
      let list = mneList.map((v) => {
        return {
          name: v,
          selected: false,
        };
      })
      setSourceMne(mnemonic)
      setMnemonicRandomList(list)
      setCurrentMnelength(list.length)
    })
  }, [])


  const onClickTopItem = useCallback((v, i) => {
    let tempMnemonicRandomList = [...mnemonicRandomList]
    let tempSelectlist = [...mneSelectList]
    const bool = v.selected;
    if (bool) {
      const index = tempMnemonicRandomList.findIndex((item) => item.name == v.name);
      tempMnemonicRandomList[index].selected = !bool;
      tempSelectlist.splice(i, 1);
      setMnemonicRandomList(tempMnemonicRandomList)
      setMneSelectList(setMneListFill(tempSelectlist))
    }
  }, [mnemonicRandomList, mneSelectList])


  const setMneListFill = useCallback((list = []) => {
    let targetLength = currentMnelength
    let newList = list.filter(Boolean)
    let length = targetLength - newList.length
    let newFillList = Array(length).fill('')
    return [...newList, ...newFillList]
  }, [currentMnelength])

  const onClickBottomItem = useCallback((v, i) => {
    let tempMnemonicRandomList = [...mnemonicRandomList]
    let tempSelectlist = mneSelectList.filter(Boolean)
    const bool = v.selected;
    if (!bool) {
      tempMnemonicRandomList[i].selected = !bool;
      tempSelectlist.push(v);
      setMnemonicRandomList(tempMnemonicRandomList)
      setMneSelectList(setMneListFill(tempSelectlist))
    }
  }, [mnemonicRandomList, mneSelectList])


  useEffect(() => {
    let tempSelectlist = mneSelectList.filter(Boolean)
    if (tempSelectlist.length === currentMnelength) {
      setBtnClick(true)
    }
  }, [mneSelectList])

  const compareList = useCallback(() => {
    let mneList = sourceMne.split(" ")
    return mneSelectList.map((v) => v.name).join("") == mneList.join("");
  }, [sourceMne, mneSelectList])

  const goToNext = useCallback(() => {
    let bool = compareList();
    if (bool) {
      setLoadingStatus(true)
      sendMsg({
        action: WALLET_NEW_HD_ACCOUNT,
        payload: {
          mne: sourceMne,
        }
      },
        async (currentAccount) => {
          setLoadingStatus(false)
          dispatch(updateCurrentAccount(currentAccount))
          dispatch(updateEntryWitchRoute(ENTRY_WITCH_ROUTE.HOME_PAGE))
          history.push("/backupsuccess")
        })
    } else {
      Toast.info(i18n.t("seed_error"))
      setMneSelectList(setMneListFill([]))
      let newList = mnemonicRandomList.map(v => {
        v.selected = false;
        return v;
      })
      setMnemonicRandomList(newList)
    }
  }, [mnemonicRandomList, i18n])

  return (
    <CustomView title={i18n.t('backupMnemonicPhrase')}>
      <p className={styles.backTitle}>
        {i18n.t('confirmMneTip')}
      </p>

      <div className={styles.mne_container}>
        {mneSelectList.map((mne, index) => {
          return <MneItem key={index} mne={mne?.name || ""} contentColorStatus={!mne} index={index} onClick={() => onClickTopItem(mne, index)} canClick={true} />
        })}
      </div>
      <div className={styles.dividedLine} />
      <div className={styles.mne_container}>
        {mnemonicRandomList.map((mne, index) => {
          if (mne.selected) {
            return null
          }
          return <MneItemSelected key={index} mne={mne.name} index={index} onClick={() => onClickBottomItem(mne, index)} />
        })}
      </div>

      <BottomBtn
        disable={!btnClick}
        onClick={goToNext}
        rightLoadingStatus={loadingStatus}
        rightBtnContent={i18n.t('next')}
      />
    </CustomView>
  )
}

export const MneItemSelected = ({ mne, onClick = () => { } }) => {
  const [showSmallMne, setShowSmallMne] = useState(mne.length >= 8)
  return (<div className={styles.mneItemContainer} onClick={onClick}>
    <span className={cls(styles.mneItem, {
      [styles.smallStyle]: showSmallMne
    })}>
      {mne}
    </span>
  </div>)
}