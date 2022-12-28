import BigNumber from "bignumber.js";
import cls from "classnames";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getBalance, getFeeRecom, sendStakeTx } from "../../../background/api";
import i18n from "i18next";
import { useHistory } from 'react-router-dom';
import AdvanceMode from "../../component/AdvanceMode";
import Button from "../../component/Button";
import { ConfirmModal } from "../../component/ConfirmModal";
import CustomView from "../../component/CustomView";
import FeeGroup from "../../component/FeeGroup";
import Input from "../../component/Input";
import styles from "./index.module.scss";
import { updateNetAccount } from '../../../reducers/accountReducer';
import { addressSlice, getRealErrorMsg, isNumber, isTrueNumber, trimSpace } from "../../../utils/utils";
import { addressValid } from "../../../utils/validator";

import { cointypes } from "../../../../config";
import { WALLET_CHECK_TX_STATUS, WALLET_SEND_STAKE_TRANSTRACTION } from "../../../constant/types";
import { sendMsg } from "../../../utils/commonMsg";
import Toast from "../../component/Toast";
import { checkLedgerConnect, requestSignDelegation } from "../../../utils/ledger";
import { ACCOUNT_TYPE } from "../../../constant/walletType";

const StakingTransfer = () => { 
  const dispatch = useDispatch()
  const history = useHistory()

  const balance = useSelector(state => state.accountInfo.balance)
  const currentAccount = useSelector(state => state.accountInfo.currentAccount)
  const netAccount = useSelector(state => state.accountInfo.netAccount)

  const {
    menuAdd, nodeName, nodeAddress, showNodeName
  } = useMemo(() => {
    let params = history.location?.params

    let menuAdd = !!params.menuAdd
    let nodeName = params.nodeName
    let nodeAddress = params.nodeAddress

    let showNodeName = nodeName || addressSlice(nodeAddress, 8)
    return {
      menuAdd, nodeName, nodeAddress, showNodeName
    }
  }, [history])


  const [blockAddress, setBlockAddress] = useState("")

  const [memo, setMemo] = useState('')
  const [feeAmount, setFeeAmount] = useState(0.1)
  const [inputedFee, setInputedFee] = useState("")
  const [inputNonce, setInputNonce] = useState("")
  const [feeErrorTip, setFeeErrorTip] = useState("")
  const [netFeeList, setNetFeeList] = useState([])
  const [isOpenAdvance, setIsOpenAdvance] = useState(false)
  const [confrimModalStatus, setConfrimModalStatus] = useState(false)
  const [confrimBtnStatus, setConfrimBtnStatus] = useState(false)
  const [contentList, setContentList] = useState([])

  const [waintLedgerStatus, setWaintLedgerStatus] = useState(false)
  const [btnDisableStatus,setBtnDisableStatus] = useState(()=>{
    if(menuAdd){
      return true
    }
    return false
  })




  const onBlockAddressInput = useCallback((e) => {
    setBlockAddress(e.target.value)
  }, [])

  const onMemoInput = useCallback((e) => {
    setMemo(e.target.value)
  }, [])
  const onClickFeeGroup = useCallback((item) => {
    setFeeAmount(item.fee)
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
  }, [])
  const onNonceInput = useCallback((e) => {
    setInputNonce(e.target.value)
  }, [])
  const onClickClose = useCallback(() => {
    setConfrimModalStatus(false)
  }, [])

  const onSubmitSuccess = useCallback((data, type) => {
    if (data.error) {
      let errorMessage = i18n.t('postFailed')
      let realMsg = getRealErrorMsg(data.error)
      errorMessage = realMsg ? realMsg : errorMessage
      Toast.info(errorMessage, 5 * 1000)
      return
    }
    let detail = data.sendDelegation && data.sendDelegation.delegation || {}
    if (type === "ledger") {
      sendMsg({
        action: WALLET_CHECK_TX_STATUS,
        payload: {
          paymentId: detail.id,
          hash: detail.hash,
        }
      }, () => { })
    }
    history.go(-(history.length-1))
  }, [history])


  useEffect(()=>{
    if(!confrimModalStatus){
      setWaintLedgerStatus(false)
    }
  },[confrimModalStatus])

  const ledgerTransfer = useCallback(async(params)=>{
    const { ledgerApp } = await checkLedgerConnect()
    if (ledgerApp) {
      setWaintLedgerStatus(true)
      const { signature, payload, error,rejected } = await requestSignDelegation(ledgerApp, params, currentAccount.hdPath)
      if(rejected){
        setConfrimModalStatus(false)
      }
      if (error) {
        Toast.info(error.message)
        return
      }
      let postRes = await sendStakeTx(payload, { rawSignature: signature }).catch(error => error)
      onSubmitSuccess(postRes,"ledger")
    }
  },[currentAccount,onSubmitSuccess])

  const clickNextStep = useCallback(() => {
    let fromAddress = currentAccount.address
    let toAddress = nodeAddress || trimSpace(blockAddress)
    let nonce = trimSpace(inputNonce) || netAccount.inferredNonce
    let memo = memo || ""
    let fee = trimSpace(feeAmount)
    const payload = {
      fromAddress, toAddress, fee, nonce, memo
    }
    if (currentAccount.type === ACCOUNT_TYPE.WALLET_LEDGER) {
      return ledgerTransfer(payload)
    }
    setConfrimBtnStatus(true)
    sendMsg({
      action: WALLET_SEND_STAKE_TRANSTRACTION,
      payload
    }, (data) => {
      setConfrimBtnStatus(false)
      onSubmitSuccess(data)
    })
  }, [currentAccount, netAccount, inputNonce, feeAmount, blockAddress,ledgerTransfer])


  const onConfirm = useCallback(() => {
    let realBlockAddress = nodeAddress || blockAddress
    if (!addressValid(realBlockAddress)) {
      Toast.info(i18n.t('sendAddressError'))
      return
    }
    let inputFee = trimSpace(feeAmount)
    if (inputFee.length > 0 && !isNumber(inputFee)) {
      Toast.info(i18n.t('inputFeeError'))
      return
    }

    if (new BigNumber(inputFee).gt(balance)) {
      Toast.info(i18n.t('balanceNotEnough'));
      return;
    }
    let nonce = trimSpace(inputNonce)
    if (nonce.length > 0 && !isTrueNumber(nonce)) {
      Toast.info(i18n.t('inputNonceError'))
      return
    }

    let list = [
      {
        label: i18n.t('blockProducerAddress'),
        value: nodeAddress || blockAddress,
      },
      {
        label: i18n.t('from'),
        value: currentAccount.address,
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
  }, [nodeAddress, balance, feeAmount, inputNonce,
    clickNextStep, nodeName, nodeAddress, blockAddress, currentAccount, memo])


  const onClickBlockProducer = useCallback(() => {
    history.replace({
      pathname: "/staking_list",
      params: {
        nodeAddress: nodeAddress,
        fromPage: 'stakingTransfer'
      }
    });
  }, [nodeAddress])

  const fetchFeeData = useCallback(async () => {
    let feeRecom = await getFeeRecom()
    if (feeRecom.length > 0) {
      setNetFeeList(feeRecom)
      setFeeAmount(feeRecom[1].value)
    }
  }, [])

  const fetchAccountData = useCallback(async () => {
    let account = await getBalance(currentAccount.address)
    if (account.publicKey) {
      dispatch(updateNetAccount(account))
    }
  }, [currentAccount])


  useEffect(() => {
    fetchFeeData()
    fetchAccountData()
  }, [])

  useEffect(()=>{
    if(menuAdd && trimSpace(blockAddress).length === 0 ){
      setBtnDisableStatus(true)
    }else{
      setBtnDisableStatus(false)
    }
  },[menuAdd,blockAddress])
  return (<CustomView title={i18n.t('staking')} contentClassName={styles.container}>
    <div className={styles.contentContainer}>
      <div className={styles.inputContainer}>
        {menuAdd ? <Input
          label={i18n.t('blockProducer')}
          onChange={onBlockAddressInput}
          value={blockAddress}
          inputType={'text'}
        /> : <BlockProducer
          label={i18n.t('blockProducer')}
          showNodeName={showNodeName}
          onClickBlockProducer={onClickBlockProducer}
        />}
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
      highlightTitle={i18n.t(('blockProducerName'))}
      highlightContent={showNodeName || addressSlice(blockAddress, 8)}
      onConfirm={clickNextStep}
      loadingStatus={confrimBtnStatus}
      onClickClose={onClickClose}
      contentList={contentList}
      waitingLedger={waintLedgerStatus}
    />
  </CustomView>)
}


const BlockProducer = ({ label, showNodeName, onClickBlockProducer }) => {
  return (<div className={styles.nodeNameContainer} >
    <div className={styles.label}>
      <div className={styles.labelContainer}>
        <span>{label}</span>
      </div>
    </div>
    <div className={styles.rowContainer} onClick={onClickBlockProducer}>
      <p className={styles.nodeName}>{showNodeName}</p>
      <img className={styles.arrow} src={'/img/icon_arrow_unfold.svg'} />
    </div>
  </div>)
}
export default StakingTransfer