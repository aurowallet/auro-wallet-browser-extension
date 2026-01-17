import styled from 'styled-components';
import { StyledContentContainer as BaseContentContainer } from '../../component/CustomView/index.styled';

export const StyledContainer = styled(BaseContentContainer)`
  padding: 10px 0px 100px;
`;

export const StyledContentContainer = styled.div`
  padding: 0px 20px;
`;

export const StyledInputContainer = styled.div`
  > :not(:first-child) {
    margin-top: 20px;
  }
`;

export const StyledFeeContainer = styled.div`
  margin: 20px 0 10px;
`;

export const StyledDividedLine = styled.div`
  height: 0.5px;
  background-color: ${({ theme }) => theme.colors.borderLight};
  width: 100%;
  margin: 10px 0px;
`;

export const StyledBottomContainer = styled.div`
  padding: 12px 38px 20px;
  position: fixed;
  bottom: 0;
  width: calc(100%);
  max-width: 375px;
`;

export const StyledPlaceholder = styled.div`
  flex: 1;
`;

export const StyledNodeNameContainer = styled.div``;

export const StyledLabel = styled.div`
  font-weight: ${({ theme }) => theme.typography.fontWeightSemiBold};
  font-size: ${({ theme }) => theme.typography.fontSizeDesc};
  line-height: ${({ theme }) => theme.typography.lineHeightDesc};
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: 4px;
  justify-content: space-between;
`;

export const StyledLabelContainer = styled.div`
  display: flex;
  align-items: center;
`;

export const StyledRowContainer = styled.div`
  display: flex;
  align-items: center;
  height: 44px;
  justify-content: space-between;
  border: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: 6px;
  padding: 0 10px;
  cursor: pointer;
`;

export const StyledNodeName = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSizeTitleSmall};
  line-height: 24px;
  color: ${({ theme }) => theme.colors.textPrimary};
  max-width: 280px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

export const StyledArrow = styled.img`
  transform: rotate(270deg);
  width: 30px;
  object-fit: scale-down;
`;
