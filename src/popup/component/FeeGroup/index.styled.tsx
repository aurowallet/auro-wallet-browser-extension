import styled, { css } from 'styled-components';

interface StyledFeeButtonProps {
    $selected?: boolean;
}

export const StyledFeeContainer = styled.div``;

export const StyledTopContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
`;

export const StyledFeeTitle = styled.p`
  font-weight: ${({ theme }) => theme.typography.fontWeightSemiBold};
  font-size: ${({ theme }) => theme.typography.fontSizeDesc};
  line-height: ${({ theme }) => theme.typography.lineHeightDesc};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0;
`;

export const StyledFeeAmount = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 24px;
  font-size: ${({ theme }) => theme.typography.fontSizeDesc};
  line-height: ${({ theme }) => theme.typography.lineHeightDesc};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

export const StyledBtnGroup = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
`;

export const StyledFeeButton = styled.div<StyledFeeButtonProps>`
  background: ${({ theme }) => theme.colors.backgroundLilac};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 0;
  cursor: pointer;
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
  font-size: ${({ theme }) => theme.typography.fontSizeContent};
  line-height: ${({ theme }) => theme.typography.lineHeightDesc};
  color: ${({ theme }) => theme.colors.textBlack};
  border: 0.5px solid ${({ theme }) => theme.colors.borderLight};

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
    border: 0.5px solid ${({ theme }) => theme.colors.primary};
  }

  ${({ $selected }) => $selected && css`
    color: ${({ theme }) => theme.colors.primary};
    border: 0.5px solid ${({ theme }) => theme.colors.primary};
  `}
`;
