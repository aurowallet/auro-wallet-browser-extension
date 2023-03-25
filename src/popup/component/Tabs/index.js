import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./index.module.scss";
import cls from "classnames";

export const TAB_TYPE = {
  TAB: "tab",
  STEP: "step",
};
const Tabs = (props) => {
  const {
    selected,
    onSelect,
    children,
    initedId,
    tabType = TAB_TYPE.TAB,
  } = props;
  const nextChildren = useMemo(()=>{
    return children.filter((child)=>{
      return typeof child !== "boolean"
    })
  },[children])

  const tabButtonsRef = useRef();
  const tabIndicatorRef = useRef();

  const onSelectTab = useCallback(
    (index, id) => {
      onSelect && onSelect(index);
      updateTabIndicator(tabButtonsRef.current, tabIndicatorRef.current, id);
    },
    [tabButtonsRef, tabIndicatorRef, nextChildren.length, tabType]
  );

  useEffect(() => {
    if (tabType === TAB_TYPE.STEP) {
      updateStepIndicator(tabIndicatorRef.current, nextChildren.length, selected);
    }
  }, [selected]);
  useEffect(() => {
    if (tabType === TAB_TYPE.STEP) {
      updateStepIndicator(tabIndicatorRef.current, nextChildren.length, selected);
    } else {
      updateTabIndicator(
        tabButtonsRef.current,
        tabIndicatorRef.current,
        initedId
      );
    }
  }, [initedId]);
  const buttons = React.Children.map(nextChildren, (child, index) => {
    const { id } = child.props;
    const isSelected = selected === index;
    const handleClick = () => onSelectTab(index, id);
    if (tabType === TAB_TYPE.STEP) {
      return <></>;
    }
    return (
      <TabButton id={id} selected={isSelected} onClick={handleClick}>
        {child.props.label}
      </TabButton>
    );
  });

  const panels = React.Children.map(nextChildren, (child, index) => {
    const id = child.props.id;
    const isSelected = selected === index;
    return (
      <TabPanel id={id} selected={isSelected}>
        {child.props.children}
      </TabPanel>
    );
  });
  return (
    <div
      className={cls(styles.tabContainer, {
        [styles.stepTabContainer]: tabType === TAB_TYPE.STEP,
      })}
    >
      <div
        className={cls(styles.tabBtnContainer, {
          [styles.stepTabBtn]: tabType === TAB_TYPE.STEP,
        })}
        ref={tabButtonsRef}
      >
        {buttons}
        <span
          ref={tabIndicatorRef}
          className={cls(styles.tabIndicator, {
            [styles.stepTabIndicator]: tabType === TAB_TYPE.STEP,
          })}
        />
      </div>
      <div
        className={cls(styles.tabsPanels, {
          [styles.stepTabPanels]: tabType === TAB_TYPE.STEP,
        })}
      >
        <div className={styles.tabTracker}>{panels}</div>
      </div>
    </div>
  );
};

export default Tabs;

const TabButton = (props) => {
  const { id, selected, onClick, children } = props;
  return (
    <button
      data-id={id}
      className={cls(styles.tabBtn, {
        [styles.tabBtnActive]: selected,
      })}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

const TabPanel = (props) => {
  const { id, selected, children } = props;
  return (
    <div
      data-id={id}
      className={cls(styles.tabPanel, {
        [styles.tabPanelActive]: selected,
      })}
    >
      {children}
    </div>
  );
};

const updateTabIndicator = (tabButtons, tabIndicator, selected) => {
  const tabButton = tabButtons.querySelector(`[data-id="${selected}"]`);
  const tabButtonsPos = tabButtons.getBoundingClientRect();
  const tabButtonPos = tabButton.getBoundingClientRect();
  const left = tabButtonPos.left - tabButtonsPos.left;
  const width = tabButton.clientWidth;
  tabIndicator.style.width = `${width}px`;
  tabIndicator.style.left = `${left}px`;
};
const updateStepIndicator = (tabIndicator, totalIndex, currentIndex) => {
  const width = 100 / totalIndex;
  tabIndicator.style.width = width + "%";
  tabIndicator.style.left = currentIndex * width + "%";
};
