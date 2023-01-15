import BigNumber from "bignumber.js";
import cls from "classnames";
import i18n from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from 'react-router-dom';
import { cointypes } from "../../../../config";
import { getBalance, getFeeRecom, sendTx } from "../../../background/api";
import { WALLET_CHECK_TX_STATUS, WALLET_SEND_TRANSTRACTION } from "../../../constant/types";
import { ACCOUNT_TYPE } from "../../../constant/walletType";
import { updateNetAccount, updateShouldRequest } from "../../../reducers/accountReducer";
import { updateAddressBookFrom, updateAddressDetail } from "../../../reducers/cache";
import { sendMsg } from "../../../utils/commonMsg";
import { checkLedgerConnect, requestSignPayment } from "../../../utils/ledger";
import { getDisplayAmount, getRealErrorMsg, isNumber, isTrueNumber, trimSpace } from "../../../utils/utils";
import { addressValid } from "../../../utils/validator";
import AdvanceMode from "../../component/AdvanceMode";
import Button from "../../component/Button";
import { ConfirmModal } from "../../component/ConfirmModal";
import CustomView from "../../component/CustomView";
import FeeGroup from "../../component/FeeGroup";
import Input from "../../component/Input";
import Toast from "../../component/Toast";
import styles from "./index.module.scss";


const SendPage = ({ }) => {

  const dispatch = useDispatch()
  const history = useHistory()

  const localCache = useSelector(state => state.cache)
  const balance = useSelector(state => state.accountInfo.balance)
  const netAccount = useSelector(state => state.accountInfo.netAccount)
  const currentAccount = useSelector(state => state.accountInfo.currentAccount)
  const currentAddress = useSelector(state => state.accountInfo.currentAccount.address)

  const {
    addressDetail
  } = useMemo(() => {
    let addressDetail = localCache.addressDetail
    return {
      addressDetail
    }
  }, [localCache])



  useEffect(() => {
    dispatch(updateAddressDetail(""))
  }, [history]);

  const [toAddress, setToAddress] = useState(addressDetail.address || "")
  const [toAddressName, setToAddressName] = useState(addressDetail.name || "")

  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')
  const [feeAmount, setFeeAmount] = useState(0.1)
  const [inputedFee, setInputedFee] = useState("")
  const [inputNonce, setInputNonce] = useState("")
  const [feeErrorTip, setFeeErrorTip] = useState("")


  const [netFeeList, setNetFeeList] = useState([])
  const [isOpenAdvance, setIsOpenAdvance] = useState(false)
  const [confrimModalStatus, setConfrimModalStatus] = useState(false)
  const [confrimBtnStatus, setConfrimBtnStatus] = useState(false)
  const [realTransferAmount, setRealTransferAmount] = useState("")
  const [waintLedgerStatus, setWaintLedgerStatus] = useState(false)

  const [contentList, setContentList] = useState([])
  const [btnDisableStatus,setBtnDisableStatus] = useState(true)


  const onToAddressInput = useCallback((e) => {
    setToAddress(e.target.value)
  }, [])
  const onAmountInput = useCallback((e) => {
    setAmount(e.target.value)
  }, [])
  const onMemoInput = useCallback((e) => {
    setMemo(e.target.value)
  }, [])


  const onClickAddressBook = useCallback(() => {
    dispatch(updateAddressBookFrom("send"))
    history.push("/address_book")
  }, [])

  const onClickAll = useCallback(() => {
    setAmount(balance)
  }, [balance])

  const onClickFeeGroup = useCallback((item) => {
    setFeeAmount(item.fee)
  }, [])


  const fetchFeeData = useCallback(async () => {
    let feeRecom = await getFeeRecom()
    if (feeRecom.length > 0) {
      setNetFeeList(feeRecom)
      setFeeAmount(feeRecom[1].value)
    }
  }, [])

  const fetchAccountInfo = useCallback(async () => {
    let account = await getBalance(currentAddress)
    if (account.publicKey) {
      dispatch(updateNetAccount(account))
    }
  }, [dispatch, currentAddress])

  useEffect(() => {
    fetchAccountInfo()
    fetchFeeData()
  }, [])

  const onClickAdvance = useCallback(() => {
    setIsOpenAdvance(state => !state)
  }, [])

  const onFeeInput = useCallback((e) => {
    setFeeAmount(e.target.value)
    setInputedFee(e.target.value)
    if (BigNumber(e.target.value).gt(10)) {
      setFeeErrorTip(i18n.t('feeTooHigh'))
    } else {
      setFeeErrorTip("")
    }
  }, [i18n])
  const onNonceInput = useCallback((e) => {
    setInputNonce(e.target.value)
  }, [])

  const isAllTransfer = useCallback(() => {
    return new BigNumber(amount).isEqualTo(balance)
  }, [amount, balance])

  const getRealTransferAmount = useCallback(() => {
    let fee = trimSpace(feeAmount)
    let realAmount = 0
    if (isAllTransfer()) {
      realAmount = new BigNumber(amount).minus(fee).toNumber()
    } else {
      realAmount = new BigNumber(amount).toNumber()
    }
    return realAmount
  }, [feeAmount, amount])

  useEffect(() => {
    setRealTransferAmount(getRealTransferAmount())
  }, [feeAmount, amount, getRealTransferAmount])


  const onSubmitTx = useCallback((data, type) => {
    if (data.error) {
      let errorMessage = i18n.t('postFailed')
      let realMsg = getRealErrorMsg(data.error)
      errorMessage = realMsg ? realMsg : errorMessage
      Toast.info(errorMessage, 5 * 1000)
      return
    }
    let detail = data.sendPayment && data.sendPayment.payment || {}
    dispatch(updateShouldRequest(true, true))
    if (type === "ledger") {
      sendMsg({
        action: WALLET_CHECK_TX_STATUS,
        payload: {
          paymentId: detail.id,
          hash: detail.hash,
        }
      }, () => { })
    }

    setConfrimModalStatus(false)
    history.goBack()

  }, [i18n])

  useEffect(() => {
    if (!confrimModalStatus) {
      setWaintLedgerStatus(false)
    }
  }, [confrimModalStatus])
  const ledgerTransfer = useCallback(async (params) => {
    const { ledgerApp } = await checkLedgerConnect()
    if (ledgerApp) {
      setWaintLedgerStatus(true)
      const { signature, payload, error, rejected } = await requestSignPayment(ledgerApp, params, currentAccount.hdPath)
      if (rejected) {
        setConfrimModalStatus(false)
      }
      if (error) {
        Toast.info(error.message)
        return
      }
      let postRes = await sendTx(payload, { rawSignature: signature }).catch(error => error)
      setConfrimModalStatus(false)

      onSubmitTx(postRes, "ledger")
    }
  }, [currentAccount, onSubmitTx])

  const clickNextStep = useCallback(() => {
    let fromAddress = currentAddress
    let toAddressValue = trimSpace(toAddress)
    let amount = getRealTransferAmount()
    let nonce = trimSpace(inputNonce) || netAccount.inferredNonce
    let realMemo = memo || ""
    let fee = trimSpace(feeAmount)
    let payload = {
      fromAddress, toAddress: toAddressValue, amount, fee, nonce, memo: realMemo
    }
    if (currentAccount.type === ACCOUNT_TYPE.WALLET_LEDGER) {
      return ledgerTransfer(payload)
    }

    setConfrimBtnStatus(true)
    sendMsg({
      action: WALLET_SEND_TRANSTRACTION,
      payload
    }, (data) => {
      setConfrimBtnStatus(false)
      onSubmitTx(data)
    })

  }, [getRealTransferAmount, onSubmitTx, ledgerTransfer,
    currentAccount, currentAddress, netAccount, toAddress, inputNonce, memo, feeAmount])

  const onClickClose = useCallback(() => {
    setConfrimModalStatus(false)
  }, [])


  const onConfirm = useCallback(() => {
    let toAddressValue = trimSpace(toAddress)
    if (!addressValid(toAddressValue)) {
      Toast.info(i18n.t('sendAddressError'))
      return
    }
    let amountValue = trimSpace(amount)
    if (!isNumber(amountValue) || !new BigNumber(amountValue).gte(0)) {
      Toast.info(i18n.t('amountError'))
      return
    }
    let inputFee = trimSpace(feeAmount)
    if (inputFee.length > 0 && !isNumber(inputFee)) {
      Toast.info(i18n.t('inputFeeError'))
      return
    }

    if (isAllTransfer()) {
      let maxAmount = getRealTransferAmount()
      if (new BigNumber(maxAmount).lt(0)) {
        Toast.info(i18n.t('balanceNotEnough'))
        return
      }
    } else {
      let maxAmount = new BigNumber(amount).plus(inputFee).toString()
      if (new BigNumber(maxAmount).gt(balance)) {
        Toast.info(i18n.t('balanceNotEnough'))
        return
      }
    }
    let nonce = trimSpace(inputNonce)
    if (nonce.length > 0 && !isTrueNumber(nonce)) {
      Toast.info(i18n.t('inputNonceError'))
      return
    }

    let list = [
      {
        label: i18n.t('to'),
        value: toAddress,
      },
      {
        label: i18n.t('from'),
        value: currentAddress,
      },
      {
        label: i18n.t('fee'),
        value: inputFee +" "+ cointypes.symbol,
      }
    ]
    if (isTrueNumber(nonce)) {
      list.push({
        label: "Nonce",
        value: nonce,
      })
    }
    if (memo) {
      list.push({
        label: "Memo",
        value: memo,
      })
    }

    setContentList(list)
    setConfrimModalStatus(true)

  }, [i18n, toAddress, amount, feeAmount, balance, inputNonce, currentAddress, memo, isAllTransfer, getRealTransferAmount, clickNextStep])

 
  useEffect(()=>{
    if(trimSpace(toAddress).length>0 && trimSpace(amount).length>0){
      setBtnDisableStatus(false)
    }else{
      setBtnDisableStatus(true)
    }
    
  },[toAddress,amount])
  return (<CustomView title={i18n.t('send')} contentClassName={styles.container}>
    <div className={styles.contentContainer}>
      <div className={styles.inputContainer}>
        <Input
          label={i18n.t('to')}
          onChange={onToAddressInput}
          value={toAddress}
          inputType={'text'}
          subLabel={toAddressName}
          placeholder={i18n.t('address')}
          rightComponent={<div onClick={onClickAddressBook} className={styles.addressBook}>{i18n.t('addressBook')}</div>}
        />
        <Input
          label={i18n.t('amount')}
          onChange={onAmountInput}
          value={amount}
          inputType={'number'}
          placeholder={0}
          rightComponent={<div className={styles.balance}>
            {i18n.t('balance') + ": " + getDisplayAmount(balance, cointypes.decimals)}
          </div>}
          rightStableComponent={
            <div onClick={onClickAll} className={styles.max}>{i18n.t('max')}</div>
          }
        />
        <Input
          label={i18n.t('memo')}
          onChange={onMemoInput}
          value={memo}
          inputType={'text'}
        />
      </div>
      <div className={styles.feeContainer}>
        <FeeGroup onClickFee={onClickFeeGroup} currentFee={feeAmount} netFeeList={netFeeList} />
      </div>

      <div className={styles.dividedLine}>
        <p className={styles.dividedContent}>-</p>
      </div>

      <div>
        <AdvanceMode
          onClickAdvance={onClickAdvance}
          isOpenAdvance={isOpenAdvance}
          feeValue={inputedFee}
          feePlaceholder={feeAmount}
          onFeeInput={onFeeInput}
          feeErrorTip={feeErrorTip}

          nonceValue={inputNonce}
          onNonceInput={onNonceInput}
        />
      </div>
      <div className={styles.hold} />
    </div>
    <div className={cls(styles.bottomContainer)}>
      <Button
        disable={btnDisableStatus}
        onClick={onConfirm}>
        {i18n.t('next')}
      </Button>
    </div>

    <ConfirmModal
      modalVisable={confrimModalStatus}
      title={i18n.t('transactionDetails')}
      highlightTitle={i18n.t(('amount'))}
      highlightContent={realTransferAmount}
      subHighlightContent={cointypes.symbol}
      onConfirm={clickNextStep}
      loadingStatus={confrimBtnStatus}
      onClickClose={onClickClose}
      waitingLedger={waintLedgerStatus}
      contentList={contentList}/>
  </CustomView>)
}

export default SendPage