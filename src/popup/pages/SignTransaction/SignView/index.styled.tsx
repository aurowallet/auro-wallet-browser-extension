import styled, { css } from 'styled-components';

interface StyledContentProps {
  $showMultiView?: boolean;
  $flexLayout?: boolean;
}

interface StyledAccountRowProps {
  $noMargin?: boolean;
}

interface StyledRowTitleProps {
  $rightAlign?: boolean;
}

interface StyledRowContentProps {
  $canCopy?: boolean;
}

interface StyledBtnGroupProps {
  $showMultiView?: boolean;
}

export const StyledSectionSign = styled.section`
  height: 100vh;
`;

export const StyledTitleRow = styled.div`
  display: flex;
  align-items: center;
  height: 48px;
  margin-top: 10px;
  padding: 0px 20px;
  position: relative;
  justify-content: space-between;
`;

export const StyledTitleRight = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const StyledTitle = styled.p`
  font-weight: 600;
  font-size: 18px;
  line-height: 21px;
  color: #000000;
  margin: 0;
`;

export const StyledContent = styled.div<StyledContentProps>`
  margin-top: 20px;
  padding: 0px 20px;
  height: calc(100vh - 170px);
  overflow-y: auto;

  ${({ $flexLayout }) => $flexLayout && css`
    display: flex;
    flex-direction: column;
  `}

  ${({ $showMultiView }) => $showMultiView && css`
    height: calc(100vh - 250px) !important;
  `}
`;

export const StyledWebsiteContainer = styled.div``;

export const StyledAccountRow = styled.div<StyledAccountRowProps>`
  margin-top: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;

  ${({ $noMargin }) => $noMargin && css`
    margin-top: 0px;
    flex: 1;
    min-height: 200px;
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;
  `}
`;

export const StyledRowLeft = styled.div``;

export const StyledRowTitle = styled.p<StyledRowTitleProps>`
  font-weight: 500;
  font-size: 12px;
  line-height: 14px;
  color: rgba(0, 0, 0, 0.5);
  margin: 0 0 4px 0;

  ${({ $rightAlign }) => $rightAlign && css`
    text-align: right;
    white-space: pre;
  `}
`;

export const StyledRowContent = styled.p<StyledRowContentProps>`
  font-weight: 500;
  font-size: 16px;
  color: #000000;
  margin: 0;
  align-content: center;

  ${({ $canCopy }) => $canCopy && css`
    cursor: pointer;
  `}
`;

export const StyledRowDescContent = styled.span`
  font-size: 12px;
`;

export const StyledFeeCon = styled.div`
  display: flex;
  align-items: center;
`;

export const StyledFeeContent = styled(StyledRowContent)`
  margin-right: 4px;
`;

export const StyledFeeTypeBase = styled.span`
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
  font-weight: 500;
  font-size: 12px;
  line-height: 14px;
  color: rgba(0, 0, 0, 0.3);
  padding: 2px 6px;
  height: fit-content;
  text-align: center;
`;

export const StyledFeeTypeSite = styled(StyledFeeTypeBase)`
  background: rgba(13, 178, 124, 0.1);
  color: #0db27c;
`;

export const StyledRowArrow = styled.div`
  height: 100%;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 10px;
  }
`;

export const StyledRowRight = styled.div``;

export const StyledRightWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
`;

export const StyledTypeRow = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 15px;
  padding: 2px 6px;
  border-radius: 8px;
  margin-right: 4px;
  border: 1px solid #594af1;
  color: #594af1;
  font-size: 10px;
  font-weight: 500;
`;

export const StyledModeWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  height: auto;
  align-items: stretch;
`;

export const StyledRowPurpleContent = styled.p`
  font-weight: 600;
  font-size: 14px;
  text-align: center;
  color: #594af1;
  cursor: pointer;
  position: absolute;
  right: 0;
  bottom: 0;
  margin: 0;
`;

export const StyledHighFeeTip = styled.div`
  font-weight: 500;
  font-size: 12px;
  line-height: 17px;
  color: #e4b200;
`;

export const StyledBtnGroup = styled.div<StyledBtnGroupProps>`
  position: absolute;
  bottom: 0;
  justify-content: center;
  align-items: center;
  width: 100%;
  display: flex;
  gap: 15px;
  padding: 12px 0px 20px;
  max-width: 375px;

  ${({ $showMultiView }) => $showMultiView && css`
    bottom: 40px !important;
  `}
`;

export const StyledTabContent = styled.div<{ ref?: React.Ref<HTMLDivElement> }>`
  font-size: 12px;
  border-radius: 4px;
  border: 0.5px solid rgba(0, 0, 0, 0.1);
  padding: 10px;
  color: rgba(0, 0, 0, 0.8);
  margin: 0;
  overflow-y: auto;
  width: 100%;
  overflow-wrap: break-word;
  word-break: break-word;
  white-space: pre-wrap;
  box-sizing: border-box;
  flex: 1;

  pre {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
  }
`;

export const StyledClickCss = styled.span`
  font-style: normal;
  font-weight: 400;
  font-size: 14px;
  line-height: 17px;
  color: #594af1;
  cursor: pointer;
  height: min-content;
`;

export const StyledRowData = styled.div`
  color: rgba(0, 0, 0, 0.5);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  padding: 4px 0 4px 4px;
`;

export const StyledScrollBtn = styled.div`
  position: absolute;
  bottom: 5px;
  right: 5px;
  cursor: pointer;
`;

export const StyledCustomTabPanelCss = styled.div<{ $active?: boolean }>`
  position: relative;
  width: 100%;
  display: ${({ $active }) => $active ? 'flex' : 'none'};
  flex: 1;
  min-width: 0;
  flex-direction: column;
`;
