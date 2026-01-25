import i18n from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useStore";
import type { AccountInfo } from "../../types/account";
import { useNavigate, useLocation } from "react-router-dom";
import {
  DAPP_CHANGE_CONNECTING_ADDRESS,
  WALLET_IMPORT_HD_ACCOUNT,
} from "../../../constant/msgTypes";
import { updateCurrentAccount } from "../../../reducers/accountReducer";
import { sendMsg } from "../../../utils/commonMsg";
import Button from "../../component/Button";
import CustomView from "../../component/CustomView";
import TextArea from "../../component/TextArea";
import Toast from "../../component/Toast";
import {
  StyledTitle,
  StyledTextAreaContainer,
  StyledDesc,
  StyledPlaceholder,
  StyledBottomContainer,
} from "./index.styled";

const ImportAccount = () => {
  const currentAddress = useAppSelector(
    (state) => state.accountInfo.currentAccount.address
  );

  const [inputValue, setInputValue] = useState("");
  const [btnStatus, setBtnStatus] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const dispatch = useAppDispatch();
  const accountName = useMemo(() => {
    return location?.state?.accountName ?? "";
  }, [location]);

  const onInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let privateKey = e.target.value;
    setInputValue(privateKey);
  }, []);
  useEffect(() => {
    if (inputValue.length > 0) {
      setBtnStatus(true);
    } else {
      setBtnStatus(false);
    }
  }, [inputValue]);
  const onConfirm = useCallback(() => {
    setLoading(true);

    sendMsg(
      {
        action: WALLET_IMPORT_HD_ACCOUNT,
        payload: {
          privateKey: inputValue.replace(/[\r\n]/g, ""),
          accountName: accountName,
        },
      },
      (account: AccountInfo & { error?: string; type?: string }) => {
        setLoading(false);
        if (account.error) {
          if (account.type === "local") {
            Toast.info(i18n.t(account.error));
          } else {
            Toast.info(account.error);
          }
          return;
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
          setTimeout(() => {
            if (window.history.length >= 5) {
              navigate(-4);
            } else {
              navigate("/");
            }
          }, 50);
        }
      }
    );
  }, [inputValue, accountName, history, currentAddress]);
  return (
    <CustomView title={i18n.t("importPrivateKey")}>
      <StyledTitle>{i18n.t("pleaseInputPriKey")}</StyledTitle>
      <StyledTextAreaContainer>
        <TextArea onChange={onInput} value={inputValue} />
      </StyledTextAreaContainer>
      <StyledDesc>{i18n.t("importAccount_3")}</StyledDesc>
      <StyledDesc>{i18n.t("importAccount_2")}</StyledDesc>
      <StyledPlaceholder />
      <StyledBottomContainer>
        <Button disable={!btnStatus} loading={loading} onClick={onConfirm}>
          {i18n.t("confirm")}
        </Button>
      </StyledBottomContainer>
    </CustomView>
  );
};

export default ImportAccount;
