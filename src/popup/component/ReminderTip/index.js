import cls from "classnames";
import styles from "./index.module.scss";

export const ReminderTip_type = {
    info: "reminderTip_type_info",
    warning: "reminderTip_type_warning",
    warning_no_icon: "reminderTip_type_warning_no_icon"
}

export const ReminderTip = ({
    content = "",
    type = ReminderTip_type.info
}) => {
    return (
        <div className={cls(styles.content, {
            [styles.info]: type === ReminderTip_type.info
        })}>
            {content}
        </div>
    )
} 