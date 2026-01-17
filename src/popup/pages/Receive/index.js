import i18n from "i18next";
import {QRCodeSVG} from 'qrcode.react';
import { useCallback, useEffect, useMemo, useState } from "react";
import { Trans } from "react-i18next";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { MAIN_COIN_CONFIG, POWER_BY } from "../../../constant";
import { copyText } from "../../../utils/browserUtils";
import Toast from "../../component/Toast";
import {
  StyledPageWrapper,
  StyledTitleRow,
  StyledBackWrapper,
  StyledBackArrow,
  StyledPageTitle,
  StyledContent,
  StyledTitle,
  StyledDividedLine,
  StyledReceiveTip,
  StyledReceiveBold,
  StyledQrCodeContainer,
  StyledAddressContent,
  StyledBoldPart,
  StyledDividedLine2,
  StyledCopyOuterContainer,
  StyledCopyContainer,
  StyledCopyTxt,
  StyledBottomTip,
} from "./index.styled";

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
      <StyledContent>
        <StyledTitle>{i18n.t("scanPay")}</StyledTitle>
        <StyledDividedLine />
        <StyledReceiveTip>
          <Trans
            i18nKey={"addressQrTip"}
            values={{ symbol: tokenSymbol }}
            components={{
              b: <StyledReceiveBold />,
            }}
          />
        </StyledReceiveTip>
        <StyledQrCodeContainer>
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
        </StyledQrCodeContainer>
        <StyledAddressContent>
          {mainPart}
          <StyledBoldPart>{lastPart}</StyledBoldPart>
        </StyledAddressContent>
        <StyledDividedLine2 />
        <StyledCopyOuterContainer onClick={onCopy}>
          <StyledCopyContainer>
            <img src="/img/icon_copy.svg" />
            <StyledCopyTxt>{i18n.t("copy")}</StyledCopyTxt>
          </StyledCopyContainer>
        </StyledCopyOuterContainer>
      </StyledContent>
      <StyledBottomTip>{POWER_BY}</StyledBottomTip>
    </StyledPageWrapper>
  );
};

export default ReceivePage;
