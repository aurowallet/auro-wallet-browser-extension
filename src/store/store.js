import { configureStore, getDefaultMiddleware } from "@reduxjs/toolkit";
import { applyMiddleware, createStore } from "redux";
import thunk from 'redux-thunk';
import rootReducer from '../reducers';


const store = configureStore({
      reducer: rootReducer,
      middleware: [...getDefaultMiddleware(),
      ],
    });
export default store;
