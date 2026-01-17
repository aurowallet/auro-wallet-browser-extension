import Button from "../Button";
import {
    StyledPlaceholder,
    StyledBottomContainer,
} from "./index.styled";

const BottomBtn = ({
    disable = false,
    onClick = () => { },
    rightBtnContent = "",
    children,
    rightLoadingStatus = false,
    containerClass,
    noHolder = false
}) => {
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