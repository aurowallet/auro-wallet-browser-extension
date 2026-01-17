import styled from 'styled-components';
import { StyledContentContainer as BaseContentContainer } from '../../component/CustomView/index.styled';

export const StyledContentContainer = styled(BaseContentContainer)`
  padding: 10px 0px 0px;
`;

export const StyledRowContainer = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 54px;
  cursor: pointer;
  padding: 0px 20px;

  span {
    font-weight: ${({ theme }) => theme.typography.fontWeightSemiBold};
    font-size: ${({ theme }) => theme.typography.fontSizeTitleSmall};
    line-height: 100%;
    color: ${({ theme }) => theme.colors.textBlack};
  }

  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
`;
