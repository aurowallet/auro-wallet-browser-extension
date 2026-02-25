import i18n from "i18next";
import { useCallback, useMemo, useState } from "react";
import { useAppSelector } from "@/hooks/useStore";
import { useNavigate, useLocation } from "react-router-dom";
import { ValidatorsLaunch } from "../../../constant";
import { addressSlice, showNameSlice } from "../../../utils/utils";
import CustomView from "../../component/CustomView";
import { NetworkID_MAP } from "@/constant/network";
import { useDelegationKey } from "@/hooks/useDelegationKey";
import {
  StyledContentClassName, 
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
  StyledSectionTitle,
} from "./index.styled";

interface NodeItemData {
  nodeAddress: string;
  nodeName: string;
  icon?: string;
}

const StakingList = () => {

  const navigate = useNavigate()
  const location = useLocation()
  const networkID = useAppSelector((state) => state.network.currentNode.networkID)
  const stakingList = useAppSelector((state) => {
    if(networkID === NetworkID_MAP.mainnet){
      return state.staking.stakingList
    }
    return { active: [], inactive: [] }
  })

  const [currentSelectAddress, setCurrentSelectAddress] = useState(() => {
    return (location?.state as { nodeAddress?: string })?.nodeAddress || ""
  })

  const [fromPage] = useState(() => {
    return (location?.state as { fromPage?: string })?.fromPage ?? "";
  })

  const [isRedelegate] = useState(() => {
    return !!(location?.state as { isRedelegate?: boolean })?.isRedelegate
  })

  const onClickRow = useCallback((nodeItem: NodeItemData) => {
    setCurrentSelectAddress(nodeItem.nodeAddress)
    const nextState = {
      ...nodeItem,
      ...(isRedelegate ? { isRedelegate: true } : {}),
    };
    if (fromPage === 'stakingTransfer') {
      navigate("/staking_transfer", { state: nextState, replace: true });
    } else {
      navigate("/staking_transfer", { state: nextState });
    }
  }, [fromPage, isRedelegate, navigate])

  const onClickManual = useCallback(() => {
    navigate("/staking_transfer", {
      state: {
        menuAdd: true,
        ...(isRedelegate ? { isRedelegate: true } : {}),
      },
    });
  }, [isRedelegate, navigate])

  const { activeNodes, inactiveNodes } = useMemo(() => {
    return { activeNodes: stakingList.active || [], inactiveNodes: stakingList.inactive || [] };
  }, [stakingList]);

  return (<CustomView
    title={i18n.t('blockProducers')}
    ContentWrapper={StyledContentClassName}>
    <StyledListContainer>
      {activeNodes.length > 0 && (
        <>
          <StyledSectionTitle>{i18n.t('active')}</StyledSectionTitle>
          {activeNodes.map((nodeItem: NodeItemData, index: number) => (
            <NodeItem key={`active-${index}`} nodeItem={nodeItem} onClickRow={onClickRow} currentSelectAddress={currentSelectAddress} />
          ))}
        </>
      )}

      {inactiveNodes.length > 0 && (
        <>
          <StyledSectionTitle>{i18n.t('inactive')}</StyledSectionTitle>
          {inactiveNodes.map((nodeItem: NodeItemData, index: number) => (
            <NodeItem key={`inactive-${index}`} nodeItem={nodeItem} onClickRow={onClickRow} currentSelectAddress={currentSelectAddress} />
          ))}
        </>
      )}

      <StyledManualAddContainer>
        <StyledManualAddContent onClick={onClickManual}>
          {i18n.t('manualAdd')}
        </StyledManualAddContent>
        <StyledManualSubmit href={ValidatorsLaunch} target="_blank">
          {i18n.t('submitNode')}
        </StyledManualSubmit>
      </StyledManualAddContainer>
    </StyledListContainer>
  </CustomView>)
};

interface NodeItemProps {
  onClickRow: (item: NodeItemData) => void;
  nodeItem: NodeItemData;
  currentSelectAddress: string;
}

const NodeItem = ({ onClickRow, nodeItem, currentSelectAddress }: NodeItemProps) => {
  const delegationKey = useDelegationKey();
  const { select, showName, showAddress, isChecked } = useMemo(() => {
    let select = nodeItem.nodeAddress === currentSelectAddress;
    let showName = nodeItem.nodeName || "";
    if (showName.length >= 16) {
      showName = showNameSlice(nodeItem.nodeName, 16) || '';
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
        {(currentSelectAddress ? select : isChecked) && (
          <div>
            <img src="/img/icon_checked.svg" />
          </div>
        )}
      </StyledNodeItemContainer>
    </StyledRowContainer>
  );
};

interface NodeIconProps {
  nodeItem: { nodeName: string; icon?: string };
}

const NodeIcon = ({ nodeItem }: NodeIconProps) => {
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

