import i18n from "i18next";
import { useCallback, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useStore";
import { useNavigate } from "react-router-dom";
import { saveLocal } from "../../../background/localStorage";
import { CURRENCY_UNIT_CONFIG } from "../../../constant/storageKey";
import { updateCurrencyConfig } from "../../../reducers/currency";
import CustomView from "../../component/CustomView";
import { StyledContentContainer, StyledRowContainer } from "./index.styled";

const CurrencyUnit = () => {

  const navigate = useNavigate();
  const currencyList = useAppSelector((state) => state.currencyConfig.currencyList);
  const oldCurrency = useMemo(() => {
    const list = currencyList.filter((item) => item.isSelect);
    return list[0];
  }, [currencyList]);

  const [currentCurrency, setCurrentCurrency] = useState(() => {
    const list = currencyList.filter((item) => item.isSelect);
    return list[0];
  });

  const dispatch = useAppDispatch();

  const onSelect = useCallback(
    (item: typeof currentCurrency) => {
      if (!item) return;
      setCurrentCurrency(item);
      if (item !== oldCurrency) {
        const list = currencyList.map((mapItem) => ({
          ...mapItem,
          isSelect: mapItem.key === item.key,
        }));
        dispatch(updateCurrencyConfig(list));
        saveLocal(CURRENCY_UNIT_CONFIG, JSON.stringify(item.key));
        navigate(-1);
      }
    },
    [oldCurrency, currencyList, dispatch, navigate]
  );

  return (
    <CustomView title={i18n.t("currency")} ContentWrapper={StyledContentContainer}>
      {currencyList.map((item, index) => {
        const isChecked = currentCurrency?.key === item.key;
        return (
          <StyledRowContainer key={index} onClick={() => onSelect(item)}>
            <span>{item.value}</span>
            {isChecked && <img src="/img/icon_checked.svg" />}
          </StyledRowContainer>
        );
      })}
    </CustomView>
  );
};

export default CurrencyUnit;