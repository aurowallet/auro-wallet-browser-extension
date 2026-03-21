import i18n from "i18next";
import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CustomView from "../../component/CustomView";
import IOSSwitch from "../../component/Switch";
import { getDebugLogEnabled, setDebugLogEnabled } from "../../../utils/runtimeLog";
import { t as vt } from "./vaultDebugI18n";
import {
  StyledContainer,
  StyledRowContainer,
  StyledRowTitle,
  StyledRowLeft,
  StyledRowContent,
} from "./index.styled";

const DevPage = () => {

  const navigate = useNavigate();
  const [debugLogEnabled, setDebugLogEnabledState] = useState(false);

  useEffect(() => {
    getDebugLogEnabled().then(setDebugLogEnabledState);
  }, []);

  const handleDebugLogToggle = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const enabled = e.target.checked;
    setDebugLogEnabledState(enabled);
    try {
      await setDebugLogEnabled(enabled);
    } catch {
      setDebugLogEnabledState(!enabled);
    }
  }, []);

  const goToPage = useCallback((nextRoute: string, { pageType, title }: { pageType?: string; title?: string }) => {
    navigate(nextRoute, { state: { pageType, title } });
  }, [navigate]);

  return (
    <CustomView title={"Auro Dev"} ContentWrapper={StyledContainer}>
      <RowItem
        title={i18n.t("history")}
        onClickItem={() => {
          goToPage("/dev_detail_page", {
            pageType: "transaction",
            title: i18n.t("history"),
          });
        }}
      />
      <RowItem
        title={i18n.t("pendingTx")}
        onClickItem={() => {
          goToPage("/dev_detail_page", {
            pageType: "pendingTx",
            title: i18n.t("pendingTx"),
          });
        }}
      />
      <RowItem
        title={"zkApp-" + i18n.t("pendingTx")}
        onClickItem={() => {
          goToPage("/dev_detail_page", {
            pageType: "pendingZkTx",
            title: "zkApp-" + i18n.t("pendingTx"),
          });
        }}
      />
      <RowItem
        title={i18n.t("tokens")}
        onClickItem={() => {
          goToPage("/dev_detail_page", {
            pageType: "balance",
            title: i18n.t("tokens"),
          });
        }}
      />
      <StyledRowContainer>
        <div>
          <StyledRowTitle>{vt("debugLoggingTitle")}</StyledRowTitle>
        </div>
        <StyledRowLeft>
          <IOSSwitch
            isChecked={String(debugLogEnabled)}
            toggleSwitch={handleDebugLogToggle}
          />
        </StyledRowLeft>
      </StyledRowContainer>
      {process.env.NODE_ENV === 'development' && (
        <RowItem
          title={"Vault debug"}
          onClickItem={() => {
            goToPage("/vault_debug", {});
          }}
        />
      )}
    </CustomView>
  );
};

const RowItem = ({ title = "", content = "", onClickItem = () => {} }) => {
  return (
    <StyledRowContainer onClick={onClickItem}>
      <div>
        <StyledRowTitle>{title}</StyledRowTitle>
      </div>
      <StyledRowLeft>
        <StyledRowContent>{content}</StyledRowContent>
        <img src="/img/icon_arrow.svg" />
      </StyledRowLeft>
    </StyledRowContainer>
  );
};

export default DevPage;
