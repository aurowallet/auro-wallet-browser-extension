import cls from "classnames";
import { useCallback, useEffect, useMemo, useState } from "react";
import { isTrueNumber, nameLengthCheck } from "../../../utils/utils";
import Input from "../Input";
import styles from "./index.module.scss";

export const PopupModal_type = {
    common: "popup_common",
    warning: "popup_warning",
    input: "popup_input"
}

export const PopupModal = ({
    title = "",
    content = "",
    componentContent = <></>,
    leftBtnContent = "",
    rightBtnContent = "",
    rightBtnStyle = "",

    type = PopupModal_type.common,
    onLeftBtnClick = () => { },
    onRightBtnClick = () => { },
    modalVisible,

    inputType = "text",
    inputPlaceholder = "",
    showBottomTip = false,
    bottomTip = "",
    bottomTipClass = "",
    onInputChange = () => { },
    contentList = [],
    maxInputLength = -1,

    rightBtnDisable=false,
    clearWhenClose = true
}) => {

    const [inputValue, setInputValue] = useState("")

    const {
        modalTopIcon
    } = useMemo(() => {
        let modalTopIcon = ""
        if (type === PopupModal_type.warning) {
            modalTopIcon = "/img/unusual.svg"
        }
        return {
            modalTopIcon,
        }
    }, [type])

    const onLeftClick = useCallback(() => {
        onLeftBtnClick()
    }, [onLeftBtnClick])

    const onRightClick = useCallback(() => {
        if(rightBtnDisable){
            return
        }
        onRightBtnClick({ inputValue })
    }, [onRightBtnClick, inputValue,rightBtnDisable])


    const onInput = useCallback((e) => {
        if (maxInputLength !== -1 && isTrueNumber(maxInputLength)) {
            let checkResult = nameLengthCheck(e.target.value, maxInputLength)
            if (checkResult) {
                onInputChange(e)
                setInputValue(e.target.value)
            }
        } else {
            onInputChange(e)
            setInputValue(e.target.value)
        }
    }, [onInputChange, maxInputLength])


    useEffect(()=>{
        if(!modalVisible && clearWhenClose){
            setInputValue("")
        }
    },[modalVisible,clearWhenClose])
    return (
        <>
            {
                modalVisible && <div className={styles.outerContainer}>
                    <div className={styles.contentContainer}>
                        <div className={styles.topContainer}>
                            {modalTopIcon && <div className={styles.iconContainer}>
                                <img src={modalTopIcon} />
                            </div>}

                            <p className={styles.modalTitle}>{title}</p>
                            {content && <p className={styles.content}>{content}</p>}
                            {contentList.length > 0 &&
                                contentList.map((content, index) => {
                                    return <p key={index} className={styles.content}>{content}</p>
                                })
                            }
                            {type === PopupModal_type.input &&
                                <Input
                                    placeholder={inputPlaceholder || ""}
                                    onChange={ onInput}
                                    value={inputValue}
                                    inputType={inputType}
                                    showBottomTip={showBottomTip}
                                    bottomTip={bottomTip}
                                    bottomTipClass={bottomTipClass}
                                />}
                            {componentContent && <div className={styles.componentContentContainer}>
                                {componentContent}
                            </div>}
                        </div>
                        {(leftBtnContent || rightBtnContent) && <div className={styles.bottomContainer}>
                            {leftBtnContent && <div className={styles.leftBtn} onClick={onLeftClick}>{leftBtnContent}</div>}
                            {leftBtnContent && rightBtnContent && <div className={styles.divideLine} />}
                            {rightBtnContent && <div className={cls(styles.rightBtn, rightBtnStyle,{
                                [styles.rightBtnDisable]:rightBtnDisable
                            })} onClick={onRightClick}>{rightBtnContent}</div>}
                        </div>}
                    </div>
                </div>
            }
        </>
    )
} 