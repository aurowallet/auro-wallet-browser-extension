import { useCallback, useMemo, useState } from "react";
import {
    StyledContainer,
    StyledIcon,
    StyledUrl,
} from "./index.styled";

const DappWebsite = ({ siteIcon, siteUrl }) => {
  const [iconStatus, setIconStatus] = useState(true);

  const { showIcon, showUrl } = useMemo(() => {
    const showIcon = siteIcon || "/img/dapp_default_icon.svg";
    let showUrl = siteUrl;
    return {
      showIcon,
      showUrl,
    };
  }, [siteIcon, siteUrl]);

  const onLoadError = useCallback(() => {
    setIconStatus(false);
  }, []);

  return (
    <StyledContainer>
      <StyledIcon
        src={iconStatus ? showIcon : "/img/dapp_default_icon.svg"}
        onError={onLoadError}
      />
      <StyledUrl>{showUrl}</StyledUrl>
    </StyledContainer>
  );
};

export default DappWebsite;
