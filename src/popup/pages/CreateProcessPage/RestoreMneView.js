import { validateMnemonic } from "@/background/accountService";
import { WALLET_NEW_HD_ACCOUNT } from "@/constant/msgTypes";
import Button from "@/popup/component/Button";
import { MneItemV2 } from "@/popup/component/MneItem";
import Toast from "@/popup/component/Toast";
import { updateCurrentAccount } from "@/reducers/accountReducer";
import {
  ENTRY_WITCH_ROUTE,
  updateEntryWitchRoute,
} from "@/reducers/entryRouteReducer";
import { sendMsg } from "@/utils/commonMsg";
import { checkValidStrInList } from "@/utils/utils";
import { wordlists } from "bip39";
import i18n from "i18next";
import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import styled from "styled-components";
import { BackView } from ".";

const StyledPwdContainer = styled.div`
  margin-top: 20px;
`;
const StyledPwdContentContainer = styled.div`
  padding: 40px;
`;
const StyledProcessTitle = styled.div`
  color: var(--Black, #000);
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const StyledBottomContainer = styled.div`
  position: absolute;
  width: 600px;
  bottom: 30px;
  left: 50%;
  transform: translate(-50%);
`;
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
  max-width: 572px;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  grid-row-gap: 12px;
  grid-column-gap: 20px;
`;

const StyledBottomMneContainer = styled.div`
  max-width: 572px;
  margin-top: 40px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px 20px;
`;
const StyledRowSwitch = styled.span`
  color: #594af1;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  position: absolute;
  right: 40px;
`;

export const RestoreMneView = ({
  onClickPre,
  onClickNext,
  onSwitchMneCount,
}) => {
  const [mneCount, setMenCount] = useState(12);
  const [mneInputList, setMneInputList] = useState(Array(mneCount).fill(""));
  const [similarWordList, setSimilarWordList] = useState([]);
  const [btnLoading, setBtnLoading] = useState(false);
  const [btnClick, setBtnClick] = useState(true);
  const [mneInput, setMneInput] = useState({
    word: "",
    index: -1,
  });

  const dispatch = useDispatch();
  const getSimilarWord = useCallback(() => {
    if (mneInput.word.length > 0) {
      let list = wordlists.english.filter((item) => {
        return item.indexOf(mneInput.word) === 0;
      });
      list = list.slice(0, 10);
      setSimilarWordList(list);
    } else {
      setSimilarWordList([]);
    }
  }, [mneInput]);
  const onSwitch = useCallback(() => {
    let nextCount = mneCount == 12 ? 24 : 12;
    setMenCount(nextCount);
    setMneInputList(Array(nextCount).fill(""));
    setSimilarWordList([]);
    if (onSwitchMneCount) {
      onSwitchMneCount(nextCount == 24);
    }
  }, [mneCount, onSwitchMneCount]);

  useEffect(() => {
    getSimilarWord();
  }, [mneInput]);

  const onChangeMneItem = useCallback(
    (e, index) => {
      const value = e.target.value;
      const lastValue = value.trim();

      const list = [...mneInputList];
      list[index] = lastValue;
      setMneInputList(list);
      setMneInput({
        word: lastValue,
        index,
      });
    },
    [mneInputList]
  );

  const handlePaste = useCallback(
    (index, value) => {
      const wordsStr =
        (value || "").trim().toLowerCase().match(/\w+/gu)?.join(" ") || "";
      const words = wordsStr.split(" ");
      if (words.length === mneCount) {
        setMneInputList(words);
        return;
      }

      const newFullWords = mneInputList.slice();
      for (let i = index; i < Math.min(index + words.length, mneCount); i++) {
        newFullWords[i] = words[i - index];
      }
      setMneInputList(newFullWords);
    },
    [mneInputList, mneCount]
  );

  const onClickSimilarWord = useCallback(
    (similarWord) => {
      const list = [...mneInputList];
      list[mneInput.index] = similarWord;
      setMneInputList(list);
      setSimilarWordList([]);
    },
    [mneInput, mneInputList]
  );

  const goToCreate = useCallback(() => {
    let mnemonic = mneInputList.join(" ").trim();
    mnemonic = mnemonic.toLowerCase();

    let mnemonicValid = validateMnemonic(mnemonic);
    if (!mnemonicValid) {
      Toast.info(i18n.t("seed_error"));
      return;
    }
    setBtnLoading(true);
    sendMsg(
      {
        action: WALLET_NEW_HD_ACCOUNT,
        payload: {
          mne: mnemonic,
        },
      },
      async (currentAccount) => {
        setBtnLoading(false);
        dispatch(updateCurrentAccount(currentAccount));
        dispatch(updateEntryWitchRoute(ENTRY_WITCH_ROUTE.HOME_PAGE));
        onClickNext();
      }
    );
  }, [mneInputList, i18n, onClickNext]);

  useEffect(() => {
    const validList = checkValidStrInList(mneInputList);
    if (validList.length === mneCount) {
      setBtnClick(false);
    } else {
      setBtnClick(true);
    }
  }, [mneInputList, mneCount]);

  return (
    <StyledPwdContainer>
      <BackView onClickBack={onClickPre} />
      <StyledPwdContentContainer>
        <StyledProcessTitle>
          {i18n.t("restoreWallet")}
          <StyledRowSwitch onClick={onSwitch}>
            {i18n.t("mneTip", { count: mneCount == 12 ? 24 : 12 })}
          </StyledRowSwitch>
        </StyledProcessTitle>

        <StyledMneTip>{i18n.t("inputSeed")}</StyledMneTip>
        <StyledTopMneContainer>
          {mneInputList.map((mne, index) => {
            return (
              <MneItemV2
                key={index}
                useInput={true}
                colorStatus={true}
                index={index}
                mne={mne}
                onChange={onChangeMneItem}
                onPaste={handlePaste}
              />
            );
          })}
        </StyledTopMneContainer>
        <StyledBottomMneContainer>
          {similarWordList.map((similarWord, index) => {
            return (
              <MneItemSelectedV2
                key={index}
                mne={similarWord}
                index={index}
                onClick={() => onClickSimilarWord(similarWord)}
              />
            );
          })}
        </StyledBottomMneContainer>
      </StyledPwdContentContainer>
      <StyledBottomContainer>
        <Button disable={btnClick} loading={btnLoading} onClick={goToCreate}>
          {i18n.t("next")}
        </Button>
      </StyledBottomContainer>
    </StyledPwdContainer>
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
const MneItemSelectedV2 = ({ mne, onClick = () => {} }) => {
  return (
    <StyledSelectedContainer onClick={onClick}>
      <StyledSelectedItem>{mne}</StyledSelectedItem>
    </StyledSelectedContainer>
  );
};
