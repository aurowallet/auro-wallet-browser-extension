import React, { createRef } from 'react';
import { createRoot } from 'react-dom/client';
import ToastContainer from './ToastContainer';

const toastContainerDiv = document.createElement('div');
document.body.appendChild(toastContainerDiv);

const toastContainerRef = createRef();
const root = createRoot(toastContainerDiv);
root.render(<ToastContainer ref={toastContainerRef} />);

const destroy = () => {
    root.render(<ToastContainer ref={toastContainerRef} />);
}

export default {
    info: (text, duration, isShowMask) => {
        if (toastContainerRef.current) {
            toastContainerRef.current.pushToast({ type: 'info', text, duration, isShowMask });
        }
    },
    hide: destroy
};