import Button from "../Button";
import styles from "./index.module.scss";
import cls from "classnames"

const BottomBtn = ({
    disable = false,
    onClick = () => { },
    rightBtnContent = "",
    children,
    rightLoadingStatus = false,
    containerClass,
    noHolder=false
}) => {

    return (<>
        {!noHolder && <div className={styles.hold} ></div>}
        {children}
        <div className={cls(styles.bottomCon,containerClass)}>
            <Button
                disable={disable}
                loading={rightLoadingStatus}
                onClick={onClick}>
                {rightBtnContent}
            </Button>
        </div>
    </>)
}

export default BottomBtn