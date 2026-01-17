import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  StyledTabContainer,
  StyledTabBtnContainer,
  StyledBtnRow,
  StyledTabIndicator,
  StyledTabBtn,
  StyledTabPanel,
  StyledTabsPanels,
  StyledTabTracker,
} from "./index.styled";

export const TAB_TYPE = {
  TAB: "tab",
  STEP: "step",
};

const Tabs = (props) => {
  const {
    selected,
    onSelect,
    children,
    initId,
    tabType = TAB_TYPE.TAB,
    btnRightComponent,
    customBtnCss,
    customTabPanelCss
  } = props;

  const nextChildren = useMemo(() => {
    return children.filter((child) => {
      return typeof child !== "boolean"
    })
  }, [children])

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
        initId
      );
    }
  }, [initId]);

  const TabBtnComponent = customBtnCss || StyledTabBtn;
  const TabPanelComponent = customTabPanelCss || StyledTabPanel;

  const buttons = React.Children.map(nextChildren, (child, index) => {
    const { id } = child.props;
    const isSelected = selected === index;
    const handleClick = () => onSelectTab(index, id);
    if (tabType === TAB_TYPE.STEP) {
      return <></>;
    }
    return (
      <TabBtnComponent
        data-id={id}
        $active={isSelected}
        onClick={handleClick}
      >
        {child.props.label}
      </TabBtnComponent>
    );
  });

  const panels = React.Children.map(nextChildren, (child, index) => {
    const id = child.props.id;
    const isSelected = selected === index;
    return (
      <TabPanelComponent
        data-id={id}
        $active={isSelected}
      >
        {child.props.children}
      </TabPanelComponent>
    );
  });

  return (
    <StyledTabContainer $isStep={tabType === TAB_TYPE.STEP}>
      <StyledTabBtnContainer
        $isStep={tabType === TAB_TYPE.STEP}
        ref={tabButtonsRef}
      >
        <StyledBtnRow>
          <div>{buttons}</div>
          {btnRightComponent && <div>{btnRightComponent}</div>}
        </StyledBtnRow>
        <StyledTabIndicator
          ref={tabIndicatorRef}
          $isStep={tabType === TAB_TYPE.STEP}
        />
      </StyledTabBtnContainer>
      <StyledTabsPanels $isStep={tabType === TAB_TYPE.STEP}>
        <StyledTabTracker>{panels}</StyledTabTracker>
      </StyledTabsPanels>
    </StyledTabContainer>
  );
};

export default Tabs;

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
