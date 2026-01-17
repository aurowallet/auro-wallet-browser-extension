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

const DEBUG_ENABLED = true; // Set to false to disable all debug logs

const STYLES = {
  page: 'background: #594af1; color: white; padding: 2px 6px; border-radius: 3px;',
  component: 'background: #0db27c; color: white; padding: 2px 6px; border-radius: 3px;',
  ui: 'background: #e4b200; color: black; padding: 2px 6px; border-radius: 3px;',
};

export const debugLog = {
  /**
   * Log page mount
   * @param {string} pageName - Name of the page
   */
  page: (pageName) => {
    if (!DEBUG_ENABLED) return;
    console.log(`%c[PAGE] ${pageName}`, STYLES.page, '- mounted');
  },

  /**
   * Log component mount
   * @param {string} componentName - Name of the component
   */
  component: (componentName) => {
    if (!DEBUG_ENABLED) return;
    console.log(`%c[COMPONENT] ${componentName}`, STYLES.component, '- mounted');
  },

  /**
   * Log UI logic execution
   * @param {string} source - Page or component name
   * @param {string} action - Action being performed
   * @param {any} data - Optional data to log
   */
  ui: (source, action, data) => {
    if (!DEBUG_ENABLED) return;
    if (data !== undefined) {
      console.log(`%c[UI] ${source}`, STYLES.ui, `- ${action}:`, data);
    } else {
      console.log(`%c[UI] ${source}`, STYLES.ui, `- ${action}`);
    }
  },
};

export default debugLog;
