import { NET_CONFIG_TYPE } from "@/constant/network";
import { NET_CONFIG_DEFAULT } from "@/reducers/network";
import { useMemo } from "react";
import styled from "styled-components";

const StyledNetIconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  margin-right: 10px;
`;
const StyledNetIcon = styled.img``;
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

export const NetworkIcon = ({ nodeItem }) => {
  const { isCustomNet, iconSource, holderIconName } = useMemo(() => {
    let isCustomNet = nodeItem.type !== NET_CONFIG_DEFAULT;
    let iconSource =
      nodeItem.netType == NET_CONFIG_TYPE.Mainnet
        ? "img/mina_color.svg"
        : "img/mina_gray.svg";
    let holderIconName = nodeItem.name.slice(0, 1) || "";
    holderIconName = holderIconName.toUpperCase();
    return {
      isCustomNet,
      iconSource,
      holderIconName,
    };
  }, [nodeItem]);
  return (
    <StyledNetIconWrapper>
      {isCustomNet ? (
        <StyledHolderIcon>{holderIconName}</StyledHolderIcon>
      ) : (
        <StyledNetIcon src={iconSource} />
      )}
    </StyledNetIconWrapper>
  );
};
