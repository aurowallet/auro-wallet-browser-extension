import { memo, useEffect, useState } from "react";

const svgCache: Record<string, string> = {};

interface SvgIconProps {
  src: string;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

const SvgIcon = memo(({ src, color, className, style }: SvgIconProps) => {
  const [svgContent, setSvgContent] = useState(svgCache[src] || "");

  useEffect(() => {
    if (svgCache[src]) {
      setSvgContent(svgCache[src]);
      return;
    }
    let cancelled = false;
    fetch(src)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch SVG: ${src}`);
        return res.text();
      })
      .then((text) => {
        if (!text.trimStart().startsWith("<svg")) {
          throw new Error(`Invalid SVG content: ${src}`);
        }
        svgCache[src] = text;
        if (!cancelled) setSvgContent(text);
      })
      .catch((err) => {
        console.error(err);
      });
    return () => {
      cancelled = true;
    };
  }, [src]);

  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        lineHeight: 0,
        color,
        ...style,
      }}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
});

SvgIcon.displayName = "SvgIcon";

export default SvgIcon;
