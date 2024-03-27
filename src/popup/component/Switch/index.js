import React, { useState } from "react";
import styled from "styled-components";

const SwitchLabel = styled.label`
  position: relative;
  display: inline-block;
  width: 40px;
  height: 25px;
`;

const SwitchInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;

  &:checked + span {
    background-color: rgba(89, 74, 241, 1);
  }

  &:checked + span:before {
    transform: translateX(17px);
  }
`;

const SliderSpan = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(233, 233, 233, 1);
  transition: 0.4s;
  border-radius: 25px;

  &:before {
    position: absolute;
    content: "";
    height: 17px;
    width: 17px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    transition: 0.4s;
    border-radius: 50%;
  }
`;

const IOSSwitch = ({ isChecked, toggleSwitch }) => {
  return (
    <SwitchLabel>
      <SwitchInput
        type="checkbox"
        checked={isChecked}
        onChange={toggleSwitch}
      />
      <SliderSpan></SliderSpan>
    </SwitchLabel>
  );
};

export default IOSSwitch;
