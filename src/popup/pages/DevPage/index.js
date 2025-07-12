import i18n from "i18next";
import { useCallback } from "react";
import { useHistory } from "react-router-dom";
import CustomView from "../../component/CustomView";
import styles from "./index.module.scss";

const DevPage = ({}) => {
  const history = useHistory();

  const goToPage = useCallback((nextRoute, { pageType, title }) => {
    const params = { pageType: pageType, title: title };

    history.push({
      pathname: nextRoute,
      params: params,
    });
  }, []);

  return (
    <CustomView title={"Auro Dev"} contentClassName={styles.container}>
      <RowItem
        title={i18n.t("history")}
        onClickItem={() => {
          goToPage("dev_detail_page", {
            pageType: "transaction",
            title: i18n.t("history"),
          });
        }}
      />
      <RowItem
        title={i18n.t("pendingTx")}
        onClickItem={() => {
          goToPage("dev_detail_page", {
            pageType: "pendingTx",
            title: i18n.t("pendingTx"),
          });
        }}
      />
      <RowItem
        title={"zkApp-" + i18n.t("pendingTx")}
        onClickItem={() => {
          goToPage("dev_detail_page", {
            pageType: "pendingZkTx",
            title: "zkApp-" + i18n.t("pendingTx"),
          });
        }}
      />
      <RowItem
        title={i18n.t("tokens")}
        onClickItem={() => {
          goToPage("dev_detail_page", {
            pageType: "balance",
            title: i18n.t("tokens"),
          });
        }}
      />
    </CustomView>
  );
};

const RowItem = ({ title = "", content = "", onClickItem = () => {} }) => {
  return (
    <div className={styles.rowContainer} onClick={onClickItem}>
      <div>
        <p className={styles.rowTitle}>{title}</p>
      </div>
      <div className={styles.rowLeft}>
        <p className={styles.rowContent}>{content}</p>
        <img src="/img/icon_arrow.svg" />
      </div>
    </div>
  );
};
export default DevPage;
