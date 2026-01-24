import styled, { css } from 'styled-components';

interface StyledModalBgProps {
  $show?: boolean;
}

interface StyledOptionProps {
  $selected?: boolean;
}

export const StyledModalBg = styled.div<StyledModalBgProps>`
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  width: 375px;
  height: 600px;
  display: ${({ $show }) => $show ? 'initial' : 'none'} !important;
`;

export const StyledContainer = styled.div`
  position: relative;
  width: 120px;
`;

export const StyledSelectContainer = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: 43px;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 30px;
  padding-left: 14px;
  z-index: 12;
  cursor: pointer;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
`;

export const StyledArrowIcon = styled.div`
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  margin-right: 6px;
`;

export const StyledSelectTitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSizeContent};
  line-height: 100%;
  font-weight: ${({ theme }) => theme.typography.fontWeightSemiBold};
  text-align: center;
  color: ${({ theme }) => theme.colors.textBlack};
  order: 0;
  flex-grow: 0;
  margin: 0;
  width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

export const StyledOptionsOuter = styled.div`
  position: absolute;
  padding-top: 10px;
  width: 100%;
`;

export const StyledOptionsContainer = styled.div`
  width: 100%;
  padding: 10px 0px;
  background: ${({ theme }) => theme.colors.backgroundWhite};
  max-height: 300px;
  overflow-y: scroll;
  border: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  box-shadow: 0px 4px 15px rgba(0, 0, 0, 0.15);
  border-radius: ${({ theme }) => theme.borderRadius.medium};
`;

export const StyledOption = styled.div<StyledOptionProps>`
  padding: 10px 10px;
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
  font-size: ${({ theme }) => theme.typography.fontSizeTitleSmall};
  line-height: 100%;
  text-align: center;
  color: ${({ theme }) => theme.colors.textBlack};
  margin: 0;
  cursor: pointer;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }

  ${({ $selected }) => $selected && css`
    color: ${({ theme }) => theme.colors.primary};
  `}
`;

export const StyledNetworkTitleWrapper = styled.div`
  margin: 8px 0px;
  display: flex;
  justify-content: center;
  padding: 0 10px;
`;

export const StyledNodeListTitle = styled.p`
  font-weight: ${({ theme }) => theme.typography.fontWeightNormal};
  font-size: ${({ theme }) => theme.typography.fontSizeDesc};
  color: #808080;
  padding: 0 10px;
  text-transform: capitalize;
  white-space: nowrap;
  margin: 0;
`;

export const StyledHrDotted = styled.hr`
  width: 100%;
  height: 0;
  border: 0.5px dashed #808080;
`;
