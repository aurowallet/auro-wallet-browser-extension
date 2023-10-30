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
const ChildView = ({ data }) => {
  return (<ContentRow title={data.label} content={data.value}/>)
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
