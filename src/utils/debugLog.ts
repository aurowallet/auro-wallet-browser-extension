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
 * // To view all logged pages/components:
 * debugLog.getLoggedPages();
 * debugLog.getLoggedComponents();
 * debugLog.printSummary();
 * debugLog.clear() 
 */

const DEBUG_ENABLED = process.env.NODE_ENV === 'development';

const STYLES = {
  page: "background: #594af1; color: white; padding: 2px 6px; border-radius: 3px;",
  component:
    "background: #0db27c; color: white; padding: 2px 6px; border-radius: 3px;",
  ui: "background: #e4b200; color: black; padding: 2px 6px; border-radius: 3px;",
  summary: "background: #333; color: #fff; padding: 2px 6px; border-radius: 3px;",
} as const;

// Track logged pages and components
const loggedPages = new Set<string>();
const loggedComponents = new Set<string>();

export const debugLog = {
  /**
   * Log page mount
   */
  page: (pageName: string): void => {
    if (!DEBUG_ENABLED) return;
    loggedPages.add(pageName);
    console.log(`%c[PAGE] ${pageName}`, STYLES.page, "- mounted");
  },

  /**
   * Log component mount
   */
  component: (componentName: string): void => {
    if (!DEBUG_ENABLED) return;
    loggedComponents.add(componentName);
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

  /**
   * Get all logged pages as array
   */
  getLoggedPages: (): string[] => {
    return Array.from(loggedPages).sort();
  },

  /**
   * Get all logged components as array
   */
  getLoggedComponents: (): string[] => {
    return Array.from(loggedComponents).sort();
  },

  /**
   * Print summary of all logged pages and components
   */
  printSummary: (): void => {
    const pages = Array.from(loggedPages).sort();
    const components = Array.from(loggedComponents).sort();
    console.log(`%c[DEBUG SUMMARY]`, STYLES.summary, `\nPages (${pages.length}):`, pages, `\nComponents (${components.length}):`, components);
  },

  /**
   * Clear logged records
   */
  clear: (): void => {
    loggedPages.clear();
    loggedComponents.clear();
    console.log(`%c[DEBUG]`, STYLES.summary, "Cleared all logged records");
  },
};

// Expose to window for easy console access
if (DEBUG_ENABLED && typeof window !== 'undefined') {
  (window as unknown as { debugLog: typeof debugLog }).debugLog = debugLog;
}

export default debugLog;
