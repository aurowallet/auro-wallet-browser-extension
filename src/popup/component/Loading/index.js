import React, { createRef } from 'react';
import { createRoot } from 'react-dom/client';
import LoadingContainer from './LoadingContainer';

const loadingContainerDiv = document.createElement('div');
document.body.appendChild(loadingContainerDiv);

const loadingContainerRef = createRef();
const root = createRoot(loadingContainerDiv);
root.render(<LoadingContainer ref={loadingContainerRef} />);

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