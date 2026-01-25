import { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";

// ============ Styled Components (with transient props) ============

interface StyledNetIconWrapperProps {
  $size: string;
}

const StyledNetIconWrapper = styled.div<StyledNetIconWrapperProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${(props) => props.$size};
  height: ${(props) => props.$size};
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

// ============ Component Props Interface ============

interface TokenIconProps {
  /** Token icon URL, if not provided or fails to load, shows placeholder */
  iconUrl?: string;
  /** Token symbol, first 3 characters will be shown in placeholder */
  tokenSymbol?: string;
  /** Icon size with CSS unit, defaults to "30px" */
  size?: string;
}

// ============ Component ============

export const TokenIcon: React.FC<TokenIconProps> = ({
  iconUrl,
  tokenSymbol,
  size = "30px",
}) => {
  const [showHolderIcon, setShowHolderIcon] = useState<boolean>(!iconUrl);

  useEffect(() => {
    setShowHolderIcon(!iconUrl);
  }, [iconUrl]);

  const holderIconName = useMemo<string>(() => {
    let showIdentityName = tokenSymbol?.slice(0, 3) ?? "";
    showIdentityName = showIdentityName.toUpperCase();
    return showIdentityName;
  }, [tokenSymbol]);

  const onLoadError = useCallback(() => {
    setShowHolderIcon(true);
  }, []);

  return (
    <StyledNetIconWrapper $size={size}>
      {showHolderIcon ? (
        <StyledHolderIcon>{holderIconName}</StyledHolderIcon>
      ) : (
        <StyledNetIcon src={iconUrl} onError={onLoadError} />
      )}
    </StyledNetIconWrapper>
  );
};

export default TokenIcon;
