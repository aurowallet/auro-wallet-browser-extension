import { useCallback, useMemo, useState } from "react";
import styles from "./index.module.scss";

const DappWebsite = ({ siteIcon, siteUrl }) => {
  const [iconStatus, setIconStatus] = useState(true);

  const { showIcon, showUrl } = useMemo(() => {
    const showIcon = siteIcon || "/img/dapp_default_icon.svg";
    let showUrl = siteUrl;
    return {
      showIcon,
      showUrl,
    };
  }, [siteIcon, siteUrl]);
  const onLoadError = useCallback(() => {
    setIconStatus(false);
  }, []);
  return (
    <div className={styles.container}>
      <img
        src={iconStatus ? showIcon : "/img/dapp_default_icon.svg"}
        className={styles.iconContainer}
        onError={onLoadError}
      />
      <p className={styles.url}>{showUrl}</p>
    </div>
  );
};

export default DappWebsite;
