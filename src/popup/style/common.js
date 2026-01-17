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

/** tab page outer wrapper */
export const StyledPageOuterWrapper = styled.div`
  height: 100vh;
  width: 100vw;
  min-height: 600px;
  background-color: ${({ theme }) => theme?.colors?.backgroundLilac || 'rgb(249, 250, 252)'};
  display: flex;
  align-items: center;
  justify-content: center;
`;

/** tab page content wrapper */
export const StyledPageInnerContent = styled.div`
  background-color: ${({ theme }) => theme?.colors?.backgroundWhite || 'white'};
  width: 750px;
  height: ${(props) => (props.showMore ? "750px" : "600px")};
  position: relative;
  transition: height 0.3s ease-in-out;
  overflow: hidden;
  border-radius: 20px;
  box-shadow: ${({ theme }) => theme?.shadows?.card || '0px 0px 20px rgba(0, 0, 0, 0.05)'};

  display: flex;
  flex-direction: column;
`;
