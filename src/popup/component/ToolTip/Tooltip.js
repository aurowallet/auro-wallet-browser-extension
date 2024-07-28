import styled from "styled-components";

const TooltipContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const TooltipText = styled.div`
  background: rgba(0, 0, 0, 0.8);

  visibility: hidden;
  max-width: 335px;
  color: white;
  text-align: center;
  border-radius: 8px;
  padding: 8px 10px;
  position: absolute;
  z-index: 1;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);

  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.3s;

  ${TooltipContainer}:hover & {
    visibility: visible;
    opacity: 1;
  }
`;

const Tooltip = ({ children, text }) => {
  return (
    <TooltipContainer>
      {children}
      <TooltipText>{text}</TooltipText>
    </TooltipContainer>
  );
};

export default Tooltip;
