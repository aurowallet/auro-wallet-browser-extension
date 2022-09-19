import cls from "classnames";
import i18n from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import 'react-circular-progressbar/dist/styles.css';
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from 'react-router-dom';
import { getStakingList } from "../../../reducers/stakingReducer";
import { addressSlice } from "../../../utils/utils";
import Toast from "../../component/Toast";
import Button from "../../component/Button";
import CustomView from "../../component/CustomView";
import styles from './index.module.scss';
import Input from "../../component/Input";

const StakingList = ({ }) => {

  const history = useHistory()
  const dispatch = useDispatch()
  const stakingList = useSelector(state => state.staking.stakingList)

  const [keywords, setKeywords] = useState("")
  const [currentSelectAddress, setCurrentSelectAddress] = useState(() => {
    let delegatedAddress = history.location?.params?.nodeAddress ?? "";
    return delegatedAddress
  })

  const [fromPage,] = useState(() => {
    let fromPage = history.location?.params?.fromPage ?? "";
    return fromPage
  })

  const onChange = useCallback((e) => {
    setKeywords(e.target.value)
  }, [])


  const onClickRow = useCallback((nodeItem) => {
    setCurrentSelectAddress(nodeItem.nodeAddress)
  }, [])

  const onClickManual = useCallback(() => {
    history.push({
      pathname: "/staking_transfer",
      params: {
        menuAdd: true
      }
    });
  }, [])

  const onConfirm = useCallback(() => {
    let nodeParams = null;
    if (currentSelectAddress) {
      let node = stakingList.find(n => n.nodeAddress === currentSelectAddress);
      if (node) {
        nodeParams = node;
      }
    }
    if (!nodeParams) {
      Toast.info(i18n.t('selectNode'))
      return;
    }

    if (fromPage === 'stakingTransfer') {
      history.replace({
        pathname: "/staking_transfer",
        params: nodeParams
      });
    } else {
      history.push({
        pathname: "/staking_transfer",
        params: nodeParams
      });
    }

  }, [currentSelectAddress, stakingList, fromPage])

  useEffect(() => {
    dispatch(getStakingList())
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
      </div>
    </div>
    <div className={cls(styles.bottomContainer)}>
      <Button
        onClick={onConfirm}>
        {i18n.t('next')}
      </Button>
    </div>
  </CustomView>)
}

const NodeItem = ({
  onClickRow,
  nodeItem,
  currentSelectAddress,
}) => {
  const {
    select, showName, showAddress
  } = useMemo(() => {
    let select = nodeItem.nodeAddress === currentSelectAddress

    let showName = nodeItem.nodeName || addressSlice(nodeItem.nodeAddress, 8)
    let showAddress = addressSlice(nodeItem.nodeAddress, 10)
    return {
      select, showName, showAddress
    }
  }, [nodeItem, currentSelectAddress])

  return (<div className={styles.rowContainer}>
    <div className={cls(styles.nodeItemContainer, {
    })} onClick={() => onClickRow(nodeItem)}>
      <div className={styles.rowleft}>
        <div className={styles.rowTopContainer}>
          <p className={styles.nodeName}>{showName}</p>
        </div>
        <p className={styles.nodeAddress}>{showAddress}</p>
        <div className={styles.stakeRow}>
          <p className={styles.numberTitle}>{i18n.t("stake")} <span className={styles.numberContent}> {nodeItem.totalStake}</span></p>
          <p className={styles.numberTitle}>{i18n.t("users")} <span className={styles.numberContent}> {nodeItem.delegations}</span></p>
        </div>
      </div>
      <div className={styles.rowRight}>
        {select && <img src="/img/icon_checked.svg" className={styles.checkedIcon} />}
      </div>
    </div>
  </div>)
}

export default StakingList

