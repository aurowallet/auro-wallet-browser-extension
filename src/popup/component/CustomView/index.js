import cls from "classnames";
import { useCallback, useMemo } from "react";
import { useHistory } from 'react-router-dom';
import styles from "./index.module.scss";


const CustomView = ({
    children,
    title = "",
    backRoute = "",
    onGoBack,
    contentClassName = "",
    isReceive = false,
    rightComponent = "",
    customContainerClass = "",
    noBack = false,
    customeTitleClass = '',
    onClickTitle=()=>{},
    rightIcon = '',
    onClickRightIcon = () => { }
}) => {
 
    let history = useHistory();
    const goBack = useCallback(() => {
        if (onGoBack && onGoBack()) {
            return;
        }
        if (backRoute) {
            history.push(backRoute)
        } else {
            history.goBack()
        }
    }, [backRoute, onGoBack])

    const { backIcon } = useMemo(() => {
        const backIcon = isReceive ? "/img/icon_back_white.svg" : "/img/icon_back.svg"
        return {
            backIcon
        }
    }, [isReceive])

    return (
        <>
            <div className={cls(styles.rowContainer, customContainerClass, {
                [styles.receiveClass]: isReceive,
                [styles.rightIconClass]: rightIcon
            })}>
                {isReceive && <img src={'/img/receivePageBg.svg'} className={styles.fullPageImg} />}
                {!noBack && <div className={styles.backImgCon} onClick={goBack}>
                    <img src={backIcon} />
                </div>}
                <p onClick={onClickTitle} className={cls(styles.title, customeTitleClass, {
                    [styles.receiveTitle]: isReceive
                })}>
                    {title}
                </p>
                {rightComponent}
                {rightIcon && <div className={styles.rightIconContainer}>
                    <img
                        src={rightIcon}
                        className={styles.rightIcon} onClick={onClickRightIcon} />
                </div>}
            </div>
            <div className={cls(styles.contentContainer, contentClassName)}>
                {children}
            </div>
        </>
    )
}
export default CustomView