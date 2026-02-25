import styled from 'styled-components';
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

export const StyledFeeContainer = styled.div`
  margin: 20px 0 10px;
`;

export const StyledDividedLine = styled.div`
  height: 0.5px;
  background-color: ${({ theme }) => theme.colors.borderLight};
  width: 100%;
  margin: 10px 0px;
`;

export const StyledBottomContainer = styled.div`
  padding: 12px 38px 20px;
  position: fixed;
  bottom: 0;
  width: calc(100%);
  max-width: 375px;
`;

export const StyledPlaceholder = styled.div`
  flex: 1;
`;

export const StyledInfoBanner = styled.div`
  background-color: rgba(0, 210, 146, 0.1);
  padding: 12px 20px;
`;

export const StyledInfoBannerText = styled.p`
  font-size: 14px;
  line-height: 20px;
  color: #00D292;
  margin: 0;
`;

export const StyledValidatorSection = styled.div`
  margin-top: 10px;
`;

export const StyledValidatorLabel = styled.p`
  font-size: 14px;
  line-height: 17px;
  color: rgba(0, 0, 0, 0.5);
  margin: 0 0 10px 0;
`;

export const StyledValidatorCard = styled.div`
  background: #f9fafc;
  border: 0.5px solid rgba(0, 0, 0, 0.05);
  border-radius: 10px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  margin-bottom: 20px;
`;

export const StyledValidatorSelectorCard = styled.div`
  background: #f9fafc;
  border: 0.5px solid rgba(0, 0, 0, 0.05);
  border-radius: 10px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;

  &:hover {
    border-color: #594af1;
  }
`;

export const StyledValidatorInfo = styled.div`
  display: flex;
  align-items: center;
`;

export const StyledValidatorIconWrapper = styled.div`
  width: 36px;
  height: 36px;
  margin-right: 12px;
  flex-shrink: 0;
`;

export const StyledValidatorIconHolder = styled.div`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 16px;
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
`;

export const StyledValidatorIconImg = styled.img`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
`;

export const StyledValidatorName = styled.span`
  font-weight: 500;
  font-size: 14px;
  line-height: 17px;
  color: #000000;
`;

export const StyledSelectorArrow = styled.img`
  width: 30px;
  height: 30px;
`;

// ============ EarningsEstimate Styled Components ============

export const StyledEarningsCard = styled.div`
  background: #f9fafc;
  border: 0.5px solid rgba(0, 0, 0, 0.05);
  border-radius: 10px;
  padding: 16px;
  margin-top: 20px;
`;

export const StyledEarningsRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  &:not(:first-child) {
    margin-top: 12px;
  }
`;

export const StyledEarningsLabel = styled.span`
  font-size: 14px;
  line-height: 17px;
  color: rgba(0, 0, 0, 0.5);
`;

export const StyledEarningsValue = styled.span`
  font-weight: 500;
  font-size: 14px;
  line-height: 17px;
  color: #000000;
  text-align: right;
`;
