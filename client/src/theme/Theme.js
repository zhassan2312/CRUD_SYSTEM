import { createTheme } from '@mui/material/styles';

// User-friendly color palette with psychological appeal and accessibility
const lightPalette = {
  mode: 'light',
  primary: {
    main: '#4f46e5', // Calming indigo
    light: '#6366f1',
    dark: '#3730a3',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#06b6d4', // Refreshing cyan
    light: '#22d3ee',
    dark: '#0891b2',
    contrastText: '#ffffff',
  },
  success: {
    main: '#059669', // Natural green
    light: '#10b981',
    dark: '#047857',
    lighter: '#ecfdf5',
  },
  warning: {
    main: '#d97706', // Warm amber
    light: '#f59e0b',
    dark: '#b45309',
    lighter: '#fffbeb',
  },
  error: {
    main: '#dc2626', // Balanced red
    light: '#ef4444',
    dark: '#b91c1c',
    lighter: '#fef2f2',
  },
  info: {
    main: '#0284c7', // Professional blue
    light: '#0ea5e9',
    dark: '#0369a1',
    lighter: '#f0f9ff',
  },
  background: {
    default: '#fafbfc', // Softer white
    paper: '#ffffff',
    sidebar: '#f8fafc', // Light sidebar instead of dark
    hover: '#f1f5f9',
  },
  text: {
    primary: '#1f2937', // Softer dark text
    secondary: '#6b7280',
    disabled: '#9ca3af',
  },
  divider: '#e5e7eb',
  grey: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
};

const darkPalette = {
  mode: 'dark',
  primary: {
    main: '#6366f1', // Softer indigo for dark mode
    light: '#818cf8',
    dark: '#4f46e5',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#22d3ee', // Bright cyan for contrast
    light: '#67e8f9',
    dark: '#06b6d4',
    contrastText: '#000000',
  },
  success: {
    main: '#10b981', // Vibrant green
    light: '#34d399',
    dark: '#059669',
    lighter: '#064e3b',
  },
  warning: {
    main: '#f59e0b', // Warm yellow
    light: '#fbbf24',
    dark: '#d97706',
    lighter: '#451a03',
  },
  error: {
    main: '#f87171', // Soft red
    light: '#fca5a5',
    dark: '#ef4444',
    lighter: '#7f1d1d',
  },
  info: {
    main: '#38bdf8', // Sky blue
    light: '#7dd3fc',
    dark: '#0284c7',
    lighter: '#164e63',
  },
  background: {
    default: '#1a1b23', // Warmer dark background
    paper: '#232530', // Softer paper background
    sidebar: '#1f2028', // Subtle sidebar
    hover: '#2d2f3a',
  },
  text: {
    primary: '#f1f5f9', // Softer white text
    secondary: '#cbd5e1',
    disabled: '#64748b',
  },
  divider: '#374151',
  grey: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
};

const createModernTheme = (mode = 'light') => {
  const palette = mode === 'light' ? lightPalette : darkPalette;
  
  return createTheme({
    palette,
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontSize: '2.5rem',
        fontWeight: 700,
        lineHeight: 1.2,
        letterSpacing: '-0.02em',
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 600,
        lineHeight: 1.3,
        letterSpacing: '-0.01em',
      },
      h3: {
        fontSize: '1.5rem',
        fontWeight: 600,
        lineHeight: 1.4,
      },
      h4: {
        fontSize: '1.25rem',
        fontWeight: 600,
        lineHeight: 1.4,
      },
      h5: {
        fontSize: '1.125rem',
        fontWeight: 600,
        lineHeight: 1.4,
      },
      h6: {
        fontSize: '1rem',
        fontWeight: 600,
        lineHeight: 1.4,
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.6,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.5,
      },
      button: {
        textTransform: 'none',
        fontWeight: 500,
        fontSize: '0.875rem',
      },
      caption: {
        fontSize: '0.75rem',
        lineHeight: 1.4,
      },
    },
    shape: {
      borderRadius: 12,
    },
    spacing: 8,
    shadows: [
      'none',
      '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06)',
      '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)',
      '0px 10px 15px -3px rgba(0, 0, 0, 0.1), 0px 4px 6px -2px rgba(0, 0, 0, 0.05)',
      '0px 20px 25px -5px rgba(0, 0, 0, 0.1), 0px 10px 10px -5px rgba(0, 0, 0, 0.04)',
      '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
      ...Array(19).fill('0px 25px 50px -12px rgba(0, 0, 0, 0.25)'),
    ],
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarWidth: 'thin',
            scrollbarColor: `${palette.grey[400]} ${palette.background.paper}`,
            '&::-webkit-scrollbar': {
              width: 8,
            },
            '&::-webkit-scrollbar-track': {
              background: palette.background.paper,
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: palette.grey[400],
              borderRadius: 4,
              '&:hover': {
                backgroundColor: palette.grey[500],
              },
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
            borderRadius: 8,
            padding: '10px 20px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-1px)',
            },
          },
          contained: {
            background: mode === 'light' 
              ? `linear-gradient(135deg, ${palette.primary.main} 0%, ${palette.primary.dark} 100%)`
              : palette.primary.main,
            boxShadow: '0px 3px 6px rgba(0, 0, 0, 0.16)',
            '&:hover': {
              background: mode === 'light'
                ? `linear-gradient(135deg, ${palette.primary.dark} 0%, ${palette.primary.main} 100%)`
                : palette.primary.dark,
              boxShadow: '0px 6px 16px rgba(0, 0, 0, 0.24)',
            },
          },
          outlined: {
            borderWidth: '1.5px',
            '&:hover': {
              borderWidth: '1.5px',
              backgroundColor: palette.primary.main + '08',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            border: `1px solid ${palette.divider}`,
            boxShadow: mode === 'light' 
              ? '0px 1px 3px rgba(0, 0, 0, 0.08), 0px 1px 2px rgba(0, 0, 0, 0.04)' 
              : '0px 4px 6px rgba(0, 0, 0, 0.3)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: mode === 'light'
                ? '0px 8px 25px rgba(0, 0, 0, 0.12), 0px 4px 8px rgba(0, 0, 0, 0.06)'
                : '0px 12px 32px rgba(0, 0, 0, 0.4)',
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: palette.primary.main,
                },
              },
              '&.Mui-focused': {
                '& .MuiOutlinedInput-notchedOutline': {
                  borderWidth: 2,
                },
              },
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            fontWeight: 500,
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            border: 'none',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 16,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: palette.background.paper,
            color: palette.text.primary,
            boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: palette.background.sidebar,
            borderRight: `1px solid ${palette.divider}`,
            boxShadow: mode === 'light' ? '2px 0 8px rgba(0, 0, 0, 0.08)' : 'none',
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            margin: '2px 8px',
            transition: 'all 0.2s ease-in-out',
            color: mode === 'light' ? palette.text.primary : palette.text.secondary,
            '&:hover': {
              backgroundColor: palette.background.hover,
              transform: 'translateX(4px)',
            },
            '&.Mui-selected': {
              backgroundColor: palette.primary.main,
              color: palette.primary.contrastText,
              '&:hover': {
                backgroundColor: palette.primary.dark,
              },
              '& .MuiListItemIcon-root': {
                color: palette.primary.contrastText,
              },
            },
            '& .MuiListItemIcon-root': {
              color: mode === 'light' ? palette.text.secondary : palette.text.disabled,
            },
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
            minHeight: 48,
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: {
            height: 3,
            borderRadius: '3px 3px 0 0',
          },
        },
      },
    },
  });
};

export default createModernTheme;
