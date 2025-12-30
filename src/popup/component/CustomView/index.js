import cls from "classnames";
import { useCallback } from "react";
import { useNavigate } from 'react-router-dom';
import styles from "./index.module.scss";


const CustomView = ({
    children,
    title = "",
    backRoute = "",
    onGoBack,
    contentClassName = "",
    rightComponent = "",
    customContainerClass = "",
    noBack = false,
    customTitleClass = '',
    onClickTitle=()=>{},
    rightIcon = '',
    onClickRightIcon = () => { },
    rightHoverContent=""
}) => {
    const navigate = useNavigate();
    const goBack = useCallback(() => {
        if (onGoBack) {
            onGoBack()
            return
        }
        if (backRoute) {
            navigate(backRoute)
        } else {
            navigate(-1)
        }
    }, [backRoute, onGoBack])


    return (
        <>
            <div className={cls(styles.rowContainer, customContainerClass, {
                [styles.rightIconClass]: rightIcon
            })}>
                {!noBack && <div className={styles.backImgCon} onClick={goBack}>
                    <img src={"/img/icon_back.svg"} />
                </div>}
                <p onClick={onClickTitle} className={cls(styles.title, customTitleClass)}>
                    {title}
                </p>
                {rightComponent}
                {rightIcon && <div className={styles.rightIconContainer}>
                    <img
                        src={rightIcon}
                        className={styles.rightIcon} onClick={onClickRightIcon} />
                    {rightHoverContent && <div className={styles.baseTipContainer}>
                        <span className={styles.baseTip}>{rightHoverContent}</span>
                    </div>}
                </div>}
            </div>
            <div className={cls(styles.contentContainer, contentClassName)}>
                {children}
            </div>
        </>
    )
}
export default CustomView