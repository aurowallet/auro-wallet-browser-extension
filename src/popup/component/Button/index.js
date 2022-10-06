import cls from "classnames";
import { useEffect, useState } from "react";
import styles from "./index.module.scss";

export const button_theme = {
    BUTTON_THEME_COLOR: "BUTTON_THEME_COLOR",
    BUTTON_THEME_LIGHT: "BUTTON_THEME_LIGHT"
}

export const button_size = {
    large: "button_size_large",
    sub: "button_size_sub",
    middle: "button_size_middle",
    small: "button_size_small",
}
 
const Button = ({ 
    disable = false,
    leftIcon = "",
    theme = button_theme.BUTTON_THEME_COLOR,
    size = button_size.large,
    onClick = () => { },
    loading = false,
    children,
    className = "",
}) => {
    const [btnDisable, setBtnDisable] = useState(disable)
    useEffect(() => {
        setBtnDisable(loading)
    }, [loading])


    const onRealClick = () => {
        if (!loading && !disable) {
            onClick()
        }
    }

    return (<button className={cls(styles.button, className, {
        [styles.noLeftIcon]: !leftIcon,
        [styles.loadingBtn]: loading,
        [styles.buttonDisable]: disable,
        [styles.button_light]: theme === button_theme.BUTTON_THEME_LIGHT,
        [styles.btn_large]: size === button_size.large || size === button_size.sub,
        [styles.btn_middle]: size === button_size.middle,
        [styles.btn_small]: size === button_size.small,
    })} disabled={btnDisable} onClick={onRealClick}>
        {leftIcon && !loading && <div className={styles.iconContainer}>
            <img src={leftIcon} className={styles.btnIcon} />
        </div>}
        <img className={cls(styles.refreshLoading,{
            [styles.refreshLoadingShow]:loading
        })} src="/img/loading_light.svg" />

        {!loading && children}
    </button>)
}

export default Button