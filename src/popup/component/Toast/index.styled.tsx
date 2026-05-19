import styled from 'styled-components';

export const StyledToastContainer = styled.div`
  position: absolute;
  inset: 0;
  margin: 0;
  padding: 0;
  pointer-events: none;
`;

export const StyledMask = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.1);
  z-index: 10101;
  pointer-events: auto;
`;

export const StyledToastWrap = styled.div<{ $top?: string }>`
  position: absolute;
  top: ${({ $top }) => $top || '40%'};
  left: 50%;
  transform: translateX(-50%);
  max-width: 80%;
  z-index: 10102;
  width: fit-content;
  pointer-events: auto;
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
