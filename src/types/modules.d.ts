declare module 'node-forge' {
  namespace util {
    interface ByteStringBuffer {
      data: string;
      read: number;
      length(): number;
      isEmpty(): boolean;
      putByte(b: number): ByteStringBuffer;
      fillWithByte(b: number, n: number): ByteStringBuffer;
      putBytes(bytes: string): ByteStringBuffer;
      putString(str: string): ByteStringBuffer;
      putInt16(i: number): ByteStringBuffer;
      putInt24(i: number): ByteStringBuffer;
      putInt32(i: number): ByteStringBuffer;
      putInt16Le(i: number): ByteStringBuffer;
      putInt24Le(i: number): ByteStringBuffer;
      putInt32Le(i: number): ByteStringBuffer;
      putInt(i: number, n: number): ByteStringBuffer;
      putSignedInt(i: number, n: number): ByteStringBuffer;
      getByte(): number;
      getInt16(): number;
      getInt24(): number;
      getInt32(): number;
      getInt16Le(): number;
      getInt24Le(): number;
      getInt32Le(): number;
      getInt(n: number): number;
      getSignedInt(n: number): number;
      getBytes(count?: number): string;
      bytes(count?: number): string;
      at(i: number): number;
      setAt(i: number, b: number): ByteStringBuffer;
      last(): number;
      copy(): ByteStringBuffer;
      compact(): ByteStringBuffer;
      clear(): ByteStringBuffer;
      truncate(count: number): ByteStringBuffer;
      toHex(): string;
      toString(): string;
    }
    function createBuffer(input?: string, encoding?: string): ByteStringBuffer;
    function encode64(bytes: string): string;
    function decode64(str: string): string;
  }
  namespace pki {
    function publicKeyFromPem(pem: string): {
      encrypt(data: string, scheme: string, options?: Record<string, unknown>): string;
    };
    function privateKeyFromPem(pem: string): {
      decrypt(data: string, scheme: string, options?: Record<string, unknown>): string;
    };
  }
  namespace md {
    namespace sha256 {
      function create(): unknown;
    }
  }
  namespace cipher {
    function createCipher(algorithm: string, key: string): {
      start(options: { iv: util.ByteStringBuffer }): void;
      update(input: util.ByteStringBuffer): void;
      finish(): boolean;
      output: util.ByteStringBuffer;
    };
    function createDecipher(algorithm: string, key: string): {
      start(options: { iv: util.ByteStringBuffer }): void;
      update(input: util.ByteStringBuffer): void;
      finish(): boolean;
      output: util.ByteStringBuffer;
    };
  }
  namespace random {
    function getBytesSync(count: number): string;
    function getBytes(count: number, callback?: (err: Error | null, bytes: string) => void): string;
  }
}

declare module 'libsodium-wrappers-sumo' {
  export const ready: Promise<void>;
  export function crypto_sign_seed_keypair(seed: Uint8Array): { publicKey: Uint8Array; privateKey: Uint8Array };
  export function crypto_sign_detached(message: Uint8Array, privateKey: Uint8Array): Uint8Array;
  export function crypto_sign_verify_detached(signature: Uint8Array, message: Uint8Array, publicKey: Uint8Array): boolean;
  export function from_string(str: string): Uint8Array;
  export function to_hex(arr: Uint8Array): string;
  export function from_hex(hex: string): Uint8Array;
  export function crypto_pwhash(
    keyLength: number,
    password: Uint8Array,
    salt: Uint8Array,
    opsLimit: number,
    memLimit: number,
    algorithm: number
  ): Uint8Array;
  export const crypto_pwhash_OPSLIMIT_MODERATE: number;
  export const crypto_pwhash_MEMLIMIT_INTERACTIVE: number;
  export const crypto_pwhash_ALG_ARGON2ID13: number;
  export const crypto_pwhash_ALG_ARGON2I13: number;
  export function crypto_secretbox_open_easy(
    ciphertext: Uint8Array,
    nonce: Uint8Array,
    key: Uint8Array
  ): Uint8Array;
}
