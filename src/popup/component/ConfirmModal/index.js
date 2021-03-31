import React from 'react';
import ReactDom from 'react-dom';
import ConfirmModalContainer from './ConfirmModalContainer';

const confirmModalContainerDiv = document.createElement('div');
document.body.appendChild(confirmModalContainerDiv);

const getConfirmContainerRef = () => {
    return ReactDom.render(<ConfirmModalContainer />, confirmModalContainerDiv);
}

let confirmModalContainer = getConfirmContainerRef();

const show = (params) => {
    confirmModalContainer.show(params)

}

const destroy = () => {
    confirmModalContainer.hide();
}

export default {
    show: show,
    hide: destroy,
};