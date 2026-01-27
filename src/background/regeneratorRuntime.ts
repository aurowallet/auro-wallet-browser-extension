// Extend globalThis to include regeneratorRuntime property
export {}; // Make this a module

declare global {
  // eslint-disable-next-line no-var
  var regeneratorRuntime: unknown;
}

globalThis.regeneratorRuntime = undefined;
