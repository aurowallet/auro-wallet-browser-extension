import i18n from "i18next";
import QRCode from "qrcode.react";
import { useCallback, useState } from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { POWER_BY } from "../../../constant";
import { copyText } from "../../../utils/utils";
import Toast from "../../component/Toast";
import styles from "./index.module.scss";
import { useHistory } from 'react-router-dom';
const StyledPageWrapper = styled.div`
  width: 375px;
  height: 600px;
  background-image: url("/img/receivePageBg.svg");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
`;
const StyledTitleRow = styled.div`
  display: flex;
  align-items: center;
  height: 48px;
  padding: 10px 10px 0px;
`;
const StyledBackWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;

  width: 30px;
  height: 30px;

  cursor: pointer;
  z-index: 1;
`;
const StyledBackArrow = styled.img``;
const StyledPageTitle = styled.div`
  margin: 0;
  font-weight: 600;
  font-size: 18px;
  line-height: 21px;
  text-align: center;
  color: rgba(255, 255, 255, 1);

  position: absolute;
  left: 50%;
  transform: translate(-50%, 0%);
  white-space: nowrap;
`;

const ReceivePage = ({}) => {
  let history = useHistory();
  const accountInfo = useSelector((state) => state.accountInfo);
  const [currentAccount, setCurrentAccount] = useState(
    accountInfo.currentAccount
  );

  const onCopy = useCallback(() => {
    copyText(currentAccount.address).then(() => {
      Toast.info(i18n.t("copySuccess"));
    });
  }, [i18n, currentAccount]);

  const onClickBack = useCallback(()=>{
    history.goBack()
  },[history])

  return (
    <StyledPageWrapper>
      <StyledTitleRow>
        <StyledBackWrapper onClick={onClickBack}>
          <StyledBackArrow src="/img/icon_back_white.svg" />
        </StyledBackWrapper>
        <StyledPageTitle>{i18n.t("receive")}</StyledPageTitle>
      </StyledTitleRow>
      <div className={styles.content}>
        <p className={styles.title}>{i18n.t("scanPay")}</p>
        <div className={styles.dividedLine} />
        <p className={styles.receiveTip}>{i18n.t("addressQrTip")}</p>
        <div className={styles.qrCodeContainer}>
          <QRCode
            value={currentAccount.address}
            size={150}
            level={"H"}
            fgColor="#000000"
            imageSettings={{
              src: "/img/logo/128.png",
              height: 30,
              width: 30,
              excavate: true,
            }}
          />
        </div>
        <p className={styles.address}>{currentAccount.address}</p>
        <div className={styles.dividedLine2} />
        <div className={styles.copyOuterContainer} onClick={onCopy}>
          <div className={styles.copyContainer}>
            <img src="/img/icon_copy.svg" className={styles.copyIcon} />
            <p className={styles.copyTxt}>{i18n.t("copy")}</p>
          </div>
        </div>
      </div>
      <p className={styles.bottomTip}>{POWER_BY}</p>
    </StyledPageWrapper>
  );
};

export default ReceivePage;
