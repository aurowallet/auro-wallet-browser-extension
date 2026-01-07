/**
 * Vault Debug Tool
 * 
 * Development-only tool for visualizing vault data before/after migration.
 * Uses 'keyringData' as the single storage key for both v1 (array) and v2 (object with version=2).
 * Features: decrypt/display, manual upgrade with backup/rollback, plaintext toggle, simulation test.
 */

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import browser from "webextension-polyfill";
import Button, { button_size, button_theme } from "../../component/Button";
import Input from "../../component/Input";
import Toast from "../../component/Toast";
import { LoadingView } from "../Wallet/component/StatusView";

// Import vault utilities
import {
  migrateToV2,
  normalizeVault,
  validateVault,
} from "../../../background/vaultMigration";
import { isLegacyVault, isV2Vault, VAULT_VERSION } from "../../../constant/vaultTypes";

const encryptUtils = require("../../../utils/encryptUtils").default;

// Import i18n from separate file
import { t } from "./vaultDebugI18n";

// Storage keys
const STORAGE_KEY = {
  KEYRING_DATA: "keyringData",
  BACKUP: "keyringData_backup",
};

// ============================================
// Styled Components
// ============================================

const WidePageWrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: white;
  z-index: 9999;
  overflow: hidden;
`;

const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
`;

const LoadingText = styled.p`
  margin-top: 16px;
  color: #666;
  font-size: 14px;
`;

const PageHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid #eee;
  margin-bottom: 16px;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  color: #594af1;
  font-size: 14px;
  
  &:hover {
    opacity: 0.8;
  }
`;

const PageTitle = styled.h1`
  font-size: 20px;
  font-weight: 600;
  color: #000;
  margin: 0;
`;

const Container = styled.div`
  padding: 20px 40px 100px;
  overflow-y: auto;
  height: 100vh;
  max-width: 1200px;
  margin: 0 auto;
`;

const Title = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: #000;
  margin: 16px 0 8px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const VersionBadge = styled.span`
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  background: ${props => props.$isV2 ? '#52c41a' : '#faad14'};
  color: white;
`;

const Section = styled.div`
  margin-bottom: 20px;
`;

const SectionTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin: 12px 0 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid #eee;
`;

const CodeBlock = styled.pre`
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 12px;
  font-size: 12px;
  font-family: 'Monaco', 'Consolas', monospace;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 300px;
  overflow-y: auto;
  margin: 0;
  position: relative;
`;

const CodeBlockWrapper = styled.div`
  position: relative;
  margin: 8px 0;
`;

const CopyButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 8px;
  font-size: 11px;
  background: #594af1;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  opacity: 0.8;
  
  &:hover {
    opacity: 1;
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const KeyringCard = styled.div`
  background: #fafafa;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
`;

const KeyringHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
`;

const KeyringType = styled.span`
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  background: ${props => {
    switch(props.$type) {
      case 'hd': return '#1890ff';
      case 'imported': return '#722ed1';
      case 'ledger': return '#13c2c2';
      case 'watch': return '#faad14';
      default: return '#999';
    }
  }};
  color: white;
  text-transform: uppercase;
`;

const AccountItem = styled.div`
  background: white;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  padding: 8px;
  margin: 4px 0;
  font-size: 11px;
`;

const Label = styled.span`
  font-weight: 600;
  color: #666;
`;

const Value = styled.span`
  color: #333;
  word-break: break-all;
`;

const SensitiveValue = styled.span`
  color: ${props => props.$visible ? '#ff4d4f' : '#999'};
  font-family: monospace;
  background: ${props => props.$visible ? '#fff1f0' : '#f5f5f5'};
  padding: 2px 4px;
  border-radius: 2px;
`;

const CheckboxContainer = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 13px;
  color: #666;
  margin: 12px 0;
`;

const Checkbox = styled.input`
  width: 16px;
  height: 16px;
  cursor: pointer;
`;

const WarningText = styled.p`
  color: #ff4d4f;
  font-size: 12px;
  margin: 4px 0;
`;

const InfoText = styled.p`
  color: #1890ff;
  font-size: 12px;
  margin: 4px 0;
`;

const SuccessText = styled.p`
  color: #52c41a;
  font-size: 12px;
  margin: 4px 0;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 12px;
  margin: 16px 0;
`;

const ErrorBox = styled.div`
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 4px;
  padding: 12px;
  margin: 12px 0;
  color: #ff4d4f;
  font-size: 12px;
`;

const StatusRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px 0;
  font-size: 13px;
`;

const StatusDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.$active ? '#52c41a' : '#d9d9d9'};
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: 12px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 11px;
  resize: vertical;
  margin: 8px 0;
  
  &:focus {
    outline: none;
    border-color: #594af1;
  }
`;

const TwoColumnLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const Column = styled.div`
  min-width: 0;
`;

const CompareBox = styled.div`
  background: ${props => props.$type === 'before' ? '#fff7e6' : '#f6ffed'};
  border: 1px solid ${props => props.$type === 'before' ? '#ffd591' : '#b7eb8f'};
  border-radius: 8px;
  padding: 12px;
  margin: 8px 0;
`;

const CompareTitle = styled.h4`
  font-size: 13px;
  font-weight: 600;
  color: ${props => props.$type === 'before' ? '#d46b08' : '#389e0d'};
  margin: 0 0 8px;
`;

// ============================================
// Main Component
// ============================================

const VaultDebug = () => {
  const navigate = useNavigate();
  
  // Storage states
  const [rawKeyringData, setRawKeyringData] = useState(null);
  const [hasBackup, setHasBackup] = useState(false);
  const [hasOldVaultKey, setHasOldVaultKey] = useState(false);
  
  // Decrypted states
  const [decryptedData, setDecryptedData] = useState(null);
  const [password, setPassword] = useState("");
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptError, setDecryptError] = useState("");
  
  // UI states
  const [showPlaintext, setShowPlaintext] = useState(false);
  const [plaintextData, setPlaintextData] = useState({});
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeResult, setUpgradeResult] = useState(null);
  const [processingText, setProcessingText] = useState("");
  const [isDecryptingPlaintext, setIsDecryptingPlaintext] = useState(false);
  
  // Version detection
  const [currentVersion, setCurrentVersion] = useState(null); // 'v1' | 'v2' | null
  const [isLoading, setIsLoading] = useState(true);
  
  // Simulation test states
  const [inputOldData, setInputOldData] = useState("");
  const [simulationResult, setSimulationResult] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [applyToStorage, setApplyToStorage] = useState(true);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [simulationBefore, setSimulationBefore] = useState(null);
  const [simulationAfter, setSimulationAfter] = useState(null);
  
  const isProcessing = isDecrypting || isUpgrading || isSimulating || isDecryptingPlaintext;

  // ============================================
  // Load storage data on mount
  // ============================================
  
  useEffect(() => {
    loadStorageData();
  }, []);

  const loadStorageData = async () => {
    setIsLoading(true);
    try {
      const result = await browser.storage.local.get([
        STORAGE_KEY.KEYRING_DATA, 
        STORAGE_KEY.BACKUP,
        'vault'
      ]);
      
      setRawKeyringData(result[STORAGE_KEY.KEYRING_DATA] || null);
      setHasBackup(!!result[STORAGE_KEY.BACKUP]);
      setHasOldVaultKey(!!result['vault']);
      
      if (result[STORAGE_KEY.KEYRING_DATA]) {
        setCurrentVersion('unknown'); // Will be confirmed after decryption
      } else {
        setCurrentVersion(null);
      }
    } catch (error) {
      console.error('[VaultDebug] Failed to load storage:', error);
      Toast.info(t('loadFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // Decrypt vault data
  // ============================================

  const handleDecrypt = useCallback(async () => {
    if (!password) {
      setDecryptError(t('passwordRequired'));
      return;
    }

    setIsDecrypting(true);
    setProcessingText(t('decrypting'));
    setDecryptError("");
    setDecryptedData(null);
    setPlaintextData({});

    try {
      if (!rawKeyringData) {
        setDecryptError(t('noKeyringData'));
        return;
      }

      const decrypted = await encryptUtils.decrypt(password, rawKeyringData);
      
      if (isV2Vault(decrypted)) {
        setCurrentVersion('v2');
        setDecryptedData(decrypted);
      } else if (isLegacyVault(decrypted)) {
        setCurrentVersion('v1');
        setDecryptedData(decrypted);
      } else {
        setCurrentVersion('unknown');
        setDecryptedData(decrypted);
      }

      Toast.info(t('decryptSuccess'));
    } catch (error) {
      console.error('[VaultDebug] Decrypt error:', error);
      setDecryptError(t('passwordError'));
    } finally {
      setIsDecrypting(false);
    }
  }, [password, rawKeyringData]);

  // ============================================
  // Decrypt sensitive fields for plaintext view
  // ============================================

  const decryptSensitiveField = useCallback(async (encryptedValue, fieldKey) => {
    if (!password || !encryptedValue) return null;
    
    try {
      const decrypted = await encryptUtils.decrypt(password, encryptedValue);
      setPlaintextData(prev => ({ ...prev, [fieldKey]: decrypted }));
      return decrypted;
    } catch (error) {
      console.error('[VaultDebug] Failed to decrypt field:', fieldKey, error);
      return t('decryptFailed');
    }
  }, [password]);

  // When showPlaintext is toggled on, decrypt all sensitive fields
  useEffect(() => {
    if (showPlaintext && decryptedData && password) {
      decryptAllSensitiveFields();
    } else {
      setPlaintextData({});
    }
  }, [showPlaintext, decryptedData, password]);

  const decryptAllSensitiveFields = async () => {
    if (!decryptedData || !password) return;

    setIsDecryptingPlaintext(true);
    setProcessingText(t('decryptingPlaintext'));
    
    const newPlaintextData = {};

    if (currentVersion === 'v2') {
      // V2 structure
      for (const keyring of decryptedData.keyrings || []) {
        if (keyring.mnemonic) {
          try {
            newPlaintextData[`mnemonic_${keyring.id}`] = await encryptUtils.decrypt(password, keyring.mnemonic);
          } catch (e) {
            newPlaintextData[`mnemonic_${keyring.id}`] = t('decryptFailed');
          }
        }
        for (const account of keyring.accounts || []) {
          if (account.privateKey) {
            try {
              newPlaintextData[`pk_${account.address}`] = await encryptUtils.decrypt(password, account.privateKey);
            } catch (e) {
              newPlaintextData[`pk_${account.address}`] = t('decryptFailed');
            }
          }
        }
      }
    } else if (currentVersion === 'v1') {
      // V1 structure (array)
      for (let i = 0; i < decryptedData.length; i++) {
        const wallet = decryptedData[i];
        if (wallet.mnemonic) {
          try {
            newPlaintextData[`mnemonic_${i}`] = await encryptUtils.decrypt(password, wallet.mnemonic);
          } catch (e) {
            newPlaintextData[`mnemonic_${i}`] = t('decryptFailed');
          }
        }
        for (const account of wallet.accounts || []) {
          if (account.privateKey) {
            try {
              newPlaintextData[`pk_${account.address}`] = await encryptUtils.decrypt(password, account.privateKey);
            } catch (e) {
              newPlaintextData[`pk_${account.address}`] = t('decryptFailed');
            }
          }
        }
      }
    }

    setPlaintextData(newPlaintextData);
    setIsDecryptingPlaintext(false);
  };

  // ============================================
  // Upgrade to V2 (with backup and rollback)
  // ============================================

  const handleUpgrade = useCallback(async () => {
    if (!password) {
      Toast.info(t('passwordRequired'));
      return;
    }

    if (currentVersion === 'v2') {
      Toast.info(t('alreadyV2'));
      return;
    }

    if (!isLegacyVault(decryptedData)) {
      Toast.info(t('cannotUpgrade'));
      return;
    }

    setIsUpgrading(true);
    setProcessingText(t('upgrading'));
    setUpgradeResult(null);

    try {
      // Step 1: Create backup
      setProcessingText(t('creatingBackup'));
      await browser.storage.local.set({ [STORAGE_KEY.BACKUP]: rawKeyringData });
      setHasBackup(true);

      // Step 2: Execute migration
      const { vault: v2Vault, migrated } = normalizeVault(decryptedData);
      
      if (!migrated) {
        throw new Error(t('alreadyNewFormat'));
      }

      // Step 3: Validate migrated data
      const validation = validateVault(v2Vault);
      if (!validation.valid) {
        throw new Error(t('validationFailed') + ': ' + validation.errors.join(', '));
      }

      // Step 4: Verify account count
      const originalCount = decryptedData.reduce((sum, w) => sum + (w.accounts?.length || 0), 0);
      const migratedCount = v2Vault.keyrings.reduce((sum, kr) => sum + kr.accounts.length, 0);
      if (originalCount !== migratedCount) {
        throw new Error(t('accountCountMismatch') + `: ${originalCount} vs ${migratedCount}`);
      }

      // Step 5: Re-encrypt and save
      const encryptedV2 = await encryptUtils.encrypt(password, v2Vault);
      await browser.storage.local.set({ [STORAGE_KEY.KEYRING_DATA]: encryptedV2 });

      setUpgradeResult({ success: true, message: t('upgradeSuccess') });
      Toast.info(t('upgradeSuccess'));
      
      // Reload data
      await loadStorageData();
      setDecryptedData(v2Vault);
      setCurrentVersion('v2');

    } catch (error) {
      console.error('[VaultDebug] Upgrade error:', error);
      
      // Rollback from backup
      try {
        const backupResult = await browser.storage.local.get(STORAGE_KEY.BACKUP);
        if (backupResult[STORAGE_KEY.BACKUP]) {
          await browser.storage.local.set({ [STORAGE_KEY.KEYRING_DATA]: backupResult[STORAGE_KEY.BACKUP] });
          // Delete backup after successful rollback
          await browser.storage.local.remove(STORAGE_KEY.BACKUP);
          setHasBackup(false);
          console.log('[VaultDebug] Rolled back from backup, backup deleted');
          setUpgradeResult({ 
            success: false, 
            message: error.message,
            rolledBack: true,
          });
          Toast.info(t('rollbackSuccess'));
          await loadStorageData();
        } else {
          setUpgradeResult({ success: false, message: error.message });
          Toast.info(t('upgradeFailed') + ': ' + error.message);
        }
      } catch (rollbackError) {
        console.error('[VaultDebug] Rollback failed:', rollbackError);
        setUpgradeResult({ 
          success: false, 
          message: t('upgradeAndRollbackFailed') + `: ${error.message}`,
          critical: true,
        });
        Toast.info(t('rollbackFailed'));
      }
    } finally {
      setIsUpgrading(false);
    }
  }, [password, currentVersion, decryptedData, rawKeyringData]);

  // ============================================
  // Simulation upgrade test
  // ============================================

  const handleSimulateUpgrade = useCallback(async () => {
    if (!password) {
      Toast.info(t('passwordRequired'));
      return;
    }

    if (!inputOldData.trim()) {
      Toast.info(t('inputRequired'));
      return;
    }

    setIsSimulating(true);
    setProcessingText(t('simulating'));
    setSimulationResult(null);
    setSimulationBefore(null);
    setSimulationAfter(null);

    try {
      // Step 1: Decrypt input data
      setProcessingText(t('decryptingInput'));
      let decrypted;
      try {
        decrypted = await encryptUtils.decrypt(password, inputOldData.trim());
      } catch (e) {
        throw new Error(t('inputDecryptFailed'));
      }

      // Step 2: Verify legacy format
      if (!isLegacyVault(decrypted)) {
        if (isV2Vault(decrypted)) {
          throw new Error(t('inputAlreadyV2'));
        }
        throw new Error(t('inputUnknownFormat'));
      }

      setSimulationBefore(decrypted);

      // Step 3: Simulate failure test
      if (simulateFailure) {
        throw new Error(t('simulateFailureTriggered'));
      }

      // Step 4: Execute migration
      const v2Vault = migrateToV2(decrypted);

      // Step 5: Validate
      const validation = validateVault(v2Vault);
      if (!validation.valid) {
        throw new Error(t('validationFailed') + ': ' + validation.errors.join(', '));
      }

      setSimulationAfter(v2Vault);

      // Step 6: Apply to storage if checked
      if (applyToStorage) {
        // Backup current data first
        if (rawKeyringData) {
          await browser.storage.local.set({ [STORAGE_KEY.BACKUP]: rawKeyringData });
        }
        
        // Save migrated data
        const encryptedV2 = await encryptUtils.encrypt(password, v2Vault);
        await browser.storage.local.set({ [STORAGE_KEY.KEYRING_DATA]: encryptedV2 });
        
        setSimulationResult({ 
          success: true, 
          message: t('simulationSuccessApplied'),
          applied: true,
        });
        Toast.info(t('upgradeSuccess'));
        await loadStorageData();
        setDecryptedData(v2Vault);
        setCurrentVersion('v2');
      } else {
        setSimulationResult({ 
          success: true, 
          message: t('simulationSuccessNotApplied'),
          applied: false,
        });
        Toast.info(t('simulationComplete'));
      }

    } catch (error) {
      console.error('[VaultDebug] Simulation error:', error);
      setSimulationResult({ success: false, message: error.message });
      setSimulationBefore(null);
      setSimulationAfter(null);
      Toast.info(t('upgradeFailed') + ': ' + error.message);
    } finally {
      setIsSimulating(false);
    }
  }, [password, inputOldData, applyToStorage, rawKeyringData, simulateFailure]);

  // ============================================
  // Apply simulation result to storage
  // ============================================

  const handleApplySimulationToStorage = useCallback(async () => {
    if (!simulationAfter || !password) {
      Toast.info(t('noData'));
      return;
    }

    setIsSimulating(true);
    setProcessingText(t('upgrading'));

    try {
      // backup current data
      if (rawKeyringData) {
        await browser.storage.local.set({ [STORAGE_KEY.BACKUP]: rawKeyringData });
        setHasBackup(true);
      }
      
      // save migrate data
      const encryptedV2 = await encryptUtils.encrypt(password, simulationAfter);
      await browser.storage.local.set({ [STORAGE_KEY.KEYRING_DATA]: encryptedV2 });
      
      setSimulationResult({ 
        success: true, 
        message: t('applySuccessMessage'),
        applied: true,
      });
      Toast.info(t('upgradeSuccess'));
      await loadStorageData();
      setDecryptedData(simulationAfter);
      setCurrentVersion('v2');
    } catch (error) {
      console.error('[VaultDebug] Apply to storage error:', error);
      Toast.info(t('upgradeFailed') + ': ' + error.message);
    } finally {
      setIsSimulating(false);
    }
  }, [simulationAfter, password, rawKeyringData]);

  // ============================================
  // Copy to clipboard
  // ============================================

  const copyToClipboard = useCallback((text) => {
    navigator.clipboard.writeText(text).then(() => {
      Toast.info(t('copied'));
    }).catch(err => {
      console.error('Copy failed:', err);
      Toast.info(t('upgradeFailed'));
    });
  }, []);


  // ============================================
  // Restore from backup
  // ============================================

  const handleRestoreFromBackup = useCallback(async () => {
    try {
      const backupResult = await browser.storage.local.get(STORAGE_KEY.BACKUP);
      if (!backupResult[STORAGE_KEY.BACKUP]) {
        Toast.info(t('noBackupData'));
        return;
      }

      await browser.storage.local.set({ 
        [STORAGE_KEY.KEYRING_DATA]: backupResult[STORAGE_KEY.BACKUP] 
      });
      
      Toast.info(t('rollbackSuccess'));
      await loadStorageData();
      
      // Re-decrypt and display
      if (password) {
        const decrypted = await encryptUtils.decrypt(password, backupResult[STORAGE_KEY.BACKUP]);
        setDecryptedData(decrypted);
        setCurrentVersion(isV2Vault(decrypted) ? 'v2' : isLegacyVault(decrypted) ? 'v1' : 'unknown');
      }
    } catch (error) {
      console.error('[VaultDebug] Restore error:', error);
      Toast.info(t('rollbackFailed') + ': ' + error.message);
    }
  }, [password]);

  // ============================================
  // Cleanup redundant storage keys
  // ============================================

  const handleCleanupBackup = useCallback(async () => {
    try {
      await browser.storage.local.remove(STORAGE_KEY.BACKUP);
      setHasBackup(false);
      Toast.info(t('rollbackSuccess'));
    } catch (error) {
      console.error('[VaultDebug] Cleanup backup error:', error);
      Toast.info(t('upgradeFailed') + ': ' + error.message);
    }
  }, []);

  const handleCleanupOldVaultKey = useCallback(async () => {
    try {
      await browser.storage.local.remove('vault');
      setHasOldVaultKey(false);
      Toast.info(t('rollbackSuccess'));
    } catch (error) {
      console.error('[VaultDebug] Cleanup vault key error:', error);
      Toast.info(t('upgradeFailed') + ': ' + error.message);
    }
  }, []);

  // ============================================
  // Render helpers
  // ============================================

  const renderSensitiveValue = (value, fieldKey, label = 'encrypted') => {
    if (!value) return <Value>-</Value>;
    
    if (showPlaintext && plaintextData[fieldKey]) {
      return (
        <SensitiveValue $visible={true}>
          {plaintextData[fieldKey]}
        </SensitiveValue>
      );
    }
    
    return <SensitiveValue $visible={false}>[{label}]</SensitiveValue>;
  };

  const renderV2Structure = (vault) => {
    if (!vault || !vault.keyrings) return null;

    const validation = validateVault(vault);

    return (
      <Section>
        <SectionTitle>{t('v2VaultStructure')}</SectionTitle>
        
        {/* Copy buttons */}
        <ButtonRow>
          <Button
            size={button_size.small}
            theme={button_theme.BUTTON_THEME_LIGHT}
            onClick={() => copyToClipboard(JSON.stringify(vault, null, 2), t('copyV2Json'))}
          >
            {t('copyV2Json')}
          </Button>
          {rawKeyringData && (
            <Button
              size={button_size.small}
              theme={button_theme.BUTTON_THEME_LIGHT}
              onClick={() => copyToClipboard(
                typeof rawKeyringData === 'string' ? rawKeyringData : JSON.stringify(rawKeyringData),
                t('copyV2Encrypted')
              )}
            >
              {t('copyV2Encrypted')}
            </Button>
          )}
        </ButtonRow>
        
        <StatusRow>
          <Label>{t('version')}:</Label>
          <Value>{vault.version}</Value>
          <VersionBadge $isV2={true}>V2</VersionBadge>
        </StatusRow>
        
        <StatusRow>
          <Label>{t('currentKeyringId')}:</Label>
          <Value style={{ fontSize: '10px' }}>{vault.currentKeyringId || '-'}</Value>
        </StatusRow>

        <StatusRow>
          <Label>{t('validationStatus')}:</Label>
          {validation.valid ? (
            <SuccessText>✓ {t('structureValid')}</SuccessText>
          ) : (
            <WarningText>✗ {validation.errors.join(', ')}</WarningText>
          )}
        </StatusRow>

        <SectionTitle>Keyrings ({vault.keyrings.length})</SectionTitle>
        
        {vault.keyrings.map((keyring, idx) => (
          <KeyringCard key={keyring.id || idx}>
            <KeyringHeader>
              <KeyringType $type={keyring.type}>{keyring.type}</KeyringType>
              <Value style={{ fontWeight: 600 }}>{keyring.name}</Value>
            </KeyringHeader>
            
            <div style={{ fontSize: '10px', color: '#999', marginBottom: '8px' }}>
              ID: {keyring.id}
            </div>

            {keyring.type === 'hd' && (
              <>
                <StatusRow>
                  <Label>Mnemonic:</Label>
                  {renderSensitiveValue(keyring.mnemonic, `mnemonic_${keyring.id}`, t('mnemonicEncrypted'))}
                </StatusRow>
                <StatusRow>
                  <Label>Next HD Index:</Label>
                  <Value>{keyring.nextHdIndex}</Value>
                </StatusRow>
              </>
            )}

            <StatusRow>
              <Label>Current Address:</Label>
              <Value style={{ fontSize: '10px' }}>{keyring.currentAddress || '-'}</Value>
            </StatusRow>

            <div style={{ marginTop: '8px' }}>
              <Label>Accounts ({keyring.accounts?.length || 0}):</Label>
              {keyring.accounts?.map((account, accIdx) => (
                <AccountItem key={account.address || accIdx}>
                  <div><Label>{t('address')}:</Label> <Value style={{ fontSize: '10px' }}>{account.address}</Value></div>
                  <div><Label>{t('name')}:</Label> <Value>{account.name}</Value></div>
                  
                  {keyring.type === 'hd' && (
                    <>
                      <div><Label>HD Index:</Label> <Value>{account.hdIndex}</Value></div>
                      <InfoText>💡 {t('hdDerivedNote')}</InfoText>
                    </>
                  )}
                  
                  {keyring.type === 'imported' && (
                    <div>
                      <Label>Private Key:</Label>{' '}
                      {renderSensitiveValue(account.privateKey, `pk_${account.address}`, t('privateKeyEncrypted'))}
                    </div>
                  )}
                  
                  {keyring.type === 'ledger' && (
                    <div><Label>HD Path Index:</Label> <Value>{account.hdIndex}</Value></div>
                  )}
                </AccountItem>
              ))}
            </div>
          </KeyringCard>
        ))}
      </Section>
    );
  };

  const renderV1Structure = (data) => {
    if (!Array.isArray(data)) return null;

    return (
      <Section>
        <SectionTitle>{t('v1VaultStructure')}</SectionTitle>
        <VersionBadge $isV2={false}>V1</VersionBadge>
        
        {/* Copy buttons */}
        <ButtonRow>
          <Button
            size={button_size.small}
            theme={button_theme.BUTTON_THEME_LIGHT}
            onClick={() => copyToClipboard(JSON.stringify(data, null, 2), t('copyV1Json'))}
          >
            {t('copyV1Json')}
          </Button>
          {rawKeyringData && (
            <Button
              size={button_size.small}
              theme={button_theme.BUTTON_THEME_LIGHT}
              onClick={() => copyToClipboard(
                typeof rawKeyringData === 'string' ? rawKeyringData : JSON.stringify(rawKeyringData),
                t('copyV1Json')
              )}
            >
              {t('copyV1Json')}
            </Button>
          )}
        </ButtonRow>
        
        {data.map((wallet, walletIdx) => (
          <KeyringCard key={walletIdx}>
            <KeyringHeader>
              <Value style={{ fontWeight: 600 }}>Wallet {walletIdx + 1}</Value>
            </KeyringHeader>

            <StatusRow>
              <Label>Mnemonic:</Label>
              {renderSensitiveValue(wallet.mnemonic, `mnemonic_${walletIdx}`, t('mnemonicEncrypted'))}
            </StatusRow>

            <StatusRow>
              <Label>Current Address:</Label>
              <Value style={{ fontSize: '10px' }}>{wallet.currentAddress || '-'}</Value>
            </StatusRow>

            <div style={{ marginTop: '8px' }}>
              <Label>Accounts ({wallet.accounts?.length || 0}):</Label>
              {wallet.accounts?.map((account, accIdx) => (
                <AccountItem key={account.address || accIdx}>
                  <div><Label>{t('address')}:</Label> <Value style={{ fontSize: '10px' }}>{account.address}</Value></div>
                  <div><Label>{t('name')}:</Label> <Value>{account.accountName}</Value></div>
                  <div><Label>{t('type')}:</Label> <Value>{account.type}</Value></div>
                  {account.hdPath !== undefined && (
                    <div><Label>HD Path:</Label> <Value>{account.hdPath}</Value></div>
                  )}
                  {account.privateKey && (
                    <div>
                      <Label>Private Key:</Label>{' '}
                      {renderSensitiveValue(account.privateKey, `pk_${account.address}`, t('privateKeyEncrypted'))}
                    </div>
                  )}
                </AccountItem>
              ))}
            </div>
          </KeyringCard>
        ))}
      </Section>
    );
  };

  // ============================================
  // Main render
  // ============================================

  if (isLoading) {
    return (
      <WidePageWrapper>
        <Container>
          <Title>{t('title')}</Title>
          <LoadingView />
        </Container>
      </WidePageWrapper>
    );
  }

  return (
    <WidePageWrapper>
      {/* Processing Loading Overlay */}
      {isProcessing && (
        <LoadingOverlay>
          <LoadingView />
          <LoadingText>{processingText}</LoadingText>
        </LoadingOverlay>
      )}
      
      <Container>
        {/* Page Header with Back Button */}
        <PageHeader>
          <BackButton onClick={() => navigate(-1)}>
            ← {t('back')}
          </BackButton>
          <PageTitle>{t('title')}</PageTitle>
        </PageHeader>

        {/* Version Status */}
        <Title>
          {t('currentStatus')}
          {currentVersion === 'v2' && <VersionBadge $isV2={true}>{t('v2NewStructure')}</VersionBadge>}
          {currentVersion === 'v1' && <VersionBadge $isV2={false}>{t('v1OldStructure')}</VersionBadge>}
          {currentVersion === 'unknown' && <VersionBadge $isV2={false}>{t('pending')}</VersionBadge>}
          {!currentVersion && <VersionBadge $isV2={false}>{t('noDataShort')}</VersionBadge>}
        </Title>

        <StatusRow>
          <StatusDot $active={!!rawKeyringData} />
          <span>keyringData: {rawKeyringData ? t('keyringDataExists') : t('keyringDataNotExists')}</span>
        </StatusRow>
        <StatusRow>
          <StatusDot $active={hasBackup} />
          <span>keyringData_backup: {hasBackup ? t('backupExistsCleanable') : t('backupNotExists')}</span>
        </StatusRow>
        {hasOldVaultKey && (
          <StatusRow>
            <StatusDot $active={true} />
            <span style={{ color: '#ff4d4f' }}>⚠️ {t('redundantKeyWarning')}</span>
          </StatusRow>
        )}

        {/* Storage management buttons */}
        {(hasBackup || hasOldVaultKey) && (
          <ButtonRow>
            {hasBackup && (
              <>
                <Button
                  size={button_size.small}
                  theme={button_theme.BUTTON_THEME_LIGHT}
                  onClick={handleRestoreFromBackup}
                >
                  {t('restoreFromBackup')}
                </Button>
                <Button
                  size={button_size.small}
                  theme={button_theme.BUTTON_THEME_LIGHT}
                  onClick={handleCleanupBackup}
                >
                  🗑️ {t('cleanupBackup')}
                </Button>
              </>
            )}
            {hasOldVaultKey && (
              <Button
                size={button_size.small}
                theme={button_theme.BUTTON_THEME_LIGHT}
                onClick={handleCleanupOldVaultKey}
              >
                🗑️ {t('cleanupRedundantKey')}
              </Button>
            )}
          </ButtonRow>
        )}

        {/* Raw Storage Data */}
        <Section>
          <SectionTitle>{t('rawStorageData')}</SectionTitle>
          
          {rawKeyringData && (
            <>
              <Label>keyringData:</Label>
              <CodeBlockWrapper>
                <CodeBlock>
                  {typeof rawKeyringData === 'string' 
                    ? rawKeyringData.substring(0, 500) + (rawKeyringData.length > 500 ? '...' : '')
                    : JSON.stringify(rawKeyringData, null, 2).substring(0, 500)}
                </CodeBlock>
                <CopyButton onClick={() => copyToClipboard(
                  typeof rawKeyringData === 'string' ? rawKeyringData : JSON.stringify(rawKeyringData)
                )}>
                  {t('copyFullCiphertext')}
                </CopyButton>
              </CodeBlockWrapper>
            </>
          )}

          {!rawKeyringData && (
            <InfoText>{t('noKeyringData')}</InfoText>
          )}
        </Section>

        {/* Password Input & Decrypt */}
        <Section>
          <SectionTitle>{t('decryptData')}</SectionTitle>
          
          <Input
            label={t('walletPassword')}
            inputType="password"
            placeholder={t('enterPasswordToDecrypt')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            handleBtnClick={handleDecrypt}
          />
          
          <ButtonRow>
            <Button
              size={button_size.middle}
              onClick={handleDecrypt}
              loading={isDecrypting}
              disable={!password || isDecrypting}
            >
              {t('decrypt')}
            </Button>
            
            <Button
              size={button_size.middle}
              theme={button_theme.BUTTON_THEME_LIGHT}
              onClick={loadStorageData}
            >
              {t('refreshData')}
            </Button>
          </ButtonRow>

          {decryptError && <ErrorBox>{decryptError}</ErrorBox>}
        </Section>

        {/* Decrypted Structure */}
        {decryptedData && (
          <>
            <Section>
              <SectionTitle>{t('decryptedStructure')}</SectionTitle>
              
              {/* Plaintext toggle */}
              <CheckboxContainer>
                <Checkbox
                  type="checkbox"
                  checked={showPlaintext}
                  onChange={(e) => setShowPlaintext(e.target.checked)}
                />
                <span>{t('showPlaintextLabel')}</span>
              </CheckboxContainer>
              
              {showPlaintext && (
                <WarningText>
                  ⚠️ {t('plaintextWarning')}
                </WarningText>
              )}
            </Section>

            {/* Render based on version */}
            {currentVersion === 'v2' && renderV2Structure(decryptedData)}
            {currentVersion === 'v1' && renderV1Structure(decryptedData)}
            
            {currentVersion === 'unknown' && (
              <Section>
                <SectionTitle>{t('rawData')}</SectionTitle>
                <CodeBlock>
                  {JSON.stringify(decryptedData, null, 2)}
                </CodeBlock>
              </Section>
            )}
          </>
        )}

        {/* Upgrade Section */}
        {decryptedData && (
          <Section>
            <SectionTitle>{t('versionUpgrade')}</SectionTitle>
            
            {currentVersion === 'v2' ? (
              <SuccessText>✓ {t('alreadyLatestVersion')}</SuccessText>
            ) : currentVersion === 'v1' ? (
              <>
                <InfoText>
                  {t('v1DetectedInfo')}
                </InfoText>
                
                <ButtonRow>
                  <Button
                    onClick={handleUpgrade}
                    loading={isUpgrading}
                    disable={isUpgrading}
                  >
                    {t('executeUpgradeToV2')}
                  </Button>
                </ButtonRow>

                {upgradeResult && (
                  upgradeResult.success ? (
                    <SuccessText>✓ {upgradeResult.message}</SuccessText>
                  ) : (
                    <ErrorBox>
                      {upgradeResult.message}
                      {upgradeResult.rolledBack && (
                        <InfoText>{t('autoRolledBack')}</InfoText>
                      )}
                    </ErrorBox>
                  )
                )}
              </>
            ) : (
              <WarningText>{t('unrecognizedFormat')}</WarningText>
            )}
          </Section>
        )}

        {/* Simulation upgrade test */}
        <Section>
          <SectionTitle>{t('simulationTestTitle')}</SectionTitle>
          <InfoText>
            {t('simulationTestInfo')}
          </InfoText>
          
          <TextArea
            placeholder={t('pasteOldKeyringData')}
            value={inputOldData}
            onChange={(e) => setInputOldData(e.target.value)}
          />
          
          <CheckboxContainer>
            <Checkbox
              type="checkbox"
              checked={applyToStorage}
              onChange={(e) => setApplyToStorage(e.target.checked)}
            />
            <span>{t('applyToStorageLabel')}</span>
          </CheckboxContainer>
          
          <CheckboxContainer>
            <Checkbox
              type="checkbox"
              checked={simulateFailure}
              onChange={(e) => setSimulateFailure(e.target.checked)}
            />
            <span style={{ color: '#ff4d4f' }}>🧪 {t('simulateFailureLabel')}</span>
          </CheckboxContainer>
          
          {applyToStorage && !simulateFailure && (
            <WarningText>
              ⚠️ {t('applyWarning')}
            </WarningText>
          )}
          
          {simulateFailure && (
            <InfoText>
              💡 {t('simulateFailureInfo')}
            </InfoText>
          )}
          
          <ButtonRow>
            <Button
              size={button_size.middle}
              onClick={handleSimulateUpgrade}
              loading={isSimulating}
              disable={!password || !inputOldData.trim() || isSimulating}
            >
              {t('simulateUpgradeTest')}
            </Button>
          </ButtonRow>

          {simulationResult && (
            simulationResult.success ? (
              <>
                <SuccessText>
                  ✓ {simulationResult.message}
                </SuccessText>
                {/* Show apply button if simulation succeeded but not applied */}
                {!simulationResult.applied && simulationAfter && (
                  <ButtonRow>
                    <Button
                      size={button_size.middle}
                      onClick={handleApplySimulationToStorage}
                      loading={isSimulating}
                      disable={isSimulating}
                    >
                      🚀 {t('applyToRealStorage')}
                    </Button>
                  </ButtonRow>
                )}
              </>
            ) : (
              <ErrorBox>{simulationResult.message}</ErrorBox>
            )
          )}

          {/* Before/after comparison */}
          {(simulationBefore || simulationAfter) && (
            <TwoColumnLayout>
              <Column>
                <CompareBox $type="before">
                  <CompareTitle $type="before">{t('before')}</CompareTitle>
                  {simulationBefore ? (
                    <CodeBlockWrapper>
                      <CodeBlock style={{ maxHeight: '400px' }}>
                        {JSON.stringify(simulationBefore, null, 2)}
                      </CodeBlock>
                      <CopyButton onClick={() => copyToClipboard(
                        JSON.stringify(simulationBefore, null, 2)
                      )}>
                        {t('copy')}
                      </CopyButton>
                    </CodeBlockWrapper>
                  ) : (
                    <InfoText>-</InfoText>
                  )}
                </CompareBox>
              </Column>
              <Column>
                <CompareBox $type="after">
                  <CompareTitle $type="after">{t('after')}</CompareTitle>
                  {simulationAfter ? (
                    <CodeBlockWrapper>
                      <CodeBlock style={{ maxHeight: '400px' }}>
                        {JSON.stringify(simulationAfter, null, 2)}
                      </CodeBlock>
                      <CopyButton onClick={() => copyToClipboard(
                        JSON.stringify(simulationAfter, null, 2)
                      )}>
                        {t('copy')}
                      </CopyButton>
                    </CodeBlockWrapper>
                  ) : (
                    <InfoText>-</InfoText>
                  )}
                </CompareBox>
              </Column>
            </TwoColumnLayout>
          )}
        </Section>

        {/* Debug Info */}
        <Section>
          <SectionTitle>{t('debugInfo')}</SectionTitle>
          <CodeBlock>
{`VAULT_VERSION: ${VAULT_VERSION}
${t('detectedVersion')}: ${currentVersion || 'null'}
rawKeyringData: ${rawKeyringData ? 'exists' : 'null'}
hasBackup: ${hasBackup}
decryptedData: ${decryptedData ? 'loaded' : 'null'}
isLegacy: ${decryptedData ? isLegacyVault(decryptedData) : 'N/A'}
isV2: ${decryptedData ? isV2Vault(decryptedData) : 'N/A'}
${t('storageKey')}`}
          </CodeBlock>
        </Section>
      </Container>
    </WidePageWrapper>
  );
};

export default VaultDebug;
