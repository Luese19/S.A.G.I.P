import React, { ReactNode, useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from './index';
import { initializeAuth } from './slices/authSlice';
import { setOnlineStatus } from './slices/uiSlice';
import NetInfo from '@react-native-community/netinfo';
import { useAppDispatch } from './hooks';

interface ReduxProviderProps {
  children: ReactNode;
}

const StoreInitializer: React.FC = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Initialize authentication state
    dispatch(initializeAuth());

    // Set up network status monitoring
    const unsubscribe = NetInfo.addEventListener(state => {
      dispatch(setOnlineStatus(state.isConnected ?? false));
    });

    return () => {
      unsubscribe();
    };
  }, [dispatch]);

  return null;
};

export const ReduxProvider: React.FC<ReduxProviderProps> = ({ children }) => {
  return (
    <Provider store={store}>
      <StoreInitializer />
      {children}
    </Provider>
  );
};

export default ReduxProvider;