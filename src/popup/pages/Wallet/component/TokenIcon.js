import { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";

const StyledNetIconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${(props) => props.size};
  height: ${(props) => props.size};
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
  font-size: 12px;
`;

export const TokenIcon = ({ iconUrl, tokenSymbol, size = "30px" }) => { 
  const [showHolderIcon, setShowHolderIcon] = useState(false);
  useEffect(()=>{
    setShowHolderIcon(!iconUrl)
  },[iconUrl])
  const holderIconName = useMemo(() => {
    let showIdentityName = tokenSymbol?.slice(0, 3) || "";
    showIdentityName = showIdentityName.toUpperCase();
    return showIdentityName;
  }, [tokenSymbol]);

  const onLoadError = useCallback(() => {
    setShowHolderIcon(true);
  }, []);

  return (
    <StyledNetIconWrapper size={size}>
      {showHolderIcon ? (
        <StyledHolderIcon>{holderIconName}</StyledHolderIcon>
      ) : (
        <StyledNetIcon src={iconUrl} onError={onLoadError} />
      )}
    </StyledNetIconWrapper>
  );
};

export default TokenIcon;
