import { createRef } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@/popup/style/ThemeProvider';
import ToastContainer from './ToastContainer';

const toastContainerDiv = document.createElement('div');
document.body.appendChild(toastContainerDiv);

const toastContainerRef = createRef<ToastContainer>();
const root = createRoot(toastContainerDiv);
root.render(
  <ThemeProvider>
    <ToastContainer ref={toastContainerRef} />
  </ThemeProvider>
);

const destroy = () => {
    root.render(
      <ThemeProvider>
        <ToastContainer ref={toastContainerRef} />
      </ThemeProvider>
    );
}

interface ToastOptions {
    duration?: number;
    isShowMask?: boolean;
    top?: string;
}

export default {
    info: (text: string, durationOrOptions?: number | ToastOptions, isShowMask?: boolean) => {
        if (toastContainerRef.current) {
            if (typeof durationOrOptions === 'object') {
                const { duration, isShowMask, top } = durationOrOptions;
                toastContainerRef.current.pushToast({ type: 'info', text, duration, isShowMask, top });
            } else {
                toastContainerRef.current.pushToast({ type: 'info', text, duration: durationOrOptions, isShowMask });
            }
        }
    },
    hide: destroy
};