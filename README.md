# Auro Wallet Browser Extension

## Introduction

Auro Wallet provide one-stop management for MINA assets, convenient staking, and the private key is self-owned. Auro Wallet is aiming to provide a more convenient entrance of the Mina protocol.

- Friendly UI/UX.
- Secure local accounts storage.
- Intuitive Assets management.
- Simplified staking.
- Available for Chrome&Firefox.
- Support English and Chineses.

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

[1]:https://www.nomnoml.com/#view/%5B<actor>user%5D%0A%0A%5BAuro-ui%7C%0A%20%20%20%5Btools%7C%0A%20%20%20%20%20react%0A%20%20%20%20%20redux%0A%20%20%20%20%20thunk%0A%20%20%20%5D%0A%20%20%20%5Bcomponents%7C%0A%20%20%20%20%20app%0A%20%20%20%20%20account-info%0A%20%20%20%20%20accounts-manage%0A%20%20%20%20%20send-page%0A%20%20%20%20%20stake-page%0A%20%20%20%20%20setting-page%0A%20%20%20%20%20locked-page%0A%20%20%20%20%20...%0A%20%20%20%5D%0A%20%20%20%5Breducers%7C%0A%20%20%20%20%20app%0A%20%20%20%20%20account%0A%20%20%20%20%20entry-route%0A%20%20%20%20%20cache%0A%20%20%20%20%20...%0A%20%20%20%5D%0A%20%20%20%5Bactions%7C%0A%20%20%20%20%20update-account%0A%20%20%20%20%20update-route%0A%20%20%20%20%20...%0A%20%20%20%5D%0A%20%20%20%5Bcomponents%5D%3A->%5Bactions%5D%0A%20%20%20%5Bactions%5D%3A->%5Breducers%5D%0A%20%20%20%5Breducers%5D%3A->%5Bcomponents%5D%0A%5D%0A%5Buser%5D<->%5BAuro-ui%5D%0A%0A%0A%5BAuro-background%7C%0A%20%20%0A%20%20%5Bid%20store%5D%0A%20%20%0A%20%20%5Bconfig%20manager%7C%0A%20%20%20%20%5Bservice-data%20config%5D%0A%20%20%20%20%5Bencrypted%20keys%5D%0A%20%20%20%20%5Baccount%20list%5D%0A%20%20%5D%0A%20%20%0A%20%20%5Bid%20store%5D<->%5Bconfig%20manager%5D%0A%5D%0A%0A%5Bservice-data%20%7C%0A%20%20%5Bmina-graphql%20%7C%0A%20%20%20%20balance%0A%20%20%20%20send-tx%0A%20%20%20%20pending-tx%0A%20%20%20%20tx-status%0A%20%20%20%20stake-info%0A%20%20%20%20block-info%0A%20%20%5D%0A%20%20%5Bmina-indexer%20%7C%0A%20%20%20%20validator-Detail%0A%20%20%20%20validator-list%0A%20%20%20%20fee-recommend%0A%20%20%20%20about-info%0A%20%20%20%20result-tx%0A%20%20%5D%0A%5D%0A%0A%5BAuro-background%5D<->%5BAuro-ui%5D%0A%5BAuro-background%5D<->%5Bservice-data%5D%0A
