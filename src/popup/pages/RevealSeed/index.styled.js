import styled from 'styled-components';

export const StyledBackTitle = styled.p`
  font-style: normal;
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
  font-size: ${({ theme }) => theme.typography.fontSizeContent};
  line-height: ${({ theme }) => theme.typography.lineHeightDesc};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

export const StyledMneContainer = styled.div`
  margin-top: 20px;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-row-gap: 10px;
  grid-column-gap: 18px;
`;

export const StyledPlaceholder = styled.div`
  flex: 1;
`;

export const StyledBottomContainer = styled.div`
  padding: 12px 18px 20px;
`;

export const StyledMneReminderContainer = styled.div`
  background: rgba(214, 90, 90, 0.1);
  border: 1px solid ${({ theme }) => theme.colors.error};
  border-radius: 10px;
  padding: 10px;
`;

export const StyledMneReminderTop = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 10px;
`;

export const StyledMneReminderTitle = styled.p`
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
  font-size: ${({ theme }) => theme.typography.fontSizeContent};
  line-height: 14px;
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.colors.error};
  margin: 0px 0px 0px 10px;
`;

export const StyledMneReminderContent = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSizeDesc};
  line-height: ${({ theme }) => theme.typography.lineHeightDesc};
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.colors.error};
  margin: 0;
`;
