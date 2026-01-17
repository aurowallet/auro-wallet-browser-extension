import styled, { css } from 'styled-components';
import { StyledContentContainer as BaseContentContainer } from '../../component/CustomView/index.styled';

export const StyledContainer = styled(BaseContentContainer)`
  padding: 10px 0px 100px;
`;

export const StyledContentContainer = styled.div`
  padding: 0px 20px;
`;

export const StyledInputContainer = styled.div`
  > :not(:first-child) {
    margin-top: 20px;
  }
`;

export const StyledAddressBook = styled.div`
  font-weight: 600;
  font-size: 12px;
  line-height: 17px;
  text-align: right;
  color: #594af1;
  cursor: pointer;
`;

export const StyledBalance = styled.div`
  font-size: 12px;
  line-height: 17px;
  text-align: right;
  color: rgba(0, 0, 0, 0.5);
  font-weight: 400 !important;
`;

export const StyledMax = styled(StyledAddressBook)`
  padding-right: 12px;
`;

export const StyledFeeContainer = styled.div`
  margin: 20px 0;
`;

export const StyledDividedLine = styled.div`
  height: 0.5px;
  background-color: rgba(0, 0, 0, 0.1);
  width: 100%;
  margin: 10px 0px;
`;

export const StyledBottomContainer = styled.div`
  padding: 12px 38px 20px;
  position: fixed;
  bottom: 0;
  width: calc(100%);
  background-color: white;
  max-width: 375px;
`;

export const StyledPlaceholder = styled.div`
  flex: 1;
`;

export const StyledAddressCon = styled.div`
  position: relative;
`;

export const StyledIconAddressCon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  cursor: pointer;
`;

export const StyledCloseMode = styled.div`
  position: fixed;
  top: 58px;
  right: 0;
  width: 375px;
  height: 100vh;
  z-index: 8;
`;

export const StyledOptionOuter = styled.div`
  position: absolute;
  top: 34px;
  right: 0;
  width: calc(375px - 40px);
  min-height: 40px;
  z-index: 10;
`;

export const StyledOptionContainer = styled.div`
  width: 100%;
  height: 100%;
  margin-top: 10px;
  max-height: 200px;
  overflow-y: scroll;
  padding: 4px 0px;
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  background: #f9fafc;
  box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.1);
`;

export const StyledEmptyCon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f9fafc;
  padding: 10px;
  cursor: pointer;
  color: rgba(0, 0, 0, 0.5);
  font-size: 16px;
  font-weight: 400;
`;

export const StyledAddressRowCon = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #f9fafc;
  padding: 10px;
  cursor: pointer;
  color: rgba(0, 0, 0, 0.5);
  font-size: 16px;
  font-weight: 400;

  &:hover {
    background: #594af1;
    color: #fff;
  }
`;

export const StyledAddressRowLeft = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
`;

export const StyledRowIconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 4px;
  width: 24px;
  height: 24px;
`;

export const StyledAddressName = styled.span`
  font-size: 16px;
  font-weight: 400;
  color: rgba(0, 0, 0, 0.8);
  width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  ${StyledAddressRowCon}:hover & {
    color: #fff;
  }
`;

export const StyledNewBadge = styled.span`
  background: #594af1;
  color: #fff;
  font-size: 10px;
  font-weight: 500;
  padding: 1px 6px;
  border-radius: 4px;
  margin-left: 6px;
`;
