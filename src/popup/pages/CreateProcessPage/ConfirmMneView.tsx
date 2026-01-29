import {
  WALLET_GET_CREATE_MNEMONIC,
  WALLET_NEW_HD_ACCOUNT,
} from "@/constant/msgTypes";
import Button from "@/popup/component/Button";
import { MneItemV2 } from "@/popup/component/MneItem";
import ProcessLayout from "@/popup/component/ProcessLayout";
import Toast from "@/popup/component/Toast";
import { updateCurrentAccount } from "@/reducers/accountReducer";
import {
  ENTRY_WITCH_ROUTE,
  updateEntryWitchRoute,
} from "@/reducers/entryRouteReducer";
import { sendMsg } from "@/utils/commonMsg";
import i18n from "i18next";
import { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import type {
  ProcessViewProps,
  MneWordItem,
  MneItemSelectedProps,
} from "../../types/common";
import type { AccountInfo } from "../../types/account";
import { useAppDispatch } from "@/hooks/useStore";

const StyledMneTip = styled.div`
  font-weight: 500;
  font-size: 14px;
  line-height: 17px;
  color: var(--mineBlack);
  margin: 10px 0 0;
`;

const StyledTopMneContainer = styled.div`
  margin-top: 20px;
  display: grid;
  max-width: 408px;
  grid-template-columns: 1fr 1fr 1fr;
  grid-row-gap: 12px;
  grid-column-gap: 20px;
`;

const StyledBottomMneContainer = styled.div`
  margin-top: 40px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px 20px;
`;

export const ConfirmMneView = ({ onClickPre, onClickNext }: ProcessViewProps) => {
  const [currentMneLength, setCurrentMneLength] = useState(12);
  const [mnemonicRandomList, setMnemonicRandomList] = useState<MneWordItem[]>([]);
  const [mneSelectList, setMneSelectList] = useState(
    Array(currentMneLength).fill("")
  );

  const [sourceMne, setSourceMne] = useState("");
  const [btnClick, setBtnClick] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);

  const dispatch = useAppDispatch();

  useEffect(() => {
    sendMsg(
      {
        action: WALLET_GET_CREATE_MNEMONIC,
        payload: {
          isNewMne: false,
        },
      },
      (mnemonic: string) => {
        let mneList = mnemonic.split(" ");
        for (let i = 0; i < mneList.length; i++) {
          const index = Math.floor(Math.random() * mneList.length);
          const temp = mneList[i];
          mneList[i] = mneList[index] ?? '';
          mneList[index] = temp ?? '';
        }
        let list: MneWordItem[] = mneList.map((v: string) => {
          return {
            name: v,
            selected: false,
          };
        });
        setSourceMne(mnemonic);
        setMnemonicRandomList(list);
        setCurrentMneLength(list.length);
      }
    );
  }, []);

  const onClickTopItem = useCallback(
    (v: MneWordItem | string, i: number) => {
      let tempMnemonicRandomList = [...mnemonicRandomList];
      let tempSelectList = [...mneSelectList];
      const item = typeof v === 'string' ? null : v;
      const bool = item?.selected;
      if (bool && item) {
        const index = tempMnemonicRandomList.findIndex(
          (mneItem: MneWordItem) => mneItem.name === item.name
        );
        if (index >= 0 && tempMnemonicRandomList[index]) {
          tempMnemonicRandomList[index].selected = !bool;
        }
        tempSelectList.splice(i, 1);
        setMnemonicRandomList(tempMnemonicRandomList);
        setMneSelectList(setMneListFill(tempSelectList));
      }
    },
    [mnemonicRandomList, mneSelectList]
  );

  const setMneListFill = useCallback(
    (list: (MneWordItem | string)[] = []) => {
      let targetLength = currentMneLength;
      let newList = list.filter(Boolean);
      let length = targetLength - newList.length;
      let newFillList = Array(length).fill("");
      return [...newList, ...newFillList];
    },
    [currentMneLength]
  );

  const onClickBottomItem = useCallback(
    (v: MneWordItem, i: number) => {
      let tempMnemonicRandomList = [...mnemonicRandomList];
      let tempSelectList = mneSelectList.filter(Boolean);
      const bool = v.selected;
      if (!bool && tempMnemonicRandomList[i]) {
        tempMnemonicRandomList[i].selected = !bool;
        tempSelectList.push(v);
        setMnemonicRandomList(tempMnemonicRandomList);
        setMneSelectList(setMneListFill(tempSelectList));
      }
    },
    [mnemonicRandomList, mneSelectList]
  );

  useEffect(() => {
    let tempSelectList = mneSelectList.filter(Boolean);
    if (tempSelectList.length === currentMneLength) {
      setBtnClick(true);
    }
  }, [mneSelectList]);

  const compareList = useCallback(() => {
    let mneList = sourceMne.split(" ");
    return mneSelectList.map((v) => typeof v === 'string' ? v : v.name).join("") === mneList.join("");
  }, [sourceMne, mneSelectList]);

  const goToNext = useCallback(() => {
    let bool = compareList();
    if (bool) {
      setLoadingStatus(true);
      sendMsg(
        {
          action: WALLET_NEW_HD_ACCOUNT,
          payload: {
            mne: sourceMne,
          },
        },
        async (currentAccount: AccountInfo & { error?: string; type?: string }) => {
          setLoadingStatus(false);
          if (currentAccount.error) {
            const errorMsg = currentAccount.type === "local" 
              ? i18n.t(currentAccount.error) 
              : currentAccount.error;
            Toast.info(errorMsg);
            return;
          }
          dispatch(updateCurrentAccount(currentAccount));
          dispatch(updateEntryWitchRoute(ENTRY_WITCH_ROUTE.HOME_PAGE));
          onClickNext?.();
        }
      );
    } else {
      Toast.info(i18n.t("seed_error"));
      setMneSelectList(setMneListFill([]));
      let newList = mnemonicRandomList.map((v: MneWordItem) => ({
        ...v,
        selected: false,
      }));
      setMnemonicRandomList(newList);
    }
  }, [mnemonicRandomList, i18n, onClickNext]);

  return (
    <ProcessLayout
      onClickBack={onClickPre}
      title={i18n.t("backupMnemonicPhrase")}
      bottomContent={
        <Button disable={!btnClick} loading={loadingStatus} onClick={goToNext}>
          {i18n.t("show_seed_button")}
        </Button>
      }
    >
      <StyledMneTip>{i18n.t("confirmMneTip")}</StyledMneTip>
      <StyledTopMneContainer>
        {mneSelectList.map((mne, index: number) => {
          return (
            <MneItemV2
              key={index}
              mne={mne?.name || ""}
              colorStatus={!mne}
              index={index}
              onClick={() => onClickTopItem(mne, index)}
              canClick={true}
            />
          );
        })}
      </StyledTopMneContainer>
      <StyledBottomMneContainer>
        {mnemonicRandomList.map((mne: MneWordItem, index: number) => {
          if (mne.selected) {
            return null;
          }
          return (
            <MneItemSelectedV2
              key={index}
              mne={mne.name}
              index={index}
              onClick={() => onClickBottomItem(mne, index)}
            />
          );
        })}
      </StyledBottomMneContainer>
    </ProcessLayout>
  );
};

const StyledSelectedContainer = styled.div`
  background: rgba(0, 0, 0, 0.05);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  cursor: pointer;

  box-sizing: border-box;
`;
const StyledSelectedItem = styled.div`
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  color: #000000;
`;
const MneItemSelectedV2 = ({ mne, onClick = () => {} }: MneItemSelectedProps) => {
  return (
    <StyledSelectedContainer onClick={onClick}>
      <StyledSelectedItem>{mne}</StyledSelectedItem>
    </StyledSelectedContainer>
  );
};
