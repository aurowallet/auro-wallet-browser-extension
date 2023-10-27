
import { DAppActions } from '@aurowallet/mina-provider';
import BigNumber from "bignumber.js";
import cls from "classnames";
import i18n from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from 'react-router-dom';
import { cointypes } from "../../../../config";
import { getBalance, sendStakeTx, sendTx } from "../../../background/api";
import { DAPP_ACTION_SEND_TRANSACTION, DAPP_ACTION_SIGN_MESSAGE, GET_SIGN_PARAMS,QA_SIGN_TRANSTRACTION, WALLET_CHECK_TX_STATUS, WALLET_GET_CURRENT_ACCOUNT, WALLET_SEND_FIELDS_MESSAGE_TRANSTRACTION, WALLET_SEND_MESSAGE_TRANSTRACTION, WALLET_SEND_STAKE_TRANSTRACTION, WALLET_SEND_TRANSTRACTION } from "../../../constant/types";
import { ACCOUNT_TYPE } from "../../../constant/walletType";
import { updateNetAccount } from "../../../reducers/accountReducer";
import { updateDAppOpenWindow } from "../../../reducers/cache";
import { ENTRY_WITCH_ROUTE, updateEntryWitchRoute } from "../../../reducers/entryRouteReducer";
import { sendMsg } from "../../../utils/commonMsg";
import { checkLedgerConnect, requestSignDelegation, requestSignPayment } from '../../../utils/ledger';
import { addressSlice, copyText,exportFile, getQueryStringArgs, getRealErrorMsg, isNumber, toNonExponential, trimSpace } from "../../../utils/utils";
import { addressValid } from "../../../utils/validator";
import Button, { button_size, button_theme } from "../../component/Button";
import { ConfirmModal } from '../../component/ConfirmModal';
import DAppAdvance from "../../component/DAppAdvance";
import DappWebsite from "../../component/DappWebsite";
import Loading from "../../component/Loading";
import Tabs from "../../component/Tabs";
import Toast from "../../component/Toast";
import { LockPage } from "../Lock";
import styles from "./index.module.scss";
import { TypeRowInfo } from './TypeRowInfo';
import { toPretty } from '../../../utils/zkUtils';
 
const FeeTypeEnum = {
  site: "FEE_RECOMMED_SITE",
  default: "FEE_RECOMMED_DEFAULT",
  custom: "FEE_RECOMMED_CUSTOM",
}

/** mina sign event */
const SIGN_MESSAGE_EVENT = [
  DAppActions.mina_signMessage,
  DAppActions.mina_signFields,
  DAppActions.mina_sign_JsonMessage
]
 
const SignTransaction = () => {
  const dispatch = useDispatch()
  const history = useHistory()

  const dappWindow = useSelector(state => state.cache.dappWindow)
  const currentAccount = useSelector(state => state.accountInfo.currentAccount)
  const currentAddress = useSelector(state => state.accountInfo.currentAccount.address)
  const balance = useSelector(state => state.accountInfo.balance)
  const netAccount = useSelector(state => state.accountInfo.netAccount)
  const currentConfig = useSelector(state => state.network.currentConfig)
  const netFeeList = useSelector(state => state.cache.feeRecom)

  const [lockStatus, setLockStatus] = useState(false)
  const [advanceStatus, setAdvanceStatus] = useState(false)

  const [feeValue, setFeeValue] = useState("")
  const [feeDefault, setFeeDefault] = useState("")
  const [customFeeStatus, setCustomFeeStatus] = useState(false)
  const [feeType, setFeeType] = useState("")
  const [nonceValue, setNonceValue] = useState("")

  const [selectedTabIndex, setSelectedTabIndex] = useState(0)

  const [signParams, setSignParams] = useState({})
  const [feeErrorTip, setFeeErrorTip] = useState("")

  const [btnLoading, setBtnLoading] = useState(false)


  const [ledgerModalStatus, setLedgerModalStatus] = useState(false)

  const onSelectedTab = useCallback((tabIndex) => {
    setSelectedTabIndex(tabIndex)
  }, [])

  const [params, setParams] = useState(() => {
    let url = dappWindow.url || window.location?.href || ""
    return getQueryStringArgs(url)
  })


  const goToHome = useCallback(() => {
    let url = dappWindow?.url
    if (url) {
      dispatch(updateEntryWitchRoute(ENTRY_WITCH_ROUTE.HOME_PAGE))
    }
    dispatch(updateDAppOpenWindow({}))
  }, [dappWindow])

  const onCancel = useCallback(() => {
    let resultAction = ""
      switch (signParams.sendAction) {
        case DAppActions.mina_sendStakeDelegation:
          resultAction = DAPP_ACTION_SEND_TRANSACTION
          break;
        case DAppActions.mina_sendPayment:
          resultAction = DAPP_ACTION_SEND_TRANSACTION
          break;
        case DAppActions.mina_signMessage:
        case DAppActions.mina_signFields:
        case DAppActions.mina_sign_JsonMessage:
          resultAction = DAPP_ACTION_SIGN_MESSAGE
          break;
        case DAppActions.mina_sendTransaction:
          resultAction = DAPP_ACTION_SEND_TRANSACTION
          break;
        default:
          break;
      }
    sendMsg({
      action: resultAction,
      payload: {
        cancel: true,
        resultOrigin: signParams.site?.origin
      },
    }, async (params) => {
      goToHome()
    })
  }, [currentAccount, goToHome, signParams])

  const onSubmitSuccess = useCallback((data, type) => {
    if (data.error) {
      let errorMessage = i18n.t('postFailed')
      let realMsg = getRealErrorMsg(data.error)
      errorMessage = realMsg ? realMsg : errorMessage
      Toast.info(errorMessage, 5 * 1000)
      return
    } else {
      let resultAction = ""
      let payload = {}
      let id = ""
      payload.resultOrigin = signParams?.site?.origin
      switch (signParams.sendAction) {
        case DAppActions.mina_sendStakeDelegation:
          payload.hash = data.sendDelegation.delegation.hash
          id = data.sendDelegation.delegation.id
          resultAction = DAPP_ACTION_SEND_TRANSACTION
          break;
        case DAppActions.mina_sendPayment:
          payload.hash = data.sendPayment.payment.hash
          id = data.sendPayment.payment.id
          resultAction = DAPP_ACTION_SEND_TRANSACTION
          break;
        case DAppActions.mina_signMessage:
        case DAppActions.mina_signFields:
        case DAppActions.mina_sign_JsonMessage:
          payload = {
            ...payload,
            ...data
          }
          resultAction = DAPP_ACTION_SIGN_MESSAGE
          break;
        case DAppActions.mina_sendTransaction:
          payload.hash = data.hash
          resultAction = DAPP_ACTION_SEND_TRANSACTION
          break;
        default:
          break;
      }
      if (type === "ledger" && id && payload.hash) {
        sendMsg({
          action: WALLET_CHECK_TX_STATUS,
          payload: {
            paymentId: id,
            hash: payload.hash,
          }
        }, () => { })
      }
      sendMsg({
        action: resultAction,
        payload: payload,
      }, async (params) => { })
    }
    goToHome()
  }, [signParams, goToHome])


  const ledgerTransfer = useCallback(async (params) => {
    let { sendAction } = signParams
    if (SIGN_MESSAGE_EVENT.indexOf(sendAction)!==-1){
      Toast.info(i18n.t('ledgerNotSupportSign'))
      sendMsg({
        action: DAPP_ACTION_SIGN_MESSAGE, 
        payload: { error: "not support ledger sign message" },
      }, async (params) => { })
      return
    }
    const supportAction = [DAppActions.mina_sendPayment,DAppActions.mina_sendStakeDelegation]
    if(supportAction.indexOf(sendAction)===-1){
      Toast.info(i18n.t('notSupportNow')) 
      return
    }

    const { ledgerApp } = await checkLedgerConnect()
    if (ledgerApp) {
      setLedgerModalStatus(true)
      let signResult
      let postRes
      if (sendAction === DAppActions.mina_sendPayment) {
        signResult = await requestSignPayment(ledgerApp, params, currentAccount.hdPath)

        const { signature, payload, error } = signResult
        if (error) {
          setLedgerModalStatus(false)
          Toast.info(error.message)
          return
        }
        postRes = await sendTx(payload, { rawSignature: signature }).catch(error => error)

      } else if (sendAction === DAppActions.mina_sendStakeDelegation) {
        signResult = await requestSignDelegation(ledgerApp, params, currentAccount.hdPath)

        const { signature, payload, error } = signResult
        if (error) {
          setLedgerModalStatus(false)
          Toast.info(error.message)
          return
        }
        postRes = await sendStakeTx(payload, { rawSignature: signature }).catch(error => error)
      }

      setLedgerModalStatus(false)
      onSubmitSuccess(postRes, "ledger")
    }
  }, [signParams, currentAccount])

  const clickNextStep = useCallback(() => {
    let { params } = signParams
    let vaildNonce = nonceValue || netAccount.inferredNonce
    let nonce = trimSpace(vaildNonce)

    let toAddress = ''
    let fee = ""
    let memo = ""
    if(SIGN_MESSAGE_EVENT.indexOf(signParams.sendAction) === -1){
      toAddress = trimSpace(params.to)
      fee = trimSpace(feeValue)
      memo =  params?.feePayer?.memo || params?.memo || ""
    }
    let fromAddress = currentAccount.address
    let payload = {
      fromAddress, toAddress, nonce, currentAccount, fee, memo
    }
    if(SIGN_MESSAGE_EVENT.indexOf(signParams.sendAction) !== -1){ 
      payload.message = params.message
    }
    if (signParams.sendAction === DAppActions.mina_sendPayment) {
      let amount = trimSpace(params.amount)
      amount = toNonExponential(new BigNumber(amount).toString())
      payload.amount = amount
    }
    if(signParams.sendAction === DAppActions.mina_sendTransaction){
      payload.transaction = params.transaction
      memo = params.feePayer?.memo || ""
    }
    if (currentAccount.type === ACCOUNT_TYPE.WALLET_LEDGER) {
      return ledgerTransfer(payload)
    }
    setBtnLoading(true)
    let connectAction = QA_SIGN_TRANSTRACTION
    if(signParams.sendAction === DAppActions.mina_signFields){
      connectAction = WALLET_SEND_FIELDS_MESSAGE_TRANSTRACTION
    }
    if(signParams.sendAction === DAppActions.mina_sign_JsonMessage){
      payload.sendAction = DAppActions.mina_signMessage
    }else{
      payload.sendAction = signParams.sendAction
    }
    
    sendMsg({
      action: connectAction,
      payload
    }, (data) => {
      setBtnLoading(false)
      onSubmitSuccess(data)
    })

  }, [currentAccount, signParams, nonceValue, feeValue, onSubmitSuccess, netAccount])

  const onConfirm = useCallback(() => {
    let params = signParams.params
    if (SIGN_MESSAGE_EVENT.indexOf(signParams.sendAction) == -1 && signParams.sendAction !== DAppActions.mina_sendTransaction ){
      let toAddress = trimSpace(params.to)
      if (!addressValid(toAddress)) {
        Toast.info(i18n.t('sendAddressError'))
        return
      }
    }
    if (signParams.sendAction === DAppActions.mina_sendPayment) {
      let amount = trimSpace(params.amount)
      if (!isNumber(amount) || !new BigNumber(amount).gt(0)) {
        Toast.info(i18n.t('amountError'))
        return
      }
    }
    let vaildNonce = nonceValue || netAccount.inferredNonce
    let nonce = trimSpace(vaildNonce) || ""
    if (nonce.length > 0 && !isNumber(nonce)) {
      Toast.info(i18n.t('waitNonce'))
      return
    }
    let fee = trimSpace(feeValue)
    if (fee.length > 0 && !isNumber(fee)) {
      Toast.info(i18n.t('inputFeeError'))
      return
    }
    if(SIGN_MESSAGE_EVENT.indexOf(signParams.sendAction)===-1){
      let amount = trimSpace(params.amount)
      let maxAmount = new BigNumber(amount).plus(fee).toString()
      if (new BigNumber(maxAmount).gt(balance)) {
        Toast.info(i18n.t('balanceNotEnough'))
        return
      }
    }
    clickNextStep()
  }, [i18n, currentAccount, signParams, balance, nonceValue, netAccount, feeValue, clickNextStep, goToHome])

  const onClickUnLock = useCallback(() => {
    setLockStatus(true)
  }, [currentAccount, params])

  const onClickAdvance = useCallback(() => {
    setAdvanceStatus(state => !state)
  }, [])
  const onClickClose = useCallback(() => {
    setAdvanceStatus(false)
  }, [])

  const [advanceFee, setAdvanceFee] = useState("")
  const [advanceNonce, setAdvanceNonce] = useState("")


  const onFeeInput = useCallback((e) => {
    setAdvanceFee(e.target.value)
    if (BigNumber(e.target.value).gt(10)) {
      setFeeErrorTip(i18n.t('feeTooHigh'))
    } else {
      setFeeErrorTip("")
    }
  }, [i18n])
  const onNonceInput = useCallback((e) => {
    setAdvanceNonce(e.target.value)
  }, [])



  const onConfirmAdvance = useCallback(() => {
    if (advanceFee) {
      setCustomFeeStatus(true)
      setFeeValue(advanceFee)
    }
    if (advanceNonce) {
      setNonceValue(advanceNonce)
    }
    setAdvanceStatus(false)
  }, [advanceFee, advanceNonce])

  const fetchAccountInfo = useCallback(async () => {
    let account = await getBalance(currentAddress)
    if (account.publicKey) {
      dispatch(updateNetAccount(account))
    }
    Loading.hide()
  }, [dispatch, currentAddress])

  useEffect(()=>{
    if(!feeDefault){
      if (netFeeList.length >= 1) {
        setFeeDefault(netFeeList[1].value)
      }
    }
  },[netFeeList,feeDefault])

  const getSignParams = useCallback(() => {
    sendMsg({
      action: GET_SIGN_PARAMS,
      payload: {
        openId: params.openId
      }
    }, (res) => {
      if(SIGN_MESSAGE_EVENT.indexOf(res.params?.action) === -1){
        Loading.show()
      }
      let siteFee = res.params?.feePayer?.fee || res.params?.fee || ""
      let siteRecommendFee = isNumber(siteFee) ? siteFee + "" : ""

      checkFeeHigh()

      setSignParams({
        site: res.site,
        params: res.params,
        sendAction: res.params.action,
        siteRecommendFee: siteRecommendFee,
      })

      fetchAccountInfo()
    })
  }, [params, fetchAccountInfo])

  useEffect(() => {
    sendMsg({
      action: WALLET_GET_CURRENT_ACCOUNT,
    }, async (currentAccount) => {
      setLockStatus(currentAccount.isUnlocked)
    })

    getSignParams()
  }, [])

  const getContractAddress = useCallback((tx)=>{
    try {
      let address
      if(tx){
        let realTx = JSON.parse(tx)
        let firstZKapp = realTx?.accountUpdates.find(update=>update.authorization.proof!==undefined)
        if(firstZKapp === undefined){
        }else{
          address = firstZKapp.body.publicKey
        }
      }
      return address
    } catch (error) {
        return ""
    }
   
  },[])


  const {
    showAccountAddress, toAmount, realToAddress,showToAddress, memo, content, tabInitId, tabList,pageTitle
  } = useMemo(() => {
    let showAccountAddress = addressSlice(currentAccount.address, 6, 6)
    let params = signParams?.params
    let toAmount = params?.amount || ""
    toAmount = toAmount +" "+ cointypes.symbol

    let partyContractAddress = getContractAddress(params?.transaction)
    let realToAddress = partyContractAddress||params?.to || ""
    let showToAddress = addressSlice(realToAddress, 6)

    let memo =  params?.feePayer?.memo || params?.memo || ""
    let content = params?.message || ""
    if(signParams.sendAction === DAppActions.mina_sendTransaction){
      content = toPretty(params?.transaction)
    }else if(signParams.sendAction === DAppActions.mina_signFields){
      content = JSON.stringify(content)
    }else if(signParams.sendAction === DAppActions.mina_sign_JsonMessage){
      try {
        content = JSON.parse(content)  
      } catch (error) {}
    }

    let tabList = []
    let tabInitId = ""
    if (content) {
      let contentObj = { id: "tab1", label: i18n.t('content'), content: content }
      if(signParams.sendAction === DAppActions.mina_sendTransaction){
        contentObj.isJsonData = true
      }else if(signParams.sendAction === DAppActions.mina_sign_JsonMessage){
        contentObj.isJsonData = true
      }
      tabList.push(contentObj)
      tabInitId = "tab1"
    }
    if (memo) {
      tabList.push({ id: "tab2", label: "Memo", content: memo })
      if (!content) {
        tabInitId = "tab2"
      }
    }
    let pageTitle = i18n.t('confirmTransaction')
    if(SIGN_MESSAGE_EVENT.indexOf(signParams.sendAction) !==-1){
      pageTitle = i18n.t('signatureRequest')
    }

    return {
      showAccountAddress, toAmount, realToAddress,showToAddress, memo, content, tabInitId, tabList,pageTitle
    }
  }, [currentAccount, signParams, i18n])




  useEffect(() => {
    if (customFeeStatus) {
      setFeeType(FeeTypeEnum.custom)
      return
    }
    if (signParams?.siteRecommendFee) {
      setFeeType(FeeTypeEnum.site)
      setFeeValue(signParams.siteRecommendFee)
      return
    }
    if (feeDefault) {
      setFeeType(FeeTypeEnum.default)
      setFeeValue(feeDefault)
    }
  }, [signParams, feeDefault, feeValue, customFeeStatus])

  const checkFeeHigh = useCallback(() => {
    let checkFee = ""
    if (customFeeStatus) {
      checkFee = feeValue
    } else {
      checkFee = signParams.siteRecommendFee
    }
    if (BigNumber(checkFee).gt(10)) {
      setFeeErrorTip(i18n.t('feeTooHigh'))
    } else {
      setFeeErrorTip("")
    }
  }, [feeValue, i18n, signParams, customFeeStatus])

  useEffect(() => {
    checkFeeHigh()
  }, [feeValue])

    const onClickContent = useCallback((clickAble)=>{
      if(clickAble){
        let data = signParams?.params?.transaction
        if(data){
          let res = JSON.parse(data)
          exportFile(JSON.stringify(res,null,2),"zkapp_command.json")
        }
      }
  },[signParams])
  if (!lockStatus) {
    return <LockPage onDappConfirm={true} onClickUnLock={onClickUnLock} history={history} />;
  }
  return (<div className={styles.conatiner}>
    <div className={styles.titleRow}>
      <p className={styles.title}>
        {pageTitle}
      </p>
      <div className={styles.netContainer}>
        <div className={styles.dot} />
        <p className={styles.netContent}>{currentConfig.name}</p>
      </div>
    </div>
    <div className={styles.content}>
      <div className={styles.websiteContainer}>
        <DappWebsite siteIcon={signParams?.site?.webIcon} siteUrl={signParams?.site?.origin} />
      </div>
      {SIGN_MESSAGE_EVENT.indexOf(signParams?.sendAction) !==-1 ?
        <CommonRow 
          leftTitle={currentAccount.accountName}
          leftContent={showAccountAddress}
          leftCopyContent= {currentAccount.address}
          rightTitle={i18n.t('amount')} 
          rightContent={balance + " " + cointypes.symbol} />
        :
        <>
          <CommonRow 
          leftTitle={currentAccount.accountName}
          leftContent={showAccountAddress}
          rightTitle={i18n.t('to')} 
          rightContent={showToAddress}
          leftCopyContent= {currentAccount.address}
          rightCopyContent ={realToAddress}
          showArrow={true}
           />
          {signParams?.sendAction === DAppActions.mina_sendPayment && <CommonRow leftTitle={i18n.t('amount')} leftContent={toAmount} />}
          <div className={styles.accountRow}>
            <div className={styles.rowLeft}>
              <p className={styles.rowTitle}>{i18n.t('transactionFee')}</p>
              <div className={styles.feeCon}>
                <p className={cls(styles.rowContent, styles.feeContent)}>{feeValue + " " + cointypes.symbol}</p>
                {feeType !== FeeTypeEnum.custom && <span className={cls(feeType === FeeTypeEnum.site ? styles.feeTypeSite : styles.feeTypeDefault)}>{feeType === FeeTypeEnum.site ? i18n.t('siteSuggested') : i18n.t('fee_default')}</span>}
              </div>
            </div>
            <div className={styles.rowRight}>
              <p className={cls(styles.rowTitle, styles.rightTitle)} />
              <p className={styles.rowPurpleContent} onClick={onClickAdvance}>{i18n.t('advanceMode')}</p>
            </div>
          </div>
          <div className={styles.highFeeTip}>{feeErrorTip}</div>
        </>}
      { 
      (tabList.length > 0) && <div className={styles.accountRow}>
        <Tabs selected={selectedTabIndex} initedId={tabInitId} onSelect={onSelectedTab}>
        {tabList.map((tab) => {
            const clickAble = tab.contentClick
            return (<div key={tab.id} id={tab.id} label={tab.label}>
              {<div onClick={()=>onClickContent(clickAble)} className={cls(styles.tabContent,{
                [styles.clickCss]:clickAble
              })}>
                {tab.isJsonData ? <TypeRowInfo data={tab.content}/> :tab.content}
              </div>}
            </div>)
          })}
        </Tabs>
      </div>}
    </div>


    <div className={styles.btnGroup}>
      <Button
        onClick={onCancel}
        theme={button_theme.BUTTON_THEME_LIGHT}
        size={button_size.middle}>{i18n.t('cancel')}</Button>
      <Button
        loading={btnLoading}
        size={button_size.middle}
        onClick={onConfirm}
      >{i18n.t('confirm')}</Button>
    </div>
    <DAppAdvance
      modalVisable={advanceStatus}
      title={i18n.t('advanceMode')}
      onClickClose={onClickClose}
      feeValue={advanceFee}
      feePlaceHolder={feeValue}
      onFeeInput={onFeeInput}
      nonceValue={advanceNonce}
      onNonceInput={onNonceInput}
      onConfirm={onConfirmAdvance}
      feeErrorTip={feeErrorTip}
    />
    <ConfirmModal
      modalVisable={ledgerModalStatus}
      title={i18n.t('transactionDetails')}
      waitingLedger={ledgerModalStatus} />
  </div>)
}

const CommonRow = ({
  leftTitle = "",
  leftContent = "",
  leftDescContent = "",
  rightTitle = " ",
  rightContent = "",
  leftCopyContent="",
  rightCopyContent="",
  showArrow = false
}) => {
  const {leftCopyAble,rightCopyAble} = useMemo(()=>{
    const leftCopyAble = !!leftCopyContent
    const rightCopyAble = !!rightCopyContent
    return {
      leftCopyAble,rightCopyAble
    }
  },[leftCopyContent,rightCopyContent])

  const onClickLeft = useCallback(()=>{
    if(leftCopyAble){
      copyText(leftCopyContent).then(() => {
        Toast.info(i18n.t('copySuccess'))
      })
    }
  },[leftCopyAble,leftCopyContent,i18n])
  const onClickRight = useCallback(()=>{
    if(rightCopyAble){
      copyText(rightCopyContent).then(() => {
        Toast.info(i18n.t('copySuccess'))
      })
    }
  },[rightCopyAble,rightCopyContent,i18n])

  return (<div className={styles.accountRow}>
    <div className={styles.rowLeft}>
      <p className={styles.rowTitle}>{leftTitle}</p>
      <p className={cls(styles.rowContent,{
        [styles.copyCss]:leftCopyAble
      })} onClick={onClickLeft}>{leftContent}<span className={styles.rowDescContent}>{leftDescContent}</span></p>
    </div>
    {showArrow && <div className={styles.rowArrow}>
      <img src='/img/icon_arrow_purple.svg'/>
    </div>}
    <div className={styles.rowRight}>
      <p className={cls(styles.rowTitle, styles.rightTitle)}>{rightTitle}</p>
      <p className={cls(styles.rowContent,{
        [styles.copyCss]:rightCopyAble
      })} onClick={onClickRight}>{rightContent}</p>
    </div>
  </div>)
}
export default SignTransaction