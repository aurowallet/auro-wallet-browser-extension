import i18n from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { ValidatorsLaunch } from "../../../constant";
import { addressSlice, showNameSlice } from "../../../utils/utils";
import CustomView from "../../component/CustomView";
import Input from "../../component/Input";
import { NetworkID_MAP } from "@/constant/network";
import {
  StyledContentClassName, 
  StyledInputCon,
  StyledListContainer,
  StyledRowContainer,
  StyledNodeItemContainer,
  StyledRowLeft,
  StyledNodeName,
  StyledNodeAddress,
  StyledNodeInfoCon,
  StyledManualAddContainer,
  StyledManualAddContent,
  StyledManualSubmit,
  StyledIconCon,
  StyledHolderIconCon,
  StyledNodeIcon,
  searchInputContainerCss,
  searchInputCss,
} from "./index.styled";

const StakingList = ({ }) => {

  const navigate = useNavigate()
  const location = useLocation()
  const networkID = useSelector(state => state.network.currentNode.networkID)
  const stakingList = useSelector(state => {
    if(networkID === NetworkID_MAP.mainnet){
      return state.staking.stakingList
    }
    return []
  })

  const [keywords, setKeywords] = useState("")
  const [currentSelectAddress, setCurrentSelectAddress] = useState("")

  const [fromPage,] = useState(() => {
    let fromPage = location?.state?.fromPage ?? "";
    return fromPage
  })

  const onChange = useCallback((e) => {
    setKeywords(e.target.value)
  }, [])


  const onClickRow = useCallback((nodeItem) => {
    setCurrentSelectAddress(nodeItem.nodeAddress)
    navigate("/staking_transfer", { state: nodeItem, replace: fromPage === 'stakingTransfer' });
  }, [fromPage])

  const onClickManual = useCallback(() => {
    navigate("/staking_transfer", { state: { menuAdd: true } });
  }, [])

  return (
    <CustomView
      title={i18n.t("blockProducers")}
      ContentWrapper={StyledContentClassName}
    >
      <StyledInputCon>
        <Input
          showSearchIcon
          onChange={onChange}
          value={keywords}
          placeholder={i18n.t("searchPlaceholder")}
          customInputContainer={searchInputContainerCss}
          customInputCss={searchInputCss}
        />
      </StyledInputCon>
      <StyledListContainer>
        {stakingList
          .filter((node) => {
            if (keywords) {
              const keywordsLS = keywords.toLowerCase();
              const addressFlag =
                node.nodeAddress.toLowerCase().indexOf(keywordsLS) >= 0;
              let nameFlag = false;
              if (node.nodeName) {
                nameFlag = node.nodeName.toLowerCase().indexOf(keywordsLS) >= 0;
              }
              return addressFlag || nameFlag;
            }
            return true;
          })
          .map((nodeItem, index) => {
            return (
              <NodeItem
                key={index}
                nodeItem={nodeItem}
                onClickRow={onClickRow}
                currentSelectAddress={currentSelectAddress}
              />
            );
          })}
        <StyledManualAddContainer>
          <StyledManualAddContent onClick={onClickManual}>
            {i18n.t("manualAdd")}
          </StyledManualAddContent>
          <StyledManualSubmit href={ValidatorsLaunch} target="_blank">
            {i18n.t("submitNode")}
          </StyledManualSubmit>
        </StyledManualAddContainer>
      </StyledListContainer>
    </CustomView>
  );
};

const NodeItem = ({ onClickRow, nodeItem, currentSelectAddress }) => {
  const delegationKey = useSelector((state) => state.staking.delegationKey);
  const { select, showName, showAddress, isChecked } = useMemo(() => {
    let select = nodeItem.nodeAddress === currentSelectAddress;
    let showName = nodeItem.nodeName;
    if (showName.length >= 16) {
      showName = showNameSlice(nodeItem.nodeName, 16);
    }
    let showAddress = addressSlice(nodeItem.nodeAddress, 6);
    let isChecked = delegationKey === nodeItem.nodeAddress;
    return { select, showName, showAddress, isChecked };
  }, [nodeItem, currentSelectAddress, delegationKey]);

  return (
    <StyledRowContainer>
      <StyledNodeItemContainer
        $selected={select}
        onClick={() => onClickRow(nodeItem)}
      >
        <StyledRowLeft>
          <NodeIcon nodeItem={nodeItem} />
          <StyledNodeInfoCon>
            <StyledNodeName>{showName}</StyledNodeName>
            <StyledNodeAddress>{showAddress}</StyledNodeAddress>
          </StyledNodeInfoCon>
        </StyledRowLeft>
        {isChecked && (
          <div>
            <img src="/img/icon_checked.svg" />
          </div>
        )}
      </StyledNodeItemContainer>
    </StyledRowContainer>
  );
};

const NodeIcon = ({ nodeItem }) => {
  const [showHolderIcon, setShowHolderIcon] = useState(!nodeItem.icon);

  const holderIconName = useMemo(() => {
    let showIdentityName = nodeItem.nodeName.slice(0, 1) || "";
    showIdentityName = showIdentityName.toUpperCase();
    return showIdentityName;
  }, [nodeItem]);

  const onLoadError = useCallback(() => {
    setShowHolderIcon(true);
  }, []);

  return (
    <StyledIconCon>
      {showHolderIcon || !nodeItem.icon ? (
        <StyledHolderIconCon>{holderIconName}</StyledHolderIconCon>
      ) : (
        <StyledNodeIcon src={nodeItem.icon} onError={onLoadError} />
      )}
    </StyledIconCon>
  );
};

export default StakingList;

