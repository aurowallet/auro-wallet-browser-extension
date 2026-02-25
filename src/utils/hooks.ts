import { useRef, useEffect, type MutableRefObject } from "react";

export function useLatestRef<T>(value: T): MutableRefObject<T> {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  });
  return ref;
}
