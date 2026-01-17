import styled from 'styled-components';
import { StyledContentContainer as BaseContentContainer } from '../../component/CustomView/index.styled';

export const StyledAboutContainer = styled(BaseContentContainer)`
  a {
    text-decoration: none;
    color: inherit;
    appearance: none;
    -webkit-appearance: none;
    -webkit-text-size-adjust: none;
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
    -webkit-touch-callout: none;
    border-bottom: none;
    display: block;
    text-align: left;
  }
`;

export const StyledDevWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const StyledIcon = styled.img`
  width: 72px;
  object-fit: scale-down;
  margin: 20px auto;
`;

export const StyledWalletName = styled.p`
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
  font-size: ${({ theme }) => theme.typography.fontSizeTitle};
  line-height: 22px;
  text-align: center;
  letter-spacing: -0.3px;
  color: ${({ theme }) => theme.colors.textBlack};
  margin: 0px 0px 4px;
`;

export const StyledWalletVersion = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSizeContent};
  line-height: ${({ theme }) => theme.typography.lineHeightDesc};
  text-align: center;
  letter-spacing: -0.3px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
`;

export const StyledWalletTip = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSizeContent};
  line-height: ${({ theme }) => theme.typography.lineHeightDesc};
  text-align: center;
  color: ${({ theme }) => theme.colors.textBlack};
  margin: 10px 7px 30px;
`;

export const StyledLinkContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
`;

export const StyledLinkContent = styled.a`
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
  font-size: ${({ theme }) => theme.typography.fontSizeContent};
  height: 20px;
  text-align: center;
  color: #594af1;
  margin: 0px;
  cursor: pointer;
  text-decoration: none;

  &:visited,
  &:link {
    color: #594af1;
  }

  &:hover {
    color: #4a3dd4;
  }
`;

export const StyledFollowTitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSizeDesc};
  line-height: ${({ theme }) => theme.typography.lineHeightDesc};
  text-align: center;
  color: #808080;
  margin: 30px 0px 10px;
`;

export const StyledFollowListContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
`;

export const StyledFollowItemContainer = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  cursor: pointer;
  text-decoration: none;

  &:hover > div {
    background: rgba(89, 74, 241, 0.2);
  }
`;

export const StyledIconContainer = styled.div`
  width: 48px;
  height: 48px;
  background: rgba(89, 74, 241, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const StyledFollowItemTitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSizeDesc};
  line-height: 14px;
  text-align: center;
  color: #808080;
  margin: 4px 0px 0px;
`;
