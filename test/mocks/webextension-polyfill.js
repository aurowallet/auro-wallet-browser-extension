const browserMock = {
  runtime: {
    sendMessage: () => Promise.resolve(),
    onMessage: { addListener: () => {}, removeListener: () => {} },
  },
  storage: {
    local: {
      get: () => Promise.resolve({}),
      set: () => Promise.resolve(),
      remove: () => Promise.resolve(),
    },
  },
  notifications: {
    create: () => Promise.resolve('mock-id'),
    onClicked: { addListener: () => {} },
  },
  tabs: { create: () => Promise.resolve() },
  action: { setIcon: () => Promise.resolve() },
  browserAction: { setIcon: () => Promise.resolve() },
};

module.exports = browserMock;
module.exports.default = browserMock;