import styled from 'styled-components';

export const StyledToastContainer = styled.div`
  margin: 0;
  padding: 0;
`;

export const StyledMask = styled.div`
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.1);
  z-index: 301;
`;

export const StyledToastWrap = styled.div`
  position: fixed;
  top: 40%;
  margin: 0 auto;
  left: 0;
  right: 0;
  max-width: 80%;
  z-index: 302;
  width: fit-content;
`;

export const StyledToastItem = styled.div`
  padding: 8px 10px;
  background: rgba(0, 0, 0, 1);
  color: #fff;
  border-radius: 10px;
  margin-top: 10px;
  text-align: center;
  word-wrap: break-word;
`;
