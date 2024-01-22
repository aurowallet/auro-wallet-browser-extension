import { useCallback, useState } from "react";
import styled, { css } from "styled-components";

const clickAble = css`
  cursor: pointer;
`;
const colorStatus = css`
  background: rgba(196, 196, 196, 0.2) !important;
`;
const colorIndexStatus = css`
  color: rgba(0, 0, 0, 0.5) !important;
`;

const StyledMneItemContainer = styled.div`
  background: var(--mainBlue);
  border-radius: 10px;

  display: flex;
  align-items: center;
  padding-left: 12px;
  min-height: 30px;
  width: 128px;
  ${(props) => props.clickable == "true" && clickAble}
  ${(props) => props.colorstatus == "true" && colorStatus}
`;
const StyledMneItemIndex = styled.div`
  font-size: 14px;
  line-height: 100%;
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  display: flex;
  font-weight: 500;
  ${(props) => props.colorstatus == "true" && colorIndexStatus}
`;
const StyledMneItem = styled.span`
  font-weight: 500;
  font-size: 14px;
  line-height: 100%;
  text-align: center;
  color: var(--white);
  margin-left: 6px;
`;
const StyledInputContainer = styled.div`
  width: 128px;
  height: 30px;
`;
const StyledInput = styled.input`
  background: none;
  outline: none;
  border: none;
  padding: 0 12px;

  font-weight: 500;
  font-size: 16px;
  line-height: 24px;
  color: #00142a;
  flex: 1;
  caret-color: var(--strong-black-80, rgba(0, 0, 0, 0.8));
  height: 100%;
  width: 100%;
`;
export const MneItemV2 = ({
  mne,
  index,
  canClick = false,
  onClick = () => {},
  colorStatus = false,
  useInput = false,
  onChange = () => {},
  onPaste = () => {},
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);
  return (
    <StyledMneItemContainer
      clickable={String(canClick)}
      colorstatus={String(colorStatus)}
      onClick={onClick}
    >
      <StyledMneItemIndex colorstatus={String(colorStatus)}>
        {index + 1 + "."}
      </StyledMneItemIndex>
      {useInput ? (
        <StyledInputContainer>
          <StyledInput
            onFocus={handleFocus}
            onBlur={handleBlur}
            value={mne}
            onChange={(e) => onChange(e, index)}
            type={isFocused ? "text" : "password"}
            onPaste={(e) => {
              const data = e.clipboardData.getData("text");
              if (data.trim().match(/\s/u)) {
                e.preventDefault();
                onPaste(index, data);
              }
            }}
          />
        </StyledInputContainer>
      ) : (
        <StyledMneItem>{mne}</StyledMneItem>
      )}
    </StyledMneItemContainer>
  );
};
