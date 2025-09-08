import { createTheme, ThemeOptions } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface PaletteOptions {
    // extend if needed
  }
}

const common: ThemeOptions = {
  typography: {
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Noto Sans, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol',
  },
  components: {
    MuiLink: { defaultProps: { underline: 'hover' } },
  },
};

export function getMuiTheme(mode: 'light' | 'dark') {
  return createTheme({
    palette: {
      mode,
      ...(mode === 'light'
        ? {
            background: { default: '#fafafa' },
          }
        : {
            background: { default: '#0e0e0f' },
          }),
    },
    ...common,
  });
}

