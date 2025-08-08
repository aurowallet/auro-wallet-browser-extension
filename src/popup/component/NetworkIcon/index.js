import { NetworkID_MAP } from "@/constant/network";
import { isZekoNet } from "@/utils/utils";
import { useMemo } from "react";
import styled from "styled-components";

export const network_icon_size = {
  middle: "icon_middle",
  small: "icon_small",
};
const getSize = (size) => {
  switch (size) {
    case network_icon_size.small:
      return "24px";
    case network_icon_size.middle:
    default:
      return "30px";
  }
};
const StyledNetIconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${(props) => getSize(props.size)};
  height: ${(props) => getSize(props.size)};
`;
const StyledNetIcon = styled.img`
  width: 100%;
  height: 100%;
`;
const StyledHolderIcon = styled.div`
  width: 100%;
  height: 100%;
  border-radius: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.3);
  color: white;
  font-size: 16px;
`;

export const NetworkIcon = ({ nodeItem, size }) => {
  const { isCustomNet, iconSource, holderIconName } = useMemo(() => {
    let isCustomNet = !nodeItem.isDefaultNode;
    let isZeko = isZekoNet(nodeItem.networkID)
    let iconSource =
      nodeItem.networkID == NetworkID_MAP.mainnet
        ? "img/mina_color.svg"
        : "img/icon_mina_gray.svg";
    if (isZeko) {
      iconSource = "img/icon_zeko_testnet.svg";
    }
    let holderIconName = "";
    if (isCustomNet) {
      holderIconName = nodeItem.name?.slice(0, 1) || "";
      holderIconName = holderIconName.toUpperCase();
    }

    return {
      isCustomNet,
      iconSource,
      holderIconName,
    };
  }, [nodeItem]);
  return (
    <StyledNetIconWrapper size={size}>
      {isCustomNet ? (
        <StyledHolderIcon>{holderIconName}</StyledHolderIcon>
      ) : (
        <StyledNetIcon src={iconSource} />
      )}
    </StyledNetIconWrapper>
  );
};
