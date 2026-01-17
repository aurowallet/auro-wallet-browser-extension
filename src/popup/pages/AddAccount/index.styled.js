import styled from 'styled-components';
import { StyledContentContainer as BaseContentContainer } from '../../component/CustomView/index.styled';

export const StyledContainer = styled(BaseContentContainer)`
  padding: 10px 0px 0px;
`;

export const StyledRowContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 50px;
  cursor: pointer;
  padding: 0px 20px;

  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
`;

export const StyledRowTitle = styled.p`
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
  font-size: ${({ theme }) => theme.typography.fontSizeTitleSmall};
  line-height: 100%;
  color: ${({ theme }) => theme.colors.textBlack};
  margin: 0;
`;
