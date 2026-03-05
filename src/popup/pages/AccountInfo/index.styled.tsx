import styled, { css } from 'styled-components';

interface StyledClickableProps {
  $clickable?: boolean;
}
import { StyledContentContainer as BaseContentContainer } from '../../component/CustomView/index.styled';

export const StyledContainer = styled(BaseContentContainer)`
  padding: 10px 0px 0px;
`;

export const StyledContentContainer = styled.div`
  margin-top: 10px;
`;

export const StyledRowAddress = styled.div`
  height: 74px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  border-bottom: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  padding: 0 20px;
  cursor: pointer;
`;

export const StyledRowAddressTitle = styled.p`
  font-weight: ${({ theme }) => theme.typography.fontWeightSemiBold};
  font-size: ${({ theme }) => theme.typography.fontSizeTitleSmall};
  line-height: 100%;
  color: ${({ theme }) => theme.colors.textBlack};
  margin: 0px 0px 4px;
`;

export const StyledRowAddressContent = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
  font-size: ${({ theme }) => theme.typography.fontSizeContent};
  line-height: ${({ theme }) => theme.typography.lineHeightDesc};
  color: ${({ theme }) => theme.colors.textTertiary};
  word-wrap: break-word;
`;

export const StyledRowInfoContainer = styled.div`
  margin-top: 11.5px;
`;

export const StyledRowContainer = styled.div<StyledClickableProps>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
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
  margin: 0;
`;

export const StyledRowDesc = styled.p`
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
  font-size: ${({ theme }) => theme.typography.fontSizeContent};
  line-height: ${({ theme }) => theme.typography.lineHeightDesc};
  color: ${({ theme }) => theme.colors.textTertiary};
  margin: 4px 0px 0px;
`;

export const StyledDeleteRow = styled.div`
  height: 54px;
  display: flex;
  align-items: center;
  padding: 0 20px;
`;

export const StyledDeleteTitle = styled.p`
  color: ${({ theme }) => theme.colors.error};
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  text-transform: capitalize;
  font-weight: ${({ theme }) => theme.typography.fontWeightSemiBold};
  font-size: ${({ theme }) => theme.typography.fontSizeTitleSmall};
  margin: 0;
`;

export const StyledDividedLine = styled.div`
  background-color: ${({ theme }) => theme.colors.borderLight};
  margin: 10px 0;
  width: 100%;
  height: 0.5px;
  padding: 0 20px;
`;

export const StyledWarningTip = styled.span`
  && {
    color: rgba(228, 178, 0, 1);
  }
`;

export const StyledModalDelete = styled.span`
  color: ${({ theme }) => theme.colors.error};
`;
