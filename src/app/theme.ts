import { createTheme, type ThemeOptions } from '@mui/material/styles';

// Design tokens — "mandi" (market) aesthetic: deep field green + marigold gold,
// avoiding the generic cream/terracotta AI-default look.
export const tokens = {
  green900: '#12241A',
  green700: '#1F3D2B',
  green600: '#2E5E3E',
  green500: '#3E7A52',
  gold500: '#E2A33D',
  gold400: '#EDB85E',
  clay600: '#C1442E',
  paper: '#F6F7F2',
  paperDark: '#0F1712',
  ink: '#182420',
};

const shared: ThemeOptions = {
  typography: {
    fontFamily: '"Inter", "Segoe UI", sans-serif',
    h1: { fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.01em' },
    h2: { fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.01em' },
    h3: { fontFamily: '"Fraunces", serif', fontWeight: 600 },
    h4: { fontFamily: '"Fraunces", serif', fontWeight: 600 },
    h5: { fontFamily: '"Fraunces", serif', fontWeight: 600 },
    h6: { fontFamily: '"Fraunces", serif', fontWeight: 600 },
    button: { fontWeight: 600, textTransform: 'none' as const, letterSpacing: '0.01em' },
  },
  shape: { borderRadius: 16 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 12, paddingInline: 20, paddingBlock: 10 },
      },
    },
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: 'none', borderRadius: 16 } },
    },
    MuiTextField: {
      defaultProps: { size: 'medium' },
    },
    MuiOutlinedInput: {
      styleOverrides: { root: { borderRadius: 16 } },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 16, transition: 'transform 180ms ease, box-shadow 180ms ease' },
      },
    },
    MuiDialog: {
      styleOverrides: { paper: { borderRadius: 16 } },
    },
    MuiMenu: {
      styleOverrides: { paper: { borderRadius: 16 } },
    },
    MuiAlert: {
      styleOverrides: { root: { borderRadius: 16 } },
    },
  },
};

export const lightTheme = createTheme({
  ...shared,
  palette: {
    mode: 'light',
    primary: { main: tokens.green600, dark: tokens.green700, light: tokens.green500, contrastText: '#fff' },
    secondary: { main: tokens.gold500, dark: '#C4871F', light: tokens.gold400, contrastText: tokens.ink },
    error: { main: tokens.clay600 },
    background: { default: tokens.paper, paper: '#FFFFFF' },
    text: { primary: tokens.ink, secondary: '#54615A' },
    divider: 'rgba(24,36,32,0.1)',
  },
});

export const darkTheme = createTheme({
  ...shared,
  palette: {
    mode: 'dark',
    // Same field-green identity as light mode, just lightened so it holds
    // contrast on a dark background — green stays primary in both modes.
    primary: { main: tokens.green500, dark: tokens.green600, light: '#5C9E73', contrastText: '#0B140E' },
    secondary: { main: tokens.gold400, dark: tokens.gold500, contrastText: tokens.ink },
    error: { main: '#E8624C' },
    background: { default: tokens.paperDark, paper: '#17221B' },
    text: { primary: '#EDF2ED', secondary: '#9FB0A6' },
    divider: 'rgba(237,242,237,0.1)',
  },
});
