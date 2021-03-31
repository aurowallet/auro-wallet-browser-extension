import React from 'react';
import ReactDom from 'react-dom';
import LoadingContainer from './LoadingContainer';

const loadingContainerDiv = document.createElement('div');
document.body.appendChild(loadingContainerDiv);

const getLoadingContainerRef = () => {
    return ReactDom.render(<LoadingContainer />, loadingContainerDiv);
}

let loadingContainer = getLoadingContainerRef();

const show = () => {
    loadingContainer.show()
}

const destroy = () => {
    loadingContainer.hide();
}

export default {
    show: show,
    hide: destroy,
};