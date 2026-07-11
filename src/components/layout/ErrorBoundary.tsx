import { Component, type ReactNode } from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Unhandled UI error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', p: 3 }}>
          <Stack spacing={2} alignItems="center" textAlign="center">
            <Typography variant="h5">Something went wrong</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360 }}>
              This screen hit an unexpected error. Reloading usually fixes it — your data is safe.
            </Typography>
            <Button variant="contained" onClick={() => window.location.reload()}>
              Reload page
            </Button>
          </Stack>
        </Box>
      );
    }
    return this.props.children;
  }
}
