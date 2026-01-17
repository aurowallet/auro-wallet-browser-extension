import styled, { css } from 'styled-components';

export const StyledApp = styled.div`
  -webkit-user-drag: none;
  background-color: #edeff2;

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }
`;

export const StyledAppHeader = styled.header`
  display: flex;
  flex-direction: column;
  width: 375px;
  min-height: 600px;
  margin: 0 auto;
  background-color: white;
  height: 100vh;

  ${({ $showFull }) => $showFull && css`
    height: auto !important;
    width: auto !important;
    min-height: 600px;
    min-width: 750px;
  `}

  ${({ $autoWidth }) => $autoWidth && css`
    height: auto !important;
    width: auto !important;
  `}
`;
