import cls from "classnames";
import { useMemo } from "react";
import styles from "./index.module.scss";
export const TypeRowInfo = ({ data, isZkData }) => {
  return (
    <div className={styles.container}>
      {data.map((item, i) => {
        return (
          <ChildView data={item} key={i} count={0} showInLine={isZkData} />
        );
      })}
    </div>
  );
};
const ChildView = ({ data, count, showInLine }) => {
  if (data.children && data.children.length > 0) {
    let nextCount = count + 1;
    return (
      <div
        className={cls({
          [styles.loopWrapper]: showInLine,
        })}
      >
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
      </div>
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
  return (
    <div
      className={cls(styles.rowContentContainer, {
        [styles.viewRow]: showInLine,
      })}
      style={{
        marginLeft: marginLeftValue,
      }}
    >
      <div className={styles.rowTitle2}>{showTitle}</div>
      {showContent && (
        <p
          className={cls(styles.rowContent, {
            [styles.mt10]: !showInLine,
          })}
        >
          {showContent}
        </p>
      )}
    </div>
  );
};
