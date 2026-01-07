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
        modalTopIcon="/img/unusual.svg"
        title={i18n.t("vaultUpgradeFailed")}
        componentContent={
          <StyledContent>
            {i18n.t("vaultUpgradeFailedDesc")}
          </StyledContent>
        }
        leftBtnContent=""
        rightBtnContent={i18n.t("ok")}
        onLeftBtnClick={() => {}}
        onRightBtnClick={onClose}
      />
    );
  }

  // Idle and Loading state - use same modal with button loading
  return (
    <PopupModalV2
      modalVisible={true}
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
      rightBtnLoading={isLoading}
      btnDisabled={isLoading}
    />
  );
};

export default VaultUpgradeModal;
