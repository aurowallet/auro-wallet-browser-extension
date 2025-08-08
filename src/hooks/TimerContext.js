import { createContext, useContext, useEffect, useRef, useState } from "react";

const TimerContext = createContext();

export const TimerProvider = ({
  children,
  intervalTime = 0,
  onTimerComplete = () => {},
}) => {
  const [countdown, setCountdown] = useState(intervalTime);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const timerRef = useRef(null);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    if (intervalTime <= 0) return;

    const startCountdown = () => {
      setCountdown(intervalTime);
      setIsRefreshing(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1 && !isProcessingRef.current) {
            isProcessingRef.current = true;
            setIsRefreshing(true);
            Promise.resolve(onTimerComplete("call"))
              .then(() => {
                setIsRefreshing(false);
                setCountdown(intervalTime);
                isProcessingRef.current = false;
              })
              .catch((error) => {
                console.error("TimerContext: onTimerComplete failed:", error);
                setIsRefreshing(false);
                setCountdown(intervalTime);
                isProcessingRef.current = false;
              });
            return 0;
          }
          return prev <= 1 ? 0 : prev - 1;
        });
      }, 1000);
    };

    startCountdown();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      isProcessingRef.current = false;
    };
  }, [intervalTime, onTimerComplete]);

  return (
    <TimerContext.Provider value={{ countdown, isRefreshing, intervalTime }}>
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error("useTimer must be used within a TimerProvider");
  }
  return context;
};
