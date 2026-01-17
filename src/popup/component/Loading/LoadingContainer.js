import { Component } from "react";
import i18n from "i18next";
import {
    StyledOverlay,
    StyledInnerContainer,
    StyledSpinner,
    StyledLoadingText,
} from "./index.styled";

export default class Loading extends Component {
    constructor(props) {
        super(props);
        this.state = {
            loadingStatus: false
        };
    }
    show = () => {
        this.setState({ loadingStatus: true })
    }
    hide = () => {
        this.setState({ loadingStatus: false })
    }
    render() {
        return (
            <StyledOverlay $show={this.state.loadingStatus}>
                <StyledInnerContainer>
                    <StyledSpinner src="/img/loading_purple.svg" />
                    <StyledLoadingText>{i18n.t('loading') + "..."}</StyledLoadingText>
                </StyledInnerContainer>
            </StyledOverlay>
        )
    }
}