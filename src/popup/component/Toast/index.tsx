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

export default {
    info: (text: string, duration?: number, isShowMask?: boolean) => {
        if (toastContainerRef.current) {
            toastContainerRef.current.pushToast({ type: 'info', text, duration, isShowMask });
        }
    },
    hide: destroy
};