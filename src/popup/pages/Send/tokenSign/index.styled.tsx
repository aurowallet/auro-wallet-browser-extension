import styled, { css } from 'styled-components';

interface StyledMultiRowArrowProps {
  $disabled?: boolean;
  $isRight?: boolean;
}

export const StyledContainer = styled.div``;

export const StyledMultiTitleRow = styled.div`
  display: flex;
  align-items: center;
  height: 40px;
  padding: 0px 20px;
  position: relative;
  justify-content: space-between;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
`;

export const StyledMultiTitle = styled.div`
  color: rgba(0, 0, 0, 0.5);
  text-align: center;
  font-size: 14px;
`;

export const StyledMultiTitleBold = styled.span`
  font-weight: 600;
`;

export const StyledMultiTitleRowRight = styled.div`
  display: flex;
  align-items: center;

  &:not(:first-child) {
    margin-left: 10px;
  }
`;

export const StyledMultiRowArrow = styled.div<StyledMultiRowArrowProps>`
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  ${({ $disabled }) => $disabled && css`
    cursor: not-allowed;
  `}

  ${({ $isRight }) => $isRight && css`
    transform: rotate(180deg);
  `}
`;

export const StyledMultiBottomWrapper = styled.div`
  width: 100%;
  height: 40px;
  max-width: 375px;
  justify-content: center;
  align-items: center;
  display: flex;
  position: absolute;
  bottom: 0;
`;

export const StyledMultiBottom = styled.div`
  color: #594af1;
  text-align: center;
  font-size: 14px;
  cursor: pointer;
`;
