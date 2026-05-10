import styled, { createGlobalStyle } from "styled-components";

/** Global styles for theme-aware components */
export const GlobalStyles = createGlobalStyle`
  .danger-btn-text {
    color: ${({ theme }) => theme?.colors?.error || '#d65a5a'} !important;
  }
  
  .click-cursor {
    cursor: pointer;
  }
  
  .click-cursor-disable {
    cursor: not-allowed;
  }
`;

/** tab page content wrapper */
interface StyledPageInnerContentProps {
  $showMore?: boolean;
}
export const StyledPageInnerContent = styled.div<StyledPageInnerContentProps>`
  background-color: ${({ theme }) => theme?.colors?.backgroundWhite || 'white'};
  width: 750px;
  min-height: ${(props) => (props.$showMore ? "750px" : "600px")};
  max-height: calc(100vh - 40px);
  position: relative;
  transition: min-height 0.3s ease-in-out;
  overflow-y: auto;
  border-radius: 20px;
  box-shadow: ${({ theme }) => theme?.shadows?.card || '0px 0px 20px rgba(0, 0, 0, 0.05)'};

  display: flex;
  flex-direction: column;
`;
