import styled from "styled-components";
import Input from "../Input";

export const PopupModal_type_v2 = {
  common: "popup_common",
  warning: "popup_warning",
  input: "popup_input",
};

const StyledPopupContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  z-index: 10;
  background: rgba(0, 0, 0, 0.8);
  width: 100%;
  height: 100%;

  display: flex;
  align-items: center;
`;
const StyledInnerContainer = styled.div`
  background: #ffffff;
  border-radius: 12px;
  margin: 0 auto;
  width: 100%;
  max-width: 335px;
`;
const StyledTopContainer = styled.div`
  padding: 20px 20px 0;
`;
const StyledModalIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
`;

const StyledModalTitle = styled.p`
  font-weight: 600;
  font-size: 18px;
  line-height: 21px;
  text-align: center;
  color: #000000;
  margin: 0 0 20px;
`;
const StyledModalContent = styled.p`
  margin: 0 0 30px;

  font-size: 14px;
  line-height: 17px;
  color: rgba(0, 0, 0, 0.5);
`;
const StyledComponentWrapper = styled.div`
  margin-bottom: 30px;
`;
const StyledBottomContainer = styled.div`
  display: flex;
  border-top: 0.5px solid rgba(0, 0, 0, 0.1);
  transform: rotate(0.18deg);
  height: 48px;
`;
const StyledBaseBtnWrapper = styled.div`
  font-style: normal;

  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex: 1;

  text-align: center;
  font-size: 16px;
  line-height: 19px;

  font-weight: 500;
`;
const StyledLeftBtnWrapper = styled(StyledBaseBtnWrapper)`
  color: #000000;
  border-bottom-left-radius: 12px;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
`;
const StyledDividedLine = styled.div`
  border: 0.5px solid rgba(0, 0, 0, 0.1);
`;
const StyledRightBtnWrapper = styled(StyledBaseBtnWrapper)`
  color: #594af1;
  border-bottom-right-radius: 12px;
  text-transform: capitalize;
  ${(props) => props.$rightBtnStyle}
  ${(props) => props.$disabled && `
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  `}

  &:hover {
    background: ${(props) => props.$disabled ? 'transparent' : 'rgba(0, 0, 0, 0.05)'};
  }
`;

const StyledLeftBtnWrapperDisabled = styled(StyledLeftBtnWrapper)`
  ${(props) => props.$disabled && `
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  `}
  
  &:hover {
    background: ${(props) => props.$disabled ? 'transparent' : 'rgba(0, 0, 0, 0.05)'};
  }
`;

const StyledLoadingSpinner = styled.span`
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(89, 74, 241, 0.3);
  border-top-color: #594af1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 6px;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
export const PopupModalV2 = ({
  modalVisible = false,
  modalTopIcon,
  title = "",
  contentList = [],
  type = PopupModal_type_v2.common,
  inputPlaceholder = "",
  onInputChange = () => {},
  inputType = "text",
  bottomTip = "",
  componentContent = <></>,
  leftBtnContent = "",
  rightBtnContent = "",
  onLeftBtnClick = () => {},
  onRightBtnClick = () => {},
  rightBtnStyle = {},
  rightBtnLoading = false,
  btnDisabled = false,
}) => {
  if (!modalVisible) {
    return <></>;
  }
  return (
    <StyledPopupContainer>
      <StyledInnerContainer>
        <StyledTopContainer>
          {modalTopIcon && (
            <StyledModalIcon>
              <img src={modalTopIcon} />
            </StyledModalIcon>
          )}

          <StyledModalTitle>{title}</StyledModalTitle>
          {contentList.length > 0 &&
            contentList.map((content, index) => {
              return (
                <StyledModalContent key={index}>{content}</StyledModalContent>
              );
            })}
          {type === PopupModal_type_v2.input && (
            <Input
              placeholder={inputPlaceholder || ""}
              onChange={onInputChange}
              //   value={inputValue}
              inputType={inputType}
              bottomTip={!!bottomTip}
            />
          )}
          {componentContent && (
            <StyledComponentWrapper>{componentContent}</StyledComponentWrapper>
          )}
        </StyledTopContainer>
        <StyledBottomContainer>
          {leftBtnContent && (
            <>
              <StyledLeftBtnWrapperDisabled 
                $disabled={btnDisabled}
                onClick={btnDisabled ? undefined : onLeftBtnClick}
              >
                {leftBtnContent}
              </StyledLeftBtnWrapperDisabled>
              <StyledDividedLine />
            </>
          )}
          <StyledRightBtnWrapper
            $rightBtnStyle={rightBtnStyle}
            $disabled={btnDisabled || rightBtnLoading}
            onClick={(btnDisabled || rightBtnLoading) ? undefined : onRightBtnClick}
          >
            {rightBtnLoading ? <StyledLoadingSpinner /> : rightBtnContent}
          </StyledRightBtnWrapper>
        </StyledBottomContainer>
      </StyledInnerContainer>
    </StyledPopupContainer>
  );
};
