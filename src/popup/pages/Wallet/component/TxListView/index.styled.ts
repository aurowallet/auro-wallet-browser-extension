import styled, { css } from 'styled-components';

// ============ Transient Props Interfaces ============

interface StyledTxItemConProps {
  $isPending?: boolean;
}

interface StyledDividedLineProps {
  $paddingLine?: boolean;
}

interface StyledItemContainerProps {
  $isPending?: boolean;
}

export type TxStatusStyle = 'success' | 'failed' | 'pending';

interface StyledItemStatusProps {
  $status?: TxStatusStyle;
}

// ============ Styled Components ============

export const StyledHistoryContainer = styled.div`
  background: #ffffff;
`;

export const StyledHolderContainer = styled.div`
  min-height: 288px;
`;

export const StyledListContainer = styled.div``;

export const StyledExplorerContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  border-top: 0.5px solid rgba(0, 0, 0, 0.1);
  padding: 20px 0px;
`;

export const StyledExplorerContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
`;

export const StyledExplorerTitle = styled.p`
  font-size: 12px;
  line-height: 14px;
  text-align: right;
  color: #594af1;
  margin: 0px 6px 0;
`;

export const StyledTxItemCon = styled.div<StyledTxItemConProps>`
  cursor: pointer;
  overflow-y: hidden;

  &:hover {
    background: linear-gradient(0deg, rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.05)), #f9fafc;
  }

  ${({ $isPending }) => $isPending && css`
    padding: 0px 0px;
    background-color: #f9fafc;
    &:hover {
      background: linear-gradient(0deg, rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.05)), #f9fafc;
    }
  `}
`;

export const StyledDividedLine = styled.div<StyledDividedLineProps>`
  height: 0.5px;
  width: 100%;
  background-color: rgba(0, 0, 0, 0.1);

  ${({ $paddingLine }) => $paddingLine && css`
    width: calc(100% - 40px);
    margin: 0 auto;
  `}
`;

export const StyledItemContainer = styled.div<StyledItemContainerProps>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;

  ${({ $isPending }) => $isPending && css`
    padding: 10px 20px 4px;
  `}
`;

export const StyledItemLeftContainer = styled.div`
  display: flex;
  align-items: center;
`;

export const StyledItemAccount = styled.div`
  margin-left: 8px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

export const StyledItemAccountAddress = styled.p`
  font-size: 14px;
  line-height: 20px;
  text-align: center;
  color: #000000;
  margin: 0;
`;

export const StyledScamTag = styled.span`
  font-weight: 500;
  font-size: 12px;
  line-height: 14px;
  color: #d65a5a;
  border: 1px solid #d65a5a;
  border-radius: 2px;
  margin-left: 4px;
`;

export const StyledItemAccountInfo = styled.p`
  font-size: 12px;
  line-height: 14px;
  text-align: center;
  color: rgba(0, 0, 0, 0.5);
  margin: 2px 0 0;
`;

export const StyledItemRightContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: end;
`;

export const StyledItemAmount = styled.p`
  font-size: 16px;
  line-height: 19px;
  text-align: right;
  color: #000000;
  margin: 0;
  font-weight: 500;
`;

export const StyledItemStatus = styled.div<StyledItemStatusProps>`
  margin-top: 6px;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 1.5px 5px;
  border-radius: 4px;
  font-weight: 500;
  font-size: 12px;
  line-height: 14px;
  text-align: center;
  color: #e4b200;

  ${({ $status }) => $status === 'success' && css`
    background: rgba(13, 178, 124, 0.1);
    color: #0db27c;
  `}

  ${({ $status }) => $status === 'failed' && css`
    background: rgba(214, 90, 90, 0.1);
    color: #d65a5a;
  `}

  ${({ $status }) => $status === 'pending' && css`
    background: rgba(228, 178, 0, 0.1);
    color: #e4b200;
  `}
`;

export const StyledSpeedBtnGroup = styled.div`
  display: flex;
  margin-left: 56px;
  padding-bottom: 10px;
  width: fit-content;
  height: fit-content;

  > :not(:first-child) {
    margin-left: 6px;
  }
`;

export const StyledSpeedBtn = styled.div`
  font-size: 14px;
  width: fit-content;
  border-radius: 4px;
  height: 21px;
  padding: 2px 4px;
  font-weight: 400;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #594af1;
  color: white;
`;

export const StyledCancelBtn = styled(StyledSpeedBtn)`
  color: #594af1;
  border: 1px solid #594af1;
  background-color: white;
`;
