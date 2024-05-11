import styled from "styled-components";
import PopModalTitleRow from "./PopModalTitleRow";

const StyledPopupContainer = styled.div`
  position: fixed;
  left: 0;
  right: 0;
  bottom: ${(props) => (props.$isOpen ? "0" : "-100%")};
  transition: bottom 200ms ease-in-out;
  background: white;
  box-shadow: 0px -5px 15px rgba(0, 0, 0, 0.1);
  z-index: 100;

  background: #ffffff;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  width: 100%;
`;
const StyledPopupContent = styled.div`
  max-height: 350px;
  overflow-y: auto;
`;

const StyledOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: ${(props) => (props.$isOpen ? "block" : "none")};
  z-index: 50;
`;

function FooterPopup({ isOpen, onClose, children, title }) {
  return (
    <>
      <StyledOverlay $isOpen={isOpen} onClick={onClose} />
      <StyledPopupContainer $isOpen={isOpen}>
        <PopModalTitleRow title={title} onClickClose={onClose} />
        <StyledPopupContent>{children}</StyledPopupContent>
      </StyledPopupContainer>
    </>
  );
}

export default FooterPopup;
