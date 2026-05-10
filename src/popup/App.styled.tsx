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

interface StyledAppHeaderProps {
  $showFull?: boolean;
  $autoWidth?: boolean;
}

export const StyledAppHeader = styled.header<StyledAppHeaderProps>`
  position: relative;
  display: flex;
  flex-direction: column;
  width: 375px;
  min-height: 600px;
  margin: 0 auto;
  background-color: white;
  height: 100vh;
  overflow: hidden;
  isolation: isolate;
  transform: translateZ(0);

  ${({ $showFull }) => $showFull && css`
    width: 100% !important;
    height: auto !important;
    min-height: 100vh;
    min-width: 750px;
    overflow: visible;
    background-color: rgb(249, 250, 252);
    align-items: center;
    justify-content: center;
  `}

  ${({ $autoWidth }) => $autoWidth && css`
    height: auto !important;
    width: auto !important;
    overflow: visible;
  `}
`;
