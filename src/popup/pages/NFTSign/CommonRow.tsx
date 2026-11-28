import { useCallback, useMemo } from "react";
import i18n from "i18next";
import { copyText } from "@/utils/browserUtils";
import Toast from "@/popup/component/Toast";
import {
  StyledAccountRow,
  StyledRowLeft,
  StyledRowTitle,
  StyledRowContent,
  StyledRowDescContent,
  StyledRowArrow,
  StyledRowRight,
  StyledRightWrapper,
  StyledTypeRow,
} from "./index.styled";

const CommonRow = ({
  leftTitle = "",
  leftContent = "",
  leftDescContent = "",
  rightTitle = " ",
  rightContent = "",
  leftCopyContent = "",
  rightCopyContent = "",
  showArrow = false,
  toTypeName = "",
}) => {
  const { leftCopyAble, rightCopyAble } = useMemo(() => {
    const leftCopyAble = !!leftCopyContent;
    const rightCopyAble = !!rightCopyContent;
    return {
      leftCopyAble,
      rightCopyAble,
    };
  }, [leftCopyContent, rightCopyContent]);

  const onClickLeft = useCallback(() => {
    if (leftCopyAble) {
      copyText(leftCopyContent).then(() => {
        Toast.info(i18n.t("copySuccess"));
      });
    }
  }, [leftCopyAble, leftCopyContent, i18n]);
  const onClickRight = useCallback(() => {
    if (rightCopyAble) {
      copyText(rightCopyContent).then(() => {
        Toast.info(i18n.t("copySuccess"));
      });
    }
  }, [rightCopyAble, rightCopyContent, i18n]);

  return (
    <StyledAccountRow>
      <StyledRowLeft>
        <StyledRowTitle>{leftTitle}</StyledRowTitle>
        <StyledRowContent $canCopy={leftCopyAble} onClick={onClickLeft}>
          {leftContent}
          <StyledRowDescContent>{leftDescContent}</StyledRowDescContent>
        </StyledRowContent>
      </StyledRowLeft>
      {showArrow && (
        <StyledRowArrow>
          <img src="/img/icon_arrow_purple.svg" />
        </StyledRowArrow>
      )}
      <StyledRowRight>
        <StyledRightWrapper>
          {toTypeName && <StyledTypeRow>{toTypeName}</StyledTypeRow>}
          <StyledRowTitle $rightAlign>{rightTitle}</StyledRowTitle>
        </StyledRightWrapper>
        <StyledRowContent $canCopy={rightCopyAble} onClick={onClickRight}>
          {rightContent}
        </StyledRowContent>
      </StyledRowRight>
    </StyledAccountRow>
  );
};

export default CommonRow;
