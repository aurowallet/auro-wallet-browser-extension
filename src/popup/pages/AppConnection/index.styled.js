import styled from 'styled-components';

export const StyledRowContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 54px;

  span {
    font-weight: ${({ theme }) => theme.typography.fontWeightSemiBold};
    font-size: ${({ theme }) => theme.typography.fontSizeTitleSmall};
    color: ${({ theme }) => theme.colors.textBlack};
    word-break: break-all;
  }

  img {
    cursor: pointer;
    &:hover {
      opacity: 0.6;
    }
  }
`;

export const StyledEmptyContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-bottom: 58px;
`;

export const StyledEmptyIcon = styled.img`
  display: block;
`;

export const StyledNoDAppTip = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSizeDesc};
  line-height: 14px;
  color: ${({ theme }) => theme.colors.textTertiary};
  margin: 10px 0px 0px;
`;
