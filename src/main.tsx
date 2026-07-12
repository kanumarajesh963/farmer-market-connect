import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Toaster, toast } from 'sonner';
import App from './App';
import ErrorBoundary from './components/layout/ErrorBoundary';
import { lightTheme, darkTheme } from './app/theme';
import { useUiStore } from './store/uiStore';
import { useAuthStore } from './store/authStore';
import { getSocket, disconnectSocket } from './lib/socket';
import type { User } from './types';
import './styles/global.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
});

// Keeps a single realtime connection alive app-wide and reacts when an admin
// changes this person's role from another tab/device — no page reload needed.
function RealtimeRoleSync() {
  const { token, isAuthenticated, applyServerRoleChange } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket();
      return;
    }
    const socket = getSocket(token);
    const onRoleChanged = (user: User) => {
      applyServerRoleChange(user);
      toast.info(`Your role was updated to "${user.role}" by an admin.`);
    };
    socket.on('role:changed', onRoleChanged);
    return () => {
      socket.off('role:changed', onRoleChanged);
    };
  }, [token, isAuthenticated, applyServerRoleChange]);

  return null;
}

function Root() {
  const mode = useUiStore((s) => s.mode);
  const theme = mode === 'light' ? lightTheme : darkTheme;
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <RealtimeRoleSync />
            <App />
          </BrowserRouter>
          <Toaster richColors position="top-right" theme={mode} />
        </QueryClientProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
