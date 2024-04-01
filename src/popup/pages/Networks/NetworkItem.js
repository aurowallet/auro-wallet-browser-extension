import { NetworkIcon } from "@/popup/component/NetworkIcon";
import { NET_CONFIG_DEFAULT } from "@/reducers/network";
import { addressSlice } from "@/utils/utils";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import styled, { css } from "styled-components";

const selectedCss = css`
  background: #594af1;
  border: 0.5px solid transparent;
`;
const unSelectedCss = css`
  background: #f9fafc;
  border: 0.5px solid rgba(0, 0, 0, 0.05);
`;
const StyledNetworkItemWrapper = styled.div`
  display: flex;
  align-items: center;
  border-radius: 10px;
  min-height: 64px;
  padding: 16px 10px 16px 16px;
  flex: 1;
  cursor: pointer;
  &:hover {
    border: 0.5px solid #594af1;
  }
  ${(props) => (props.select == "true" ? selectedCss : unSelectedCss)};
`;

const StyledNetworkTop = styled.div`
  display: flex;
  align-items: center;
`;
const StyledNetworkName = styled.div`
  font-weight: 500;
  font-size: 16px;
  line-height: 19px;
  color: ${(props) => (props.select == "true" ? "#FFFFFF" : "#000000")};

  max-width: 210px;
  word-break: break-all;
`;
const StyledNetworkId = styled.div`
  margin: 0;
  font-weight: 400;
  font-size: 12px;
  line-height: 14px;
  color: rgba(0, 0, 0, 0.1);
  color: ${(props) =>
    props.select == "true"
      ? "rgba(255, 255, 255, 0.50)"
      : "rgba(0, 0, 0, 0.10)"};
`;
const selectedTypeCss = css`
  color: white;
  background: rgba(255, 255, 255, 0.1);
`;
const unSelectedTypeCss = css`
  color: white;
  background: rgba(0, 0, 0, 0.2);
`;
const StyledNetworkTypeWrapper = styled.div`
  margin-left: 10px;
  border-radius: 4px;
  padding: 1.5px 5px;
  ${(props) => (props.select == "true" ? selectedTypeCss : unSelectedTypeCss)};
`;
const StyledNetworkType = styled.div`
  font-weight: 500;
  font-size: 12px;
  line-height: 14px;
  text-align: center;
  text-transform: capitalize;
`;
const NetworkItem = ({ nodeItem, onClickItem }) => {
  const currentConfig = useSelector((state) => state.network.currentConfig);
  const { showNetType, select } = useMemo(() => {
    let showNetType = nodeItem.type !== NET_CONFIG_DEFAULT;
    let select = currentConfig.url === nodeItem.url;
    return {
      showNetType,
      select,
    };
  }, [nodeItem, currentConfig]);
  return (
    <StyledNetworkItemWrapper
      onClick={() => onClickItem(nodeItem)}
      select={String(select)}
    >
      <NetworkIcon nodeItem={nodeItem} />
      <div>
        <StyledNetworkTop>
          <StyledNetworkName select={String(select)}>
            {nodeItem.name}
          </StyledNetworkName>
          {showNetType && (
            <StyledNetworkTypeWrapper>
              <StyledNetworkType>{nodeItem.netType}</StyledNetworkType>
            </StyledNetworkTypeWrapper>
          )}
        </StyledNetworkTop>
        <StyledNetworkId select={String(select)}>
          {addressSlice(nodeItem.chainId, 6)}
        </StyledNetworkId>
      </div>
    </StyledNetworkItemWrapper>
  );
};
export default NetworkItem;
