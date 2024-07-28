import styled from "styled-components";

const StyledTitleWrapper = styled.div`
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.1);
`;

const StyledTitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  padding: 8px 20px;
`;
const StyledTitle = styled.div`
  color: rgba(0, 0, 0, 0.8);
  font-size: 16px;
  font-weight: 600;
`;
const StyledCloseWrapper = styled.div`
  display: flex;
  align-items: center;
`;
const StyledCloseIcon = styled.img`
  display: block;
  cursor: pointer;
`;
function PopModalTitleRow({ title, onClickClose = () => {} }) {
  return (
    <StyledTitleWrapper>
      <StyledTitleRow>
        <StyledTitle>{title}</StyledTitle>
        <StyledCloseWrapper>
          <StyledCloseIcon
            onClick={onClickClose}
            src="/img/icon_nav_close.svg"
          />
        </StyledCloseWrapper>
      </StyledTitleRow>
    </StyledTitleWrapper>
  );
}

export default PopModalTitleRow;
