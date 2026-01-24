import React, { ReactElement, ReactNode, useCallback, useEffect, useMemo, useRef } from "react";

export interface TabChildProps {
  id?: string;
  label?: string;
  children?: ReactNode;
  style?: React.CSSProperties;
}

// Tab component for type-safe tab children
export const Tab: React.FC<TabChildProps> = ({ children }) => {
  return <>{children}</>;
};

interface TabsProps {
  selected?: number;
  onSelect?: (index: number) => void;
  children: ReactNode;
  initId?: string;
  tabType?: string;
  btnRightComponent?: ReactNode;
  customBtnCss?: React.ComponentType<{ $active?: boolean; onClick?: () => void; children?: ReactNode; 'data-id'?: string }>;
  customTabPanelCss?: React.ComponentType<{ $active?: boolean; children?: ReactNode; 'data-id'?: string }>;
}
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

const Tabs = (props: TabsProps) => {
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
    return React.Children.toArray(children).filter((child) => {
      return typeof child !== "boolean"
    }) as ReactElement<TabChildProps>[]
  }, [children])

  const tabButtonsRef = useRef<HTMLDivElement>(null);
  const tabIndicatorRef = useRef<HTMLSpanElement>(null);

  const onSelectTab = useCallback(
    (index: number, id?: string) => {
      onSelect && onSelect(index);
      if (tabButtonsRef.current && tabIndicatorRef.current) {
        updateTabIndicator(tabButtonsRef.current, tabIndicatorRef.current, id);
      }
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
    } else if (tabButtonsRef.current && tabIndicatorRef.current) {
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

const updateTabIndicator = (tabButtons: HTMLDivElement, tabIndicator: HTMLSpanElement, selected?: string) => {
  const tabButton = tabButtons.querySelector(`[data-id="${selected}"]`) as HTMLElement | null;
  if (!tabButton) return;
  const tabButtonsPos = tabButtons.getBoundingClientRect();
  const tabButtonPos = tabButton.getBoundingClientRect();
  const left = tabButtonPos.left - tabButtonsPos.left;
  const width = tabButton.clientWidth;
  tabIndicator.style.width = `${width}px`;
  tabIndicator.style.left = `${left}px`;
};

const updateStepIndicator = (tabIndicator: HTMLSpanElement | null, totalIndex: number, currentIndex?: number) => {
  if (!tabIndicator) return;
  const width = 100 / totalIndex;
  tabIndicator.style.width = width + "%";
  tabIndicator.style.left = (currentIndex || 0) * width + "%";
};
