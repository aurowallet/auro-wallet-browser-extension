# Auro Wallet Browser Extension

## Overview

Auro Wallet is a secure and user-friendly browser extension designed for managing MINA assets. It offers seamless asset management, convenient staking, and self-custody of private keys, serving as an intuitive gateway to the Mina Protocol ecosystem.

### Key Features
- **Intuitive UI/UX**: A clean and user-friendly interface for effortless navigation.
- **Secure Local Storage**: Private keys are stored locally, ensuring user control and security.
- **Asset Management**: Simplified tools for managing MINA assets.
- **Easy Staking**: Streamlined staking process for Mina Protocol.
- **Cross-Browser Support**: Compatible with Chrome and Firefox.
- **Multilingual**: Supports English and Chinese, with additional languages in progress.

## Architecture

The Auro Wallet extension is built with a modular architecture to ensure scalability and maintainability. Below is a high-level overview of the system:

<!-- ![Architecture Diagram](docs/auro-extension-wallet.png) -->

- **Auro-UI**: The front-end interface built with React, Redux, and Thunk, featuring components like `app`, `account-info`, `accounts-manage`, `send-page`, `stake-page`, `setting-page`, and `locked-page`. It interacts with actions and reducers for state management.
- **Auro-Background**: Manages background processes, including the `id store` and `config manager` (handling service-data config, encrypted keys, and account lists).
- **Service-Data**: Interfaces with external services like `mina-graphql` (for balance, transactions, staking, and block info) and `mina-indexer` (for validator details, fee recommendations, and transaction results).

## Getting Started

### Prerequisites

To build and run the Auro Wallet extension, ensure you have the following dependencies installed:

- **React**: 17.x.x
- **npm**: 10.5.0
- **Yarn**: 1.22.19
- **Node.js**: v22.12.0

### Installation

1. **Clone the Repository**:
   ```sh
   git clone https://github.com/aurowallet/auro-wallet-browser-extension.git
   cd auro-wallet-browser-extension
   ```

2. **Install Dependencies**:
   ```sh
   yarn install
   ```

3. **Configure the Environment**:
   - The repository uses `git-secret` to encrypt sensitive endpoints and API keys.
   - Create a `config.js` file in the root directory based on the provided `config.example.js` template.
   - Update `config.js` with your own configuration details.

### Building the Extension

- **Development Build**:
   ```sh
   yarn dev
   ```
   This generates a development build in the `/dist` directory.

- **Production Build**:
   ```sh
   yarn build
   ```
   This creates an optimized production build in the `/dist` directory.

To install the extension in your browser, follow the [Chrome Developer Guide](https://developer.chrome.com/extensions/getstarted) for loading an unpacked extension.

## Testing

### Library Tests

Run the following command to execute tests and launch a local test server at `http://localhost:6006`:

```sh
yarn test
```

## Contributing

We welcome contributions to Auro Wallet to make it even better! Contributions can be made to both the [browser extension](https://github.com/aurowallet/auro-wallet-browser-extension) and the [mobile app](https://github.com/aurowallet/auro-wallet-mobile-app).

### Translation Contributions

We encourage adding or updating translations to support a global audience.

#### For Non-Developers
- Use [Weblate](https://hosted.weblate.org/projects/aurowallet) to add or update translations.
- To propose a new language, join our [Telegram community](https://t.me/aurowallet) and contact an admin.

#### For Developers
1. **Clone and Prepare**:
   ```sh
   git clone https://github.com/aurowallet/auro-wallet-browser-extension.git
   cd auro-wallet-browser-extension
   git checkout feature/translate
   ```

2. **Translation Files**:
   - Language files are stored in the `src/i18n` directory.
   - File names follow the [language code standard](https://developers.google.com/admin-sdk/directory/v1/languages) (e.g., `en.json` for English, `zh.json` for Chinese). Replace `-` with `_` in language codes (e.g., `zh-CN` becomes `zh_CN.json`).
   - To update translations, edit the relevant `.json` file.
   - To add a new language, create a new file (e.g., `tr.json` for Turkish).

3. **Submit Changes**:
   - Commit your changes and submit a pull request to the `feature/translate` branch.

## License

This project is licensed under the [Apache License 2.0](LICENSE).

## Support

For questions, feedback, or support, join our [Telegram community](https://t.me/aurowallet) or open an issue on the [GitHub repository](https://github.com/aurowallet/auro-wallet-browser-extension).