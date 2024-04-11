# Changelog
All notable changes to this project will be documented in this file.


## [Un-Released]

## [2.2.14]
- Enhancements
    - Network Management
    - Account Management
    - Create & Restore process
    - Windows UI
    - zkApp approve
    - zkApp fee 
- Fixed
    - Setting popup UI
    - Ledger UI
    - TxList delegation show address



## [2.2.13]
- Upgrade mina-signer to 3.0.0
- Update some i18n 
- Add Russian language support
- Merge pull request [#21](https://github.com/aurowallet/auro-wallet-browser-extension/pull/21)

## [2.2.12]
- Fix account init
- Update aboutPage 

## [2.2.11]
- Enhanced security process for wallet create and restore
- Added Ukrainian language support
- Optimized loading
- Updated zkApp user interface (UI):
- Fixed Origin mismatch issue
- Fixed onMessage errors during lock

## [2.2.10]
- Fix zkTx show status
- UI enhancements
- add language:Turkish

## [2.2.9]
- Logo enhancements
- Update tx history source
- UI enhancements
- Fix zkApp switch chain refresh issue

## [2.2.8]
- Deprecated legacy method
- UI enhancements

## [2.2.7]
- New features:
    - Add advance in cancel tx
    - Add zkApp multiple transactions at the same time
    - Add zkApp switch chain
    - Add zkApp add chain
    - Add zkApp sign json messgae
    - Add nullifier support
    - Add zk-commond parse
- Network config enhancements 


## [2.2.6]
- Add support for Testworld2.0 network

## [2.2.5]
- Add transaction speed-up and cancel
- Ledger enhancements

## [2.2.4]
- Upgrade mina-signer to 2.1.1
- Add internal transfer
- Bug fixes

## [2.2.3]
- Firefox manifest version to V2
- Staking page optimization under unknown network

## [2.2.2]
- Upgrade mina-provider to 0.2.1
- Recover Auto Lock feature
- Bug fixes

## [2.2.1]
- Add scam-address match
- Ledger enhancements
- UI enhancements
- Bug fixes

## [2.2.0]
- Upgrade to manifest v3
- Upgrade mina-provider to 0.2.0
- Bug fixes

## [2.1.10]
- Staking UI enhancements
- Bug fixes

## [2.1.9]
- Upgrade mina-signer to 2.0.3

## [2.1.8]
- Upgrade mina-provider to 0.1.7
- Ledger enhancements

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