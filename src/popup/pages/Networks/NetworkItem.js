import { NetworkIcon } from "@/popup/component/NetworkIcon";
import { NET_CONFIG_DEFAULT } from "@/reducers/network";
import { addressSlice } from "@/utils/utils";
import { useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import styled, { css } from "styled-components";

const selectedCss = css`
  border: 0.5px solid transparent;
`;
const unSelectedCss = css`
  border: 0.5px solid rgba(0, 0, 0, 0.05);
`;
const StyledNetworkItemWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 10px;
  min-height: 64px;
  padding: 16px 10px 16px 16px;
  flex: 1;
  cursor: pointer;
  background: ${(props) => props.color};
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
  color: ${(props) => props.color};

  max-width: 210px;
  word-break: break-all;
`;
const StyledNetworkId = styled.div`
  margin: 0;
  font-weight: 400;
  font-size: 12px;
  line-height: 14px;
  color: rgba(0, 0, 0, 0.1);
  color: ${(props) => props.color};
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

const StyledNetworkLeft = styled.div`
  display: flex;
  align-items: center;
`;
const StyledEditWrapper = styled.div`
  width: 30px;
  height: 30px;
`;
const StyledEdit = styled.img`
  display: block;
  cursor: pointer;
  &:hover {
    background-color: linear-gradient(
        0deg,
        rgba(0, 0, 0, 0.05),
        rgba(0, 0, 0, 0.05)
      ),
      rgba(249, 250, 252, 1);
  }
`;
const NetworkItem = ({
  nodeItem,
  onClickItem,
  editMode = false,
  onEditItem = () => {},
}) => {
  const currentConfig = useSelector((state) => state.network.currentConfig);
  const { isNotDefault, select } = useMemo(() => {
    let isNotDefault = nodeItem.type !== NET_CONFIG_DEFAULT;
    let select = currentConfig.url === nodeItem.url;
    return {
      isNotDefault,
      select,
    };
  }, [nodeItem, currentConfig]);

  const getChainNameColor = useCallback(() => {
    if (editMode) {
      return isNotDefault ? "#000" : "rgba(0, 0, 0, 0.2)";
    } else if (select) {
      return "#FFF";
    }
    return "#000";
  }, [editMode, select, isNotDefault]);

  return (
    <StyledNetworkItemWrapper
      onClick={() => onClickItem(nodeItem)}
      select={String(select)}
      color={select && !editMode ? "#594af1" : "#f9fafc"}
    >
      <StyledNetworkLeft>
        <NetworkIcon nodeItem={nodeItem} />
        <div>
          <StyledNetworkTop>
            <StyledNetworkName color={getChainNameColor()}>
              {nodeItem.name}
            </StyledNetworkName>
            {isNotDefault && (
              <StyledNetworkTypeWrapper>
                <StyledNetworkType>{nodeItem.netType}</StyledNetworkType>
              </StyledNetworkTypeWrapper>
            )}
          </StyledNetworkTop>
          <StyledNetworkId
            color={
              select && !editMode
                ? "rgba(255, 255, 255, 0.50)"
                : "rgba(0, 0, 0, 0.10)"
            }
          >
            {addressSlice(nodeItem.chainId, 6)}
          </StyledNetworkId>
        </div>
      </StyledNetworkLeft>
      {editMode && isNotDefault && (
        <StyledEditWrapper onClick={() => onEditItem(nodeItem)}>
          <StyledEdit src="/img/icon_edit.svg" />
        </StyledEditWrapper>
      )}
    </StyledNetworkItemWrapper>
  );
};
export default NetworkItem;
