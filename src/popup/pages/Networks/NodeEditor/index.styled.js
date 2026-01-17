import styled from 'styled-components';
import { StyledContentContainer as BaseContentContainer } from '../../../component/CustomView/index.styled';

export const StyledContentClassName = styled(BaseContentContainer)`
  padding: 0px 0px;
`;

export const StyledAddTipContainer = styled.div`
  padding: 10px 20px;
  background: rgba(214, 90, 90, 0.1);
`;

export const StyledAddTip = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSizeContent};
  line-height: 20px;
  color: ${({ theme }) => theme.colors.error};
`;

export const StyledInputContainer = styled.div`
  margin-top: 20px;
  padding: 0px 20px;

  > :first-child {
    margin-bottom: 20px;
  }
`;

export const StyledPlaceholder = styled.div`
  flex: 1;
`;

export const StyledBottomContainer = styled.div`
  padding: 12px 38px 20px;
`;

export const StyledDeleteBtn = styled.p`
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
  font-size: ${({ theme }) => theme.typography.fontSizeContent};
  line-height: ${({ theme }) => theme.typography.lineHeightDesc};
  text-align: center;
  color: ${({ theme }) => theme.colors.error};
  margin: 0 10px 0px 0px;
  cursor: pointer;
`;

export const StyledModalDelete = styled.span`
  color: ${({ theme }) => theme.colors.error};
`;

export const StyledWarningTip = styled.span`
  color: rgba(214, 90, 90, 1);
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
`;
