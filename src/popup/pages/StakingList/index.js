import cls from "classnames";
import i18n from "i18next";
import { useCallback, useMemo, useState } from "react";
import 'react-circular-progressbar/dist/styles.css';
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from 'react-router-dom';
import { MAIN_COIN_CONFIG } from "../../../constant";
import { NET_CONFIG_TYPE } from "../../../constant/network";
import { addressSlice, getAmountForUI, showNameSlice } from "../../../utils/utils";
import CustomView from "../../component/CustomView";
import Input from "../../component/Input";
import styles from './index.module.scss';

const StakingList = ({ }) => {

  const history = useHistory()
  const dispatch = useDispatch()
  const netType = useSelector(state => state.network.currentConfig.netType)
  const stakingList = useSelector(state => {
    if(netType === NET_CONFIG_TYPE.Mainnet){
      return state.staking.stakingList
    }
    return []
  })

  const [keywords, setKeywords] = useState("")
  const [currentSelectAddress, setCurrentSelectAddress] = useState("")

  const [fromPage,] = useState(() => {
    let fromPage = history.location?.params?.fromPage ?? "";
    return fromPage
  })

  const onChange = useCallback((e) => {
    setKeywords(e.target.value)
  }, [])


  const onClickRow = useCallback((nodeItem) => {
    setCurrentSelectAddress(nodeItem.nodeAddress)
    let nextParams = {
      pathname: "/staking_transfer",
      params: nodeItem
    }
    if (fromPage === 'stakingTransfer') {
      history.replace(nextParams);
    } else {
      history.push(nextParams);
    }
  }, [fromPage])

  const onClickManual = useCallback(() => {
    history.push({
      pathname: "/staking_transfer",
      params: {
        menuAdd: true
      }
    });
  }, [])

  return (<CustomView
    title={i18n.t('blockProducers')}
    contentClassName={styles.contentClassName}>
    <div className={styles.inputCon}>
      <Input
        showSearchIcon
        onChange={onChange}
        value={keywords}
        placeholder={i18n.t('searchPlaceholder')}
        customInputContainer={styles.customInputContainer}
        className={styles.customInput}
      />
    </div>
    <div className={styles.listContainer}>
      {
        stakingList.filter(((node) => {
          if (keywords) {
            const keywordsLS = keywords.toLowerCase();
            const addressFlag = node.nodeAddress.toLowerCase().indexOf(keywordsLS) >= 0;
            let nameFlag = false;
            if (node.nodeName) {
              nameFlag = node.nodeName.toLowerCase().indexOf(keywordsLS) >= 0;
            }
            return addressFlag || nameFlag;
          }
          return true;
        })).map((nodeItem, index) => {
          return <NodeItem key={index} nodeItem={nodeItem} onClickRow={onClickRow} currentSelectAddress={currentSelectAddress} />
        })
      }
      <div className={styles.manualAddContainer} >
        <p onClick={onClickManual} className={styles.manualAddContent}>{i18n.t('manualAdd')}</p>
        <a href={"https://github.com/aurowallet/launch/tree/master/validators"} 
          target="_blank"
          className={styles.manualSubmit}>
          {i18n.t("submitNode")}
          </a>
      </div>
    </div>
  </CustomView>)
}

const NodeItem = ({
  onClickRow,
  nodeItem,
  currentSelectAddress,
}) => {
  const delegationKey = useSelector(state => state.staking.delegationKey)
  const {
    select, showName, showAddress,isChecked
  } = useMemo(() => {
    let select = nodeItem.nodeAddress === currentSelectAddress

    let showName = nodeItem.nodeName
    if(showName.length>=16){
      showName = showNameSlice(nodeItem.nodeName,16)
    }
    let showAddress = addressSlice(nodeItem.nodeAddress, 6)
    let isChecked = delegationKey === nodeItem.nodeAddress
    return {
      select, showName, showAddress,isChecked
    }
  }, [nodeItem, currentSelectAddress,i18n,delegationKey])
  return(<div className={styles.rowContainer}>
     <div className={cls(styles.nodeItemContainer, {
      [styles.selectedBorder]:select
    })} onClick={() => onClickRow(nodeItem)}>
      <div className={styles.rowleft}>
          <NodeIcon nodeItem={nodeItem}/>
          <div className={styles.nodeInfoCon}>
            <p className={styles.nodeName}>{showName}</p>
            <p className={styles.nodeAddress}>{showAddress}</p>
          </div>
      </div>
      {isChecked && <div className={styles.rowRight}> 
         <img src="/img/icon_checked.svg" />
      </div>}
    </div>
  </div>)
}

const NodeIcon = ({nodeItem})=>{
  const [showHolderIcon,setShowHolderIcon] = useState(!nodeItem.icon)
  
  const holderIconName = useMemo(()=>{
    let showIdentityName = nodeItem.nodeName.slice(0,1)||""
    showIdentityName = showIdentityName.toUpperCase()
    return showIdentityName
  },[nodeItem])

  const onLoadError = useCallback(()=>{
    setShowHolderIcon(true)
  },[])
  return(<div className={styles.iconCon}>
    {showHolderIcon ?
    <div className={styles.holderIconCon}>
      {holderIconName}
    </div>:
     <img src={nodeItem.icon} className={styles.nodeIcon} onError={onLoadError}/>}
  </div>)
}

export default StakingList

