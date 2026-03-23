import styled, { css, keyframes } from 'styled-components';
import { StyledContentContainer as BaseContentContainer } from '../../component/CustomView/index.styled';

interface StyledRowContainerProps {
  $isSelect?: boolean;
  $notSupport?: boolean;
  $canSelect?: boolean;
}

interface StyledSelectProps {
  $isSelect?: boolean;
}

export const StyledCustomContainerClass = styled.div`
  justify-content: space-between;
  padding-right: 20px;
  background-color: white;
`;

export const StyledContentClassName = styled(BaseContentContainer)`
  padding: 10px 0px 0px;
  height: 100%;
`;

export const StyledContentContainer = styled.div`
  padding: 0px 20px;
  flex: 1;
  overflow-y: auto;
  margin-bottom: 80px;
`;

export const StyledRowCommonContainer = styled.div<StyledRowContainerProps>`
  background: #f9fafc;
  border-radius: 12px;
  padding: 10px 20px 10px;
  margin-bottom: 10px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  height: 80px;
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  box-sizing: border-box;

  ${({ $isSelect }) => $isSelect && css`
    background: #594af1 !important;
    border: none;
  `}

  ${({ $notSupport }) => $notSupport && css`
    background: rgba(214, 90, 90, 0.1);
    border: 0.5px solid #d65a5a;
  `}

  ${({ $canSelect }) => $canSelect && css`
    cursor: pointer;
    &:hover {
      border: 1px solid #594af1;
    }
  `}
`;
export const StyledAccountRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const StyledAccountRowLeft = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const StyledAccountName = styled.p<StyledSelectProps>`
  font-size: 16px;
  font-weight: 600;
  color: rgba(0, 0, 0, 1);
  margin: 0;

  ${({ $isSelect }) => $isSelect && css`
    color: #ffffff !important;
  `}
`;

export const StyledAccountType = styled.div<StyledSelectProps>`
  font-weight: 500;
  font-size: 12px;
  text-align: center;
  color: white;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  margin-left: 4px;
  padding: 2px 4px;

  ${({ $isSelect }) => $isSelect && css`
    color: white !important;
    background: rgba(255, 255, 255, 0.1) !important;
  `}
`;

export const StyledAddress = styled.p<StyledSelectProps>`
  font-size: 12px;
  color: rgba(128, 128, 128, 1);
  margin: 2px 0px 0px;

  ${({ $isSelect }) => $isSelect && css`
    color: rgba(255, 255, 255, 0.5) !important;
  `}
`;

export const StyledAccountBalanceRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
`;

export const StyledAccountBalance = styled.p<StyledSelectProps>`
  font-size: 12px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.8);
  margin: 0;

  ${({ $isSelect }) => $isSelect && css`
    color: #ffffff !important;
  `}
`;

export const StyledPointMenuContainer = styled.div`
  display: flex;
  align-content: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  object-fit: scale-down;
  border-radius: 100%;
  cursor: pointer;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
`;

export const StyledPointMenu = styled.img`
  width: 13px;
`;

export const StyledIconContainer = styled.div`
  height: 30px;
  width: 30px;
  display: flex;
  background-color: pink;
`;

export const StyledLockBtn = styled.p`
  font-weight: 500;
  font-size: 14px;
  line-height: 17px;
  text-align: center;
  color: #594af1;
  margin: 0;
  margin-right: 10px;
  cursor: pointer;
`;

export const StyledKeyringGroup = styled.div`
  margin-bottom: 20px;
`;

export const StyledKeyringHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  padding: 0 4px;
`;

export const StyledKeyringName = styled.p`
  font-weight: 600;
  font-size: 14px;
  color: #000000;
  margin: 0;
`;

export const StyledKeyringMenu = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  cursor: pointer;

  &:hover {
    background: rgba(89, 74, 241, 0.05);
    border-color: #594af1;
  }

  img {
    width: 32px;
    height: 32px;
  }
`;

export const StyledKeyringAccounts = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const StyledKeyringAccountRow = styled.div<StyledSelectProps>`
  background: #f9fafc;
  padding: 10px 20px 10px;
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  cursor: pointer;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  height: 80px;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;

  &:hover {
    border-color: #594af1;
  }

  ${({ $isSelect }) => $isSelect && css`
    background: #594af1 !important;
    border: none;
  `}
`;

export const StyledRowLeft = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

export const StyledKeyringAccountName = styled.p<StyledSelectProps>`
  font-size: 16px;
  font-weight: 600;
  color: ${({ $isSelect }) => $isSelect ? "white" : "rgba(0, 0, 0, 1)"};
  margin: 0;
`;

export const StyledKeyringAddress = styled.p<StyledSelectProps>`
  font-size: 12px;
  color: ${({ $isSelect }) => $isSelect ? "rgba(255, 255, 255, 0.5)" : "rgba(128, 128, 128, 1)"};
  margin: 2px 0px 0px;
`;

export const StyledKeyringBalance = styled.p<StyledSelectProps>`
  font-size: 12px;
  font-weight: 600;
  color: ${({ $isSelect }) => $isSelect ? "white" : "rgba(0, 0, 0, 0.8)"};
  margin: 8px 0 0;
`;

export const StyledKeyringPointMenuContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  cursor: pointer;
  object-fit: scale-down;
  border-radius: 100%;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
`;

export const StyledKeyringRightContainer = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: center;
`;

export const StyledKeyringPointMenu = styled.img`
  width: 13px;
`;

export const StyledNotSupportContainer = styled.div``;

export const StyledNotSupportTitle = styled.p`
  font-weight: 500;
  font-size: 14px;
  line-height: 16px;
  color: #000000;
  margin: 10px 0px;
`;

export const StyledAddWalletBtnContainer = styled.div`
  padding: 12px 38px 20px;
  position: fixed;
  width: calc(100%);
  background-color: white;
  bottom: 0;
  left: 0;
  right: 0;
`;

const shimmer = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: 200px 0; }
`;

const skeletonBase = css`
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 400px 100%;
  animation: ${shimmer} 1.5s ease-in-out infinite;
  border-radius: 4px;
`;

export const StyledSkeletonGroup = styled.div`
  margin-bottom: 20px;
`;

export const StyledSkeletonHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  padding: 0 4px;
`;

export const StyledSkeletonHeaderBar = styled.div`
  width: 120px;
  height: 16px;
  ${skeletonBase}
`;

export const StyledSkeletonRow = styled.div`
  background: #f9fafc;
  border-radius: 12px;
  padding: 10px 20px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  height: 80px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  margin-bottom: 10px;
`;

export const StyledSkeletonLine = styled.div<{ $width?: string }>`
  height: 12px;
  width: ${({ $width }) => $width || '100%'};
  ${skeletonBase}
`;

export const StyledSkeletonLineTall = styled.div<{ $width?: string }>`
  height: 16px;
  width: ${({ $width }) => $width || '100%'};
  ${skeletonBase}
`;

export const StyledAddWalletBtn = styled.div`
  background: #594af1;
  color: white;
  font-size: 14px;
  font-weight: 600;
  padding: 14px 20px;
  border-radius: 12px;
  text-align: center;
  cursor: pointer;

  &:hover {
    background: #4a3dd4;
  }
`;
