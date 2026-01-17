import styled from 'styled-components';

export const StyledInputContainer = styled.div`
  > :first-child {
    margin-bottom: 20px;
  }
`;

export const StyledPlaceholder = styled.div`
  flex: 1;
`;

export const StyledBottomContainer = styled.div`
  padding: 12px 18px 20px;
`;

export const StyledDeleteBtn = styled.p`
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
  font-size: ${({ theme }) => theme.typography.fontSizeContent};
  line-height: ${({ theme }) => theme.typography.lineHeightDesc};
  text-align: center;
  color: ${({ theme }) => theme.colors.error};
  margin: 0;
  cursor: pointer;
  text-transform: capitalize;
`;

export const StyledModalDelete = styled.span`
  color: ${({ theme }) => theme.colors.error};
`;
