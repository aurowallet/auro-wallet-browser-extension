# Changelog
All notable changes to this project will be documented in this file.


## [Un-Released]

## [2.1.7]
- Upgrade mina-provider to 0.1.6

## [2.1.6]
- Upgrade mina-signer to 2.0.2
- Bug fixes

## [2.1.5]
- Optimize Ledger UX

## [2.1.4]
- Upgrade mina-signer to v1.7.0
- Upgrade webpack to v5
- Bug fix

## [2.1.3]
- Add transaction memo parse
- Update some i18n 
- Fix some ui (contains windows ui)

## [2.1.2]
- Upgrade mina-signer to v1.6.0
- Add support for Berkeley network

## [2.1.1]
- Update transaction history provider
- Update delegation detail provider

## [2.1.0]
- New UI
- New features:
    - Add popup window
    - Add Auto-lock
    - Add Connect DApp List

## [2.0.6]
- fix (ledger): signing not working on testnet
- fix change password failed when have ledger account

## [2.0.5]

- fix DApp default icon
- change DApp message request page title
- fix address-book 
- update auro-web3-provider to @aurowallet/mina-provider
- add gql params type
- update build production scripts
- update the page display logic of network control
- update mina-signer init params to mainnet
- update signMessage params name to message
- fix update the current network url not timely problem 

## [2.0.4]

- Re-encode raw signature to fix ledger transation signature  (https://github.com/jspada/ledger-app-mina/pull/22)
- fix no-balance account tip

## [2.0.3]

### Fixed
- add old version network default-name [`Unknown`]
- add ledger transaction tip when waiting sign in ledger
- fix send default button status 
- fix networkPage delete button 
 

## [2.0.2]

### Changed
- change permission `tabs` to `activeTab`


## [2.0.1]

### Added
- Support Dapp
- Support Devnet
- Improve user experience and features optimization:
- Add `All` feature when sending, change the default explorer, transaction fees and other humanized tips.
- Deprecated import watch account(Forced).

### Fixed
- Bug fix

