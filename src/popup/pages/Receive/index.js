import i18n from "i18next";
import {QRCodeSVG} from 'qrcode.react';
import { useCallback, useMemo, useState } from "react";
import { Trans } from "react-i18next";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { MAIN_COIN_CONFIG, POWER_BY } from "../../../constant";
import { copyText } from "../../../utils/browserUtils";
import Toast from "../../component/Toast";
import styles from "./index.module.scss";
const StyledPageWrapper = styled.div`
  width: 375px;
  height: 100vh;
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

const StyledAddressContent = styled.p`
  font-size: 14px;
  line-height: 17px;
  text-align: center;
  color: #000000;
  margin: 22px auto 40px;
  padding: 0 20px;
  word-break: break-all;
`;
const StyledBoldPart = styled.span`
  font-weight: 700;
`;
const StyledReceiveTip = styled.p`
  margin: 36px auto 22px;
  font-size: 14px;
  line-height: 17px;
  text-align: center;
  color: rgba(0, 0, 0, 0.5);
`;

const ReceivePage = ({}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const accountInfo = useSelector((state) => state.accountInfo);
  const token = useSelector((state) => state.cache.nextTokenDetail);
  const currentAccount = useMemo(()=>{
    return accountInfo.currentAccount
  },[accountInfo])

  const isShowToken = useMemo(() => {
    let isFungibleToken = location.state?.isFungibleToken;
    let isFromTokenPage = location.state?.isFromTokenPage;
    return isFungibleToken && isFromTokenPage;
  }, [location]);

  
  const { tokenSymbol } = useMemo(() => {
    let tokenSymbol = MAIN_COIN_CONFIG.symbol;
    if (isShowToken ) {
      tokenSymbol = token?.tokenNetInfo?.tokenSymbol ?? "UNKNOWN";
    }
    return { tokenSymbol };
  }, [isShowToken,token]);

  const onCopy = useCallback(() => {
    copyText(currentAccount.address).then(() => {
      Toast.info(i18n.t("copySuccess"));
    });
  }, [i18n, currentAccount]);

  const onClickBack = useCallback(() => {
    navigate(-1);
  }, []);

  const { mainPart, lastPart } = useMemo(() => {
    const address = currentAccount.address;
    const mainPart = address.slice(0, -6);
    const lastPart = address.slice(-6);
    return {
      mainPart,
      lastPart,
    };
  }, [currentAccount.address]);

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
        <StyledReceiveTip>
          <Trans
            i18nKey={"addressQrTip"}
            values={{ symbol: tokenSymbol }}
            components={{
              b: <span className={styles.receiveBold} />,
            }}
          />
        </StyledReceiveTip>
        <div className={styles.qrCodeContainer}>
          <QRCodeSVG
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
        <StyledAddressContent>
          {mainPart}
          <StyledBoldPart>{lastPart}</StyledBoldPart>
        </StyledAddressContent>
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
