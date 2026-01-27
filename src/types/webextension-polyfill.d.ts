import { Runtime } from "webextension-polyfill";

declare module "webextension-polyfill" {
  namespace Runtime {
    interface OnMessageEvent {
      addListener(
        callback: (
          message: { action: string; payload: Record<string, unknown> },
          sender: Runtime.MessageSender,
          sendResponse: (response?: unknown) => void
        ) => boolean | void | Promise<unknown>
      ): void;
      removeListener(
        callback: (
          message: { action: string; payload: Record<string, unknown> },
          sender: Runtime.MessageSender,
          sendResponse: (response?: unknown) => void
        ) => boolean | void | Promise<unknown>
      ): void;
    }
  }
}
