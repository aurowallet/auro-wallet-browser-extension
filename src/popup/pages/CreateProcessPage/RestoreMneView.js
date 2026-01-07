import { validateMnemonic } from "@/background/accountService";
import {
  WALLET_IMPORT_HD_ACCOUNT,
  WALLET_IMPORT_KEY_STORE,
  WALLET_NEW_HD_ACCOUNT,
} from "@/constant/msgTypes";
import Button from "@/popup/component/Button";
import Input from "@/popup/component/Input";
import { MneItemV2 } from "@/popup/component/MneItem";
import { PopupModal } from "@/popup/component/PopupModal";
import ProcessLayout from "@/popup/component/ProcessLayout";
import Toast from "@/popup/component/Toast";
import { updateCurrentAccount } from "@/reducers/accountReducer";
import {
  ENTRY_WITCH_ROUTE,
  updateEntryWitchRoute,
} from "@/reducers/entryRouteReducer";
import { sendMsg } from "@/utils/commonMsg";
import { addressSlice, checkValidStrInList } from "@/utils/utils";
import { wordlist } from "@scure/bip39/wordlists/english";
import i18n from "i18next";
import { useCallback, useEffect, useState } from "react";
import { Trans } from "react-i18next";
import { useDispatch } from "react-redux";
import styled from "styled-components";

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
const StyledTabWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
  flex-shrink: 0;
`;

const StyledTabContainer = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 20px;
  padding: 4px;
`;

const StyledTabItem = styled.div`
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  color: ${(props) => (props.$active ? "#fff" : "rgba(0, 0, 0, 0.5)")};
  background: ${(props) => (props.$active ? "#594af1" : "transparent")};
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: ${(props) => (props.$active ? "#fff" : "#594af1")};
  }
`;

const StyledContentWrapper = styled.div`
  width: 572px;
  min-width: 572px;
  overflow-y: auto;
`;

const StyledPasswordInputWrapper = styled.div`
  margin-top: 20px;
  max-width: 335px;
`;

const StyledPrivateKeyInput = styled.textarea`
  width: 100%;
  min-width: 540px;
  min-height: 150px;
  padding: 16px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.5;
  resize: none;
  outline: none;
  font-family: inherit;
  box-sizing: border-box;
  margin-top: 20px;

  &:focus {
    border-color: #594af1;
  }

  &::placeholder {
    color: rgba(0, 0, 0, 0.3);
  }
`;

const IMPORT_TAB = {
  WORDS_12: "12words",
  WORDS_24: "24words",
  PRIVATE_KEY: "privateKey",
  KEYSTORE: "keystore",
};

export const RestoreMneView = ({
  onClickPre,
  onClickNext,
  onSwitchMneCount,
}) => {
  const [activeTab, setActiveTab] = useState(IMPORT_TAB.WORDS_12);
  const [mneCount, setMenCount] = useState(12);
  const [mneInputList, setMneInputList] = useState(Array(12).fill(""));
  const [similarWordList, setSimilarWordList] = useState([]);
  const [btnLoading, setBtnLoading] = useState(false);
  const [btnClick, setBtnClick] = useState(true);
  const [privateKeyInput, setPrivateKeyInput] = useState("");
  const [keystorePassword, setKeystorePassword] = useState("");
  const [mneInput, setMneInput] = useState({
    word: "",
    index: -1,
  });
  const [duplicateModalVisible, setDuplicateModalVisible] = useState(false);
  const [duplicateAccount, setDuplicateAccount] = useState(null);

  const dispatch = useDispatch();
  const getSimilarWord = useCallback(() => {
    if (mneInput.word.length > 0) {
      let list = wordlist.filter((item) => {
        return item.indexOf(mneInput.word) === 0;
      });
      list = list.slice(0, 10);
      setSimilarWordList(list);
    } else {
      setSimilarWordList([]);
    }
  }, [mneInput]);
  const onTabChange = useCallback(
    (tab) => {
      setActiveTab(tab);
      setSimilarWordList([]);
      setBtnClick(true);

      if (tab === IMPORT_TAB.WORDS_12) {
        setMenCount(12);
        setMneInputList(Array(12).fill(""));
        if (onSwitchMneCount) onSwitchMneCount(false);
      } else if (tab === IMPORT_TAB.WORDS_24) {
        setMenCount(24);
        setMneInputList(Array(24).fill(""));
        if (onSwitchMneCount) onSwitchMneCount(true);
      } else {
        setPrivateKeyInput("");
        setKeystorePassword("");
        if (onSwitchMneCount) onSwitchMneCount(false);
      }
    },
    [onSwitchMneCount]
  );

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

  const handleImportSuccess = useCallback(
    (account) => {
      setBtnLoading(false);
      if (account.error) {
        // Check if it's a duplicate account error with account info
        if (
          (account.error === "addressExists" ||
            account.error === "importRepeat") &&
          account.existingAccount
        ) {
          setDuplicateAccount(account.existingAccount);
          setDuplicateModalVisible(true);
          return;
        }
        if (account.type === "local") {
          Toast.info(i18n.t(account.error));
        } else {
          Toast.info(account.error);
        }
        return;
      }
      dispatch(updateCurrentAccount(account));
      dispatch(updateEntryWitchRoute(ENTRY_WITCH_ROUTE.HOME_PAGE));
      onClickNext();
    },
    [dispatch, onClickNext]
  );

  const onCloseDuplicateModal = useCallback(() => {
    setDuplicateModalVisible(false);
    setDuplicateAccount(null);
  }, []);

  const goToCreate = useCallback(() => {
    const isMnemonic =
      activeTab === IMPORT_TAB.WORDS_12 || activeTab === IMPORT_TAB.WORDS_24;

    if (isMnemonic) {
      // Mnemonic import
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
          payload: { mne: mnemonic },
        },
        handleImportSuccess
      );
    } else if (activeTab === IMPORT_TAB.PRIVATE_KEY) {
      // Private key import
      if (!privateKeyInput.trim()) {
        Toast.info(i18n.t("pleaseInputPriKey"));
        return;
      }
      setBtnLoading(true);
      sendMsg(
        {
          action: WALLET_IMPORT_HD_ACCOUNT,
          payload: {
            privateKey: privateKeyInput.replace(/[\r\n]/g, "").trim(),
            accountName: "",
          },
        },
        handleImportSuccess
      );
    } else if (activeTab === IMPORT_TAB.KEYSTORE) {
      // Keystore import
      if (!privateKeyInput.trim() || !keystorePassword) {
        Toast.info(i18n.t("pleaseInputKeyPair"));
        return;
      }
      setBtnLoading(true);
      sendMsg(
        {
          action: WALLET_IMPORT_KEY_STORE,
          payload: {
            keypair: privateKeyInput.trim(),
            password: keystorePassword,
            accountName: "",
          },
        },
        handleImportSuccess
      );
    }
  }, [
    activeTab,
    mneInputList,
    privateKeyInput,
    keystorePassword,
    handleImportSuccess,
  ]);
  // Button validation for each tab type
  useEffect(() => {
    const isMnemonic =
      activeTab === IMPORT_TAB.WORDS_12 || activeTab === IMPORT_TAB.WORDS_24;

    if (isMnemonic) {
      const validList = checkValidStrInList(mneInputList);
      setBtnClick(validList.length !== mneCount);
    } else if (activeTab === IMPORT_TAB.PRIVATE_KEY) {
      setBtnClick(!privateKeyInput.trim());
    } else if (activeTab === IMPORT_TAB.KEYSTORE) {
      setBtnClick(!privateKeyInput.trim() || !keystorePassword);
    }
  }, [activeTab, mneInputList, mneCount, privateKeyInput, keystorePassword]);

  const isMnemonicTab =
    activeTab === IMPORT_TAB.WORDS_12 || activeTab === IMPORT_TAB.WORDS_24;
  const isPrivateKeyTab = activeTab === IMPORT_TAB.PRIVATE_KEY;
  const isKeystoreTab = activeTab === IMPORT_TAB.KEYSTORE;

  return (
    <ProcessLayout
      onClickBack={onClickPre}
      title={i18n.t("restoreWallet")}
      bottomContent={
        <Button disable={btnClick} loading={btnLoading} onClick={goToCreate}>
          {i18n.t("next")}
        </Button>
      }
    >
      <StyledTabWrapper>
        <StyledTabContainer>
          <StyledTabItem
            $active={activeTab === IMPORT_TAB.WORDS_12}
            onClick={() => onTabChange(IMPORT_TAB.WORDS_12)}
          >
            {i18n.t("words12")}
          </StyledTabItem>
          <StyledTabItem
            $active={activeTab === IMPORT_TAB.WORDS_24}
            onClick={() => onTabChange(IMPORT_TAB.WORDS_24)}
          >
            {i18n.t("words24")}
          </StyledTabItem>
          <StyledTabItem
            $active={activeTab === IMPORT_TAB.PRIVATE_KEY}
            onClick={() => onTabChange(IMPORT_TAB.PRIVATE_KEY)}
          >
            {i18n.t("privateKey")}
          </StyledTabItem>
          <StyledTabItem
            $active={activeTab === IMPORT_TAB.KEYSTORE}
            onClick={() => onTabChange(IMPORT_TAB.KEYSTORE)}
          >
            {i18n.t("keystore")}
          </StyledTabItem>
        </StyledTabContainer>
      </StyledTabWrapper>

      <StyledContentWrapper>
        {isMnemonicTab && (
          <>
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
          </>
        )}

        {isPrivateKeyTab && (
          <>
            <StyledMneTip>
              {i18n.t("inputPrivateKey")}
            </StyledMneTip>
            <StyledPrivateKeyInput
              placeholder={i18n.t("privateKeyPlaceholder")}
              value={privateKeyInput}
              onChange={(e) => setPrivateKeyInput(e.target.value)}
            />
          </>
        )}

        {isKeystoreTab && (
          <>
            <StyledMneTip>
              {i18n.t("inputKeystore")}
            </StyledMneTip>
            <StyledPrivateKeyInput
              placeholder={i18n.t("keystorePlaceholder")}
              value={privateKeyInput}
              onChange={(e) => setPrivateKeyInput(e.target.value)}
            />
            <StyledPasswordInputWrapper>
              <Input
                label={i18n.t("keystorePassword")}
                onChange={(e) => setKeystorePassword(e.target.value)}
                value={keystorePassword}
                inputType="password"
              />
            </StyledPasswordInputWrapper>
          </>
        )}
      </StyledContentWrapper>

      <PopupModal
        title={i18n.t("tips")}
        rightBtnContent={i18n.t("ok")}
        onRightBtnClick={onCloseDuplicateModal}
        componentContent={
          duplicateAccount && (
            <StyledDuplicateTipContainer>
              <p className="tip">{i18n.t("importSameAccount_1")}</p>
              <p className="address">{duplicateAccount.address}</p>
              <Trans
                i18nKey={"importSameAccount_2"}
                values={{ accountName: duplicateAccount.accountName || duplicateAccount.address }}
                components={{
                  b: <span className="accountRepeatName" />,
                  click: <span className="accountRepeatClick" />,
                }}
              />
            </StyledDuplicateTipContainer>
          )
        }
        modalVisible={duplicateModalVisible}
        onCloseModal={onCloseDuplicateModal}
      />
    </ProcessLayout>
  );
};

const StyledDuplicateTipContainer = styled.div`
  text-align: left;
  padding: 0;

  .tip {
    font-size: 14px;
    color: rgba(0, 0, 0, 0.5);
    margin-bottom: 12px;
    line-height: 1.5;
  }
  .address {
    font-size: 14px;
    color: #594af1;
    font-weight: 500;
    margin-bottom: 12px;
    word-break: break-all;
    line-height: 1.5;
  }
  .accountRepeatName {
    color: #594af1;
    font-weight: 500;
  }
  .accountRepeatClick {
    color: #594af1;
    cursor: pointer;
    text-decoration: underline;
  }
`;

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
