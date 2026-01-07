import { useMemo, useCallback } from "react";
import styled from "styled-components";
import i18n from "i18next";
import Toast from "@/popup/component/Toast";
import {
  analyzeTransaction,
  RISK_LEVEL,
  RISK_TYPES,
  getRiskDescriptionKey,
  getRiskSpecificDetails,
} from "@/utils/transactionAnalysis";
import { addressSlice } from "@/utils/utils";
import { copyText } from "@/utils/browserUtils";

const StyledContainer = styled.div`
  margin-top: 10px;
  border-radius: 8px;
  overflow: hidden;
`;

const StyledSection = styled.div`
  margin-bottom: 10px;
  border-radius: 8px;
  border: 0.5px solid rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const StyledSectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: ${(props) =>
    props.$hasHighRisk
      ? "rgba(220, 53, 69, 0.1)"
      : props.$hasMediumRisk
      ? "rgba(255, 193, 7, 0.1)"
      : "rgba(40, 167, 69, 0.05)"};
  cursor: pointer;
`;

const StyledSectionTitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${(props) =>
    props.$hasHighRisk
      ? "#dc3545"
      : props.$hasMediumRisk
      ? "#856404"
      : "rgba(0, 0, 0, 0.8)"};
  display: flex;
  align-items: center;
  gap: 6px;
`;

const StyledBadge = styled.span`
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 10px;
  background: ${(props) =>
    props.$level === RISK_LEVEL.HIGH
      ? "#dc3545"
      : props.$level === RISK_LEVEL.MEDIUM
      ? "#ffc107"
      : "#28a745"};
  color: ${(props) => (props.$level === RISK_LEVEL.MEDIUM ? "#856404" : "#fff")};
`;

const StyledRiskList = styled.div`
  padding: 8px 12px;
  background: #fff;
`;

const StyledRiskItem = styled.div`
  padding: 8px 0;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.05);
  &:last-child {
    border-bottom: none;
  }
`;

const StyledRiskHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
`;

const StyledRiskIcon = styled.span`
  font-size: 14px;
`;

const StyledRiskType = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: ${(props) =>
    props.$level === RISK_LEVEL.HIGH
      ? "#dc3545"
      : props.$level === RISK_LEVEL.MEDIUM
      ? "#856404"
      : "rgba(0, 0, 0, 0.8)"};
`;

const StyledRiskDescription = styled.p`
  font-size: 11px;
  color: rgba(0, 0, 0, 0.6);
  margin: 0;
  line-height: 1.4;
`;

const StyledRiskDetails = styled.div`
  font-size: 10px;
  color: rgba(0, 0, 0, 0.5);
  margin-top: 4px;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 4px;
`;

const StyledPermissionTag = styled.span`
  display: inline-block;
  font-size: 9px;
  padding: 1px 4px;
  margin: 2px 2px 2px 0;
  border-radius: 3px;
  background: ${(props) =>
    props.$isDangerous ? "rgba(220, 53, 69, 0.1)" : "rgba(0, 0, 0, 0.05)"};
  color: ${(props) => (props.$isDangerous ? "#dc3545" : "rgba(0, 0, 0, 0.6)")};
`;

const StyledCopyableAddress = styled.span`
  cursor: pointer;
  font-size: 10px;
  color: rgba(0, 0, 0, 0.5);
  margin-left: 4px;
`;

const StyledImpactWarning = styled.div`
  font-size: 10px;
  color: #dc3545;
  margin-top: 4px;
  padding: 4px 8px;
  background: rgba(220, 53, 69, 0.08);
  border-radius: 4px;
  border-left: 2px solid #dc3545;
`;

const StyledAffectedAccount = styled.span`
  font-size: 10px;
  color: rgba(0, 0, 0, 0.5);
  margin-left: 4px;
`;

const StyledTokenFlowSection = styled.div`
  padding: 10px 12px;
  background: #fff;
`;

const StyledTokenFlowItem = styled.div`
  padding: 8px 0;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.05);
  &:last-child {
    border-bottom: none;
  }
`;

const StyledTokenSymbol = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.8);
  margin-bottom: 6px;
`;

const StyledFlowRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  padding: 2px 0;
`;

const StyledFlowLabel = styled.span`
  color: rgba(0, 0, 0, 0.5);
`;

const StyledFlowValue = styled.span`
  color: ${(props) =>
    props.$isPositive
      ? "#28a745"
      : props.$isNegative
      ? "#dc3545"
      : "rgba(0, 0, 0, 0.8)"};
  font-weight: ${(props) => (props.$isNet ? "600" : "400")};
`;

const TransactionAnalysis = ({ zkappCommand, currentAddress, showMediumRisk = true }) => {
  const handleCopyAddress = useCallback((address) => {
    copyText(address).then(() => {
      Toast.info(i18n.t("copySuccess"));
    });
  }, []);
  
  const analysis = useMemo(() => {
    if (!zkappCommand || !currentAddress) {
      return null;
    }
    try {
      return analyzeTransaction(zkappCommand, currentAddress);
    } catch (error) {
      console.error("Transaction analysis error:", error);
      return null;
    }
  }, [zkappCommand, currentAddress]);

  if (!analysis) {
    return null;
  }

  const { risks, tokenFlow } = analysis;
  const hasHighRisks = risks.summary.highRiskCount > 0;
  const hasMediumRisks = risks.summary.mediumRiskCount > 0;
  
  const filteredRisks = showMediumRisk
    ? risks.risks
    : risks.risks.filter((r) => r.level === RISK_LEVEL.HIGH);
  const hasRisks = filteredRisks.length > 0;
  
  const hasFundsLockedRisk = (risk) => {
    if (!risk.details?.dangerousPermissions) return false;
    return risk.details.dangerousPermissions.some(
      (p) => p.permission === "send" || p.permission === "access"
    );
  };

  const getRiskIcon = (level) => {
    switch (level) {
      case RISK_LEVEL.HIGH:
        return "⚠️";
      case RISK_LEVEL.MEDIUM:
        return "⚡";
      default:
        return "ℹ️";
    }
  };

  const getRiskLevelText = (level) => {
    switch (level) {
      case RISK_LEVEL.HIGH:
        return i18n.t("riskLevelHigh");
      case RISK_LEVEL.MEDIUM:
        return i18n.t("riskLevelMedium");
      default:
        return i18n.t("riskLevelLow");
    }
  };

  return (
    <StyledContainer>
      {/* Risk Analysis Section - Only show when risks exist */}
      {hasRisks && (
        <StyledSection>
          <StyledSectionHeader
            $hasHighRisk={hasHighRisks}
            $hasMediumRisk={hasMediumRisks && !hasHighRisks}
          >
            <StyledSectionTitle
              $hasHighRisk={hasHighRisks}
              $hasMediumRisk={hasMediumRisks && !hasHighRisks}
            >
              {hasHighRisks ? "⚠️" : "⚡"} {i18n.t("transactionRisks")}
            </StyledSectionTitle>
            <StyledBadge $level={risks.summary.overallLevel}>
              {hasHighRisks
                ? i18n.t("highRisksDetected", {
                    count: risks.summary.highRiskCount,
                  })
                : i18n.t("risksDetected", { count: risks.summary.totalRisks })}
            </StyledBadge>
          </StyledSectionHeader>

          <StyledRiskList>
            {filteredRisks.map((risk, index) => {
              const specificDetails = getRiskSpecificDetails(risk);
              return (
                <StyledRiskItem key={`risk-${index}`}>
                  <StyledRiskHeader>
                    <StyledRiskIcon>{getRiskIcon(risk.level)}</StyledRiskIcon>
                    <StyledRiskType $level={risk.level}>
                      {getRiskLevelText(risk.level)}
                    </StyledRiskType>
                    {risk.address && (
                      <StyledCopyableAddress
                        onClick={() => handleCopyAddress(risk.address)}
                        title={risk.address}
                      >
                        - {addressSlice(risk.address, 6)}
                      </StyledCopyableAddress>
                    )}
                  </StyledRiskHeader>
                  <StyledRiskDescription>
                    {i18n.t(getRiskDescriptionKey(risk.type))}
                  </StyledRiskDescription>
                  
                  {/* Show specific risk details */}
                  {specificDetails.affectedPermissions.length > 0 && (
                    <StyledRiskDetails>
                      {i18n.t("affectedPermissions")}:
                      {specificDetails.affectedPermissions.map((perm, idx) => (
                        <StyledPermissionTag key={idx} $isDangerous>
                          {perm}: Impossible
                        </StyledPermissionTag>
                      ))}
                    </StyledRiskDetails>
                  )}
                  
                  {specificDetails.changedPermissions.length > 0 &&
                    specificDetails.affectedPermissions.length === 0 && (
                      <StyledRiskDetails>
                        {i18n.t("changedPermissions")}:
                        {specificDetails.changedPermissions.map((perm, idx) => (
                          <StyledPermissionTag key={idx}>
                            {perm.key}: {perm.value}
                          </StyledPermissionTag>
                        ))}
                      </StyledRiskDetails>
                    )}
                  
                  {specificDetails.newDelegate && (
                    <StyledRiskDetails>
                      {i18n.t("newDelegate")}:{" "}
                      <StyledCopyableAddress
                        onClick={() => handleCopyAddress(specificDetails.newDelegate)}
                        title={specificDetails.newDelegate}
                      >
                        {addressSlice(specificDetails.newDelegate, 8)}
                      </StyledCopyableAddress>
                    </StyledRiskDetails>
                  )}
                  
                  {/* Show impact warning for funds locked */}
                  {hasFundsLockedRisk(risk) && (
                    <StyledImpactWarning>
                      ⚠️ {i18n.t("fundsLockedPermanently")}
                    </StyledImpactWarning>
                  )}
                </StyledRiskItem>
              );
            })}
          </StyledRiskList>
        </StyledSection>
      )}

      {/* Token Flow Section */}
      {tokenFlow.flows.length > 0 && (
        <StyledSection>
          <StyledSectionHeader>
            <StyledSectionTitle>
              💰 {i18n.t("tokenFlowSummary")}
            </StyledSectionTitle>
          </StyledSectionHeader>

          <StyledTokenFlowSection>
            {tokenFlow.flows.map((flow, index) => (
              <StyledTokenFlowItem key={`flow-${index}`}>
                <StyledTokenSymbol>
                  {flow.symbol}
                  {!flow.isMainToken && (
                    <StyledAffectedAccount>
                      ({addressSlice(flow.tokenId, 4)})
                    </StyledAffectedAccount>
                  )}
                </StyledTokenSymbol>

                {/* Show current account flows if any */}
                {flow.hasCurrentAccountFlow && (
                  <>
                    <StyledFlowRow>
                      <StyledFlowLabel>{i18n.t("totalReceive")}:</StyledFlowLabel>
                      <StyledFlowValue $isPositive>
                        +{flow.receive.formatted} {flow.symbol}
                      </StyledFlowValue>
                    </StyledFlowRow>

                    <StyledFlowRow>
                      <StyledFlowLabel>{i18n.t("totalSend")}:</StyledFlowLabel>
                      <StyledFlowValue $isNegative>
                        -{flow.send.formatted} {flow.symbol}
                      </StyledFlowValue>
                    </StyledFlowRow>

                    {flow.fee && (
                      <StyledFlowRow>
                        <StyledFlowLabel>{i18n.t("txFee")}:</StyledFlowLabel>
                        <StyledFlowValue $isNegative>
                          -{flow.fee.formatted} {flow.symbol}
                        </StyledFlowValue>
                      </StyledFlowRow>
                    )}

                    <StyledFlowRow>
                      <StyledFlowLabel>{i18n.t("netFlow")}:</StyledFlowLabel>
                      <StyledFlowValue
                        $isPositive={flow.net.isPositive}
                        $isNegative={!flow.net.isPositive}
                        $isNet
                      >
                        {flow.net.symbol}
                        {flow.net.formatted} {flow.symbol}
                      </StyledFlowValue>
                    </StyledFlowRow>
                  </>
                )}

                {/* Show other accounts transfers */}
                {flow.hasOtherAccountsFlow && (
                  <>
                    {flow.otherAccountsSend.map((item, idx) => (
                      <StyledFlowRow key={`send-${idx}`}>
                        <StyledFlowLabel>
                          <StyledCopyableAddress
                            onClick={() => handleCopyAddress(item.address)}
                            title={item.address}
                          >
                            {addressSlice(item.address, 6)}
                          </StyledCopyableAddress>
                          {" "}{i18n.t("sends")}:
                        </StyledFlowLabel>
                        <StyledFlowValue $isNegative>
                          -{item.formatted} {flow.symbol}
                        </StyledFlowValue>
                      </StyledFlowRow>
                    ))}
                    {flow.otherAccountsReceive.map((item, idx) => (
                      <StyledFlowRow key={`receive-${idx}`}>
                        <StyledFlowLabel>
                          <StyledCopyableAddress
                            onClick={() => handleCopyAddress(item.address)}
                            title={item.address}
                          >
                            {addressSlice(item.address, 6)}
                          </StyledCopyableAddress>
                          {" "}{i18n.t("receives")}:
                        </StyledFlowLabel>
                        <StyledFlowValue $isPositive>
                          +{item.formatted} {flow.symbol}
                        </StyledFlowValue>
                      </StyledFlowRow>
                    ))}
                  </>
                )}
              </StyledTokenFlowItem>
            ))}
          </StyledTokenFlowSection>
        </StyledSection>
      )}
    </StyledContainer>
  );
};

export default TransactionAnalysis;
