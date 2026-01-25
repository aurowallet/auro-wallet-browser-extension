import styled, { css } from 'styled-components';
import { StyledContentContainer as BaseContentContainer } from '../../component/CustomView/index.styled';

export const StyledContentClassName = styled(BaseContentContainer)`
  padding: 10px 0px 0px;
  
`;

export const searchInputContainerCss = css`
  background: rgba(0, 0, 0, 0.05);
  border: 0.5px solid transparent;
  
  &:hover {
    border: 0.5px solid transparent;
  }
  
  &:focus-within {
    border: 0.5px solid transparent;
  }
`;

export const searchInputCss = css`
  background-color: transparent;
  padding: 0 8px;
  border: none;
  
  &::placeholder {
    font-size: 14px;
    line-height: 17px;
    font-weight: 400;
    color: rgba(0, 0, 0, 0.3);
  }
`;

export const StyledInputCon = styled.div`
  width: 100%;
  background-color: ${({ theme }) => theme.colors.backgroundWhite};
  padding: 0 20px 10px;
  max-width: 375px;
`;

export const StyledListContainer = styled.div`
  padding: 0 20px;
  overflow: auto;
`;

export const StyledRowContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

interface StyledNodeItemContainerProps {
  $selected?: boolean;
}

export const StyledNodeItemContainer = styled.div<StyledNodeItemContainerProps>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f9fafc;
  border: 0.5px solid rgba(0, 0, 0, 0.05);
  border-radius: 10px;
  min-height: 60px;
  padding: 10px 10px;
  margin-top: 10px;
  flex: 1;
  cursor: pointer;

  &:hover {
    border: 0.5px solid ${({ theme }) => theme.colors.primary};
  }

  ${({ $selected }) => $selected && css`
    border: 0.5px solid ${({ theme }) => theme.colors.primary} !important;
  `}
`;

export const StyledRowLeft = styled.div`
  display: flex;
  align-items: center;
`;

export const StyledNodeName = styled.p`
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
  font-size: ${({ theme }) => theme.typography.fontSizeContent};
  line-height: ${({ theme }) => theme.typography.lineHeightDesc};
  color: ${({ theme }) => theme.colors.textBlack};
`;

export const StyledNodeAddress = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSizeDesc};
  line-height: ${({ theme }) => theme.typography.lineHeightDesc};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

export const StyledNodeInfoCon = styled.div`
  margin-left: 10px;
  max-width: 146px;
`;

export const StyledManualAddContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  margin: 20px 0px;
`;

export const StyledManualAddContent = styled.p`
  text-align: center;
  width: fit-content;
  color: ${({ theme }) => theme.colors.primary};
  cursor: pointer;
  font-size: ${({ theme }) => theme.typography.fontSizeContent};
`;

export const StyledManualSubmit = styled.a`
  font-weight: ${({ theme }) => theme.typography.fontWeightNormal};
  font-size: ${({ theme }) => theme.typography.fontSizeDesc};
  line-height: 14px;
  padding: 4px 0px;
  text-align: center;
  color: ${({ theme }) => theme.colors.textTertiary};
  cursor: pointer;
  margin-top: 6px;
  text-decoration: none;
`;

export const StyledIconCon = styled.div`
  width: 30px;
  height: 30px;
  border-radius: 100%;
`;

export const StyledHolderIconCon = styled.div`
  width: 100%;
  height: 100%;
  border-radius: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.3);
  color: white;
  font-size: ${({ theme }) => theme.typography.fontSizeTitleSmall};
`;

export const StyledNodeIcon = styled.img`
  width: 30px;
  height: 30px;
  object-fit: scale-down;
  border-radius: 100%;
`;
