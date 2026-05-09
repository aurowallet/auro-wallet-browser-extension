import i18n from "i18next";
import { Trans } from "react-i18next";
import styled from "styled-components";
import type { AccountInfo } from "../../types/account";

interface DuplicateAccountTipContentProps {
  account?: Pick<AccountInfo, "address" | "accountName"> & {
    groupName?: string;
    accountDisplayName?: string;
  } | null;
  onClickWalletManagement?: () => void;
}

const StyledTipContainer = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSizeContent};
  line-height: 18px;
  color: ${({ theme }) => theme.colors.textSecondary};
  text-align: left;
`;

const StyledTip = styled.p`
  margin: 0;
  line-height: 18px;
`;

const StyledAddress = styled.span`
  color: ${({ theme }) => theme.colors.primary};
  word-break: break-all;
`;

const StyledAccountRepeatClick = styled.span`
  margin: 0;
  color: ${({ theme }) => theme.colors.primary};
  overflow-wrap: break-word;
  cursor: pointer;
`;

const StyledDescription = styled.p`
  margin: 18px 0 0;
  line-height: 18px;
`;

const DuplicateAccountTipContent = ({
  account,
  onClickWalletManagement,
}: DuplicateAccountTipContentProps) => {
  if (!account) {
    return null;
  }

  return (
    <StyledTipContainer>
      <StyledTip>
        {i18n.t("importSameAccount_1")}
      </StyledTip>
      <StyledAddress>{account.address}</StyledAddress>
      <StyledDescription>
        <Trans
          i18nKey={"importSameAccount_2"}
          values={{
            accountName:
              account.accountDisplayName || account.accountName || account.address,
          }}
          components={{
            acmanage: <StyledAccountRepeatClick onClick={onClickWalletManagement} />,
          }}
        />
      </StyledDescription>
    </StyledTipContainer>
  );
};

export default DuplicateAccountTipContent;
