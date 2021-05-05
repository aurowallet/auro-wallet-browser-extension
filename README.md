# Auro Wallet Browser Extension

## Introduction

Auro Wallet provide one-stop management for MINA assets, convenient staking, and the private key is self-owned. Auro Wallet is aiming to provide a more convenient entrance of the Mina protocol.

- Friendly UI.
- Secure local accounts storage.
- Intuitive Assets management.
- Simplified staking.
- Available for Chrome&Firefox.

## Architecture
[![Architecture Diagram](./docs/auro-extension-wallet.png)][1]

## Building

### Dependencies

- `react 17.x.x` 
- `npm 6.x.x` 
- `node v10.18.x` 

### Build
Auro Wallet extension repo uses git-secret to encrypt the endpoints and the api keys. So, you can't build this without creating your own config file. You should create your own `config.js` file in the folder. Refer to the `config.example.js` sample file to create your own configuration.

Dev
```sh
npm run dev
```

Production
```sh
npm run build
``` 

Extension's build output is placed in `/dist`, and you can check out [this page](https://developer.chrome.com/extensions/getstarted) for installing the developing extension.  

## Test

### UI Test

```sh
npm run storybook
``` 
### LIB Test

run bottom sh and will open url in the chrome http://localhost:6006/

```sh
npm run test
``` 

## LICENSE

[MIT](LICENSE)

[1]:https://www.nomnoml.com/#file/auro-extension-wallet
