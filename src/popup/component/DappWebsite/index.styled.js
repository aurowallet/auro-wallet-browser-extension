import styled from 'styled-components';

export const StyledContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 20px;
  background: ${({ theme }) => theme.colors.backgroundLilac};
  border: 0.5px solid rgba(0, 0, 0, 0.05);
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  min-height: 55px;
  box-sizing: border-box;
`;

export const StyledIcon = styled.img`
  width: 30px;
  object-fit: scale-down;
  display: block;
`;

export const StyledUrl = styled.p`
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
  font-size: ${({ theme }) => theme.typography.fontSizeContent};
  line-height: ${({ theme }) => theme.typography.lineHeightDesc};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0px 0px 0px 16px;
  word-break: break-all;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;
