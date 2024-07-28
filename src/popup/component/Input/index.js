import cls from "classnames";
import { useCallback, useState } from "react";
import { Trans } from "react-i18next";
import styles from "./index.module.scss";
import i18n from "i18next";
import { numberFormat } from "../../../utils/utils";

const Input = ({ 
    onChange = () => { },
    handleBtnClick = () => { },
    placeholder = "",
    value = "",
    className = "",

    inputType = "text",
    label = "",
    showBottomTip = false,
    bottomTip = "",
    bottomTipClass = "",
    rightComponent,
    rightStableComponent,
    subLabel = "",

    showSearchIcon = false,
    customInputContainer = "",
    
    transLabel = "",
    inputDisable=false
}) => { 

    const [showPwd, setShowPwd] = useState(false)
    const [realType, setRealType] = useState(inputType)

    const onKeyup = useCallback((e) => {
        if (e.keyCode === 13) {
            handleBtnClick()
        }
    }, [value])


    const onClickPwd = useCallback(() => {
        setRealType(showPwd ? "password" : "text")
        setShowPwd(!showPwd)
    }, [showPwd])

    const onChangeValue=useCallback((e)=>{
        if(onChange){
            if(inputType === "numric"){
                onChange({
                    ...e,
                    target:{
                        value:numberFormat(e.target.value)
                    }
                })
            }else{
                onChange(e)
            }
        }
    },[onChange,inputType])

    return (
        <div className={styles.container}>
            <div className={styles.label}>
                <div className={styles.labelContainer}>
                    {label && <span>{label}</span>}
                    {
                        transLabel && <Trans
                        i18nKey={i18n.t(transLabel)}
                        components={{
                          b: <span className={styles.boldLabel} />,
                          bold: <span className={styles.boldLabel} />,
                        }}
                      /> 
                    }
                    <div className={styles.subLabel}>{subLabel}</div>
                </div>
                {rightComponent}
            </div>
            <div className={cls(styles.inputCon, customInputContainer,{
                [styles.disableCls]:inputDisable
            })}>
                {showSearchIcon && <img className={styles.search} src="/img/icon_search.svg" />}
                <input
                    onChange={onChangeValue}
                    placeholder={placeholder}
                    value={value}
                    onKeyUp={onKeyup}
                    type={realType}
                    disabled={inputDisable}
                    className={cls(styles.input,
                        className,{
                            [styles.disableInput]:inputDisable
                        }
                    )} />
                {inputType === "password" && <div className={styles.imgContainer} onClick={onClickPwd}>
                    <img src={showPwd ? "/img/icon_input_show.svg" : "/img/icon_input_hide.svg"} />
                </div>}
                {rightStableComponent}
            </div>
            {showBottomTip && <div className={cls(styles.bottomTipCon, bottomTipClass)}>
                {bottomTip}
            </div>}
        </div >
    )
}

export default Input