import i18n from "i18next";
import { useCallback, useEffect, useState } from "react";
import { useAppDispatch } from "@/hooks/useStore";
import type { AccountInfo } from "../../types/account";
import { useNavigate } from "react-router-dom";
import { WALLET_GET_CREATE_MNEMONIC, WALLET_NEW_HD_ACCOUNT } from "../../../constant/msgTypes";
import { updateCurrentAccount } from "../../../reducers/accountReducer";
import { ENTRY_WITCH_ROUTE, updateEntryWitchRoute } from "../../../reducers/entryRouteReducer";
import { sendMsg } from "../../../utils/commonMsg";
import BottomBtn from "../../component/BottomBtn";
import CustomView from "../../component/CustomView";
import Toast from "../../component/Toast";
import { MneItem } from "../ShowMnemonic";
import {
  StyledBackTitle,
  StyledMneContainer,
  StyledDividedLine,
  StyledMneItemSelectedContainer,
  StyledMneItemSelected,
} from "./index.styled";


export const BackupMnemonics = () => {

  const [currentMneLength, setCurrentMneLength] = useState(12)
  const [mnemonicRandomList, setMnemonicRandomList] = useState<{ name: string; selected: boolean }[]>([])
  const [mneSelectList, setMneSelectList] = useState<({ name: string; selected: boolean } | string)[]>(Array(currentMneLength).fill(''))

  const [sourceMne, setSourceMne] = useState("")
  const [btnClick, setBtnClick] = useState(false)
  const [loadingStatus, setLoadingStatus] = useState(false)

  const dispatch = useAppDispatch()
  const navigate = useNavigate();

  useEffect(() => {
    sendMsg({
      action: WALLET_GET_CREATE_MNEMONIC,
      payload: {
        isNewMne: false
      }
    }, (mnemonic: string) => {
      let mneList = mnemonic.split(" ")
      for (let i = 0; i < mneList.length; i++) {
        const index = Math.floor(Math.random() * mneList.length);
        const temp = mneList[i];
        mneList[i] = mneList[index] ?? '';
        mneList[index] = temp ?? '';
      }
      let list = mneList.map((v: string) => {
        return {
          name: v,
          selected: false,
        };
      })
      setSourceMne(mnemonic)
      setMnemonicRandomList(list)
      setCurrentMneLength(list.length)
    })
  }, [])


  const onClickTopItem = useCallback((v: { name: string; selected: boolean } | string, i: number) => {
    if (typeof v === 'string') return;
    let tempMnemonicRandomList = [...mnemonicRandomList]
    let tempSelectList = [...mneSelectList]
    const bool = v.selected;
    if (bool) {
      const index = tempMnemonicRandomList.findIndex((item) => item.name === v.name);
      if (index >= 0 && tempMnemonicRandomList[index]) tempMnemonicRandomList[index].selected = !bool;
      tempSelectList.splice(i, 1);
      setMnemonicRandomList(tempMnemonicRandomList)
      setMneSelectList(setMneListFill(tempSelectList))
    }
  }, [mnemonicRandomList, mneSelectList])


  const setMneListFill = useCallback((list: ({ name: string; selected: boolean } | string)[] = []) => {
    let targetLength = currentMneLength
    let newList = list.filter(Boolean)
    let length = targetLength - newList.length
    let newFillList = Array(length).fill('')
    return [...newList, ...newFillList]
  }, [currentMneLength])

  const onClickBottomItem = useCallback((v: { name: string; selected: boolean }, i: number) => {
    let tempMnemonicRandomList = [...mnemonicRandomList]
    let tempSelectList = mneSelectList.filter(Boolean)
    const bool = v.selected;
    if (!bool) {
      if (tempMnemonicRandomList[i]) tempMnemonicRandomList[i].selected = !bool;
      tempSelectList.push(v as { name: string; selected: boolean });
      setMnemonicRandomList(tempMnemonicRandomList)
      setMneSelectList(setMneListFill(tempSelectList))
    }
  }, [mnemonicRandomList, mneSelectList])


  useEffect(() => {
    let tempSelectList = mneSelectList.filter((v) => Boolean(v))
    if (tempSelectList.length === currentMneLength) {
      setBtnClick(true)
    }
  }, [mneSelectList])

  const compareList = useCallback(() => {
    let mneList = sourceMne.split(" ")
    return mneSelectList.map((v) => typeof v === 'string' ? v : (v as { name: string }).name).join("") === mneList.join("");
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
        async (currentAccount: AccountInfo) => {
          setLoadingStatus(false)
          dispatch(updateCurrentAccount(currentAccount))
          dispatch(updateEntryWitchRoute(ENTRY_WITCH_ROUTE.HOME_PAGE))
          navigate("/backup_success")
        })
    } else {
      Toast.info(i18n.t("seed_error"))
      setMneSelectList(setMneListFill([]))
      let newList = mnemonicRandomList.map((v) => {
        v.selected = false;
        return v;
      })
      setMnemonicRandomList(newList)
    }
  }, [mnemonicRandomList, i18n])

  return (
    <CustomView title={i18n.t("backupMnemonicPhrase")}>
      <StyledBackTitle>{i18n.t("confirmMneTip")}</StyledBackTitle>
      <StyledMneContainer>
        {mneSelectList.map((mne, index) => {
          return (
            <MneItem
              key={index}
              mne={typeof mne === 'string' ? mne : mne?.name || ""}
              contentColorStatus={!mne}
              index={index}
              onClick={() => onClickTopItem(mne, index)}
              canClick={true}
            />
          );
        })}
      </StyledMneContainer>
      <StyledDividedLine />
      <StyledMneContainer>
        {mnemonicRandomList.map((mne, index) => {
          if (mne.selected) {
            return null;
          }
          return (
            <MneItemSelected
              key={index}
              mne={mne.name}
              index={index}
              onClick={() => onClickBottomItem(mne, index)}
            />
          );
        })}
      </StyledMneContainer>
      <BottomBtn
        disable={!btnClick}
        onClick={goToNext}
        rightLoadingStatus={loadingStatus}
        rightBtnContent={i18n.t("next")}
      />
    </CustomView>
  );
};

interface MneItemSelectedProps {
  mne: string;
  index?: number;
  onClick?: () => void;
}

export const MneItemSelected = ({ mne, onClick = () => {} }: MneItemSelectedProps) => {
  const [showSmallMne] = useState(mne.length >= 8);
  return (
    <StyledMneItemSelectedContainer onClick={onClick}>
      <StyledMneItemSelected $small={showSmallMne}>{mne}</StyledMneItemSelected>
    </StyledMneItemSelectedContainer>
  );
};