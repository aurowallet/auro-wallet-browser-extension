import i18n from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Trans } from "react-i18next";
import { useAppDispatch, useAppSelector } from "@/hooks/useStore";
import type { InputChangeEvent } from "../../types/common";
import type { AccountInfo } from "../../types/account";
import { useNavigate } from "react-router-dom";
import { ACCOUNT_NAME_FROM_TYPE } from "../../../constant/commonType";
import {
  DAPP_CHANGE_CONNECTING_ADDRESS,
  WALLET_CREATE_HD_ACCOUNT,
} from "../../../constant/msgTypes";
import { updateCurrentAccount } from "../../../reducers/accountReducer";
import { sendMsg } from "../../../utils/commonMsg";
import Button from "../../component/Button";
import CustomView from "../../component/CustomView";
import Input from "../../component/Input";
import { PopupModal } from "../../component/PopupModal";
import Toast from "../../component/Toast";
import {
  StyledContainer,
  StyledBottomContainer,
  StyledPlaceholder,
  StyledTipContainer,
  StyledTip,
  StyledAddress,
  StyledAccountRepeatName,
  StyledAccountRepeatClick,
  StyledLedgerContainer,
  StyledLedgerTitle,
  StyledLedgerPath,
  StyledInputNumberContainer,
  StyledCustomInput,
  StyledImgContainer,
  StyledArrow,
  StyledAdvanceEntry,
  StyledAdvanceTitle,
  StyledAdvanceIcon,
} from "./index.styled";

const AccountName = () => {
  const cache = useAppSelector((state) => state.cache);
  const currentAddress = useAppSelector(
    (state) => state.accountInfo.currentAccount.address
  );

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [accountName, setAccountName] = useState("");
  const [reminderModalStatus, setReminderModalStatus] = useState(false);
  const [accountIndex, setAccountIndex] = useState(0);
  const [repeatAccount, setRepeatAccount] = useState<AccountInfo | null>(null);
  const [btnLoadingStatus, setBtnLoadingStatus] = useState(false);
  const [isOpenAdvance, setIsOpenAdvance] = useState(false);

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
  };
  const onNameInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (value.length <= 16) {
      setAccountName(value);
    }
  }, []);

  const { buttonText, placeholderText, fromType, isLedger } = useMemo(() => {
    let buttonText = i18n.t("next");
    let fromType = cache.fromType;

    let accountCount = 1;
    let placeholderText = "";
    let isLedger = false;
    switch (fromType) {
      case ACCOUNT_NAME_FROM_TYPE.OUTSIDE:
      case ACCOUNT_NAME_FROM_TYPE.KEYPAIR:
        placeholderText = "Import Account ";
        accountCount = cache.accountTypeCount.import;
        break;
      case ACCOUNT_NAME_FROM_TYPE.LEDGER:
        placeholderText = "Ledger Account ";
        isLedger = true;
        accountCount = cache.accountTypeCount.ledger;
        break;
      case ACCOUNT_NAME_FROM_TYPE.INSIDE:
      default:
        placeholderText = "Account ";
        buttonText = i18n.t("confirm");
        accountCount = cache.accountTypeCount.create;
        break;
    }
    placeholderText = placeholderText + accountCount;

    return {
      buttonText,
      placeholderText,
      fromType,
      isLedger,
    };
  }, [cache, i18n]);

  const onConfirm = useCallback(async () => {
    let accountText = "";
    if (accountName.length <= 0) {
      accountText = placeholderText;
    } else {
      accountText = accountName;
    }
    if (fromType === ACCOUNT_NAME_FROM_TYPE.OUTSIDE) {
      navigate("/import_account", { state: { accountName: accountText } });
    } else if (fromType === ACCOUNT_NAME_FROM_TYPE.KEYPAIR) {
      navigate("/import_keypair", { state: { accountName: accountText } });
    } else {
      setBtnLoadingStatus(true);
      sendMsg(
        {
          action: WALLET_CREATE_HD_ACCOUNT,
          payload: { accountName: accountText },
        },
        (account: AccountInfo & { error?: string; account?: AccountInfo }) => {
          setBtnLoadingStatus(false);
          if (account.error) {
            if (account.error === "importRepeat") {
              setReminderModalStatus(true);
              setRepeatAccount(account.account ?? null);
            }
          } else {
            sendMsg(
              {
                action: DAPP_CHANGE_CONNECTING_ADDRESS,
                payload: {
                  address: currentAddress,
                  currentAddress: account.address,
                },
              },
              () => {}
            );
            dispatch(updateCurrentAccount(account));
            if (window.history.length >= 3) {
              window.history.go(-2);
            } else {
              navigate("/");
            }
          }
        }
      );
    }
  }, [
    accountName,
    placeholderText,
    fromType,
    accountIndex,
    currentAddress,
  ]);

  const onCloseModal = useCallback(() => {
    setReminderModalStatus(false);
  }, []);

  const onAccountIndexChange = useCallback((e: InputChangeEvent) => {
    let value = e.target.value;
    value = value.replace(/[^\d]/g, "");
    let accountIndex = parseFloat(value);
    if (accountIndex < 0) {
      accountIndex = 0;
    }
    setAccountIndex(accountIndex);
  }, []);

  const onAdd = useCallback(() => {
    setAccountIndex(accountIndex + 1);
  }, [accountIndex]);
  const onMinus = useCallback(() => {
    if (accountIndex <= 0) {
      return;
    }
    setAccountIndex(accountIndex - 1);
  }, [accountIndex]);

  const onClickAdvance = useCallback(() => {
    setIsOpenAdvance((state) => !state);
  }, []);

  return (
    <CustomView title={i18n.t("accountName")}>
      <StyledContainer onSubmit={onSubmit}>
        <div>
          <Input
            label={i18n.t("inputAccountName")}
            onChange={onNameInput}
            value={accountName}
            inputType={"text"}
            placeholder={placeholderText}
          />
        </div>
        {isLedger && (
          <StyledAdvanceEntry onClick={onClickAdvance}>
            <StyledAdvanceTitle>{i18n.t("advanceMode")}</StyledAdvanceTitle>
            <StyledAdvanceIcon
              $open={isOpenAdvance}
              src="/img/icon_unfold_Default.svg"
            />
          </StyledAdvanceEntry>
        )}
        {isLedger && isOpenAdvance && (
          <LedgerAdvance
            value={accountIndex}
            onChange={onAccountIndexChange}
            onAdd={onAdd}
            onMinus={onMinus}
          />
        )}
        <StyledPlaceholder />
        <StyledBottomContainer>
          <Button loading={btnLoadingStatus} onClick={onConfirm}>
            {buttonText}
          </Button>
        </StyledBottomContainer>
      </StyledContainer>
      <PopupModal
        title={i18n.t("tips")}
        rightBtnContent={i18n.t("ok")}
        onRightBtnClick={onCloseModal}
        componentContent={
          <StyledTipContainer>
            <StyledTip>{i18n.t("importSameAccount_1")}</StyledTip>
            <StyledAddress>{repeatAccount?.address}</StyledAddress>
            <Trans
              i18nKey={"importSameAccount_2"}
              values={{ accountName: repeatAccount?.accountName }}
              components={{
                b: <StyledAccountRepeatName />,
                click: <StyledAccountRepeatClick />,
              }}
            />
          </StyledTipContainer>
        }
        modalVisible={reminderModalStatus}
      />
    </CustomView>
  );
};

interface LedgerAdvanceProps {
  value: number;
  onChange?: (e: InputChangeEvent) => void;
  onAdd?: () => void;
  onMinus?: () => void;
}

const LedgerAdvance = ({
  value,
  onChange = () => {},
  onAdd = () => {},
  onMinus = () => {},
}: LedgerAdvanceProps) => {
  return (
    <StyledLedgerContainer>
      <StyledLedgerTitle>{i18n.t("hdDerivedPath")}</StyledLedgerTitle>
      <StyledLedgerPath>
        m / 44' / 12586' /
        <InputNumber
          value={value}
          onChange={onChange}
          onAdd={onAdd}
          onMinus={onMinus}
        />
        ' / 0 / 0
      </StyledLedgerPath>
    </StyledLedgerContainer>
  );
};

interface InputNumberProps {
  value: number;
  onChange?: (e: InputChangeEvent) => void;
  onAdd?: () => void;
  onMinus?: () => void;
}

const InputNumber = ({
  value,
  onChange = () => {},
  onAdd = () => {},
  onMinus = () => {},
}: InputNumberProps) => {
  return (
    <StyledInputNumberContainer>
      <StyledCustomInput
        type="number"
        min="0"
        step="1"
        onChange={onChange}
        value={value}
      />
      <StyledImgContainer>
        <StyledArrow
          src="/img/icon_fold_Default.svg"
          onClick={onAdd}
        />
        <StyledArrow
          src="/img/icon_fold_Default.svg"
          $rotate
          onClick={onMinus}
        />
      </StyledImgContainer>
    </StyledInputNumberContainer>
  );
};

export default AccountName;
