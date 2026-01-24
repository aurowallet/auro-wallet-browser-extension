import { StyledTipContent } from "./index.styled";

interface ReminderTipProps {
  content?: string;
  type?: string;
}

export const ReminderTip_type = {
    info: "reminderTip_type_info",
    warning: "reminderTip_type_warning",
    warning_no_icon: "reminderTip_type_warning_no_icon"
}

export const ReminderTip = ({
    content = "",
    type = ReminderTip_type.info
}: ReminderTipProps) => {
    return (
        <StyledTipContent $type={type === ReminderTip_type.info ? 'info' : ''}>
            {content}
        </StyledTipContent>
    )
} 