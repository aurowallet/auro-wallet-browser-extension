import { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  body {
    margin: 0;
    --mainBlue: #594af1;
    --mainBlack: rgba(0, 0, 0, 0.85);
    --secondaryRed: #d65a5a;
    --secondaryGreen: #0db27c;
    --secondaryYellow: #e4b200;
    --white: rgba(255, 255, 255, 1);
    --whiteLilac: rgba(249, 250, 252, 1);
    --mediumGray: rgba(0, 0, 0, 0.1);
    --nobelGray: rgba(0, 0, 0, 0.3);
    --mediumBlack: rgba(0, 0, 0, 0.5);
    --mineBlack: rgba(0, 0, 0, 0.85);
    background-color: #edeff2;
  }

  p {
    margin: 0;
    padding: 0;
  }

  input,
  button,
  select,
  optgroup,
  textarea {
    margin: 0;
    font-size: inherit;
    font-family: inherit;
    line-height: inherit;
  }

  .click-cursor {
    cursor: pointer;
  }

  .click-cursor-disable {
    cursor: not-allowed;
  }
`;

export default GlobalStyles;
