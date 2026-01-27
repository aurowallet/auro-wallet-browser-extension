/**
 * Firefox-specific stub for o1jsUtils
 * Firefox doesn't support certain features used by mina-attestations
 */

interface SafeParseResult {
  success: boolean;
}

export const getSimplifyCredentialData = (): Record<string, unknown> => ({});

export const getPrintPresentationRequest = (): string => "";

export const getPrintVerifierIdentity = (): string => "";

export const checkPresentationRequestSchema = (): SafeParseResult => ({ success: true });

export const checkStoredCredentialSchema = (): SafeParseResult => ({ success: true });
