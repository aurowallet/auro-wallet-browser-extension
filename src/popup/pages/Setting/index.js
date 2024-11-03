import i18n from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from 'react-router-dom';
import { getLocal } from "../../../background/localStorage";
import { AUTO_LOCK_TIME_LIST } from "../../../constant";
import { ADDRESS_BOOK_CONFIG } from "../../../constant/storageKey";
import { DAPP_CONNECTION_LIST, WALLET_GET_LOCK_TIME } from "../../../constant/msgTypes";
import { languageOption } from "../../../i18n";
import { updateAddressBookFrom } from "../../../reducers/cache";
import { sendMsg } from "../../../utils/commonMsg";
import { fitPopupWindow } from "../../../utils/pageUtils";
import { openPopupWindow } from "../../../utils/popup";
import { showNameSlice } from "../../../utils/utils";
import CustomView from "../../component/CustomView";
import styles from './index.module.scss';

const Setting = ({ }) => {

    const currentNode = useSelector(state => state.network.currentNode)
    const currency = useSelector(state => state.currencyConfig.currentCurrency)
    const currentAddress = useSelector(state => state.accountInfo.currentAccount.address)

    const dispatch = useDispatch()
    const history = useHistory()
    const [connectCount, setConnectCount] = useState(0)
    
    const [currentLockTime, setCurrentLockTime] = useState("")


    useEffect(() => {
        sendMsg({
            action: DAPP_CONNECTION_LIST,
            payload: {
                address:currentAddress
              }
        }, (list) => {
            let connectTabId = Object.keys(list)
            setConnectCount(connectTabId.length)
        })

        sendMsg({
            action: WALLET_GET_LOCK_TIME,
        }, (time) => {
            setCurrentLockTime(time)
        })
    }, [])

    const {
        routeList, rowAbout
    } = useMemo(() => {
        

        const getAutoLockTime = () => {
            let autoLockTime = ""
            let lockTime = AUTO_LOCK_TIME_LIST.filter((time,) => {
                return time.value === currentLockTime
            })
            if (lockTime.length > 0) {
                lockTime = lockTime[0]
                autoLockTime = i18n.t(lockTime.label)
            }
            return autoLockTime
        }
        const getNetwork = () => {
            return showNameSlice(currentNode.name,12)
        }
        const getLanguage = () => {
            let currentLanguage = languageOption.filter((language) => {
                return language.key === i18n.language
            })
            let show = currentLanguage.length > 0 ? currentLanguage[0].value : ""
            return show
        }
        const getCurrency = () => {
            return currency.value
        }
        const getAddressBook = () => {
            let list = getLocal(ADDRESS_BOOK_CONFIG)

            if (list) {
                list = JSON.parse(list)
            } else {
                list = []
            }
            return list.length
        }



        const addressBookAction = () => {
            dispatch(updateAddressBookFrom(""))
        }
        let routeList = [
            {
                icon: '/img/icon_security.svg',
                title: i18n.t('security'),
                targetRoute: "security_page",
            },
            {
                icon: '/img/icon_connect.svg',
                title: i18n.t('appConnection'),
                targetRoute: "app_connection",
                rightContent: connectCount
            },
            {
                icon: '/img/icon_autoLock.svg',
                title: i18n.t('autoLock'),
                targetRoute: "auto_lock",
                rightContent: getAutoLockTime()
            },
            {
                icon: '/img/icon_network.svg',
                title: i18n.t('network'),
                targetRoute: "network_page",
                rightContent: getNetwork()
            },
            {
                icon: '/img/icon_language.svg',
                title: i18n.t('language'),
                targetRoute: "language_management_page",
                rightContent: getLanguage()
            },
            {
                icon: '/img/icon_currency.svg',
                title: i18n.t('currency'),
                targetRoute: "currency_unit",
                rightContent: getCurrency()
            },
            {
                icon: '/img/icon_addressBook.svg',
                title: i18n.t('addressBook'),
                targetRoute: "address_book",
                rightContent: getAddressBook(),
                action: addressBookAction
            }
        ]
        const rowAbout = {
            icon: '/img/icon_about.svg',
            title: i18n.t('about'),
            targetRoute: "about_us"
        }
        return {
            routeList,
            rowAbout
        }
    }, [i18n, currentNode, currency, dispatch, connectCount, currentLockTime])

    

   

    const onClickTitle = useCallback(()=>{
        history.goBack()
    },[])

    return (<CustomView
        title={i18n.t('setting')}
        customTitleClass={styles.customTitleClass}
        onClickTitle={onClickTitle}
        rightHoverContent={i18n.t('popOutWindow')}
        contentClassName={styles.contentClassName}
    >
        {routeList.map((routeItem, index) => {
            return <RowItem key={index} action={routeItem.action} icon={routeItem.icon} title={routeItem.title} targetRoute={routeItem.targetRoute} rightContent={routeItem.rightContent} />
        })}
        <div className={styles.dividedLine} />
        <RowItem icon={rowAbout.icon} title={rowAbout.title} targetRoute={rowAbout.targetRoute} />
    </CustomView>)
}


const RowItem = ({
    icon = "",
    title = "",
    targetRoute = "",
    rightContent = "",
    action
}) => {
    const history = useHistory()
    const onClick = useCallback(() => {
        if (action) {
            action()
        }
        history.push(targetRoute)
    }, [action, targetRoute])
    return (<div className={styles.rowContainer} onClick={onClick}>
        <div className={styles.rowLeft}>
            <div className={styles.iconContainer}><img src={icon} /></div>
            <p className={styles.title}>{title}</p>
        </div>
        <div className={styles.rowLeft}>
            <p className={styles.rowContent}>{rightContent}</p>
            <img src="/img/icon_arrow.svg" />
        </div>
    </div>)
}

export default Setting