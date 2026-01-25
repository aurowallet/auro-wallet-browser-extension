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

export const StyledBottomContainer = styled.div`
  padding: 20px;
  position: fixed;
  bottom: 0;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 375px;
`;

export const StyledTipLink = styled.a`
  width: fit-content;
  padding: 10px;
  text-decoration: none;
  color: ${({ theme }) => theme.colors.primary};
  appearance: none;
  -webkit-appearance: none;
  -webkit-text-size-adjust: none;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
  -webkit-touch-callout: none;
  border-bottom: none;
  display: block;
  font-size: ${({ theme }) => theme.typography.fontSizeContent};
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
  cursor: pointer;

  &:hover {
    opacity: 0.8;
  }
`;
