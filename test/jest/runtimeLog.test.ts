import { DEBUG_LOG_STORAGE_KEY } from '../../src/constant/storageKey';

let initRuntimeLog: typeof import('../../src/utils/runtimeLog').initRuntimeLog;
let getDebugLogEnabled: typeof import('../../src/utils/runtimeLog').getDebugLogEnabled;
let setDebugLogEnabled: typeof import('../../src/utils/runtimeLog').setDebugLogEnabled;
let noop: typeof import('../../src/utils/runtimeLog').noop;

let browser: any;

const trueLog = console.log;
const trueWarn = console.warn;
const trueError = console.error;

beforeEach(() => {
  console.log = trueLog;
  console.warn = trueWarn;
  console.error = trueError;

  jest.resetModules();
  jest.clearAllMocks();
});

afterAll(() => {
  console.log = trueLog;
  console.warn = trueWarn;
  console.error = trueError;
});

async function loadModule() {
  browser = (await import('webextension-polyfill')).default;

  const mod = await import('../../src/utils/runtimeLog');
  initRuntimeLog = mod.initRuntimeLog;
  getDebugLogEnabled = mod.getDebugLogEnabled;
  setDebugLogEnabled = mod.setDebugLogEnabled;
  noop = mod.noop;
  return mod;
}

describe('runtimeLog', () => {
  describe('initRuntimeLog()', () => {
    it('disables console.log and console.warn by default', async () => {
      await loadModule();
      (browser.storage.local.get as jest.Mock).mockResolvedValueOnce({});
      await initRuntimeLog();

      expect(console.log).not.toBe(trueLog);
      expect(console.warn).not.toBe(trueWarn);
    });

    it('preserves console.error', async () => {
      await loadModule();
      (browser.storage.local.get as jest.Mock).mockResolvedValueOnce({});
      await initRuntimeLog();

      expect(console.error).toBe(trueError);
    });

    it('re-enables console if DEBUG_LOG_ENABLED is true in storage', async () => {
      await loadModule();
      (browser.storage.local.get as jest.Mock).mockResolvedValueOnce({
        [DEBUG_LOG_STORAGE_KEY]: true,
      });
      await initRuntimeLog();

      expect(console.log).not.toBe(noop);
      expect(console.warn).not.toBe(noop);
    });

    it('registers a storage.onChanged listener', async () => {
      await loadModule();
      (browser.storage.local.get as jest.Mock).mockResolvedValueOnce({});
      await initRuntimeLog();

      expect(browser.storage.onChanged.addListener).toHaveBeenCalledTimes(1);
    });

    it('stays disabled when storage.get throws', async () => {
      await loadModule();
      (browser.storage.local.get as jest.Mock).mockRejectedValueOnce(
        new Error('storage error')
      );
      await initRuntimeLog();

      expect(console.log).not.toBe(trueLog);
      expect(console.warn).not.toBe(trueWarn);
    });
  });

  describe('storage.onChanged listener', () => {
    it('enables console when flag is toggled on', async () => {
      await loadModule();
      (browser.storage.local.get as jest.Mock).mockResolvedValueOnce({});
      await initRuntimeLog();

      expect(console.log).toBe(noop);

      const listener = (browser.storage.onChanged.addListener as jest.Mock)
        .mock.calls[0][0];
      listener(
        { [DEBUG_LOG_STORAGE_KEY]: { newValue: true, oldValue: false } },
        'local'
      );

      expect(console.log).not.toBe(noop);
    });

    it('disables console when flag is toggled off', async () => {
      await loadModule();
      (browser.storage.local.get as jest.Mock).mockResolvedValueOnce({
        [DEBUG_LOG_STORAGE_KEY]: true,
      });
      await initRuntimeLog();

      expect(console.log).not.toBe(noop);

      const listener = (browser.storage.onChanged.addListener as jest.Mock)
        .mock.calls[0][0];
      listener(
        { [DEBUG_LOG_STORAGE_KEY]: { newValue: false, oldValue: true } },
        'local'
      );

      expect(console.log).toBe(noop);
    });

    it('ignores changes from non-local storage areas', async () => {
      await loadModule();
      (browser.storage.local.get as jest.Mock).mockResolvedValueOnce({});
      await initRuntimeLog();

      const disabledLog = console.log;

      const listener = (browser.storage.onChanged.addListener as jest.Mock)
        .mock.calls[0][0];
      listener(
        { [DEBUG_LOG_STORAGE_KEY]: { newValue: true, oldValue: false } },
        'sync'
      );

      expect(console.log).toBe(disabledLog);
    });
  });

  describe('getDebugLogEnabled()', () => {
    it('returns true when flag is true in storage', async () => {
      await loadModule();
      (browser.storage.local.get as jest.Mock).mockResolvedValueOnce({
        [DEBUG_LOG_STORAGE_KEY]: true,
      });

      const result = await getDebugLogEnabled();
      expect(result).toBe(true);
    });

    it('returns false when flag is absent', async () => {
      await loadModule();
      (browser.storage.local.get as jest.Mock).mockResolvedValueOnce({});

      const result = await getDebugLogEnabled();
      expect(result).toBe(false);
    });

    it('returns false when storage.get throws', async () => {
      await loadModule();
      (browser.storage.local.get as jest.Mock).mockRejectedValueOnce(
        new Error('storage error')
      );

      const result = await getDebugLogEnabled();
      expect(result).toBe(false);
    });
  });

  describe('setDebugLogEnabled()', () => {
    it('persists the flag to storage', async () => {
      await loadModule();
      await setDebugLogEnabled(true);

      expect(browser.storage.local.set).toHaveBeenCalledWith({
        [DEBUG_LOG_STORAGE_KEY]: true,
      });
    });

    it('propagates storage write errors', async () => {
      await loadModule();
      (browser.storage.local.set as jest.Mock).mockRejectedValueOnce(
        new Error('quota exceeded')
      );

      await expect(setDebugLogEnabled(true)).rejects.toThrow('quota exceeded');
    });
  });
});
