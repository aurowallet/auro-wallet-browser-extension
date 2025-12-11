import bs58check from "bs58check";
import { Buffer } from 'buffer';
import Client from 'mina-signer';
import { MAIN_COIN_CONFIG } from '../constant';
import { HDKey } from "@scure/bip32";
import * as bip39 from '@scure/bip39';
import { wordlist } from "@scure/bip39/wordlists/english";

export function validateMnemonic(mnemonic) {
    return bip39.validateMnemonic(mnemonic,wordlist);
}

export function getHDpath(account = 0) {
    let purpose = 44
    let index = 0
    let charge = 0
    let hdPath = "m/" + purpose + "'/" + MAIN_COIN_CONFIG.coinType + "'/" + account + "'/" + charge + "/" + index
    return hdPath
}

export function generateMne() {
    let mne = bip39.generateMnemonic(wordlist, 128);
    return mne
}

function reverse(bytes) {
    const reversed = new Buffer.alloc(bytes.length);
    for (let i = bytes.length; i > 0; i--) {
        reversed[bytes.length - i] = bytes[i - 1];
    }
    return reversed;
}
export function importWalletByMnemonic(mnemonic, index = 0) {
    const seed = bip39.mnemonicToSeedSync(mnemonic)
    const masterNode = HDKey.fromMasterSeed(seed)
    let hdPath = getHDpath(index)
    const child0 = masterNode.derive(hdPath);
    child0.privateKey[0] &= 0x3f;
    const childPrivateKey = reverse(child0.privateKey)
    const privateKeyHex = `5a01${childPrivateKey.toString('hex')}`
    const privateKey = bs58check.encode(Buffer.from(privateKeyHex, 'hex'))
    const client = new Client({ network: "mainnet" })
    const publicKey = client.derivePublicKey(privateKey)
    return {
        priKey: privateKey,
        pubKey: publicKey,
        hdIndex: index
    }
}

export async function importWalletByKeystore(keyfile, keyfilePassword) {
    try {
        if (typeof keyfile === 'string') {
            keyfile = JSON.parse(keyfile)
        }
        const _sodium = (await import('libsodium-wrappers')).default
        await _sodium.ready
        const sodium = _sodium
        let key = sodium.crypto_pwhash(
          32,
          keyfilePassword,
          bs58check.decode(keyfile.pwsalt).slice(1),
          keyfile.pwdiff[1],
          keyfile.pwdiff[0],
          sodium.crypto_pwhash_ALG_ARGON2I13
        )
        const ciphertext = bs58check.decode(keyfile.ciphertext).slice(1)
        const nonce = bs58check.decode(keyfile.nonce).slice(1)
        const privateKeyHex = '5a' + sodium.crypto_secretbox_open_easy(ciphertext, nonce, key, 'hex')
        const privateKeyBuffer = Buffer.from(privateKeyHex, 'hex')
        const privateKey = bs58check.encode(privateKeyBuffer)
        const client = new Client({ network: "mainnet" })
        const publicKey = client.derivePublicKey(privateKey)
        return {
            priKey: privateKey,
            pubKey: publicKey,
        }
    }
    catch (e) {
        return  {error: 'keystoreError' , type:"local"}
    }
}
export async function importWalletByPrivateKey(privateKey) {
    const client = new Client({ network: "mainnet" })
    const publicKey = client.derivePublicKey(privateKey)
    return {
        priKey: privateKey,
        pubKey: publicKey,
    }
}

export function importWallet(mnemonicOrPrivateKey, keyType) {
    switch (keyType) {
        case 'mnemonic':
            return importWalletByMnemonic(mnemonicOrPrivateKey)
        case 'priKey':
            return importWalletByPrivateKey(mnemonicOrPrivateKey)
    }
}
