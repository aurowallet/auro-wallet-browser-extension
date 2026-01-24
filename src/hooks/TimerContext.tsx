import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";

interface TimerContextValue {
  countdown: number;
  isRefreshing: boolean;
  intervalTime: number;
}

interface TimerProviderProps {
  children: ReactNode;
  intervalTime?: number;
  onTimerComplete?: (trigger: string) => void | Promise<void>;
}

const TimerContext = createContext<TimerContextValue | undefined>(undefined);

export const TimerProvider = ({
  children,
  intervalTime = 0,
  onTimerComplete = () => {},
}: TimerProviderProps) => {
  const [countdown, setCountdown] = useState<number>(intervalTime);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isProcessingRef = useRef<boolean>(false);

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

export const useTimer = (): TimerContextValue => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error("useTimer must be used within a TimerProvider");
  }
  return context;
};
