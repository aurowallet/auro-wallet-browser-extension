import { configureStore } from "@reduxjs/toolkit";
import rootReducer from '../reducers';

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefault) => getDefault({
    serializableCheck: false,
  }),
});

export default store;