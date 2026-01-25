import styled from 'styled-components';

export const StyledPageWrapper = styled.div`
  width: 375px;
  height: 100vh;
  background-image: url("/img/receivePageBg.svg");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
`;

export const StyledTitleRow = styled.div`
  display: flex;
  align-items: center;
  height: 48px;
  padding: 10px 10px 0px;
`;

export const StyledBackWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  cursor: pointer;
  z-index: 1;
`;

export const StyledBackArrow = styled.img``;

export const StyledPageTitle = styled.div`
  margin: 0;
  font-weight: ${({ theme }) => theme.typography.fontWeightSemiBold};
  font-size: ${({ theme }) => theme.typography.fontSizeTitle};
  line-height: 21px;
  text-align: center;
  color: rgba(255, 255, 255, 1);
  position: absolute;
  left: 50%;
  transform: translate(-50%, 0%);
  white-space: nowrap;
`;

export const StyledContent = styled.div`
  margin: 20px 20px 0px;
  height: 450px;
  z-index: 1;
  display: flex;
  flex-direction: column;
  background-color: ${({ theme }) => theme.colors.backgroundWhite};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
`;

export const StyledTitle = styled.p`
  font-weight: ${({ theme }) => theme.typography.fontWeightSemiBold};
  font-size: ${({ theme }) => theme.typography.fontSizeTitle};
  line-height: 21px;
  text-align: center;
  color: ${({ theme }) => theme.colors.textBlack};
  margin: 24px 0px;
`;

export const StyledDividedLine = styled.div`
  border: 1px dashed ${({ theme }) => theme.colors.borderLight};
  width: calc(100% - 18px);
  margin: 0 auto;
`;

export const StyledReceiveTip = styled.p`
  margin: 36px auto 22px;
  font-size: ${({ theme }) => theme.typography.fontSizeContent};
  line-height: ${({ theme }) => theme.typography.lineHeightDesc};
  text-align: center;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

export const StyledReceiveBold = styled.span`
  color: rgba(0, 0, 0, 0.8);
`;

export const StyledQrCodeContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const StyledAddressContent = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSizeContent};
  line-height: ${({ theme }) => theme.typography.lineHeightDesc};
  text-align: center;
  color: ${({ theme }) => theme.colors.textBlack};
  margin: 22px auto 40px;
  padding: 0 20px;
  word-break: break-all;
`;

export const StyledBoldPart = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeightBold};
`;

export const StyledDividedLine2 = styled.div`
  border: 0.5px solid ${({ theme }) => theme.colors.borderLight};
`;

export const StyledCopyOuterContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  cursor: pointer;
  border-bottom-left-radius: ${({ theme }) => theme.borderRadius.medium};
  border-bottom-right-radius: ${({ theme }) => theme.borderRadius.medium};

  &:hover {
    background-color: #f2f2f2;
  }
`;

export const StyledCopyContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
`;

export const StyledCopyTxt = styled.p`
  margin: 0px 0px 0px 10px;
  font-weight: ${({ theme }) => theme.typography.fontWeightSemiBold};
  font-size: ${({ theme }) => theme.typography.fontSizeTitleSmall};
  line-height: 19px;
  color: ${({ theme }) => theme.colors.textBlack};
`;

export const StyledBottomTip = styled.p`
  position: absolute;
  bottom: 20px;
  left: 20px;
  z-index: 0;
  width: calc(100% - 40px);
  font-size: ${({ theme }) => theme.typography.fontSizeDesc};
  line-height: 14px;
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
`;
