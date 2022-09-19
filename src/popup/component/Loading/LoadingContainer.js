import cls from "classnames";
import { Component } from "react";
import styles from "./index.module.scss";
import i18n from "i18next";

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
        return (<div className={cls(styles.outerContainer,
            { [styles.show]: this.state.loadingStatus }
        )}>
            <div className={styles.innerContainer}>
                <img src="/img/loading_purple.svg" className={styles.refreshLoading} />
                <p className={styles.loadingContent}>{i18n.t('loading')+"..."}</p>
            </div>
        </div>)
    }
}