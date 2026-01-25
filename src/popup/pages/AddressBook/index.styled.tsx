import styled from 'styled-components';
import { StyledContentContainer as BaseContentContainer } from '../../component/CustomView/index.styled';

export const StyledContainer = styled(BaseContentContainer)`
  padding: 10px 0px 90px;
`;

export const StyledEmptyContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

export const StyledEmptyIcon = styled.img`
  display: block;
`;

export const StyledNoAddressTip = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSizeDesc};
  line-height: 14px;
  color: ${({ theme }) => theme.colors.textTertiary};
  margin: 10px 0px 0px;
`;

export const StyledBottomContainer = styled.div`
  position: absolute;
  padding: 12px 38px 20px;
  width: 100%;
  bottom: 0;
  background-color: ${({ theme }) => theme.colors.backgroundWhite};
  max-width: 375px;
`;

export const StyledAddressContainer = styled.div`
  flex: 1;
`;

export const StyledAddressItemContainer = styled.div`
  padding: 10px 20px;
  cursor: pointer;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
`;

export const StyledAddressName = styled.p`
  font-weight: ${({ theme }) => theme.typography.fontWeightSemiBold};
  font-size: ${({ theme }) => theme.typography.fontSizeTitleSmall};
  line-height: 100%;
  color: ${({ theme }) => theme.colors.textBlack};
  margin: 0px;
  word-break: break-all;
`;

export const StyledAddressValue = styled.p`
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
  font-size: ${({ theme }) => theme.typography.fontSizeContent};
  line-height: 100%;
  color: ${({ theme }) => theme.colors.textTertiary};
  margin: 4px 0px 0px;
  word-break: break-all;
`;

export const StyledDividedLine = styled.div`
  height: 0.5px;
  background-color: ${({ theme }) => theme.colors.borderLight};
  margin: 10px 20px;
`;
