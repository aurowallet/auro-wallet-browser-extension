import { useCallback, useEffect, useState } from "react";
import { showNameSlice } from "../../../utils/utils";
import i18n from "i18next";
import {
    StyledModalBg,
    StyledContainer,
    StyledSelectContainer,
    StyledArrowIcon,
    StyledSelectTitle,
    StyledOptionsOuter,
    StyledOptionsContainer,
    StyledOption,
    StyledNetworkTitleWrapper,
    StyledNodeListTitle,
    StyledHrDotted,
} from "./index.styled";

const Select = ({
    value = "",
    optionList = [],
    onChange = () => { }
}) => {
    const [optionStatus, setOptionStatus] = useState(false)

    const onClickEntry = useCallback(() => {
        setOptionStatus(state => !state)
    }, [])

    const getShowLabel = useCallback(() => {
        let filterRes = optionList.filter((option) => {
            return option.value === value
        })
        return filterRes[0]?.label
    }, [optionList, value])

    const [currentLabel, setCurrentLabel] = useState(() => {
        return getShowLabel()
    })

    useEffect(() => {
        setCurrentLabel(getShowLabel())
    }, [value])

    const onCloseOption = useCallback(() => {
        setOptionStatus(false)
    }, [])

    const onClickOption = useCallback((option) => {
        setOptionStatus(false)
        onChange(option)
    }, [onChange])

    return (
        <>
            <StyledModalBg $show={optionStatus} onClick={onCloseOption} />
            <StyledContainer>
                <StyledSelectContainer onClick={onClickEntry}>
                    <StyledSelectTitle>
                        {showNameSlice(currentLabel, 10)}
                    </StyledSelectTitle>
                    <StyledArrowIcon>
                        <img src="/img/icon_arrow_unfold.svg" />
                    </StyledArrowIcon>
                </StyledSelectContainer>

                {optionStatus && (
                    <StyledOptionsOuter>
                        <StyledOptionsContainer>
                            {optionList.map((option, index) => {
                                if (option.type === 'dividedLine') {
                                    return (
                                        <StyledNetworkTitleWrapper key={index}>
                                            <StyledHrDotted />
                                            <StyledNodeListTitle>{i18n.t('testnet')}</StyledNodeListTitle>
                                            <StyledHrDotted />
                                        </StyledNetworkTitleWrapper>
                                    )
                                }
                                let isSelect = value == option.value
                                return (
                                    <StyledOption
                                        key={index}
                                        onClick={() => onClickOption(option)}
                                        $selected={isSelect}
                                    >
                                        {showNameSlice(option.label, 10)}
                                    </StyledOption>
                                )
                            })}
                        </StyledOptionsContainer>
                    </StyledOptionsOuter>
                )}
            </StyledContainer>
        </>
    )
}

export default Select