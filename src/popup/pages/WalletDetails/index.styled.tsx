import styled, { css } from 'styled-components';
import { StyledContentContainer as BaseContentContainer } from '../../component/CustomView/index.styled';

export const StyledContainer = styled(BaseContentContainer)`
  padding: 10px 0px 0px;
`;

export const StyledContentContainer = styled.div`
  margin-top: 10px;
`;

export const StyledRowInfoContainer = styled.div`
  margin-top: 11.5px;
`;

interface StyledRowContainerProps {
  $clickable?: boolean;
}

export const StyledRowContainer = styled.div<StyledRowContainerProps>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 54px;
  padding: 0 20px;

  ${({ $clickable }) => $clickable && css`
    cursor: pointer;
    &:hover {
      background: rgba(0, 0, 0, 0.05);
    }
  `}
`;

export const StyledRowTitle = styled.p`
  font-weight: ${({ theme }) => theme.typography.fontWeightSemiBold};
  font-size: ${({ theme }) => theme.typography.fontSizeTitleSmall};
  line-height: 100%;
  color: ${({ theme }) => theme.colors.textBlack};
`;

export const StyledRowDesc = styled.p`
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
  font-size: ${({ theme }) => theme.typography.fontSizeContent};
  line-height: ${({ theme }) => theme.typography.lineHeightDesc};
  color: ${({ theme }) => theme.colors.textTertiary};
  word-wrap: break-word;
  margin: 4px 0px 0px;
`;

export const StyledDeleteRow = styled.div`
  height: 54px;
  display: flex;
  align-items: center;
  padding: 0 20px;
`;

export const StyledDeleteTitle = styled.p`
  font-weight: ${({ theme }) => theme.typography.fontWeightSemiBold};
  font-size: ${({ theme }) => theme.typography.fontSizeTitleSmall};
  line-height: 100%;
  color: ${({ theme }) => theme.colors.error};
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  text-transform: capitalize;
`;

export const StyledDividedLine = styled.div`
  background-color: ${({ theme }) => theme.colors.borderLight};
  margin: 10px 0;
  width: 100%;
  height: 0.5px;
  padding: 0 20px;
`;

export const StyledModalDelete = styled.span`
  color: ${({ theme }) => theme.colors.error};
`;
