import cls from "classnames";
import { useCallback, useEffect, useImperativeHandle, useRef } from "react";
import styles from "./index.module.scss";

const TextArea = ({
    onChange = () => { },
    handleBtnClick = () => { },
    placeholder = "",
    value = "",
    className = "",

    label = "",
    showBottomTip = false,
    bottomErrorTip = "",
    childRef = null
}) => {
    const textAreaRef = useRef()

    const onKeyup = useCallback((e) => {
        if (e.keyCode === 13) {
            handleBtnClick()
        }
    }, [value])

    const getPositionForTextArea = useCallback(() => {
        let caretPos = textAreaRef.current?.selectionStart || textAreaRef.current?.selectionEnd
        return caretPos
    }, [textAreaRef])

    useImperativeHandle(childRef, () => ({
        setFocus: (focusTarget) => {
            textAreaRef.current?.focus()
        },
        getCurrentCaretPosition: () => {
            return getPositionForTextArea()
        }
    }));

    useEffect(() => {
        getPositionForTextArea()
    }, [value])
    return (<div className={styles.container}>
        <div className={styles.label}>
            {label}
        </div>
        <textarea
            ref={textAreaRef}
            className={cls(styles.textArea, className, {
                [styles.errorTip]: showBottomTip && bottomErrorTip
            })}
            value={value}
            onKeyUp={onKeyup}
            onChange={onChange}
            placeholder={placeholder}
        />
        {showBottomTip && bottomErrorTip &&
            <div className={styles.bottomTipCon}>
                {bottomErrorTip}
            </div>}
    </div>
    )
}
export default TextArea