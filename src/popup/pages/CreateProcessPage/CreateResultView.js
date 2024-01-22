import { Default_Follow_Link } from "@/constant";
import { WALLET_CREATE_TYPE } from "@/constant/commonType";
import Button from "@/popup/component/Button";
import i18n from "i18next";
import { useCallback, useMemo } from "react";
import { Trans } from "react-i18next";
import { useSelector } from "react-redux";
import styled from "styled-components";

const StyledPwdContainer = styled.div`
  margin-top: 20px;
  width: 100%;
`;
const StyledPwdContentContainer = styled.div`
  margin: 0 auto;
`;
const StyledBackupTitle = styled.div`
  color: var(--Black, #000);
  font-size: 22px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 20px;
`;
const StyledBackupContent = styled.div`
  color: var(--medium-black-50, #808080);
  text-align: center;
  font-size: 16px;
  font-weight: 500;
`;
const StyledFollowUs = styled.div`
  color: var(--medium-black-50, #808080);
  text-align: center;
  font-size: 12px;
  font-weight: 400;
  margin: 20px 0;
`;

const StyledBottomContainer = styled.div`
  position: absolute;
  width: 600px;
  bottom: 30px;
  left: 50%;
  transform: translate(-50%);
`;
const StyldImgContainer = styled.div`
  margin: 20px auto 40px;

  display: flex;
  align-items: center;
  justify-content: center;
`;
const StyledSuccessIcon = styled.img``;

const StyledFollowContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
`;
const StyledFollowItemContainer = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  cursor: pointer;

  text-decoration: none;
  color: inherit;
  -webkit-text-size-adjust: none;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
  -webkit-touch-callout: none;
  border-bottom: none;
  text-align: left;
`;
const StyledMediaIconWrapper = styled.div`
  width: 48px;
  height: 48px;
  background: rgba(89, 74, 241, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;

  ${StyledFollowItemContainer}:hover & {
    background: rgba(196, 196, 196, 0.2);
  }
`;
const StyledMediaIcon = styled.img``;
const StyledMediaTitle = styled.div`
  color: var(--medium-black-50, #808080);
  text-align: center;
  font-size: 12px;
  font-weight: 500;
  margin-top: 6px;
`;

const StyledExtTipWrapper = styled.div`
  position: fixed;
  right: 20px;
  top: 20px;
  display: inline-flex;
  padding: 10px;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: 10px;

  border-radius: 10px;
  background: var(--mainBlue, #594af1);
`;

const StyledExtIconWrapper = styled.div`
  border-radius: 2px;
  border: 1px solid var(--white, #fff);
  background: var(--mainBlue, #594af1);
  display: flex;
  align-items: center;
  justify-content: center;
  img {
    width: 24px;
    height: 24px;
  }
`;
const StyledExtPinTitle = styled.div`
  color: var(--white, #fff);
  text-align: center;
  font-size: 16px;
  font-weight: 600;
`;
const StyledExtPinContent = styled.div`
  color: var(--white, #fff);
  text-align: center;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  img {
    width: 16px;
    height: 16px;
    margin: 0px 8px;
  }
`;

export const CreateResultView = ({}) => {
  const welcomeNextType = useSelector((state) => state.cache.welcomeNextType);

  const { showTip } = useMemo(() => { 
    let showTip = "backup_success";
    if(welcomeNextType === WALLET_CREATE_TYPE.restore){
      showTip = "backup_success_restore";
    }
    return {
      showTip,
    };
  }, [welcomeNextType]);

  const onClickNextTab = useCallback(() => {
    window.close();
  }, []);
  return (
    <StyledPwdContainer>
      <StyledPwdContentContainer>
        <StyldImgContainer>
          <StyledSuccessIcon src={"/img/backup_success.svg"} />
        </StyldImgContainer>
        <StyledBackupTitle>{i18n.t("success")}</StyledBackupTitle>
        <StyledBackupContent>{i18n.t(showTip)}</StyledBackupContent>
        <StyledBackupContent>{i18n.t("ledgerReturnExtension")}</StyledBackupContent>
        <StyledFollowUs>{i18n.t("followUs")}</StyledFollowUs>
        <StyledFollowContainer>
          {Default_Follow_Link.map((follow, index) => {
            return (
              <StyledFollowItemContainer
                href={follow.website}
                target="_blank"
                key={index}
              >
                <StyledMediaIconWrapper>
                  <StyledMediaIcon src={follow.icon} />
                </StyledMediaIconWrapper>
                <StyledMediaTitle>{follow.name}</StyledMediaTitle>
              </StyledFollowItemContainer>
            );
          })}
        </StyledFollowContainer>
      </StyledPwdContentContainer>
      <StyledBottomContainer>
        <Button onClick={onClickNextTab}>{i18n.t("done")}</Button>
      </StyledBottomContainer>

      <StyledExtTipWrapper>
        <StyledExtIconWrapper>
          <img src="/img/logo/512.png" />
        </StyledExtIconWrapper>
        <StyledExtPinTitle>{i18n.t("pinExtension")}</StyledExtPinTitle>
        <StyledExtPinContent>
          <Trans
            i18nKey={"clickBrowser"}
            components={{
              icon: <img src="/img/ic_ext.svg" alt="ext" />,
            }}
          />
        </StyledExtPinContent>
        <StyledExtPinContent>
          <Trans
            i18nKey={"clickButton"}
            components={{
              icon: <img src="/img/ic_pin.svg" alt="pin" />,
            }}
          />
        </StyledExtPinContent>
      </StyledExtTipWrapper>
    </StyledPwdContainer>
  );
};
