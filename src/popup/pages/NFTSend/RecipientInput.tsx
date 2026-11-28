import { useCallback, useEffect, useMemo, useState } from "react";
import i18n from "i18next";
import { useAppSelector } from "@/hooks/useStore";
import { getLocal } from "@/background/localStorage";
import { ADDRESS_BOOK_CONFIG } from "@/constant/storageKey";
import { WALLET_GET_ALL_ACCOUNT } from "@/constant/msgTypes";
import { sendMsg } from "@/utils/commonMsg";
import { addressSlice } from "@/utils/utils";
import Input from "@/popup/component/Input";
import SvgIcon from "@/popup/component/SvgIcon";
import {
  StyledAddressCon,
  StyledIconAddressCon,
  StyledCloseMode,
  StyledOptionOuter,
  StyledOptionContainer,
  StyledEmptyCon,
  StyledAddressRowCon,
  StyledAddressRowLeft,
  StyledRowIconContainer,
  StyledAddressName,
} from "./index.styled";

export default function RecipientInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (event: { target: { value: string } }) => void;
}) {
  const currentAddress = useAppSelector(
    (state) => state.accountInfo.currentAccount.address,
  );
  const [options, setOptions] = useState<AddressOption[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<AddressOption>();
  useEffect(() => {
    let active = true;
    setOpen(false);
    setSelected(undefined);
    setOptions([]);
    sendMsg(
      { action: WALLET_GET_ALL_ACCOUNT },
      (account: { accounts?: { allList?: AddressOption[] } }) => {
        if (!active) return;
        let contacts: AddressOption[] = [];
        try {
          const stored = JSON.parse(getLocal(ADDRESS_BOOK_CONFIG) || "[]");
          if (Array.isArray(stored)) contacts = stored;
        } catch {
        }
        const accounts = account?.accounts?.allList;
        setOptions(
          [...contacts, ...(Array.isArray(accounts) ? accounts : [])].filter(
            (item) =>
              typeof item?.address === "string" &&
              item.address !== currentAddress,
          ),
        );
      },
    );
    return () => {
      active = false;
    };
  }, [currentAddress]);
  return (
    <Input
      label={i18n.t("to")}
      placeholder={i18n.t("address")}
      value={value}
      subLabel={
        selected?.address === value ? selected.accountName || selected.name : ""
      }
      onChange={(event) => {
        setSelected(undefined);
        onChange(event);
      }}
      rightStableComponent={
        <StyledAddressCon>
          <StyledIconAddressCon onClick={() => setOpen((value) => !value)}>
            <img src="/img/icon_address.svg" alt="" />
          </StyledIconAddressCon>
          {open && (
            <>
              <StyledCloseMode onClick={() => setOpen(false)} />
              <StyledOptionOuter>
                <StyledOptionContainer>
                  {options.length ? (
                    options.map((data, index) => (
                      <AddressRowItem
                        key={index}
                        data={data}
                        onClickRowAddress={(item) => {
                          setSelected(item);
                          onChange({ target: { value: item.address } });
                          setOpen(false);
                        }}
                      />
                    ))
                  ) : (
                    <StyledEmptyCon>{i18n.t("noAddressSaved")}</StyledEmptyCon>
                  )}
                </StyledOptionContainer>
              </StyledOptionOuter>
            </>
          )}
        </StyledAddressCon>
      }
    />
  );
}

interface AddressOption {
  type?: string;
  accountName?: string;
  name?: string;
  address: string;
}

interface AddressRowItemProps {
  data?: AddressOption;
  onClickRowAddress?: (data: AddressOption) => void;
}

const AddressRowItem = ({ data, onClickRowAddress }: AddressRowItemProps) => {
  const { showIconSrc, showName, showAddress } = useMemo(() => {
    const showIconSrc = data?.type
      ? "/img/icon_wallet_outline.svg"
      : "/img/icon_contact.svg";
    let showName = data?.accountName || data?.name;
    const showAddress = addressSlice(data?.address || "", 6);
    return {
      showIconSrc,
      showName,
      showAddress,
    };
  }, [data]);

  const [iconColor, setIconColor] = useState("black");

  const showWhiteIcon = useCallback(() => {
    setIconColor("white");
  }, []);
  const showBlackIcon = useCallback(() => {
    setIconColor("black");
  }, []);

  return (
    <StyledAddressRowCon
      onClick={() => onClickRowAddress?.(data!)}
      onMouseEnter={showWhiteIcon}
      onMouseLeave={showBlackIcon}
    >
      <StyledAddressRowLeft>
        <StyledRowIconContainer>
          <SvgIcon src={showIconSrc} color={iconColor} />
        </StyledRowIconContainer>
        <StyledAddressName>{showName}</StyledAddressName>
      </StyledAddressRowLeft>
      <div>{showAddress}</div>
    </StyledAddressRowCon>
  );
};
