import { useMemo } from "react";
import {
  StyledContainer,
  StyledRowTitle2,
  StyledRowContent,
  StyledMt10,
  StyledLoopWrapper,
  StyledViewRow,
  StyledRowContentContainer,
} from "./index.styled";

export const TypeRowInfo = ({ data, isZkData }) => {
  return (
    <StyledContainer>
      {data.map((item, i) => {
        return (
          <ChildView data={item} key={i} count={0} showInLine={isZkData} />
        );
      })}
    </StyledContainer>
  );
};

const ChildView = ({ data, count, showInLine }) => {
  if (data.children && data.children.length > 0) {
    let nextCount = count + 1;
    const Wrapper = showInLine ? StyledLoopWrapper : "div";
    return (
      <Wrapper>
        <ContentRow
          title={data.label}
          content={data.value}
          count={nextCount}
          showInLine={showInLine}
        />
        {data.children.map((item, i) => {
          return (
            <ChildView
              data={item}
              key={i}
              count={nextCount}
              showInLine={showInLine}
            />
          );
        })}
      </Wrapper>
    );
  }
  return (
    <ContentRow
      title={data.label}
      content={data.value}
      showInLine={showInLine}
      count={count + 1}
      withColon={showInLine}
    />
  );
};

const ContentRow = ({
  title,
  content,
  count = 0,
  showInLine,
  withColon = false,
}) => {
  const marginLeftValue = useMemo(() => {
    return 20 * (count - 1) + "px";
  }, [count]);
  const showContent = useMemo(() => {
    let nextContent;
    if (typeof content === "boolean") {
      nextContent = "" + content;
    } else {
      nextContent = content;
    }
    return nextContent;
  }, [content]);
  const showTitle = useMemo(() => {
    return withColon ? title + ": " : title;
  }, [withColon, title]);

  const Container = showInLine ? StyledViewRow : StyledRowContentContainer;

  return (
    <Container style={{ marginLeft: marginLeftValue }}>
      <StyledRowTitle2>{showTitle}</StyledRowTitle2>
      {showContent && (
        <StyledRowContent style={{ marginTop: showInLine ? 0 : "10px" }}>
          {showContent}
        </StyledRowContent>
      )}
    </Container>
  );
};
