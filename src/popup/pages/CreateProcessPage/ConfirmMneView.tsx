import {
  WALLET_CONFIRM_CREATE_MNEMONIC,
  WALLET_GET_CREATE_MNEMONIC_CHALLENGE,
} from "@/constant/msgTypes";
import { useAppDispatch } from "@/hooks/useStore";
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
import { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import type { AccountInfo } from "../../types/account";
import type {
  MneItemSelectedProps,
  MneWordItem,
  ProcessViewProps,
} from "../../types/common";

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

interface ConfirmMneViewProps extends ProcessViewProps {
  isActive?: boolean;
}

interface ChallengeWordItem extends MneWordItem {
  id: string;
}

interface MnemonicChallengeResponse {
  words?: string[];
  error?: string;
  type?: string;
}

const normalizeWords = (words: unknown): string[] => {
  if (!Array.isArray(words)) return [];
  return words
    .map((word) => (typeof word === "string" ? word.trim() : ""))
    .filter(Boolean);
};

const createChallengeList = (words: string[]): ChallengeWordItem[] => {
  return words.map((name, index) => ({
    id: `${index}-${name}`,
    name,
    selected: false,
  }));
};

export const ConfirmMneView = ({
  onClickPre,
  onClickNext,
  isActive = false,
}: ConfirmMneViewProps) => {
  const [currentMneLength, setCurrentMneLength] = useState(12);
  const [mnemonicRandomList, setMnemonicRandomList] = useState<
    ChallengeWordItem[]
  >([]);
  const [mneSelectList, setMneSelectList] = useState<
    (ChallengeWordItem | string)[]
  >(Array(currentMneLength).fill(""));
  const [btnClick, setBtnClick] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);

  const dispatch = useAppDispatch();

  const onClickPreRef = useRef(onClickPre);
  useEffect(() => {
    onClickPreRef.current = onClickPre;
  }, [onClickPre]);

  const setMneListFill = useCallback(
    (list: (ChallengeWordItem | string)[] = []) => {
      const targetLength = currentMneLength;
      const newList = list.filter(Boolean);
      const length = targetLength - newList.length;
      const newFillList = Array(length).fill("");
      return [...newList, ...newFillList];
    },
    [currentMneLength],
  );

  const resetSelectedWords = useCallback(() => {
    setMneSelectList(setMneListFill([]));
    setMnemonicRandomList((list) =>
      list.map((item) => ({
        ...item,
        selected: false,
      })),
    );
    setBtnClick(false);
  }, [setMneListFill]);

  useEffect(() => {
    if (!isActive) return;
    sendMsg<MnemonicChallengeResponse>(
      {
        action: WALLET_GET_CREATE_MNEMONIC_CHALLENGE,
      },
      (response) => {
        if (response?.error) {
          const errorMsg =
            response.type === "local" ? i18n.t(response.error) : response.error;
          Toast.info(errorMsg);
          onClickPreRef.current?.();
          return;
        }
        const words = normalizeWords(response?.words);
        if (words.length === 0) {
          Toast.info(i18n.t("tryAgain"));
          onClickPreRef.current?.();
          return;
        }
        const challengeList = createChallengeList(words);
        setCurrentMneLength(challengeList.length);
        setMnemonicRandomList(challengeList);
        setMneSelectList(Array(challengeList.length).fill(""));
        setBtnClick(false);
      },
      () => {
        Toast.info(i18n.t("tryAgain"));
      },
    );
  }, [isActive]);

  const onClickTopItem = useCallback(
    (v: ChallengeWordItem | string, i: number) => {
      const item = typeof v === "string" ? null : v;
      const isSelected = item?.selected;
      if (!isSelected || !item) return;

      const tempMnemonicRandomList = mnemonicRandomList.map((word) => ({
        ...word,
      }));
      const tempSelectList = [...mneSelectList];

      const index = tempMnemonicRandomList.findIndex(
        (word: ChallengeWordItem) => word.id === item.id,
      );

      if (index >= 0 && tempMnemonicRandomList[index]) {
        tempMnemonicRandomList[index].selected = false;
      }

      tempSelectList.splice(i, 1);

      setMnemonicRandomList(tempMnemonicRandomList);
      setMneSelectList(setMneListFill(tempSelectList));
    },
    [mnemonicRandomList, mneSelectList, setMneListFill],
  );

  const onClickBottomItem = useCallback(
    (v: ChallengeWordItem, i: number) => {
      const tempMnemonicRandomList = mnemonicRandomList.map((word) => ({
        ...word,
      }));
      const tempSelectList = mneSelectList.filter(
        Boolean,
      ) as ChallengeWordItem[];

      if (v.selected || !tempMnemonicRandomList[i]) return;

      tempMnemonicRandomList[i].selected = true;
      tempSelectList.push(tempMnemonicRandomList[i]);

      setMnemonicRandomList(tempMnemonicRandomList);
      setMneSelectList(setMneListFill(tempSelectList));
    },
    [mnemonicRandomList, mneSelectList, setMneListFill],
  );

  useEffect(() => {
    const tempSelectList = mneSelectList.filter(Boolean);
    if (currentMneLength > 0 && tempSelectList.length === currentMneLength) {
      setBtnClick(true);
    } else {
      setBtnClick(false);
    }
  }, [mneSelectList, currentMneLength]);

  const goToNext = useCallback(() => {
    const selectedWords = mneSelectList
      .map((item) => (typeof item === "string" ? "" : item.name))
      .filter(Boolean);

    if (currentMneLength <= 0 || selectedWords.length !== currentMneLength) {
      Toast.info(i18n.t("seed_error"));
      return;
    }

    setLoadingStatus(true);
    sendMsg(
      {
        action: WALLET_CONFIRM_CREATE_MNEMONIC,
        payload: {
          words: selectedWords,
        },
      },
      (currentAccount: AccountInfo & { error?: string; type?: string }) => {
        setLoadingStatus(false);

        if (currentAccount?.error) {
          const errorMsg =
            currentAccount.type === "local"
              ? i18n.t(currentAccount.error)
              : currentAccount.error;
          Toast.info(errorMsg || i18n.t("tryAgain"));

          if (currentAccount.error === "mnemonicLost") {
            onClickPre?.();
          } else if (currentAccount.error === "seed_error") {
            resetSelectedWords();
          }
          return;
        }

        dispatch(updateCurrentAccount(currentAccount));
        dispatch(updateEntryWitchRoute(ENTRY_WITCH_ROUTE.HOME_PAGE));
        onClickNext?.();
      },
      () => {
        setLoadingStatus(false);
        Toast.info(i18n.t("tryAgain"));
      },
    );
  }, [
    mneSelectList,
    currentMneLength,
    dispatch,
    onClickNext,
    resetSelectedWords,
  ]);

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
              mne={typeof mne === "string" ? "" : mne.name}
              colorStatus={!mne}
              index={index}
              onClick={() => onClickTopItem(mne, index)}
              canClick={true}
            />
          );
        })}
      </StyledTopMneContainer>
      <StyledBottomMneContainer>
        {mnemonicRandomList.map((mne: ChallengeWordItem, index: number) => {
          if (mne.selected) {
            return null;
          }
          return (
            <MneItemSelectedV2
              key={mne.id}
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
const MneItemSelectedV2 = ({
  mne,
  onClick = () => {},
}: MneItemSelectedProps) => {
  return (
    <StyledSelectedContainer onClick={onClick}>
      <StyledSelectedItem>{mne}</StyledSelectedItem>
    </StyledSelectedContainer>
  );
};
