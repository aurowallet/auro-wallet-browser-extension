import { configureStore, getDefaultMiddleware } from "@reduxjs/toolkit";
import rootReducer from '../reducers';

const store = configureStore({
      reducer: rootReducer,
      middleware: [...getDefaultMiddleware(),
      ],
    });
export default store;
