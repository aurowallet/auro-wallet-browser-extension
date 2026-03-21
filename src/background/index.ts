import { initRuntimeLog } from "../utils/runtimeLog";
import { setupMessageListeners } from "./messageListener";

initRuntimeLog().catch(() => {});
setupMessageListeners();
