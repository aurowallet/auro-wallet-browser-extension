import styled from "styled-components";

const StyledProcessContainer = styled.div`
  height: ${({ $height }) => $height || "100%"};
  width: ${({ $width }) => $width || "100%"};
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #fff;
`;

const StyledBackContainer = styled.div`
  flex-shrink: 0;
  padding: 20px 0 0 20px;
  cursor: pointer;
  width: fit-content;
`;

const StyledBackImg = styled.img`
  width: 30px;
  height: 30px;
`;

const StyledMainWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
`;

const StyledContentArea = styled.div`
  flex: 1;
  padding: 0 40px 40px 40px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 40px;
  overflow-y: auto;
`;

const StyledTitle = styled.div`
  color: var(--Black, #000);
  font-size: 24px;
  font-weight: 700;
  margin: 20px 0;
`;

const StyledBottomWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const StyledBottomLeftContent = styled.div``;

const StyledBottomInner = styled.div`
  width: 600px;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-self: center;
`;

export const ProcessLayout = ({
  onClickBack,
  title,
  children,
  bottomContent,
  bottomLeftContent,
  hideBack = false,
  height,
  width,
}) => {
  return (
    <StyledProcessContainer $height={height} $width={width}>
      {!hideBack && onClickBack && (
        <StyledBackContainer onClick={onClickBack}>
          <StyledBackImg src="/img/icon_back.svg" alt="back" />
        </StyledBackContainer>
      )}

      <StyledMainWrapper>
        <StyledContentArea>
          <div>
            {title && <StyledTitle>{title}</StyledTitle>}
            {children}
          </div>

          <StyledBottomWrapper>
            {bottomLeftContent && (
              <StyledBottomLeftContent>{bottomLeftContent}</StyledBottomLeftContent>
            )}
            {bottomContent && <StyledBottomInner>{bottomContent}</StyledBottomInner>}
          </StyledBottomWrapper>
        </StyledContentArea>
      </StyledMainWrapper>
    </StyledProcessContainer>
  );
};

export default ProcessLayout;