import {
  Credential,
  Presentation,
  PresentationRequest,
} from "mina-attestations";
import { Signature } from "o1js";
import { serializeError } from "serialize-error";

interface PromiseCallbacks {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
}

let presentationSignaturePromise: PromiseCallbacks | null = null;
let allowedOrigin = ""
window.addEventListener("message", async (event) => {
  if (event.data.type === "init-sandbox" && event.source === window.parent) {
    allowedOrigin = event.origin;
    return;
  }
  if(!allowedOrigin){
    return;
  }
  if (event.origin !== allowedOrigin || event.source !== window.parent) {
    throw new Error("Invalid origin");
  }
  if (event.data.type === "presentation-signature") {
    if (presentationSignaturePromise) {
      if (event.data.signature) {
        presentationSignaturePromise.resolve(event.data.signature);
        presentationSignaturePromise = null;
      } else {
        presentationSignaturePromise.reject(new Error(event.data.error));
        presentationSignaturePromise = null;
      }
    }
    return;
  }

  const data = event.data;
  if (data.type == "validate-credential") {
    try {
      const payload = data.payload;
      const credentialDeserialized = await Credential.fromJSON(payload);
      await Credential.validate(credentialDeserialized);
      const result = {
        type: "validate-credential-result",
        result: Credential.toJSON(credentialDeserialized),
      };
      window.parent.postMessage(result, allowedOrigin);
    } catch (error) {
      const result = {
        type: "validate-credential-result",
        error: serializeError(error),
      };
      window.parent.postMessage(result, allowedOrigin);
    }
  } else if (data.type == "presentation") {
    
    try {
      const parsedPayload = data.payload;
      const {
        presentationRequest,
        verifierIdentity,
      } = parsedPayload;

      const selectedCredentials = Array.isArray(parsedPayload.selectedCredentials)
      ? parsedPayload.selectedCredentials
      : [parsedPayload.selectedCredentials];
      const stringifiedPresentationRequest = JSON.stringify(
        presentationRequest
      );
      const storedCredentials = [];
      for (const credential of selectedCredentials) {
        const stored = await Credential.fromJSON(credential);
        storedCredentials.push(stored);
      }
      const deserialized = PresentationRequest.fromJSON(
        presentationRequest.type,
        stringifiedPresentationRequest
      );
      const verifierIdentityString =
        presentationRequest.type === "zk-app"
          ? JSON.stringify(verifierIdentity)
          : verifierIdentity;

      const prepared = await Presentation.prepare({
        request: deserialized,
        credentials: storedCredentials,
        context: { verifierIdentity: verifierIdentityString },
      });

      window.parent.postMessage(
        {
          type: "presentation-signing-request",
          fields: prepared.messageFields,
        },
        allowedOrigin
      );
      const signature = await new Promise<string>((resolve, reject) => {
        presentationSignaturePromise = { resolve: resolve as (value: unknown) => void, reject };
      });
      const ownerSignature = Signature.fromBase58(signature);
      const presentation = await Presentation.finalize(
        deserialized,
        ownerSignature,
        prepared
      );
      const serializedPresentation = Presentation.toJSON(presentation);
      const result = {
        type: "presentation-result",
        result: serializedPresentation,
      };
      window.parent.postMessage(result, allowedOrigin);
    } catch (error) {
      const result = {
        type: "presentation-result",
        error: serializeError(error),
      };
      window.parent.postMessage(result, allowedOrigin);
    }
  }
});
