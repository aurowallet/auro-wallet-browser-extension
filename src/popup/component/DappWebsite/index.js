import { useMemo } from "react"
import styles from "./index.module.scss"

const DappWebsite = ({ siteIcon, siteUrl }) => {
  const {
    showIcon, showUrl
  } = useMemo(() => {
    const showIcon = siteIcon || "/img/dapp_default_icon.svg"
    let showUrl = siteUrl
    return {
      showIcon, showUrl
    }
  }, [siteIcon, siteUrl])
  return (<div className={styles.container}>
    <img src={showIcon} className={styles.iconContainer} />
    <p className={styles.url}>{showUrl}</p>
  </div>)
}

export default DappWebsite