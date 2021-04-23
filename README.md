# Auro Wallet-extension

Mina Protocol browser extension wallet.

### Introduction

Auro Wallet provide one-stop management for mina assets, convenient staking, and the private key is self-owned. 


Auro Wallet is aiming to provide a more convenient entrance of the mina network.

- Friendly UI.
- Secure local accounts storage.
- Intuitive Assets management.
- Simplified staking.
- Available for Chrome.
<!-- ## Architecture
[![Architecture Diagram](./docs/auro-extension-wallet.png)][1] -->

### Building

#### Dependencies

- `react 16.x.x` 
- `npm 6.x.x` 
- `node v10.18.x` 

## Dev
Auro Wallet extension repo uses git-secret to encrypt the endpoints and the api keys. So, you can't build this without creating your own config file. You should create your own `config.js` file in the folder. Refer to the `config.example.js` sample file to create your own configuration.
```sh
npm run dev
``` 
Extension's build output is placed in `/dist`, and you can check out [this page](https://developer.chrome.com/extensions/getstarted) for installing the developing extension.  

## UI TEST

```sh
npm run storybook
``` 
## LIB TEST

run bottom sh and will open url in the chrome http://localhost:6006/

```sh
npm run test
``` 

## LICENSE

[MIT](LICENSE)

<!-- [1]:https://www.nomnoml.com/#file/auro-extension-wallet -->