import i18n from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Trans } from "react-i18next";
import { useAppDispatch, useAppSelector } from "@/hooks/useStore";
import type { InputChangeEvent } from "../../types/common";
import type { AccountInfo } from "../../types/account";
import { LEDGER_PAGE_TYPE, LEDGER_STATUS } from "../../../constant/commonType";
import {
  ACCOUNT_ACTIONS,
  DAPP_CHANGE_CONNECTING_ADDRESS,
  GET_LEDGER_ACCOUNT_NUMBER,
  GET_WALLET_LOCK_STATUS,
  WALLET_IMPORT_LEDGER,
} from "../../../constant/msgTypes";
import { updateCurrentAccount } from "../../../reducers/accountReducer";
import { openTab, sendMsg } from "../../../utils/commonMsg";
import ledgerManager from "../../../utils/ledger";
import { getQueryStringArgs } from "../../../utils/utils";
import Button from "../../component/Button";
import Input from "../../component/Input";
import ProcessLayout from "../../component/ProcessLayout";
import StepTabs from "../../component/StepTabs";
import { CreateResultView } from "../CreateProcessPage/CreateResultView";
import { LedgerModal } from "./LedgerModal";
import {
  StyledOuterContainer,
  StyledInnerContainer,
  StyledInnerContent,
  StyledViewTip,
  StyledLedgerIcon,
  StyledStartDesc,
  StyledStepContainer,
  StyledStepNumber,
  StyledStepContent,
  StyledStepContentLight,
  StyledAccountWarningTip,
  StyledAccountNameTip,
  StyledClickIntro,
  StyledInputContainer,
  StyledLedgerContainer,
  StyledLedgerPath,
  StyledInputNumberContainer,
  StyledCustomInput,
  StyledImgContainer,
  StyledTopArrow,
  StyledBottomArrow,
} from "./index.styled";

const Tip_Type = {
  init: "init",
  openLedger: "openLedger",
  openLedgerApp: "openLedgerApp",
  openLockStatus: "openLockStatus",

  grantSuccess: "grantSuccess",
};
export const LedgerPage = ({ onClickPre }: { onClickPre?: () => void }) => {

  const [tabIndex, setTabIndex] = useState(0);
  const [tipType, setTipType] = useState(Tip_Type.init);
  const [isShowSuccessTip, setIsShowSuccessTip] = useState(false);

  const { isLedgerPermission } = useMemo(() => {
    const url = window.location?.href || "";
    const params = getQueryStringArgs(url);
    const ledgerPageType = params.ledgerPageType || "";
    const isLedgerPermission =
      ledgerPageType === LEDGER_PAGE_TYPE.permissionGrant;
    return {
      isLedgerPermission,
    };
  }, []);
  const onClickNextTab = useCallback(() => {
    setTabIndex((state) => state + 1);
  }, []);

  const getWalletLockStatus = useCallback(() => {
    return new Promise((resolve) => {
      sendMsg(
        {
          action: GET_WALLET_LOCK_STATUS,
        },
        (lockStatus) => {
          resolve(lockStatus);
        }
      );
    });
  }, []);

  const onClickConnect = useCallback(() => {
    if (isShowSuccessTip) {
      window.close();
      return;
    }
    setTipType(Tip_Type.init);
    getWalletLockStatus().then((ok) => {
      if (!ok) {
        setTipType(Tip_Type.openLockStatus);
        return;
      }

      ledgerManager.requestConnect().then(({ status }) => {
        if (status === LEDGER_STATUS.READY) {
          if (!isLedgerPermission) onClickNextTab();
          if (isLedgerPermission) {
            setIsShowSuccessTip(true);
            setTipType(Tip_Type.grantSuccess);
          }
        } else if (status === LEDGER_STATUS.LEDGER_CONNECT_APP_NOT_OPEN) {
          setTipType(Tip_Type.openLedgerApp);
        } else {
          setTipType(Tip_Type.openLedger);
        }
      });
    });
  }, [isShowSuccessTip, isLedgerPermission, onClickNextTab]);
  const onClickImport = useCallback(() => {
    onClickNextTab();
  }, []);
  const onClickDone = useCallback(() => {
    window.close();
  }, []);
  const tipContent = useMemo(() => {
    let msg = "";
    switch (tipType) {
      case Tip_Type.openLedger:
        msg = i18n.t("ledgerConnectTip");
        break;
      case Tip_Type.openLedgerApp:
        msg = i18n.t("ledgerConnectOpenTip");
        break;
      case Tip_Type.openLockStatus:
        msg = i18n.t("auroLocked");
        break;
      case Tip_Type.grantSuccess:
        msg = i18n.t("grantSuccess");
        break;
      default:
        break;
    }
    return msg;
  }, [tipType, i18n]);
 
  return (
    <StyledOuterContainer>
      <StyledInnerContainer>
        <StepTabs selected={tabIndex} children={[
          <StyledInnerContent key={1} id={"1"}>
            <LedgerConnectView
              isLedgerPermission={isLedgerPermission}
              onClickNext={onClickConnect}
              onClickPre={onClickPre}
              tipContent={tipContent}
              isShowSuccessTip={isShowSuccessTip}
            />
          </StyledInnerContent>,
          !isLedgerPermission && (
            <StyledInnerContent key={2} id={2 as any}>
              <AccountNameView
                onClickNext={onClickImport}
                onClickPre={onClickPre}
                tipContent={tipContent}
                onClickConnect={onClickConnect}
              />
            </StyledInnerContent>
          ),
          !isLedgerPermission && (
            <StyledInnerContent key={3} id={3 as any}>
              <CreateResultView
                onClickDone={onClickDone}
                contents={[i18n.t("ledgerSuccess"), i18n.t("returnEx")]}
                showFollowUs={false}
                showExtTip={false}
              />
            </StyledInnerContent>
          )
        ] as any} />
      </StyledInnerContainer>
    </StyledOuterContainer>
  );
};

interface LedgerConnectViewProps {
  onClickNext?: () => void;
  onClickPre?: () => void;
  tipContent?: string;
  isShowSuccessTip?: boolean;
  isLedgerPermission?: boolean;
}

const LedgerConnectView = ({
  onClickNext,
  onClickPre,
  tipContent,
  isShowSuccessTip,
  isLedgerPermission,
}: LedgerConnectViewProps) => {
  const viewTitle = useMemo(() => {
    const title = isLedgerPermission ? "grantLedger" : "connectHardwareWallet";
    return i18n.t(title);
  }, [isLedgerPermission, i18n]);
  const btnTxt = useMemo(() => {
    const txt = isShowSuccessTip ? "done" : "next";
    return i18n.t(txt);
  }, [isShowSuccessTip, i18n]);
  return (
    <ProcessLayout
      onClickBack={onClickPre}
      title={viewTitle}
      bottomContent={
        <>
          {tipContent && (
            <StyledAccountWarningTip $success={isShowSuccessTip}>
              {tipContent}
            </StyledAccountWarningTip>
          )}
          <Button onClick={onClickNext}>{btnTxt}</Button>
        </>
      }
    >
      <StyledViewTip>{i18n.t("selectHardware")}</StyledViewTip>
      <StyledLedgerIcon src="/img/ledgerBorderLogo.svg" />
      <StyledViewTip>{i18n.t("getStarted")}</StyledViewTip>
      <StyledStartDesc>{i18n.t("ledgerStartDesc")}</StyledStartDesc>

      <StyledStepContainer>
        <StyledStepNumber>1</StyledStepNumber>
        <StyledStepContent>{i18n.t("ledgerConnect_1")}</StyledStepContent>
      </StyledStepContainer>
      <StyledStepContainer>
        <StyledStepNumber>2</StyledStepNumber>
        <StyledStepContent>
          <Trans
            i18nKey={"ledgerConnect_2"}
            components={{
              b: <StyledStepContentLight />,
            }}
          />
        </StyledStepContent>
      </StyledStepContainer>
    </ProcessLayout>
  );
};
interface AccountNameViewProps {
  onClickNext?: () => void;
  onClickPre?: () => void;
  tipContent?: string;
  onClickConnect?: () => void;
}

const AccountNameView = ({
  onClickNext,
  onClickPre,
  tipContent,
  onClickConnect,
}: AccountNameViewProps) => {
  const currentAddress = useAppSelector(
    (state) => state.accountInfo.currentAccount?.address
  );

  const [nextAccountIndex, setNextAccountIndex] = useState(0);
  const getLedgerAccountNumber = useCallback(() => {
    sendMsg(
      {
        action: GET_LEDGER_ACCOUNT_NUMBER,
      },
      (count: number) => {
        setNextAccountIndex(count + 1);
      }
    );
  }, []);
  useEffect(() => {
    getLedgerAccountNumber();
  }, []);

  const [accountIndex, setAccountIndex] = useState<string | number>("");
  const placeholderText = useMemo(() => {
    return "Ledger " + nextAccountIndex;
  }, [nextAccountIndex]);
  const [accountName, setAccountName] = useState("");

  const [tipModalVisible, setTipModalVisible] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  useEffect(() => {
    setErrorMsg(tipContent || '');
  }, [tipContent]);

  const dispatch = useAppDispatch();

  const onConfirm = useCallback(async () => {
    let nextIndex: number = typeof accountIndex === 'string' ? parseInt(accountIndex) || 0 : accountIndex;
    if (nextIndex <= 0) {
      nextIndex = 0;
    }
    const { status } = await ledgerManager.ensureConnect();

    if (status !== LEDGER_STATUS.READY) {
      setErrorMsg(i18n.t("pleaseOpenInLedger"));
      return;
    }
    setTipModalVisible(true);
    try {
      const { publicKey, rejected } = await ledgerManager.getAddress(nextIndex) as { publicKey?: string; rejected?: boolean };
      setTipModalVisible(false);
      if (rejected || !publicKey) {
        setErrorMsg(
          rejected ? i18n.t("ledgerRejected") : "Failed to get address"
        );
        return;
      }
      sendMsg(
        {
          action: WALLET_IMPORT_LEDGER,
          payload: {
            address: publicKey,
            accountIndex: nextIndex,
            accountName: accountName || placeholderText,
          },
        },
        (res: AccountInfo & { error?: string; type?: string }) => {
          if (res.error) {
            if (res.error) {
              if (res.type === "local") {
                setErrorMsg(i18n.t(res.error));
              } else {
                setErrorMsg(res.error);
              }
            }
          } else {
            sendMsg(
              {
                action: DAPP_CHANGE_CONNECTING_ADDRESS,
                payload: {
                  address: currentAddress,
                  currentAddress: res.address,
                },
              },
              () => {}
            );
            dispatch(updateCurrentAccount(res));
            sendMsg({
              action: ACCOUNT_ACTIONS.REFRESH_CURRENT_ACCOUNT,
              payload: { address: res.address },
            });
            onClickNext && onClickNext();
          }
        }
      );
    } catch (err) {
      setErrorMsg("Connection lost");
    }
  }, [accountIndex, accountName, placeholderText, onClickNext, currentAddress]);
  const onNameInput = useCallback((e: InputChangeEvent) => {
    let value = e.target.value;
    if (value.length <= 16) {
      setAccountName(e.target.value);
    }
  }, []);

  const onAccountIndexChange = useCallback((e: InputChangeEvent) => {
    let value = e.target.value;
    value = value.replace(/[^\d]/g, "");
    let nextAccountIndex = parseFloat(value);
    if (nextAccountIndex < 0 || !value) {
      nextAccountIndex = 0;
    }
    setAccountIndex(nextAccountIndex);
  }, []);

  const onAdd = useCallback(() => {
    let nextIndex = typeof accountIndex === 'string' ? parseInt(accountIndex) || 0 : accountIndex;
    if (nextIndex <= 0) {
      nextIndex = 0;
    }
    setAccountIndex(nextIndex + 1);
  }, [accountIndex]);
  const onMinus = useCallback(() => {
    const currentIndex = typeof accountIndex === 'string' ? parseInt(accountIndex) || 0 : accountIndex;
    if (currentIndex <= 0) {
      setAccountIndex(0);
      return;
    }
    setAccountIndex(currentIndex - 1);
  }, [accountIndex]);
  return (
    <ProcessLayout
      onClickBack={onClickPre}
      title={i18n.t("accountName")}
      bottomContent={
        <>
          {errorMsg && (
            <StyledAccountWarningTip>{errorMsg}</StyledAccountWarningTip>
          )}
          <Button onClick={onConfirm}>{i18n.t("import")}</Button>
        </>
      }
    >
      <StyledViewTip>{i18n.t("inputAccountName")}</StyledViewTip>
      <StyledInputContainer>
        <Input
          onChange={onNameInput}
          value={accountName}
          inputType={"text"}
          placeholder={placeholderText}
        />
      </StyledInputContainer>
      <StyledViewTip style={{ marginTop: "20px" }}>
        {i18n.t("selectHDPath")}
      </StyledViewTip>
      <StyledAccountNameTip>
        <Trans
          i18nKey={"ledgerSelectPathTip"}
          components={{
            click: (
              <StyledClickIntro
                onClick={() =>
                  openTab(
                    "https://www.ledger.com/academy/crypto/what-are-hierarchical-deterministic-hd-wallets"
                  )
                }
              />
            ),
          }}
        />
      </StyledAccountNameTip>
      <LedgerAdvance
        value={accountIndex}
        onChange={onAccountIndexChange}
        onAdd={onAdd}
        onMinus={onMinus}
      />
      <LedgerModal modalVisible={tipModalVisible} />
    </ProcessLayout>
  );
};

interface LedgerAdvanceProps {
  value?: string | number;
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
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
        placeholder="0"
      />
      <StyledImgContainer>
        <StyledTopArrow src="/img/icon_fold_Default.svg" onClick={onAdd} />
        <StyledBottomArrow src="/img/icon_fold_Default.svg" onClick={onMinus} />
      </StyledImgContainer>
    </StyledInputNumberContainer>
  );
};

