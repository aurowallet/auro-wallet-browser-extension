/**
 * Debug logging utility for UI components and pages
 *
 * Usage:
 * import { debugLog } from '@/utils/debugLog';
 *
 * // In component/page:
 * useEffect(() => {
 *   debugLog.page('PageName');
 * }, []);
 *
 * // For UI logic:
 * debugLog.ui('PageName', 'actionName', data);
 *
 * TO REMOVE: Delete this file and remove all debugLog imports/calls
 */

const DEBUG_ENABLED = true;

const STYLES = {
  page: "background: #594af1; color: white; padding: 2px 6px; border-radius: 3px;",
  component:
    "background: #0db27c; color: white; padding: 2px 6px; border-radius: 3px;",
  ui: "background: #e4b200; color: black; padding: 2px 6px; border-radius: 3px;",
} as const;

export const debugLog = {
  /**
   * Log page mount
   */
  page: (pageName: string): void => {
    if (!DEBUG_ENABLED) return;
    console.log(`%c[PAGE] ${pageName}`, STYLES.page, "- mounted");
  },

  /**
   * Log component mount
   */
  component: (componentName: string): void => {
    if (!DEBUG_ENABLED) return;
    console.log(`%c[COMPONENT] ${componentName}`, STYLES.component, "- mounted");
  },

  /**
   * Log UI logic execution
   */
  ui: (source: string, action: string, data?: unknown): void => {
    if (!DEBUG_ENABLED) return;
    if (data !== undefined) {
      console.log(`%c[UI] ${source}`, STYLES.ui, `- ${action}:`, data);
    } else {
      console.log(`%c[UI] ${source}`, STYLES.ui, `- ${action}`);
    }
  },
};

export default debugLog;
