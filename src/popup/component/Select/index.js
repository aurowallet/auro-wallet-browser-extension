import cls from "classnames";
import { useCallback, useEffect, useState } from "react";
import { showNameSlice } from "../../../utils/utils";
import styles from "./index.module.scss";

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
    
    return (<>
        <div className={cls(styles.commonBg, {
            [styles.modalBg]: optionStatus
        })} onClick={onCloseOption} />
        <div className={styles.container}>
            <div className={styles.selectContainer}
                onClick={onClickEntry}
            >
                <p className={styles.selectTitle}>
                    {showNameSlice(currentLabel,10)}
                </p>
                <div className={styles.arrowtIcon}>
                <img src="/img/icon_arrow_unfold.svg"  />
                </div>
            </div>

            {optionStatus && <div className={styles.optionsOuter}>
                <div className={styles.optionsContainer}>
                    {
                        optionList.map((option, index) => {
                            let isSelect = value == option.value
                            return <Option onClick={() => onClickOption(option)} isSelect={isSelect} key={index} label={option.label} value={option.value} />
                        })
                    }
                </div>
            </div>}
        </div>

    </>)
}

const Option = ({ label, value, isSelect, onClick }) => {

    return (<div
        onClick={onClick}
        className={cls(styles.optionContainer, {
            [styles.selectedOption]: isSelect
        })}>
        {showNameSlice(label,10)}
    </div>)
}

export default Select