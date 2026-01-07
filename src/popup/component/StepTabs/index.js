import React, { useEffect, useRef, useCallback } from "react";
import styled from "styled-components";

const StyledTabContainer = styled.div`
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
`;

const StyledIndicatorContainer = styled.div`
  background: rgb(174, 175, 176);
  height: 3px;
  position: relative;
  flex-shrink: 0;
`;

const StyledIndicator = styled.span`
  position: absolute;
  z-index: 1;
  top: 0;
  height: 3px;
  background: #594af1;
  transition: all 0.3s ease;
`;

const StyledPanelsContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: white;
  border-radius: 0 0 10px 10px;
  min-height: 0;
`;

const StyledPanelTracker = styled.div`
  display: flex;
  flex: 1;
  transition: transform 0.3s ease;
  min-height: 0;
`;

const StyledPanel = styled.div`
  width: 100%;
  flex-shrink: 0;
  display: ${({ $selected }) => ($selected ? "flex" : "none")};
  flex-direction: column;
  flex: 1;
  min-height: 0;
`;

/**
 * StepTabs 
 * @param {Object} props
 * @param {number} props.selected - selected tab index
 * @param {React.ReactNode} props.children - tab panels content
 * @param {Function} props.onSelect - selected callback (index, id)
 */
export const StepTabs = ({ selected = 0, children, onSelect }) => {
  const indicatorRef = useRef(null);
  const childrenArray = React.Children.toArray(children);
  const totalSteps = childrenArray.length;

  const updateIndicator = useCallback(() => {
    if (indicatorRef.current && totalSteps > 0) {
      // Each step shows its own segment (e.g., 25% width at step position)
      const stepWidth = 100 / totalSteps;
      const leftPosition = selected * stepWidth;
      indicatorRef.current.style.width = `${stepWidth}%`;
      indicatorRef.current.style.left = `${leftPosition}%`;
    }
  }, [selected, totalSteps]);

  useEffect(() => {
    updateIndicator();
  }, [updateIndicator]);

  const panels = childrenArray.map((child, index) => {
    const isSelected = selected === index;
    return (
      <StyledPanel key={child.props.id || index} $selected={isSelected}>
        {child.props.children}
      </StyledPanel>
    );
  });

  return (
    <StyledTabContainer>
      <StyledIndicatorContainer>
        <StyledIndicator ref={indicatorRef} />
      </StyledIndicatorContainer>
      <StyledPanelsContainer>
        <StyledPanelTracker>{panels}</StyledPanelTracker>
      </StyledPanelsContainer>
    </StyledTabContainer>
  );
};

export default StepTabs;
