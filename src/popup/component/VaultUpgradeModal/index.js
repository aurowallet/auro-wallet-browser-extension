import i18n from "i18next";
import styled from "styled-components";
import { PopupModalV2 } from "../PopupModalV2";

const StyledContent = styled.p`
  font-size: 14px;
  line-height: 20px;
  color: rgba(0, 0, 0, 0.5);
  text-align: center;
  margin: 0;
`;

const StyledLoadingWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  
  img {
    width: 48px;
    height: 48px;
    margin-bottom: 16px;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

export const VaultUpgradeModal = ({
  modalVisible = false,
  onClose = () => {},
  onUpgrade = () => {},
  upgradeStatus = "idle", // idle, loading, failed
}) => {
  if (!modalVisible) return null;

  const isLoading = upgradeStatus === "loading";
  const isFailed = upgradeStatus === "failed";

  // Failed state - single button modal
  if (isFailed) {
    return (
      <PopupModalV2
        modalVisible={true}
        modalTopIcon="/img/icon_error.svg"
        title={i18n.t("vaultUpgradeFailed")}
        componentContent={
          <StyledContent>
            {i18n.t("vaultUpgradeFailedDesc")}
          </StyledContent>
        }
        leftBtnContent=""
        rightBtnContent={i18n.t("iUnderstand")}
        onLeftBtnClick={() => {}}
        onRightBtnClick={onClose}
      />
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <PopupModalV2
        modalVisible={true}
        title={i18n.t("upgrading")}
        componentContent={
          <StyledLoadingWrapper>
            <img src="/img/detail_pending.svg" alt="loading" />
            <StyledContent>
              {i18n.t("upgradingDesc")}
            </StyledContent>
          </StyledLoadingWrapper>
        }
        leftBtnContent=""
        rightBtnContent={i18n.t("upgrading")}
        onLeftBtnClick={() => {}}
        onRightBtnClick={() => {}}
      />
    );
  }

  // Idle state - two button modal
  return (
    <PopupModalV2
      modalVisible={true}
      modalTopIcon="/img/icon_remind.svg"
      title={i18n.t("vaultUpgradeTitle")}
      componentContent={
        <StyledContent>
          {i18n.t("vaultUpgradeNeededDesc")}
        </StyledContent>
      }
      leftBtnContent={i18n.t("cancel")}
      rightBtnContent={i18n.t("upgrade")}
      onLeftBtnClick={onClose}
      onRightBtnClick={onUpgrade}
    />
  );
};

export default VaultUpgradeModal;
