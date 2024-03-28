import { extSaveLocal } from "@/background/extensionStorage";
import { getLocal, saveLocal } from "@/background/localStorage";
import { NET_CONFIG_TYPE } from "@/constant/network";
import { NETWORK_SHOW_TESTNET, NET_WORK_CONFIG } from "@/constant/storageKey";
import { NetworkIcon } from "@/popup/component/NetworkIcon";
import IOSSwitch from "@/popup/component/Switch";
import {
  updateShouldRequest,
  updateStakingRefresh,
} from "@/reducers/accountReducer";
import { NET_CONFIG_DEFAULT, updateNetConfig } from "@/reducers/network";
import {
  addressSlice,
  clearLocalCache,
  sendNetworkChangeMsg,
} from "@/utils/utils";
import i18n from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled, { css, keyframes } from "styled-components";

const NetworkSelect = ({}) => {
  const dispatch = useDispatch();
  const netConfig = useSelector((state) => state.network);
  const [modalVisable, setModalVisable] = useState(false);

  const showName = useMemo(() => {
    return netConfig?.currentConfig?.name;
  }, [netConfig]);
  const onClickEntry = useCallback(() => {
    setModalVisable(true);
  }, []);
  const onClickOuter = useCallback(() => {
    setModalVisable(false);
  }, []);

  const onClickNetItem = useCallback(
    async (data) => {
      const { currentConfig, currentNetConfig, netList } = netConfig;
      if (data.url !== currentConfig.url) {
        let newConfig = {};
        for (let index = 0; index < netList.length; index++) {
          const config = netList[index];
          if (config.url === data.url) {
            newConfig = config;
            break;
          }
        }
        let config = {
          ...currentNetConfig,
          currentConfig: newConfig,
        };
        await extSaveLocal(NET_WORK_CONFIG, config);
        dispatch(updateNetConfig(config));
        dispatch(updateStakingRefresh(true));

        dispatch(updateShouldRequest(true));
        sendNetworkChangeMsg(newConfig);
        clearLocalCache();
        onClickOuter();
      }
    },
    [netConfig]
  );
  return (
    <>
      <NetSelectEntry onClickEntry={onClickEntry} showName={showName} />
      <NetworkModal
        modalVisable={modalVisable}
        title={i18n.t("network")}
        onClickItem={onClickNetItem}
        onClose={onClickOuter}
      />
    </>
  );
};

const StyledEntryOuter = styled.div`
  width: 120px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 43px;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  height: 30px;
  padding-left: 14px;
  z-index: 11;
  cursor: pointer;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
`;
const StyledEntryTitle = styled.div`
  font-size: 14px;
  line-height: 100%;
  font-weight: 600;
  text-align: center;
  color: #000000;
  order: 0;
  flex-grow: 0;
  margin: 0;
  width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;
const StyledEntryArrow = styled.div`
  display: flex;
  align-items: center;
  margin-right: 6px;
`;
const NetSelectEntry = ({ onClickEntry, showName }) => {
  return (
    <StyledEntryOuter onClick={onClickEntry}>
      <StyledEntryTitle>{showName}</StyledEntryTitle>
      <StyledEntryArrow />
      <StyledEntryArrow>
        <img src="/img/icon_arrow_unfold.svg" />
      </StyledEntryArrow>
    </StyledEntryOuter>
  );
};

const StyledModalOuter = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  z-index: 15;
  background: rgba(0, 0, 0, 0.8);
  width: 100%;
  height: 100%;

  display: flex;
  justify-content: end;
  flex-direction: column;
`;
const openModal = keyframes`
  from {
        bottom: -50%;
    }
    to {
        bottom: 0;
    }
`;
const StyledInnerContent = styled.div`
  background: #ffffff;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  width: 100%;

  position: absolute;
  bottom: 0;
  animation: ${openModal} 0.35s;
  animation-fill-mode: forwards;
`;

const StyledTitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  padding: 8px 20px;
`;
const StyledRowTitle = styled.span`
  font-weight: 600;
  font-size: 16px;
  line-height: 16px;
  display: flex;
  align-items: center;
  color: #222222;
`;
const StyledDividedLine = styled.div`
  width: 100%;
  height: 0.5px;
  background-color: #f2f2f2;
`;
const StyledListWrapper = styled.div`
  padding: 20px 20px;
  > :not(:first-of-type) {
    margin-top: 10px;
  }
`;
const StyledTestnetControl = styled.div`
  height: 25px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;
const StyledLeftName = styled.div`
  color: #808080;
  font-size: 12px;
  font-weight: 400;
`;
export const NetworkModal = ({
  modalVisable = false,
  title = "",
  onClickItem = () => {},
  onClose = () => {},
}) => {
  const netConfig = useSelector((state) => state.network);

  const [isChecked, setIsChecked] = useState();
  useEffect(() => {
    const localStatus = getLocal(NETWORK_SHOW_TESTNET);
    setIsChecked(localStatus == "true");
  }, []);

  const toggleSwitch = () => {
    setIsChecked(!isChecked);
    saveLocal(NETWORK_SHOW_TESTNET, !isChecked);
  };
  const { topList, bottomList } = useMemo(() => {
    let topList = [];
    let bottomList = [];
    let defaultMainConfig;
    const netConfigList = netConfig.netList;
    netConfigList.map((item) => {
      if (item.type === NET_CONFIG_DEFAULT) {
        if (item.netType !== NET_CONFIG_TYPE.Mainnet) {
          bottomList.push(item);
        } else {
          defaultMainConfig = item;
        }
      } else {
        topList.push(item);
      }
    });
    if (defaultMainConfig) {
      topList.unshift(defaultMainConfig);
    }
    return { topList, bottomList };
  }, [netConfig]);
  return (
    <>
      {modalVisable && (
        <StyledModalOuter onClick={onClose}>
          <StyledInnerContent
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <StyledTitleRow>
              <StyledRowTitle>{title}</StyledRowTitle>
            </StyledTitleRow>
            <StyledDividedLine />
            <StyledListWrapper>
              {topList.map((item, index) => {
                return (
                  <NetworkItem
                    key={index}
                    nodeItem={item}
                    onClickItem={onClickItem}
                  />
                );
              })}
              <StyledTestnetControl>
                <StyledLeftName>{i18n.t("showTestnet")}</StyledLeftName>
                <IOSSwitch
                  isChecked={String(isChecked)}
                  toggleSwitch={toggleSwitch}
                />
              </StyledTestnetControl>
              {isChecked &&
                bottomList.map((item, index) => {
                  return (
                    <NetworkItem
                      key={index}
                      nodeItem={item}
                      onClickItem={() => onClickItem(item)}
                    />
                  );
                })}
            </StyledListWrapper>
          </StyledInnerContent>
        </StyledModalOuter>
      )}
    </>
  );
};

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

export default NetworkSelect;
