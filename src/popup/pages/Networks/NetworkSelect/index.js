import { extSaveLocal } from "@/background/extensionStorage";
import { getLocal, saveLocal } from "@/background/localStorage";
import { NET_CONFIG_TYPE } from "@/constant/network";
import { NETWORK_SHOW_TESTNET, NET_WORK_CONFIG } from "@/constant/storageKey";
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
import NetworkItem from "../NetworkItem";

const NetworkSelect = ({}) => {
  const dispatch = useDispatch();
  const netConfig = useSelector((state) => state.network);
  const [modalVisible, setModalVisible] = useState(false);

  const showName = useMemo(() => {
    return netConfig?.currentConfig?.name;
  }, [netConfig]);
  const onClickEntry = useCallback(() => {
    setModalVisible(true);
  }, []);
  const onClickOuter = useCallback(() => {
    setModalVisible(false);
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
        modalVisible={modalVisible}
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

const StyledTitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 18px 20px 10px;
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
  width: calc(100%);
  height: 0.5px;
  background-color: rgba(0, 0, 0, 0.1);
`;
const StyledListWrapper = styled.div`
  padding: 20px 20px;
  > :not(:first-of-type) {
    margin-top: 10px;
  }
`;
const StyledTopList = styled.div`
  max-height: ${(props) => (props.isshowfullheight == "true" ? "350px" : "220px")};
  overflow-y: auto;
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
const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const fadeOut = keyframes`
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
`;

const ModalOverlay = styled.div`
  display: ${(props) => (props.show == "true" ? "block" : "none")};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 20;
  animation: ${(props) =>
      props.show == "true"
        ? css`
            ${fadeIn} 0.3s
          `
        : css`
            ${fadeOut} 0.3s
          `}
    ease-out;
  animation-fill-mode: forwards;
`;

const ModalContent = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  z-index: 21;
  width: calc(375px - 40px);
  border-radius: 12px;
`;
const StyledCloseIcon = styled.img`
  display: block;
  cursor: pointer;
`;
const NetworkModal = ({
  modalVisible = false,
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
    <ModalOverlay show={String(modalVisible)} onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <StyledTitleRow>
          <StyledRowTitle>{title}</StyledRowTitle>
          <StyledCloseIcon onClick={onClose} src="/img/icon_nav_close.svg" />
        </StyledTitleRow>
        <StyledDividedLine />
        <StyledListWrapper>
          <StyledTopList isshowfullheight={String(!isChecked)}>
            {topList.map((item, index) => {
              return (
                <NetworkItem
                  key={index}
                  nodeItem={item}
                  onClickItem={onClickItem}
                />
              );
            })}
          </StyledTopList>
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
      </ModalContent>
    </ModalOverlay>
  );
};

export default NetworkSelect;
