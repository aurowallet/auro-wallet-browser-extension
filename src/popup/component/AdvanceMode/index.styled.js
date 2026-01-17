import styled, { css } from 'styled-components';

export const StyledAdvanceContainer = styled.div`
  img {
    display: block;
  }
`;

export const StyledAdvanceEntry = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
  width: fit-content;
`;

export const StyledAdvanceTitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSizeDesc};
  line-height: 14px;
  color: ${({ theme }) => theme.colors.primary};
  margin: 0 5px 0px 0px;
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
`;

export const StyledAdvanceIcon = styled.img`
  transform: ${({ $isOpen }) => $isOpen ? 'rotate(180deg)' : 'rotate(0)'};
  transition: 0.35s;
`;

export const StyledAdvanceInputGroup = styled.div`
  margin-top: 20px;
  
  > :not(:first-child) {
    margin-top: 20px;
  }
`;

export const StyledWarningTip = styled.span`
  color: ${({ theme }) => theme.colors.warning};
`;
