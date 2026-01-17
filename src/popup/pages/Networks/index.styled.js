import styled, { css } from 'styled-components';
import { StyledContentContainer as BaseContentContainer } from '../../component/CustomView/index.styled';

export const StyledContentClassName = styled(BaseContentContainer)`
  padding: 0px 0px 100px;
`;

export const StyledEditBtn = styled.p`
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
  font-size: ${({ theme }) => theme.typography.fontSizeContent};
  line-height: ${({ theme }) => theme.typography.lineHeightDesc};
  text-align: center;
  color: ${({ theme }) => theme.colors.primary};
  margin: 0 10px 0px 0px;
  cursor: pointer;
`;

export const StyledInnerContent = styled.div`
  flex: 1;
  padding: 0px 20px;
`;

export const StyledBottomContainer = styled.div`
  position: absolute;
  padding: 12px 38px 20px;
  width: 100%;
  bottom: 0;
  background-color: ${({ theme }) => theme.colors.white};
  max-width: 375px;
`;

export const StyledNetworkTitleWrapper = styled.div`
  margin: 10px 0px;
  display: flex;
  justify-content: center;
`;

export const StyledNodeListTitle = styled.p`
  font-weight: ${({ theme }) => theme.typography.fontWeightNormal};
  font-size: ${({ theme }) => theme.typography.fontSizeDesc};
  color: #808080;
  padding: 0 10px;
  text-transform: capitalize;
  white-space: nowrap;
`;

export const StyledHrDotted = styled.hr`
  width: 100%;
  height: 0;
  border: 0.5px dashed #808080;
`;

export const StyledRowContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
`;

export const StyledItemWrapper = styled.div`
  margin-top: 10px;
`;

export const StyledDeleteIconContainer = styled.div`
  margin-left: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
`;

export const StyledDeleteIcon = styled.img`
  display: block;
`;

export const StyledModalDelete = styled.span`
  color: ${({ theme }) => theme.colors.error};
`;
