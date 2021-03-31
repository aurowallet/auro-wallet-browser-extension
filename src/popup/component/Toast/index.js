import React from 'react';
import ReactDom from 'react-dom';
import ToastContainer from './ToastContainer';

const toastContainerDiv = document.createElement('div');
document.body.appendChild(toastContainerDiv);

const getToastContainerRef = () => {
    return ReactDom.render(<ToastContainer />, toastContainerDiv);
}

let toastContainer = getToastContainerRef();

const destroy = () => {
    ReactDom.unmountComponentAtNode(toastContainerDiv);
    toastContainer = getToastContainerRef();
}


export default {
    info: (text, duration, isShowMask) => (toastContainer.pushToast({ type: 'info', text, duration, isShowMask })),
    hide: destroy
};