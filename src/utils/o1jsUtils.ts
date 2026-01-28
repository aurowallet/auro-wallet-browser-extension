/**
 * o1jsUtils - Utilities for mina-attestations library
 *
 * NOTE: Uses dynamic import due to mina-attestations package export conditions.
 * The package doesn't export properly under webpack's default conditions.
 */
import { PrettyPrinter } from "mina-attestations";
import {
  PresentationRequestSchema,
  StoredCredentialSchema,
} from "mina-attestations/validation";

// ============ Types ============

interface SafeParseResult {
  success: boolean;
  error?: unknown;
  data?: unknown;
}

// ============ Functions ============

export const getSimplifyCredentialData = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  credential: any
): Record<string, unknown> => {
  try {
    return PrettyPrinter.simplifyCredentialData(credential) || {};
  } catch (error) {
    console.error("Error in getSimplifyCredentialData:", error);
    return {};
  }
};

export const getPrintPresentationRequest = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  presentationRequest: any
): string => PrettyPrinter.printPresentationRequest(presentationRequest) || "";

export const getPrintVerifierIdentity = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  verifierIdentity: any
): string => PrettyPrinter.printVerifierIdentity(type, verifierIdentity) || "";

export const checkPresentationRequestSchema = (
  presentationRequest: unknown
): SafeParseResult => PresentationRequestSchema.safeParse(presentationRequest);

export const checkStoredCredentialSchema = (
  credentialData: unknown
): SafeParseResult => StoredCredentialSchema.safeParse(credentialData);
