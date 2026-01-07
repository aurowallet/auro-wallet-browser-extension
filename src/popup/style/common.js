import styled from "styled-components";

/** tab page outer wrapper */
export const StyledPageOuterWrapper = styled.div`
  height: 100vh;
  width: 100vw;
  min-height: 600px;
  background-color: rgb(249, 250, 252);
  display: flex;
  align-items: center;
  justify-content: center;
`;

/** tab page content wrapper */
export const StyledPageInnerContent = styled.div`
  background-color: white;
  width: 750px;
  height: ${(props) => (props.showMore ? "750px" : "600px")};
  position: relative;
  transition: height 0.3s ease-in-out;
  overflow: hidden;
  border-radius: 20px;
  box-shadow: 0px 0px 20px rgba(0, 0, 0, 0.05);

  display: flex;
  flex-direction: column;
`;
