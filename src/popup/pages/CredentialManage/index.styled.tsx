import styled from 'styled-components';
import { StyledContentContainer as BaseContentContainer } from '../../component/CustomView/index.styled';

export const StyledContainer = styled(BaseContentContainer)`
  padding: 10px 0px 10px;
`;

export const StyledContentWrapper = styled.div`
  flex: 1;
`;

export const StyledItemWrapper = styled.div`
  margin: 0px 20px 10px;
  padding: 10px 0px 10px 20px;
  cursor: pointer;
  min-height: 40px;
  display: flex;
  align-items: center;
  border-radius: 10px;
  border: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  background: #f9fafc;
  justify-content: space-between;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
`;

export const StyledItemContent = styled.div`
  color: rgba(0, 0, 0, 0.8);
  font-size: ${({ theme }) => theme.typography.fontSizeContent};
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};

  div {
    word-break: break-all;
    white-space: pre-wrap;
  }

  > :not(:first-child) {
    margin-top: 8px;
  }
`;

export const StyledEmptyContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  img {
    display: block;
  }
`;

export const StyledEmptyTip = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSizeDesc};
  line-height: 14px;
  color: ${({ theme }) => theme.colors.textTertiary};
  margin: 10px 0px 0px;
`;
