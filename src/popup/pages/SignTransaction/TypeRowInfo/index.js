import { useMemo } from "react";
import styles from "./index.module.scss";

export const TypeRowInfo = ({ data }) => {
  return (
    <div className={styles.container}>
      {data.map((item, i) => {
        return <ChildView data={item} key={i} />;
      })}
    </div>
  );
};
const ChildView = ({ data, count = 0 }) => {
  if (typeof data === "object" && data !== null && data !== undefined) {
    let keys = Object.keys(data).filter((key) => {
      return key !== "label";
    });
    const label = data?.label || "";
    if (label) {
      keys = ["label", ...keys];
    }
    return keys.map((key, i) => {
      const showData = data[key];
      if (typeof showData === "object") {
        return (
          <div>
            <ContentRow key={i} title={key} count={count} />
            <ChildView data={showData} key={i} count={count + 2} />
          </div>
        );
      } else {
        if (key === "label") {
          return <TitleRow key={i} title={showData} />;
        } else {
          return (
            <ContentRow key={i} title={key} content={showData} count={count} />
          );
        }
      }
    });
  } else {
    return <ContentRow key={i} content={data} />;
  }
};

const TitleRow = ({ title }) => {
  return <div className={styles.rowTitle}>{title}</div>;
};
const ContentRow = ({ title, content, count = 0 }) => {
  const marginleftValue = useMemo(() => {
    return 10 * count + "px";
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
  return (
    <div
      className={styles.rowContentContainer}
      style={{
        marginLeft: marginleftValue,
      }}
    >
      <div className={styles.rowTitle2}>{title}</div>
      {showContent && <p className={styles.rowContent}>{showContent}</p>}
    </div>
  );
};
