import { ReactNode, ComponentType } from "react";
import Button from "../Button";
import {
    StyledPlaceholder,
    StyledBottomContainer,
} from "./index.styled";

interface BottomBtnProps {
    disable?: boolean;
    onClick?: () => void;
    rightBtnContent?: string;
    children?: ReactNode;
    rightLoadingStatus?: boolean;
    containerClass?: ComponentType<{ children?: ReactNode }>;
    noHolder?: boolean;
}

const BottomBtn = ({
    disable = false,
    onClick = () => { },
    rightBtnContent = "",
    children,
    rightLoadingStatus = false,
    containerClass,
    noHolder = false
}: BottomBtnProps) => {
    const ContainerComponent = containerClass || StyledBottomContainer;

    return (
        <>
            {!noHolder && <StyledPlaceholder />}
            {children}
            <ContainerComponent>
                <Button
                    disable={disable}
                    loading={rightLoadingStatus}
                    onClick={onClick}>
                    {rightBtnContent}
                </Button>
            </ContainerComponent>
        </>
    )
}

export default BottomBtn