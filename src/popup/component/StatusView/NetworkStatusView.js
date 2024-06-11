import { useSelector } from "react-redux";
import styled from "styled-components";
import { NetworkIcon, network_icon_size } from "../NetworkIcon";

const StyledNetworkWrapper = styled.div`
  background: rgba(0, 0, 0, 0.1);
  border-radius: 20px;
  padding: 4px 8px;
  gap: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
`;
const StyledNetworkName = styled.div`
  font-weight: 400;
  font-size: 12px;
  line-height: 14px;
  display: flex;
  align-items: center;
  color: #000000;
`;
const NetworkStatusView = () => {
  const currentNode = useSelector((state) => state.network.currentNode);
  return (
    <StyledNetworkWrapper>
      <NetworkIcon nodeItem={currentNode} size={network_icon_size.small} />
      <StyledNetworkName>{currentNode.name}</StyledNetworkName>
    </StyledNetworkWrapper>
  );
};

export default NetworkStatusView;
