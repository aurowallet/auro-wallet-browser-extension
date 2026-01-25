import styled, { css } from 'styled-components';
import { StyledContentContainer as BaseContentContainer } from '../../component/CustomView/index.styled';

export const StyledContainer = styled(BaseContentContainer)`
  padding: 10px 20px;
  position: relative;
`;

export const StyledDividedLine = styled.div`
  border: 0.5px solid #f2f2f2;
  width: 100%;
  margin-top: 10px;
`;

export const StyledRowContainer = styled.div`
  margin-top: 8px;
  cursor: pointer;
`;

export const StyledRowTitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSizeDesc};
  line-height: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
`;

interface StyledRowContentProps {
  $camelCase?: boolean;
}
export const StyledRowContent = styled.p<StyledRowContentProps>`
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
  font-size: ${({ theme }) => theme.typography.fontSizeContent};
  line-height: 16px;
  color: ${({ theme }) => theme.colors.textBlack};
  margin: 0;
  word-wrap: break-word;

  ${({ $camelCase }) => $camelCase && css`
    text-transform: capitalize;
  `}
`;

export const StyledScamTag = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
  font-size: ${({ theme }) => theme.typography.fontSizeDesc};
  line-height: 14px;
  color: ${({ theme }) => theme.colors.error};
  border: 1px solid ${({ theme }) => theme.colors.error};
  border-radius: 2px;
  margin-left: 4px;
`;

export const StyledExplorerOuter = styled.div`
  position: fixed;
  bottom: 0;
  width: calc(100% - 40px);
  max-width: calc(375px - 40px);
  background-color: ${({ theme }) => theme.colors.backgroundWhite};
`;

export const StyledExplorerContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 10px auto;
  cursor: pointer;
  width: fit-content;
`;

export const StyledExplorerTitle = styled.p`
  font-style: normal;
  font-weight: ${({ theme }) => theme.typography.fontWeightSemiBold};
  font-size: ${({ theme }) => theme.typography.fontSizeContent};
  line-height: 22px;
  text-align: center;
  color: ${({ theme }) => theme.colors.primary};
  margin: 0px 6px 0px 0px;
`;
