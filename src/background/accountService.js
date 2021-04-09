import * as RawSDK from '@o1labs/client-sdk/src/client_sdk.bc';
import * as bip32 from 'bip32';
import * as bip39 from 'bip39';
import { generateMnemonic } from "bip39";
import bs58check from "bs58check";
import { Buffer } from 'safe-buffer';
import { cointypes } from "../../config";
export function validateMnemonic(mnemonic) {
    return bip39.validateMnemonic(mnemonic);
}

export function getHDpath(account = 0) {
    let purpse = 44
    let index = 0
    let charge = 0
    let hdpath = "m/" + purpse + "'/" + cointypes.coinType + "'/" + account + "'/" + charge + "/" + index
    return hdpath
}

export function generateMne() {
    let mne = generateMnemonic();
    return mne
}

export function decodeAddress(address) {
    try {
        const decodedAddress = bs58check.decode(address).toString('hex');
        return decodedAddress;
    } catch (ex) {
        return null
    }
}

function reverse(bytes) {
    const reversed = new Buffer(bytes.length);
    for (let i = bytes.length; i > 0; i--) {
        reversed[bytes.length - i] = bytes[i - 1];
    }
    return reversed;
}
export async function importWalletByMnemonic(mnemonic, index = 0) {
    const seed = await bip39.mnemonicToSeedSync(mnemonic)
    const masterNode = bip32.fromSeed(seed)
    let hdPath = getHDpath(index)
    const child0 = masterNode.derivePath(hdPath)
    child0.privateKey[0] &= 0x3f;
    const childPrivateKey = reverse(child0.privateKey)
    const privateKeyHex = `5a01${childPrivateKey.toString('hex')}`
    const privateKey = bs58check.encode(Buffer.from(privateKeyHex, 'hex'))
    const publicKey = RawSDK.codaSDK.publicKeyOfPrivateKey(privateKey)
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
        let key = await sodium.crypto_pwhash(
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
        const publicKey = RawSDK.codaSDK.publicKeyOfPrivateKey(privateKey)
        return {
            priKey: privateKey,
            pubKey: publicKey,
        }
    }
    catch (e) {
        return  {error: 'keystoreError' , type:"local"}
    }
}
export function importWalletByPrivateKey(privateKey) {
    const publicKey = RawSDK.codaSDK.publicKeyOfPrivateKey(privateKey)
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
