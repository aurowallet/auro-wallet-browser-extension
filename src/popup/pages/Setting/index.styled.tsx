import styled from 'styled-components';
import { StyledContentContainer as BaseContentContainer, StyledTitle } from '../../component/CustomView/index.styled';

export const StyledContentContainer = styled(BaseContentContainer)`
  padding: 10px 0px 0px;
`;

export const StyledCustomTitle = styled(StyledTitle)`
  left: 46px;
  transform: unset;
  cursor: pointer;
`;

export const StyledRowContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 54px;
  padding: 0px 10px 0 16px;
  cursor: pointer;

  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
`;

export const StyledRowLeft = styled.div`
  display: flex;
  align-items: center;
`;

export const StyledRowTitle = styled.p`
  font-weight: ${({ theme }) => theme.typography.fontWeightSemiBold};
  font-size: ${({ theme }) => theme.typography.fontSizeTitleSmall};
  line-height: 100%;
  color: ${({ theme }) => theme.colors.textBlack};
  flex: none;
  order: 1;
  flex-grow: 0;
  margin: 0;
  padding-left: 10px;
`;

export const StyledIconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const StyledRowContent = styled.p`
  font-weight: ${({ theme }) => theme.typography.fontWeightNormal};
  font-size: ${({ theme }) => theme.typography.fontSizeContent};
  line-height: 100%;
  color: ${({ theme }) => theme.colors.textTertiary};
  margin: 0;
  white-space: nowrap;
  text-overflow: ellipsis;
  max-width: 120px;
`;

export const StyledDividedLine = styled.div`
  background-color: ${({ theme }) => theme.colors.borderLight};
  height: 0.5px;
  width: calc(100% - 40px);
  margin: 10px auto;
`;
