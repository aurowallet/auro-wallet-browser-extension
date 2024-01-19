import styled, { css } from "styled-components";

const clickAble = css`
  cursor: pointer;
`;
const colorStatus = css`
  background: rgba(196, 196, 196, 0.2) !important;
`;
const colorIndexStatus = css`
  color: rgba(0, 0, 0, 0.5) !important;
`;

const StyledMneItemContainer = styled.div`
  background: var(--mainBlue);
  border-radius: 10px;

  display: flex;
  align-items: center;
  padding-left: 12px;
  min-height: 30px;
  width: 128px;
  ${(props) => props.clickable == "true" && clickAble}
  ${(props) => props.colorstatus == "true" && colorStatus}
`;
const StyledMneItemIndex = styled.div`
  font-size: 14px;
  line-height: 100%;
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  display: flex;
  font-weight: 500;
  ${(props) => props.colorstatus == "true" && colorIndexStatus}
`;
const StyledMneItem = styled.span`
  font-weight: 500;
  font-size: 14px;
  line-height: 100%;
  text-align: center;
  color: var(--white);
  margin-left: 6px;
`;
export const MneItemV2 = ({
  mne,
  index,
  canClick = false,
  onClick = () => {},
  colorStatus = false,
}) => {
  return (
    <StyledMneItemContainer
      clickable={String(canClick)}
      colorstatus={String(colorStatus)}
      onClick={onClick}
    >
      <StyledMneItemIndex colorstatus={String(colorStatus)}>
        {index + 1 + "."}
      </StyledMneItemIndex>
      <StyledMneItem>{mne}</StyledMneItem>
    </StyledMneItemContainer>
  );
};
