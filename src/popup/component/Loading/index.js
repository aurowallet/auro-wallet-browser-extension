import React, { createRef } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@/popup/style/ThemeProvider';
import LoadingContainer from './LoadingContainer';

const loadingContainerDiv = document.createElement('div');
document.body.appendChild(loadingContainerDiv);

const loadingContainerRef = createRef();
const root = createRoot(loadingContainerDiv);
root.render(
  <ThemeProvider>
    <LoadingContainer ref={loadingContainerRef} />
  </ThemeProvider>
);

const show = () => {
    if (loadingContainerRef.current) {
        loadingContainerRef.current.show();
    }
}

const destroy = () => {
    if (loadingContainerRef.current) {
        loadingContainerRef.current.hide();
    }
}

export default {
    show: show,
    hide: destroy,
};