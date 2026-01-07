/**
 * VaultDebug i18n translations
 * Separate file to keep VaultDebug.js clean
 */

export const VAULT_DEBUG_I18N = {
  zh: {
    // Page
    title: "Vault 调试工具",
    back: "返回",
    
    // Actions
    password: "密码",
    decrypt: "解密",
    upgrade: "升级到 V2",
    rollback: "回滚到备份",
    simulate: "模拟升级",
    refresh: "刷新",
    copy: "复制",
    copied: "已复制",
    showPlaintext: "显示明文",
    hidePlaintext: "隐藏明文",
    apply: "应用到存储",
    cleanup: "清理",
    
    // Status
    currentVersion: "当前版本",
    storageStatus: "存储状态",
    hasBackup: "有备份",
    noBackup: "无备份",
    hasOldKey: "存在旧的 vault 键（冗余）",
    noData: "没有找到存储数据",
    
    // Processing
    decrypting: "正在解密数据...",
    upgrading: "正在执行升级...",
    simulating: "正在模拟升级...",
    decryptingPlaintext: "正在解密敏感数据...",
    creatingBackup: "正在创建备份...",
    applyingToStorage: "正在应用到真实存储...",
    decryptingInput: "正在解密输入数据...",
    
    // Messages
    passwordRequired: "请输入密码",
    passwordError: "密码错误或数据损坏",
    noKeyringData: "没有找到存储的 keyringData 数据",
    decryptSuccess: "解密成功",
    alreadyV2: "已经是 V2 版本",
    cannotUpgrade: "当前数据格式无法升级",
    upgradeSuccess: "升级成功！",
    upgradeFailed: "升级失败",
    rollbackSuccess: "回滚成功",
    rollbackFailed: "回滚失败",
    noBackupData: "没有备份数据",
    simulationComplete: "模拟完成",
    decryptFailed: "解密失败",
    loadFailed: "加载存储数据失败",
    confirmRollback: "确定要回滚到备份吗？这将覆盖当前数据。",
    inputRequired: "请输入旧版 keyringData 加密字符串",
    inputDecryptFailed: "解密失败，请检查密码和加密字符串是否正确",
    inputAlreadyV2: "输入数据已是 V2 格式，无需升级",
    inputUnknownFormat: "输入数据格式无法识别",
    simulateFailureTriggered: "模拟升级失败：用户触发的测试失败场景",
    validationFailed: "迁移后验证失败",
    alreadyNewFormat: "数据已是新格式，无需迁移",
    accountCountMismatch: "账户数量不匹配",
    appliedToStorage: "已应用到真实存储",
    simulationSuccessApplied: "模拟升级成功，已应用到真实存储！",
    simulationSuccessNotApplied: "模拟升级成功（未应用到存储）",
    applySuccessMessage: "已成功应用到真实存储！",
    noSimulationResult: "没有可应用的模拟结果",
    backupCleanedUp: "备份数据已清理",
    oldKeyCleanedUp: "冗余 vault 键已清理",
    upgradeAndRollbackFailed: "升级和回滚都失败",
    criticalError: "严重错误：升级和回滚都失败！",
    rolledBackFromBackup: "升级失败，已从备份恢复并清理备份",
    
    // Structure
    keyrings: "Keyrings",
    accounts: "账户",
    mnemonic: "助记词",
    privateKey: "私钥",
    address: "地址",
    name: "名称",
    type: "类型",
    hdIndex: "HD 索引",
    nextHdIndex: "下一个 HD 索引",
    currentAddress: "当前地址",
    
    // Validation
    validation: "验证",
    valid: "有效",
    invalid: "无效",
    errors: "错误",
    structureValid: "结构有效",
    
    // Comparison
    before: "升级前 (V1)",
    after: "升级后 (V2)",
    
    // V2 Structure
    v2VaultStructure: "V2 Vault 结构",
    v1VaultStructure: "V1 Vault 结构 (Legacy)",
    copyV2Json: "复制 V2 明文 JSON",
    copyV2Encrypted: "复制 V2 密文",
    copyV1Json: "复制 V1 明文 JSON",
    version: "版本",
    currentKeyringId: "当前 Keyring ID",
    validationStatus: "验证状态",
    
    // Account details
    mnemonicEncrypted: "助记词已加密",
    privateKeyEncrypted: "私钥已加密",
    hdDerivedNote: "私钥按需从助记词派生，不存储",
    hdPathIndex: "HD Path 索引",
    
    // Simulation
    simulationSection: "模拟升级测试",
    inputOldData: "输入旧版 keyringData 加密字符串",
    simulateFailure: "模拟升级失败",
    applyToStorage: "应用到真实存储",
    simulationResult: "模拟结果",
    
    // Wallet info
    wallet: "钱包",
    walletAccounts: "钱包账户",
    encryptedData: "加密数据",
    
    // UI Labels (JSX)
    currentStatus: "当前状态",
    v2NewStructure: "V2 新结构",
    v1OldStructure: "V1 旧结构",
    pending: "待检测",
    noDataShort: "无数据",
    keyringDataExists: "存在",
    keyringDataNotExists: "不存在",
    backupExistsCleanable: "存在（升级成功后可清理）",
    backupNotExists: "不存在",
    redundantKeyWarning: "vault: 存在（冗余键，应清理）",
    restoreFromBackup: "从备份恢复",
    cleanupBackup: "清理备份",
    cleanupRedundantKey: "清理冗余 vault 键",
    rawStorageData: "原始存储数据（密文）- 仅使用 keyringData",
    copyFullCiphertext: "复制完整密文",
    decryptData: "解密数据",
    walletPassword: "钱包密码",
    enterPasswordToDecrypt: "输入密码以解密数据",
    refreshData: "刷新数据",
    decryptedStructure: "解密后结构",
    showPlaintextLabel: "显示明文（助记词/私钥）",
    plaintextWarning: "警告：明文仅在内存中显示，请勿截图或分享！",
    rawData: "原始数据",
    versionUpgrade: "版本升级",
    alreadyLatestVersion: "已是最新版本（V2），无需升级",
    v1DetectedInfo: "检测到 V1 旧结构，可以升级到 V2 多 keyring 结构。升级后 HD 账户私钥将不再存储，而是按需从助记词派生。",
    executeUpgradeToV2: "执行升级到 V2",
    autoRolledBack: "已自动回滚，钱包数据保持不变，可继续使用",
    unrecognizedFormat: "无法识别当前数据格式",
    simulationTestTitle: "模拟升级测试",
    simulationTestInfo: "输入旧版 keyringData 加密字符串进行模拟测试（不影响真实数据）。可通过控制台执行：chrome.storage.local.get('keyringData', d => console.log(d.keyringData))",
    pasteOldKeyringData: "粘贴旧版 keyringData 加密字符串...",
    applyToStorageLabel: "应用到真实存储（默认开启，会覆盖当前数据）",
    simulateFailureLabel: "模拟升级失败（测试回滚逻辑）",
    applyWarning: "警告：升级成功后将直接覆盖当前 keyringData！",
    simulateFailureInfo: "已开启失败模拟：升级将在迁移前失败，用于测试回滚和错误处理",
    simulateUpgradeTest: "模拟升级测试",
    applyToRealStorage: "应用到真实存储",
    debugInfo: "调试信息",
    detectedVersion: "当前检测版本",
    storageKey: "存储键: keyringData (唯一)",
  },
  en: {
    // Page
    title: "Vault Debug Tool",
    back: "Back",
    
    // Actions
    password: "Password",
    decrypt: "Decrypt",
    upgrade: "Upgrade to V2",
    rollback: "Rollback to Backup",
    simulate: "Simulate Upgrade",
    refresh: "Refresh",
    copy: "Copy",
    copied: "Copied",
    showPlaintext: "Show Plaintext",
    hidePlaintext: "Hide Plaintext",
    apply: "Apply to Storage",
    cleanup: "Cleanup",
    
    // Status
    currentVersion: "Current Version",
    storageStatus: "Storage Status",
    hasBackup: "Has Backup",
    noBackup: "No Backup",
    hasOldKey: "Old vault key exists (redundant)",
    noData: "No storage data found",
    
    // Processing
    decrypting: "Decrypting data...",
    upgrading: "Upgrading...",
    simulating: "Simulating upgrade...",
    decryptingPlaintext: "Decrypting sensitive data...",
    creatingBackup: "Creating backup...",
    applyingToStorage: "Applying to storage...",
    decryptingInput: "Decrypting input data...",
    
    // Messages
    passwordRequired: "Please enter password",
    passwordError: "Wrong password or corrupted data",
    noKeyringData: "No keyringData found in storage",
    decryptSuccess: "Decrypt success",
    alreadyV2: "Already V2 version",
    cannotUpgrade: "Cannot upgrade current data format",
    upgradeSuccess: "Upgrade success!",
    upgradeFailed: "Upgrade failed",
    rollbackSuccess: "Rollback success",
    rollbackFailed: "Rollback failed",
    noBackupData: "No backup data",
    simulationComplete: "Simulation complete",
    decryptFailed: "Decrypt failed",
    loadFailed: "Failed to load storage data",
    confirmRollback: "Are you sure you want to rollback to backup? This will overwrite current data.",
    inputRequired: "Please enter old keyringData encrypted string",
    inputDecryptFailed: "Decrypt failed, please check password and encrypted string",
    inputAlreadyV2: "Input data is already V2 format, no upgrade needed",
    inputUnknownFormat: "Input data format unrecognized",
    simulateFailureTriggered: "Simulated upgrade failure: user triggered test scenario",
    validationFailed: "Validation failed after migration",
    alreadyNewFormat: "Data is already new format, no migration needed",
    accountCountMismatch: "Account count mismatch",
    appliedToStorage: "Applied to storage",
    simulationSuccessApplied: "Simulation success, applied to storage!",
    simulationSuccessNotApplied: "Simulation success (not applied to storage)",
    applySuccessMessage: "Successfully applied to storage!",
    noSimulationResult: "No simulation result to apply",
    backupCleanedUp: "Backup data cleaned up",
    oldKeyCleanedUp: "Redundant vault key cleaned up",
    upgradeAndRollbackFailed: "Both upgrade and rollback failed",
    criticalError: "Critical error: Both upgrade and rollback failed!",
    rolledBackFromBackup: "Upgrade failed, rolled back from backup",
    
    // Structure
    keyrings: "Keyrings",
    accounts: "Accounts",
    mnemonic: "Mnemonic",
    privateKey: "Private Key",
    address: "Address",
    name: "Name",
    type: "Type",
    hdIndex: "HD Index",
    nextHdIndex: "Next HD Index",
    currentAddress: "Current Address",
    
    // Validation
    validation: "Validation",
    valid: "Valid",
    invalid: "Invalid",
    errors: "Errors",
    structureValid: "Structure valid",
    
    // Comparison
    before: "Before (V1)",
    after: "After (V2)",
    
    // V2 Structure
    v2VaultStructure: "V2 Vault Structure",
    v1VaultStructure: "V1 Vault Structure (Legacy)",
    copyV2Json: "Copy V2 JSON",
    copyV2Encrypted: "Copy V2 Encrypted",
    copyV1Json: "Copy V1 JSON",
    version: "Version",
    currentKeyringId: "Current Keyring ID",
    validationStatus: "Validation Status",
    
    // Account details
    mnemonicEncrypted: "Mnemonic encrypted",
    privateKeyEncrypted: "Private key encrypted",
    hdDerivedNote: "Private key derived on-demand from mnemonic, not stored",
    hdPathIndex: "HD Path Index",
    
    // Simulation
    simulationSection: "Simulation Upgrade Test",
    inputOldData: "Enter old keyringData encrypted string",
    simulateFailure: "Simulate upgrade failure",
    applyToStorage: "Apply to storage",
    simulationResult: "Simulation Result",
    
    // Wallet info
    wallet: "Wallet",
    walletAccounts: "Wallet Accounts",
    encryptedData: "Encrypted data",
    
    // UI Labels (JSX)
    currentStatus: "Current Status",
    v2NewStructure: "V2 New Structure",
    v1OldStructure: "V1 Old Structure",
    pending: "Pending",
    noDataShort: "No Data",
    keyringDataExists: "Exists",
    keyringDataNotExists: "Not Exists",
    backupExistsCleanable: "Exists (can cleanup after upgrade)",
    backupNotExists: "Not Exists",
    redundantKeyWarning: "vault: Exists (redundant key, should cleanup)",
    restoreFromBackup: "Restore from Backup",
    cleanupBackup: "Cleanup Backup",
    cleanupRedundantKey: "Cleanup Redundant vault Key",
    rawStorageData: "Raw Storage Data (Ciphertext) - keyringData only",
    copyFullCiphertext: "Copy Full Ciphertext",
    decryptData: "Decrypt Data",
    walletPassword: "Wallet Password",
    enterPasswordToDecrypt: "Enter password to decrypt data",
    refreshData: "Refresh Data",
    decryptedStructure: "Decrypted Structure",
    showPlaintextLabel: "Show Plaintext (Mnemonic/Private Key)",
    plaintextWarning: "Warning: Plaintext shown in memory only, do not screenshot or share!",
    rawData: "Raw Data",
    versionUpgrade: "Version Upgrade",
    alreadyLatestVersion: "Already latest version (V2), no upgrade needed",
    v1DetectedInfo: "V1 old structure detected, can upgrade to V2 multi-keyring structure. After upgrade, HD account private keys will not be stored, but derived on-demand from mnemonic.",
    executeUpgradeToV2: "Execute Upgrade to V2",
    autoRolledBack: "Auto rolled back, wallet data unchanged, can continue using",
    unrecognizedFormat: "Cannot recognize current data format",
    simulationTestTitle: "Simulation Upgrade Test",
    simulationTestInfo: "Enter old keyringData encrypted string for simulation test (does not affect real data). Run in console: chrome.storage.local.get('keyringData', d => console.log(d.keyringData))",
    pasteOldKeyringData: "Paste old keyringData encrypted string...",
    applyToStorageLabel: "Apply to real storage (enabled by default, will overwrite current data)",
    simulateFailureLabel: "Simulate upgrade failure (test rollback logic)",
    applyWarning: "Warning: After successful upgrade, current keyringData will be overwritten!",
    simulateFailureInfo: "Failure simulation enabled: upgrade will fail before migration, for testing rollback and error handling",
    simulateUpgradeTest: "Simulate Upgrade Test",
    applyToRealStorage: "Apply to Real Storage",
    debugInfo: "Debug Info",
    detectedVersion: "Detected Version",
    storageKey: "Storage key: keyringData (only)",
  }
};

// Get current language (Chinese if zh, otherwise English)
export const getVaultDebugLocale = () => {
  try {
    const lang = navigator.language || 'en';
    return lang.startsWith('zh') ? 'zh' : 'en';
  } catch {
    return 'en';
  }
};

export const t = (key) => {
  const locale = getVaultDebugLocale();
  return VAULT_DEBUG_I18N[locale]?.[key] || VAULT_DEBUG_I18N.en[key] || key;
};
