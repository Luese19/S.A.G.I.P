import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UIState {
  isLoading: boolean;
  loadingMessage: string | null;
  showMatchResults: boolean;
  showPostMatchModal: boolean;
  isOnline: boolean;
  showErrorModal: boolean;
  errorMessage: string | null;
  theme: 'light' | 'dark' | 'auto';
  hapticEnabled: boolean;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
}

const initialState: UIState = {
  isLoading: false,
  loadingMessage: null,
  showMatchResults: false,
  showPostMatchModal: false,
  isOnline: true,
  showErrorModal: false,
  errorMessage: null,
  theme: 'auto',
  hapticEnabled: true,
  soundEnabled: true,
  notificationsEnabled: true,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<{ isLoading: boolean; message?: string }>) => {
      state.isLoading = action.payload.isLoading;
      state.loadingMessage = action.payload.message || null;
    },
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    showMatchResultsModal: (state) => {
      state.showMatchResults = true;
    },
    hideMatchResultsModal: (state) => {
      state.showMatchResults = false;
    },
    showPostMatchModal: (state) => {
      state.showPostMatchModal = true;
    },
    hidePostMatchModal: (state) => {
      state.showPostMatchModal = false;
    },
    showErrorModal: (state, action: PayloadAction<string>) => {
      state.showErrorModal = true;
      state.errorMessage = action.payload;
    },
    hideErrorModal: (state) => {
      state.showErrorModal = false;
      state.errorMessage = null;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'auto'>) => {
      state.theme = action.payload;
    },
    setHapticEnabled: (state, action: PayloadAction<boolean>) => {
      state.hapticEnabled = action.payload;
    },
    setSoundEnabled: (state, action: PayloadAction<boolean>) => {
      state.soundEnabled = action.payload;
    },
    setNotificationsEnabled: (state, action: PayloadAction<boolean>) => {
      state.notificationsEnabled = action.payload;
    },
    resetUIState: (state) => {
      state.isLoading = false;
      state.loadingMessage = null;
      state.showMatchResults = false;
      state.showPostMatchModal = false;
      state.showErrorModal = false;
      state.errorMessage = null;
    },
  },
});

export const {
  setLoading,
  setOnlineStatus,
  showMatchResultsModal,
  hideMatchResultsModal,
  showPostMatchModal,
  hidePostMatchModal,
  showErrorModal,
  hideErrorModal,
  setTheme,
  setHapticEnabled,
  setSoundEnabled,
  setNotificationsEnabled,
  resetUIState,
} = uiSlice.actions;

export default uiSlice.reducer;