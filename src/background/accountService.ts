import { Buffer } from "buffer";
import Client from "mina-signer";
import { MAIN_COIN_CONFIG } from "../constant";
import { HDKey } from "@scure/bip32";
import * as bip39 from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";
import { createBase58check } from "@scure/base";
import { sha256 } from "@noble/hashes/sha256";

// ============ Constants ============

const bs58check = createBase58check(sha256);

// ============ Types ============

interface WalletResult {
  priKey: string;
  pubKey: string;
  hdIndex?: number;
}

interface WalletError {
  error: string;
  type: string;
}

interface KeyFile {
  pwsalt: string;
  pwdiff: [number, number];
  ciphertext: string;
  nonce: string;
}

// ============ Internal Functions ============

function reverse(bytes: Uint8Array): Buffer {
  const reversed = Buffer.alloc(bytes.length);
  for (let i = bytes.length; i > 0; i--) {
    reversed[bytes.length - i] = bytes[i - 1] as number;
  }
  return reversed;
}

// ============ Exported Functions ============

export function validateMnemonic(mnemonic: string): boolean {
  return bip39.validateMnemonic(mnemonic, wordlist);
}

export function getHDpath(account: number = 0): string {
  const purpose = 44;
  const index = 0;
  const charge = 0;
  const hdPath =
    "m/" +
    purpose +
    "'/" +
    MAIN_COIN_CONFIG.coinType +
    "'/" +
    account +
    "'/" +
    charge +
    "/" +
    index;
  return hdPath;
}

export function generateMne(): string {
  const mne = bip39.generateMnemonic(wordlist, 128);
  return mne;
}

export function importWalletByMnemonic(
  mnemonic: string,
  index: number = 0
): WalletResult {
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const masterNode = HDKey.fromMasterSeed(seed);
  const hdPath = getHDpath(index);
  const child0 = masterNode.derive(hdPath);
  const privateKeyBytes = child0.privateKey!;
  privateKeyBytes[0] = (privateKeyBytes[0] ?? 0) & 0x3f;
  const childPrivateKey = reverse(privateKeyBytes);
  const privateKeyHex = `5a01${childPrivateKey.toString("hex")}`;
  const privateKey = bs58check.encode(Buffer.from(privateKeyHex, "hex"));
  const client = new Client({ network: "mainnet" });
  const publicKey = client.derivePublicKey(privateKey);
  return {
    priKey: privateKey,
    pubKey: publicKey,
    hdIndex: index,
  };
}

export async function importWalletByKeystore(
  keyfile: string | KeyFile,
  keyfilePassword: string
): Promise<WalletResult | WalletError> {
  try {
    let parsedKeyfile: KeyFile;
    if (typeof keyfile === "string") {
      parsedKeyfile = JSON.parse(keyfile);
    } else {
      parsedKeyfile = keyfile;
    }
    const _sodium = (await import("libsodium-wrappers-sumo")).default;
    await _sodium.ready;
    const sodium = _sodium;
    const key = sodium.crypto_pwhash(
      32,
      new TextEncoder().encode(keyfilePassword),
      bs58check.decode(parsedKeyfile.pwsalt).slice(1),
      parsedKeyfile.pwdiff[1],
      parsedKeyfile.pwdiff[0],
      sodium.crypto_pwhash_ALG_ARGON2I13
    );
    const ciphertext = bs58check.decode(parsedKeyfile.ciphertext).slice(1);
    const nonce = bs58check.decode(parsedKeyfile.nonce).slice(1);
    const privateKeyHex =
      "5a" + Buffer.from(sodium.crypto_secretbox_open_easy(ciphertext, nonce, key)).toString("hex");
    const privateKeyBuffer = Buffer.from(privateKeyHex, "hex");
    const privateKey = bs58check.encode(privateKeyBuffer);
    const client = new Client({ network: "mainnet" });
    const publicKey = client.derivePublicKey(privateKey);
    return {
      priKey: privateKey,
      pubKey: publicKey,
    };
  } catch {
    return { error: "keystoreError", type: "local" };
  }
}

export async function importWalletByPrivateKey(
  privateKey: string
): Promise<WalletResult> {
  const client = new Client({ network: "mainnet" });
  const publicKey = client.derivePublicKey(privateKey);
  return {
    priKey: privateKey,
    pubKey: publicKey,
  };
}

export function importWallet(
  mnemonicOrPrivateKey: string,
  keyType: "mnemonic" | "priKey"
): WalletResult | Promise<WalletResult> | undefined {
  switch (keyType) {
    case "mnemonic":
      return importWalletByMnemonic(mnemonicOrPrivateKey);
    case "priKey":
      return importWalletByPrivateKey(mnemonicOrPrivateKey);
  }
}
