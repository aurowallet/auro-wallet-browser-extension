/**
 * Vault Debug Tool
 * 
 * Development-only tool for visualizing vault data before/after migration.
 * Uses 'keyringData' as the single storage key for both v1 (array) and v3 (object with version=3, CryptoKey encryption).
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
import { isLegacyVault, isModernVault, MIN_MODERN_VAULT_VERSION, VAULT_VERSION } from "../../../constant/vaultTypes";

const encryptUtils = require("../../../utils/encryptUtils").default;

// Import i18n from separate file
import { t } from "./vaultDebugI18n";

// Storage keys
const STORAGE_KEY = {
  KEYRING_DATA: "keyringData",
  BACKUP: "keyringData_backup",
  BACKUP_SALT: "keyringData_backup_vaultSalt",
};

const isV3EncryptedPayload = (payload: string): boolean => {
  try {
    const parsed = JSON.parse(payload);
    return parsed?.version === 3;
  } catch {
    return false;
  }
};

const encryptVaultAsV3 = async (
  vault: any,
  password: string
): Promise<{ encryptedV3: string; vaultSalt: string; upgradedVault: any }> => {
  const upgradedVault = JSON.parse(JSON.stringify(vault));
  const { key: cryptoKey, salt: vaultSalt } = await encryptUtils.deriveSessionKey(password);

  // Re-encrypt legacy inner secrets (v1/v2) with session CryptoKey.
  for (const keyring of upgradedVault.keyrings || []) {
    const kr = keyring as any;
    if (typeof kr.mnemonic === "string" && !isV3EncryptedPayload(kr.mnemonic)) {
      const mne = await encryptUtils.decrypt(password, kr.mnemonic);
      kr.mnemonic = await encryptUtils.encryptWithCryptoKey(cryptoKey, mne);
    }
    for (const acc of (kr.accounts || []) as any[]) {
      if (typeof acc.privateKey === "string" && !isV3EncryptedPayload(acc.privateKey)) {
        const pk = await encryptUtils.decrypt(password, acc.privateKey);
        acc.privateKey = await encryptUtils.encryptWithCryptoKey(cryptoKey, pk);
      }
    }
  }

  const encryptedV3 = await encryptUtils.encryptWithCryptoKey(cryptoKey, upgradedVault);
  return { encryptedV3, vaultSalt, upgradedVault };
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

interface VersionBadgeProps {
  $isV2?: boolean;
}
const VersionBadge = styled.span<VersionBadgeProps>`
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

interface KeyringTypeProps {
  $type?: string;
}
const KeyringType = styled.span<KeyringTypeProps>`
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

interface SensitiveValueProps {
  $visible?: boolean;
}
const SensitiveValue = styled.span<SensitiveValueProps>`
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

interface StatusDotProps {
  $active?: boolean;
}
const StatusDot = styled.span<StatusDotProps>`
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

interface CompareBoxProps {
  $type?: string;
}
const CompareBox = styled.div<CompareBoxProps>`
  background: ${props => props.$type === 'before' ? '#fff7e6' : '#f6ffed'};
  border: 1px solid ${props => props.$type === 'before' ? '#ffd591' : '#b7eb8f'};
  border-radius: 8px;
  padding: 12px;
  margin: 8px 0;
`;

interface CompareTitleProps {
  $type?: string;
}
const CompareTitle = styled.h4<CompareTitleProps>`
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
  const [rawKeyringData, setRawKeyringData] = useState<unknown>(null);
  const [hasBackup, setHasBackup] = useState(false);
  const [hasOldVaultKey, setHasOldVaultKey] = useState(false);
  
  // Decrypted states
  const [decryptedData, setDecryptedData] = useState<unknown>(null);
  const [password, setPassword] = useState("");
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptError, setDecryptError] = useState("");
  
  // UI states
  const [showPlaintext, setShowPlaintext] = useState(false);
  const [plaintextData, setPlaintextData] = useState<Record<string, unknown>>({});
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeResult, setUpgradeResult] = useState<{ success: boolean; message: string; rolledBack?: boolean; critical?: boolean; applied?: boolean } | null>(null);
  const [processingText, setProcessingText] = useState("");
  const [isDecryptingPlaintext, setIsDecryptingPlaintext] = useState(false);
  
  // Version detection
  const [currentVersion, setCurrentVersion] = useState<'v1' | 'v3' | 'unknown' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Simulation test states
  const [inputOldData, setInputOldData] = useState("");
  const [simulationResult, setSimulationResult] = useState<{ success: boolean; message: string; applied?: boolean } | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [applyToStorage, setApplyToStorage] = useState(true);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [simulationBefore, setSimulationBefore] = useState<unknown>(null);
  const [simulationAfter, setSimulationAfter] = useState<unknown>(null);
  
  // Migration check states
  interface MigrationCheckItem {
    label: string;
    status: 'pass' | 'fail' | 'na' | 'notChecked';
    detail: string;
  }
  const [migrationChecks, setMigrationChecks] = useState<MigrationCheckItem[] | null>(null);
  const [migrationVerdict, setMigrationVerdict] = useState<'complete' | 'incomplete' | 'partial' | null>(null);
  const [isCheckingMigration, setIsCheckingMigration] = useState(false);
  
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
  // One-click migration status check
  // ============================================

  const handleMigrationCheck = useCallback(async (withPasswordVerify = false) => {
    setIsCheckingMigration(true);
    setMigrationChecks(null);
    setMigrationVerdict(null);

    try {
      const storage = await browser.storage.local.get([
        'keyringData', 'vaultSalt'
      ]);

      const checks: MigrationCheckItem[] = [];
      let passCount = 0;
      const totalBasic = 3; // keyringData, encVersion, vaultSalt

      // 1. keyringData exists
      const hasKeyring = !!storage.keyringData;
      checks.push({
        label: t('checkKeyringData'),
        status: hasKeyring ? 'pass' : 'fail',
        detail: hasKeyring ? String(storage.keyringData).substring(0, 60) + '...' : '-',
      });
      if (hasKeyring) passCount++;

      // 2. Encryption payload version
      let encVersion: number | string = '-';
      try {
        const parsed = JSON.parse(storage.keyringData as string);
        encVersion = parsed.version ?? 'none';
      } catch { encVersion = 'parse error'; }
      const isV3Enc = encVersion === 3;
      checks.push({
        label: t('checkEncVersion'),
        status: isV3Enc ? 'pass' : 'fail',
        detail: String(encVersion),
      });
      if (isV3Enc) passCount++;

      // 3. vaultSalt exists
      const hasVaultSalt = !!storage.vaultSalt;
      checks.push({
        label: t('checkVaultSalt'),
        status: hasVaultSalt ? 'pass' : 'fail',
        detail: hasVaultSalt ? (storage.vaultSalt as string).substring(0, 20) + '...' : '-',
      });
      if (hasVaultSalt) passCount++;

      // 4. Optional: vault decrypt verification (password required)
      if (withPasswordVerify && password && isV3Enc && hasVaultSalt) {
        try {
          const { key } = await encryptUtils.deriveSessionKey(password, storage.vaultSalt);
          const decrypted = await encryptUtils.decryptWithCryptoKey(key, storage.keyringData);
          checks.push({
            label: t('checkVerifierWorks'),
            status: 'pass',
            detail: '✓',
          });

          // Also check vault data version
          const dataVersion = isModernVault(decrypted) ? (decrypted as { version: number }).version : -1;
          checks.push({
            label: t('checkVaultDataVersion'),
            status: dataVersion >= MIN_MODERN_VAULT_VERSION ? 'pass' : 'fail',
            detail: String(dataVersion),
          });
        } catch (e) {
          checks.push({
            label: t('checkVerifierWorks'),
            status: 'fail',
            detail: 'Vault decrypt failed (wrong password?)',
          });
        }
      } else if (withPasswordVerify && !password) {
        checks.push({
          label: t('checkVerifierWorks'),
          status: 'notChecked',
          detail: t('notChecked'),
        });
      }

      setMigrationChecks(checks);

      // Determine verdict
      if (passCount === totalBasic) {
        setMigrationVerdict('complete');
      } else if (passCount === 0 || (!isV3Enc && !hasVaultSalt)) {
        setMigrationVerdict('incomplete');
      } else {
        setMigrationVerdict('partial');
      }

      Toast.info(t('migrationCheckResult'));
    } catch (error) {
      console.error('[VaultDebug] Migration check error:', error);
      Toast.info(t('loadFailed'));
    } finally {
      setIsCheckingMigration(false);
    }
  }, [password]);

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

      // Detect v3 CryptoKey format vs old password-based format
      const rawStr = typeof rawKeyringData === 'string' ? rawKeyringData : JSON.stringify(rawKeyringData);
      const payload: { version?: number } = JSON.parse(rawStr);
      let decrypted: unknown;
      if (payload.version === 3) {
        const storedSalt = await browser.storage.local.get('vaultSalt');
        const salt = storedSalt?.vaultSalt as string;
        if (!salt) {
          setDecryptError('No vaultSalt found in storage (required for v3 decryption)');
          return;
        }
        const { key } = await encryptUtils.deriveSessionKey(password, salt);
        decrypted = await encryptUtils.decryptWithCryptoKey(key, rawStr);
      } else {
        decrypted = await encryptUtils.decrypt(password, rawStr);
      }
      
      if (isModernVault(decrypted)) {
        setCurrentVersion('v3');
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

  const decryptSensitiveField = useCallback(async (encryptedValue: string, fieldKey: string) => {
    if (!password || !encryptedValue) return null;
    
    try {
      // Detect v3 inner secrets vs old format
      const innerPayload = JSON.parse(encryptedValue);
      let decrypted: unknown;
      if (innerPayload.version === 3) {
        const storedSalt = await browser.storage.local.get('vaultSalt');
        const salt = storedSalt?.vaultSalt as string;
        if (!salt) return t('decryptFailed');
        const { key } = await encryptUtils.deriveSessionKey(password, salt);
        decrypted = await encryptUtils.decryptWithCryptoKey(key, encryptedValue);
      } else {
        decrypted = await encryptUtils.decrypt(password, encryptedValue);
      }
      setPlaintextData((prev) => ({ ...prev, [fieldKey]: decrypted }));
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

  /**
   * Helper: decrypt a single inner secret (mnemonic or private key).
   * Detects v3 (CryptoKey) vs v1/v2 (password-based) format automatically.
   */
  const decryptInnerSecret = async (encrypted: string, cryptoKey: CryptoKey | null): Promise<unknown> => {
    const innerPayload = JSON.parse(encrypted);
    if (innerPayload.version === 3) {
      if (!cryptoKey) {
        throw new Error('CryptoKey required for v3 decryption but could not be derived');
      }
      return encryptUtils.decryptWithCryptoKey(cryptoKey, encrypted);
    }
    return encryptUtils.decrypt(password, encrypted);
  };

  const decryptAllSensitiveFields = async () => {
    if (!decryptedData || !password) return;

    setIsDecryptingPlaintext(true);
    setProcessingText(t('decryptingPlaintext'));
    
    const newPlaintextData: Record<string, unknown> = {};

    // Derive CryptoKey once for v3 inner secrets
    let cryptoKey: CryptoKey | null = null;
    try {
      const storedSalt = await browser.storage.local.get('vaultSalt');
      const salt = storedSalt?.vaultSalt as string;
      if (salt) {
        const { key } = await encryptUtils.deriveSessionKey(password, salt);
        cryptoKey = key;
      }
    } catch { /* salt not available, will fall back to password-based decrypt */ }

    if (currentVersion === 'v3') {
      // V3 structure
      for (const keyring of (decryptedData as { keyrings?: Array<{ id: string; mnemonic?: string; accounts?: Array<{ address: string; privateKey?: string }> }> }).keyrings || []) {
        if (keyring.mnemonic) {
          try {
            newPlaintextData[`mnemonic_${keyring.id}`] = await decryptInnerSecret(keyring.mnemonic, cryptoKey);
          } catch (e) {
            newPlaintextData[`mnemonic_${keyring.id}`] = t('decryptFailed');
          }
        }
        for (const account of keyring.accounts || []) {
          if (account.privateKey) {
            try {
              newPlaintextData[`pk_${account.address}`] = await decryptInnerSecret(account.privateKey, cryptoKey);
            } catch (e) {
              newPlaintextData[`pk_${account.address}`] = t('decryptFailed');
            }
          }
        }
      }
    } else if (currentVersion === 'v1') {
      // V1 structure (array)
      for (let i = 0; i < (decryptedData as unknown[]).length; i++) {
        const wallet = (decryptedData as Array<{ mnemonic?: string; accounts?: Array<{ address: string; privateKey?: string }> }>)[i];
        if (!wallet) continue;
        if (wallet.mnemonic) {
          try {
            newPlaintextData[`mnemonic_${i}`] = await decryptInnerSecret(wallet.mnemonic, cryptoKey);
          } catch (e) {
            newPlaintextData[`mnemonic_${i}`] = t('decryptFailed');
          }
        }
        for (const account of wallet.accounts || []) {
          if (account.privateKey) {
            try {
              newPlaintextData[`pk_${account.address}`] = await decryptInnerSecret(account.privateKey, cryptoKey);
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

    if (currentVersion === 'v3') {
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
      const currentSalt = await browser.storage.local.get('vaultSalt');
      await browser.storage.local.set({
        [STORAGE_KEY.BACKUP]: rawKeyringData,
        [STORAGE_KEY.BACKUP_SALT]: currentSalt?.vaultSalt || '',
      });
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
      const originalCount = (decryptedData as Array<{ accounts?: unknown[] }>).reduce((sum: number, w) => sum + (w.accounts?.length || 0), 0);
      const migratedCount = v2Vault.keyrings.reduce((sum, kr) => sum + kr.accounts.length, 0);
      if (originalCount !== migratedCount) {
        throw new Error(t('accountCountMismatch') + `: ${originalCount} vs ${migratedCount}`);
      }

      // Step 5: Derive CryptoKey, migrate inner secrets, re-encrypt and save
      const { encryptedV3, vaultSalt, upgradedVault } = await encryptVaultAsV3(v2Vault, password);
      await browser.storage.local.set({ [STORAGE_KEY.KEYRING_DATA]: encryptedV3, vaultSalt });

      setUpgradeResult({ success: true, message: t('upgradeSuccess') });
      Toast.info(t('upgradeSuccess'));
      
      // Reload data
      await loadStorageData();
      setDecryptedData(upgradedVault);
      setCurrentVersion('v3');

    } catch (error) {
      console.error('[VaultDebug] Upgrade error:', error);
      const err = error as Error;
      
      // Rollback from backup
      try {
        const backupResult = await browser.storage.local.get([
          STORAGE_KEY.BACKUP,
          STORAGE_KEY.BACKUP_SALT,
        ]);
        if (backupResult[STORAGE_KEY.BACKUP]) {
          const backupSalt = backupResult[STORAGE_KEY.BACKUP_SALT];
          if (typeof backupSalt === 'string' && backupSalt) {
            await browser.storage.local.set({
              [STORAGE_KEY.KEYRING_DATA]: backupResult[STORAGE_KEY.BACKUP],
              vaultSalt: backupSalt,
            });
          } else {
            await browser.storage.local.set({
              [STORAGE_KEY.KEYRING_DATA]: backupResult[STORAGE_KEY.BACKUP],
            });
            await browser.storage.local.remove('vaultSalt');
          }
          // Delete backup after successful rollback
          await browser.storage.local.remove([STORAGE_KEY.BACKUP, STORAGE_KEY.BACKUP_SALT]);
          setHasBackup(false);
          console.log('[VaultDebug] Rolled back from backup, backup deleted');
          setUpgradeResult({ 
            success: false, 
            message: (error as Error).message,
            rolledBack: true,
          });
          Toast.info(t('rollbackSuccess'));
          await loadStorageData();
        } else {
          setUpgradeResult({ success: false, message: err.message });
          Toast.info(t('upgradeFailed') + ': ' + err.message);
        }
      } catch (rollbackError) {
        console.error('[VaultDebug] Rollback failed:', rollbackError);
        const rollbackErr = rollbackError as Error;
        setUpgradeResult({ 
          success: false, 
          message: t('upgradeAndRollbackFailed') + `: ${(error as Error).message}`,
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
        if (isModernVault(decrypted)) {
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
          const currentSalt = await browser.storage.local.get('vaultSalt');
          await browser.storage.local.set({
            [STORAGE_KEY.BACKUP]: rawKeyringData,
            [STORAGE_KEY.BACKUP_SALT]: currentSalt?.vaultSalt || '',
          });
        }
        
        // Save migrated data in current v3 encrypted format.
        const { encryptedV3, vaultSalt, upgradedVault } = await encryptVaultAsV3(v2Vault, password);
        await browser.storage.local.set({ [STORAGE_KEY.KEYRING_DATA]: encryptedV3, vaultSalt });
        setSimulationAfter(upgradedVault);
        
        setSimulationResult({ 
          success: true, 
          message: t('simulationSuccessApplied'),
          applied: true,
        });
        Toast.info(t('upgradeSuccess'));
        await loadStorageData();
        setDecryptedData(upgradedVault);
        setCurrentVersion('v3');
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
      const err = error as Error;
      setSimulationResult({ success: false, message: err.message });
      setSimulationBefore(null);
      setSimulationAfter(null);
      Toast.info(t('upgradeFailed') + ': ' + (error as Error).message);
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
        const currentSalt = await browser.storage.local.get('vaultSalt');
        await browser.storage.local.set({
          [STORAGE_KEY.BACKUP]: rawKeyringData,
          [STORAGE_KEY.BACKUP_SALT]: currentSalt?.vaultSalt || '',
        });
        setHasBackup(true);
      }
      
      // Save migrate data in current v3 encrypted format.
      const { encryptedV3, vaultSalt, upgradedVault } = await encryptVaultAsV3(simulationAfter, password);
      await browser.storage.local.set({ [STORAGE_KEY.KEYRING_DATA]: encryptedV3, vaultSalt });
      setSimulationAfter(upgradedVault);
      
      setSimulationResult({ 
        success: true, 
        message: t('applySuccessMessage'),
        applied: true,
      });
      Toast.info(t('upgradeSuccess'));
      await loadStorageData();
      setDecryptedData(upgradedVault);
      setCurrentVersion('v3');
    } catch (error) {
      console.error('[VaultDebug] Apply to storage error:', error);
      const err = error as Error;
      Toast.info(t('upgradeFailed') + ': ' + err.message);
    } finally {
      setIsSimulating(false);
    }
  }, [simulationAfter, password, rawKeyringData]);

  // ============================================
  // Copy to clipboard
  // ============================================

  const copyToClipboard = useCallback((text: string) => {
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
      const backupResult = await browser.storage.local.get([
        STORAGE_KEY.BACKUP,
        STORAGE_KEY.BACKUP_SALT,
      ]);
      if (!backupResult[STORAGE_KEY.BACKUP]) {
        Toast.info(t('noBackupData'));
        return;
      }

      const backupSalt = backupResult[STORAGE_KEY.BACKUP_SALT];
      if (typeof backupSalt === 'string' && backupSalt) {
        await browser.storage.local.set({
          [STORAGE_KEY.KEYRING_DATA]: backupResult[STORAGE_KEY.BACKUP],
          vaultSalt: backupSalt,
        });
      } else {
        await browser.storage.local.set({
          [STORAGE_KEY.KEYRING_DATA]: backupResult[STORAGE_KEY.BACKUP],
        });
        await browser.storage.local.remove('vaultSalt');
      }
      
      Toast.info(t('rollbackSuccess'));
      await loadStorageData();
      
      // Re-decrypt and display (detect v3 CryptoKey format vs old password-based format)
      if (password) {
        const backupRaw = backupResult[STORAGE_KEY.BACKUP];
        const rawStr = typeof backupRaw === 'string'
          ? backupRaw
          : JSON.stringify(backupRaw);
        const backupPayload: { version?: number } = JSON.parse(rawStr as string);
        let decrypted: unknown;
        if (backupPayload.version === 3) {
          const storedSalt = await browser.storage.local.get('vaultSalt');
          const salt = storedSalt?.vaultSalt as string;
          if (!salt) {
            Toast.info('No vaultSalt found (required for v3 backup decryption)');
            return;
          }
          const { key } = await encryptUtils.deriveSessionKey(password, salt);
          decrypted = await encryptUtils.decryptWithCryptoKey(key, rawStr);
        } else {
          decrypted = await encryptUtils.decrypt(password, rawStr);
        }
        setDecryptedData(decrypted);
        setCurrentVersion(isModernVault(decrypted) ? 'v3' : isLegacyVault(decrypted) ? 'v1' : 'unknown');
      }
    } catch (error) {
      console.error('[VaultDebug] Restore error:', error);
      const err = error as Error;
      Toast.info(t('rollbackFailed') + ': ' + err.message);
    }
  }, [password]);

  // ============================================
  // Cleanup redundant storage keys
  // ============================================

  const handleCleanupBackup = useCallback(async () => {
    try {
      await browser.storage.local.remove([STORAGE_KEY.BACKUP, STORAGE_KEY.BACKUP_SALT]);
      setHasBackup(false);
      Toast.info(t('rollbackSuccess'));
    } catch (error) {
      console.error('[VaultDebug] Cleanup backup error:', error);
      const err = error as Error;
      Toast.info(t('upgradeFailed') + ': ' + err.message);
    }
  }, []);

  const handleCleanupOldVaultKey = useCallback(async () => {
    try {
      await browser.storage.local.remove('vault');
      setHasOldVaultKey(false);
      Toast.info(t('rollbackSuccess'));
    } catch (error) {
      console.error('[VaultDebug] Cleanup vault key error:', error);
      const err = error as Error;
      Toast.info(t('upgradeFailed') + ': ' + err.message);
    }
  }, []);

  // ============================================
  // Render helpers
  // ============================================

  const renderSensitiveValue = (value: unknown, fieldKey: string, label = 'encrypted'): React.ReactNode => {
    if (!value) return <Value>-</Value>;
    
    if (showPlaintext && plaintextData[fieldKey]) {
      return (
        <SensitiveValue $visible={true}>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {plaintextData[fieldKey] as any}
        </SensitiveValue>
      );
    }
    
    return (
      <SensitiveValue $visible={false}>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {`[${label}]` as any}
      </SensitiveValue>
    );
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderV2Structure = (vault: any) => {
    if (!vault || !vault.keyrings) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const validation = validateVault(vault as any);

    return (
      <Section>
        <SectionTitle>{t('v2VaultStructure')}</SectionTitle>
        
        {/* Copy buttons */}
        <ButtonRow>
          <Button
            size={button_size.small}
            theme={button_theme.BUTTON_THEME_LIGHT}
            onClick={() => copyToClipboard(JSON.stringify(vault, null, 2))}
          >
            {t('copyV2Json')}
          </Button>
          {rawKeyringData ? (
            <Button
              size={button_size.small}
              theme={button_theme.BUTTON_THEME_LIGHT}
              onClick={() => copyToClipboard(
                typeof rawKeyringData === 'string' ? rawKeyringData : JSON.stringify(rawKeyringData)
              )}
            >
              {t('copyV2Encrypted')}
            </Button>
          ) : null}
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
        
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {vault.keyrings.map((keyring: any, idx: any) => (
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
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {keyring.accounts?.map((account: any, accIdx: any) => (
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderV1Structure = (data: any[]) => {
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
            onClick={() => copyToClipboard(JSON.stringify(data, null, 2))}
          >
            {t('copyV1Json')}
          </Button>
          {rawKeyringData ? (
            <Button
              size={button_size.small}
              theme={button_theme.BUTTON_THEME_LIGHT}
              onClick={() => copyToClipboard(
                typeof rawKeyringData === 'string' ? rawKeyringData : JSON.stringify(rawKeyringData)
              )}
            >
              {t('copyV1Json')}
            </Button>
          ) : null}
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
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {wallet.accounts?.map((account: any, accIdx: any) => (
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
      {/* @ts-expect-error styled-components children type conflict with i18next */}
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
          {currentVersion === 'v3' && <VersionBadge $isV2={true}>{t('v2NewStructure')}</VersionBadge>}
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
        {(hasBackup || hasOldVaultKey) ? (
          <ButtonRow>
            {hasBackup ? (
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
            ) : null}
            {hasOldVaultKey ? (
              <Button
                size={button_size.small}
                theme={button_theme.BUTTON_THEME_LIGHT}
                onClick={handleCleanupOldVaultKey}
              >
                🗑️ {t('cleanupRedundantKey')}
              </Button>
            ) : null}
          </ButtonRow>
        ) : null}

        {/* Migration Status Check */}
        <Section>
          <SectionTitle>{t('migrationCheckTitle')}</SectionTitle>
          <InfoText>{t('migrationCheckInfo')}</InfoText>

          <ButtonRow>
            <Button
              size={button_size.small}
              onClick={() => handleMigrationCheck(false)}
              loading={isCheckingMigration}
              disable={isCheckingMigration}
            >
              {t('runMigrationCheck')}
            </Button>
            <Button
              size={button_size.small}
              theme={button_theme.BUTTON_THEME_LIGHT}
              onClick={() => handleMigrationCheck(true)}
              loading={isCheckingMigration}
              disable={isCheckingMigration || !password}
            >
              {t('migrationCheckWithVerify')}
            </Button>
          </ButtonRow>

          {migrationChecks && (
            <>
              {/* Verdict banner */}
              {migrationVerdict === 'complete' && (
                <SuccessText style={{ fontSize: '14px', fontWeight: 600, margin: '12px 0' }}>
                  ✅ {t('migrationComplete')}
                </SuccessText>
              )}
              {migrationVerdict === 'incomplete' && (
                <WarningText style={{ fontSize: '14px', fontWeight: 600, margin: '12px 0' }}>
                  ⚠️ {t('migrationIncomplete')}
                </WarningText>
              )}
              {migrationVerdict === 'partial' && (
                <WarningText style={{ fontSize: '14px', fontWeight: 600, margin: '12px 0' }}>
                  ❓ {t('migrationPartial')}
                </WarningText>
              )}

              {/* Check items table */}
              <div style={{ border: '1px solid #e8e8e8', borderRadius: '8px', overflow: 'hidden', margin: '8px 0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1fr', background: '#fafafa', padding: '8px 12px', fontWeight: 600, fontSize: '12px', borderBottom: '1px solid #e8e8e8' }}>
                  <span>{t('checkItem')}</span>
                  <span>{t('checkStatus')}</span>
                  <span>Detail</span>
                </div>
                {migrationChecks.map((check, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1fr', padding: '6px 12px', fontSize: '12px', borderBottom: idx < migrationChecks.length - 1 ? '1px solid #f0f0f0' : 'none', background: check.status === 'fail' ? '#fff2f0' : 'white' }}>
                    <span>{check.label}</span>
                    <span style={{ fontWeight: 600, color: check.status === 'pass' ? '#52c41a' : check.status === 'fail' ? '#ff4d4f' : '#999' }}>
                      {check.status === 'pass' ? t('pass') : check.status === 'fail' ? t('fail') : check.status === 'notChecked' ? t('na') : t('na')}
                    </span>
                    <span style={{ fontSize: '11px', color: '#666', wordBreak: 'break-all' }}>{check.detail}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Section>

        {/* Raw Storage Data */}
        <Section>
          <SectionTitle>{t('rawStorageData')}</SectionTitle>
          
          {rawKeyringData ? (
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
          ) : null}

          {!rawKeyringData ? (
            <InfoText>{t('noKeyringData')}</InfoText>
          ) : null}
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
            {currentVersion === 'v3' && renderV2Structure(decryptedData)}
            {currentVersion === 'v1' && renderV1Structure(decryptedData as any[])}
            
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
            
            {currentVersion === 'v3' ? (
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
          {(simulationBefore || simulationAfter) ? (
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
          ) : null}
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
isV2: ${decryptedData ? isModernVault(decryptedData) : 'N/A'}
${t('storageKey')}`}
          </CodeBlock>
        </Section>
      </Container>
    </WidePageWrapper>
  );
};

export default VaultDebug;
