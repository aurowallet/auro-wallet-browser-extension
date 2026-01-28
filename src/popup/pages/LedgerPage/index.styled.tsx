import styled, { css } from 'styled-components';

export const StyledOuterContainer = styled.div`
  min-width: 750px;
  min-height: 600px;
  background-color: rgb(249, 250, 252);
  z-index: 10;
`;

export const StyledInnerContainer = styled.div`
  width: 750px;
  min-height: 600px;
  position: relative;
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0px 0px 20px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
`;

export const StyledInnerContent = styled.div`
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 60px auto 0;
`;

export const StyledViewTip = styled.div`
  font-weight: 500;
  font-size: 16px;
  line-height: 19px;
  margin-top: 30px;
  color: #000000;
`;

export const StyledLedgerIcon = styled.img`
  height: 50px;
  margin-top: 20px;
`;

export const StyledStartDesc = styled.div`
  font-weight: 400;
  font-size: 14px;
  line-height: 17px;
  color: rgba(0, 0, 0, 0.5);
  margin-top: 10px;
  margin-bottom: 40px;
`;

export const StyledStepContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;
`;

export const StyledStepNumber = styled.span`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: #594af1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 400;
  font-size: 14px;
  line-height: 17px;
  color: #ffffff;
`;

export const StyledStepContent = styled.span`
  font-weight: 400;
  font-size: 14px;
  line-height: 17px;
  color: #000000;
  margin-left: 8px;
`;

export const StyledStepContentLight = styled.span`
  font-weight: 700 !important;
`;

export const StyledWarningTip = styled.div`
  background: rgba(214, 90, 90, 0.1);
  border: 1px solid #d65a5a;
  border-radius: 10px;
  display: flex;
  align-items: center;
  font-weight: 400;
  font-size: 14px;
  line-height: 17px;
  color: #d65a5a;
  padding: 12px 10px;
  margin-top: 20px;
`;

interface StyledAccountWarningTipProps {
  $success?: boolean;
}
export const StyledAccountWarningTip = styled(StyledWarningTip)<StyledAccountWarningTipProps>`
  margin-bottom: 32px;
  min-width: 632px;
  transform: translate(-16px);

  ${({ $success }) => $success && css`
    background: rgba(13, 178, 124, 0.1);
    border: 1px solid #0db27c;
    color: #0db27c;
  `}
`;

export const StyledAccountNameTip = styled(StyledStartDesc)`
  margin-top: 10px;
  margin-bottom: 20px;
`;

export const StyledClickIntro = styled.span`
  color: #594af1;
  cursor: pointer;
`;

export const StyledInputContainer = styled.div`
  width: 355px;
  margin-top: 20px;
`;

export const StyledLedgerContainer = styled.div`
  margin-top: 20px;
`;

export const StyledLedgerPath = styled.div`
  font-weight: 400;
  font-size: 16px;
  color: #666666;
  display: flex;
  align-items: center;
`;

export const StyledInputNumberContainer = styled.div`
  width: fit-content;
  position: relative;
  display: flex;
  align-items: center;
  height: 32px;
  border: 0.5px solid rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  margin: 0 20px;

  &:hover {
    border: 0.5px solid #594af1;
  }
`;

export const StyledCustomInput = styled.input`
  display: inline-block;
  outline: none;
  background: #ffffff;
  border: none;
  font-weight: 500;
  font-size: 16px;
  color: #00142a;
  flex: 1;
  caret-color: #594af1;
  width: 64px;
  text-align: center;
  padding-right: 26px;

  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`;

export const StyledImgContainer = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0 4px;
  justify-content: center;
`;

export const StyledTopArrow = styled.img`
  width: 14px;
  height: 14px;
  cursor: pointer;

  &:hover {
    background: rgba(0, 0, 0, 0.15);
  }
`;

export const StyledBottomArrow = styled(StyledTopArrow)`
  transform: rotate(180deg);
`;
