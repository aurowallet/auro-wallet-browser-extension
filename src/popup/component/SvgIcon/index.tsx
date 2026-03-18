import { memo, useEffect, useState } from "react";
import browser from "webextension-polyfill";

const svgCache: Record<string, string> = {};
const svgPending: Record<string, Promise<string>> = {};

const EXTENSION_ORIGIN = (() => {
  try {
    return new URL(browser.runtime.getURL("")).origin;
  } catch {
    return "";
  }
})();

function isExtensionLocalUrl(url: string): boolean {
  if (!EXTENSION_ORIGIN) return false;
  try {
    return new URL(url, EXTENSION_ORIGIN).origin === EXTENSION_ORIGIN;
  } catch {
    return false;
  }
}

function fetchSvg(src: string): Promise<string> {
  if (svgCache[src]) return Promise.resolve(svgCache[src]);
  if (!isExtensionLocalUrl(src)) {
    return Promise.reject(new Error(`SvgIcon: blocked non-extension URL: ${src}`));
  }
  if (!svgPending[src]) {
    svgPending[src] = fetch(src)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch SVG: ${src}`);
        return res.text();
      })
      .then((text) => {
        if (!text.trimStart().startsWith("<svg")) {
          throw new Error(`Invalid SVG content: ${src}`);
        }
        svgCache[src] = text;
        delete svgPending[src];
        return text;
      })
      .catch((err) => {
        delete svgPending[src];
        throw err;
      });
  }
  return svgPending[src];
}

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
    fetchSvg(src)
      .then((text) => {
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
