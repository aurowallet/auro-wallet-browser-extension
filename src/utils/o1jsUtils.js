import { PrettyPrinter } from "mina-attestations";
import {
  PresentationRequestSchema,
  StoredCredentialSchema,
} from "mina-attestations/validation";

export const getSimplifyCredentialData = (credential) =>
  PrettyPrinter.simplifyCredentialData(credential) || {};

export const getPrintPresentationRequest = (presentationRequest) =>
  PrettyPrinter.printPresentationRequest(presentationRequest) || "";

export const getPrintVerifierIdentity = (type, verifierIdentity) =>
  PrettyPrinter.printVerifierIdentity(type, verifierIdentity) || "";

export const checkPresentationRequestSchema = (presentationRequest) =>
  PresentationRequestSchema.safeParse(presentationRequest);

export const checkStoredCredentialSchema = (credentialData) =>
  StoredCredentialSchema.safeParse(credentialData);
