import { copyText } from "@/utils/utils";
import i18n from "i18next";
import { useCallback } from "react";
import { useHistory } from "react-router-dom";
import styled from "styled-components";
import Toast from "./Toast";

const StyledCustomView = styled.div`
  display: flex;
  align-items: center;
  height: 48px;
  margin-top: 10px;
  padding: 0px 10px;
  position: relative;
  justify-content: space-between;
`;
const StyledBackArrow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;

  width: 30px;
  height: 30px;

  cursor: pointer;
  z-index: 1;
`;
const StyledTitleWrapper = styled.div`
  position: absolute;
  left: 50%;
  transform: translate(-50%, 0%);
  white-space: nowrap;

  display: flex;
  flex-direction: column;
`;

const StyledTitle = styled.div`
  font-weight: 600;
  font-size: 18px;
  text-align: center;
  color: #000000;
`;
const StyledSubTitle = styled.div`
  font-weight: 400;
  font-size: 12px;
  text-align: center;
  color: rgba(0, 0, 0, 0.8);
`;
const StyledSubTitleWrapper = styled.div`
  display: flex;
  align-items: center;
  cursor: ${(props) => (props.$canCopy ? "pointer" : "initial")};
`;
const StyledCopyImg = styled.img`
  margin-left: 4px;
`;
const StyledChildrenWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
`;
const CustomViewV2 = ({
  children,
  title = "",
  subTitle = "",
  copyContent = "",
}) => {
  let history = useHistory();
  const goBack = useCallback(() => {
    history.goBack();
  }, []);
  const onCopySubTitle = useCallback(() => {
    if (copyContent) {
      copyText(copyContent).then(() => {
        Toast.info(i18n.t("copySuccess"));
      });
    }
  }, [copyContent]);
  return (
    <>
      <StyledCustomView>
        <StyledBackArrow onClick={goBack}>
          <img src={"/img/icon_back.svg"} />
        </StyledBackArrow>
        <StyledTitleWrapper>
          <StyledTitle>{title}</StyledTitle>
          <StyledSubTitleWrapper
            $canCopy={!!copyContent}
            onClick={onCopySubTitle}
          >
            <StyledSubTitle>{subTitle}</StyledSubTitle>
            {copyContent && <StyledCopyImg src="/img/icon_copy_black.svg" />}
          </StyledSubTitleWrapper>
        </StyledTitleWrapper>
      </StyledCustomView>
      <StyledChildrenWrapper>{children}</StyledChildrenWrapper>
    </>
  );
};
export default CustomViewV2;
