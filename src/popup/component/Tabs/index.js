import React, { useCallback, useEffect, useRef, useState } from "react";
import styles from "./index.module.scss"
import cls from "classnames"

const Tabs = (props) => {
    const { selected, onSelect, children, initedId, } = props;


    const tabButtonsRef = useRef();
    const tabIndicatorRef = useRef();

    const onSelectTab = useCallback((index, id) => {
        onSelect(index)

        updateTabIndicator(
            tabButtonsRef.current,
            tabIndicatorRef.current,
            id
        );

    }, [tabButtonsRef, tabIndicatorRef])


    useEffect(() => {
        updateTabIndicator(
            tabButtonsRef.current,
            tabIndicatorRef.current,
            initedId
        );
    }, [initedId])
    const buttons = React.Children.map(children, (child, index) => {
        const { id } = child.props;
        const isSelected = selected === index;
        const handleClick = () => onSelectTab(index, id);

        return (
            <TabButton id={id} selected={isSelected} onClick={handleClick}>
                {child.props.label}
            </TabButton>
        );
    });

    const panels = React.Children.map(children, (child, index) => {
        const id = child.props.id;
        const isSelected = selected === index;
        return (
            <TabPanel id={id} selected={isSelected}>
                {child.props.children}
            </TabPanel>
        );
    });
    return (<div className={styles.tabContainer} >
        <div className={styles.tabBtnContainer} ref={tabButtonsRef}>
            {buttons}
            <span ref={tabIndicatorRef}
                className={styles.tabIndicator} />
        </div>
        <div className={styles.tabsPanels}>
            <div className={styles.tabTracker}>
                {panels}
            </div>
        </div>
    </div>)
}

export default Tabs

const TabButton = (props) => {
    const { id, selected, onClick, children } = props;
    return (
        <button data-id={id} className={cls(styles.tabBtn, {
            [styles.tabBtnActive]: selected
        })} onClick={onClick} >
            {children}
        </button>
    );
}

const TabPanel = (props) => {
    const { id, selected, children } = props;
    return (
        <div data-id={id} className={cls(styles.tabPanel, {
            [styles.tabPanelActive]: selected
        })} >
            {children}
        </div>
    );
}

const updateTabIndicator = (tabButtons, tabIndicator, selected) => {
    const tabButton = tabButtons.querySelector(`[data-id="${selected}"]`);
    const tabButtonsPos = tabButtons.getBoundingClientRect();
    const tabButtonPos = tabButton.getBoundingClientRect();
    const left = tabButtonPos.left - tabButtonsPos.left;
    const width = tabButton.clientWidth;
    tabIndicator.style.width = `${width}px`;
    tabIndicator.style.left = `${left}px`;
}