import { createTheme, alpha } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2196f3',
      light: '#64b5f6',
      dark: '#1976d2',
      contrastText: '#fff'
    },
    secondary: {
      main: '#9c27b0',
      light: '#ba68c8',
      dark: '#7b1fa2',
      contrastText: '#fff'
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff',
      gradient: 'linear-gradient(45deg, #2196f3 30%, #21cbf3 90%)'
    },
    chat: {
      sent: '#e3f2fd',
      received: '#ffffff',
      system: alpha('#9e9e9e', 0.1)
    }
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif'
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.43
    }
  },
  shape: {
    borderRadius: 12
  },
  shadows: [
    'none',
    '0px 2px 4px rgba(0,0,0,0.05)',
    '0px 4px 8px rgba(0,0,0,0.08)',
    '0px 8px 16px rgba(0,0,0,0.12)',
    '0px 12px 24px rgba(0,0,0,0.16)',
    ...Array(20).fill('none')
  ],
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(45deg, #2196f3 30%, #21cbf3 90%)',
          boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)'
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          padding: '8px 16px',
          fontWeight: 500
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none'
        },
        elevation1: {
          boxShadow: '0px 2px 4px rgba(0,0,0,0.05)'
        },
        elevation2: {
          boxShadow: '0px 4px 8px rgba(0,0,0,0.08)'
        },
        elevation3: {
          boxShadow: '0px 8px 16px rgba(0,0,0,0.12)'
        }
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: 'none',
          boxShadow: '0px 8px 16px rgba(0,0,0,0.12)'
        }
      }
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          marginBottom: 4,
          '&.Mui-selected': {
            backgroundColor: alpha('#2196f3', 0.08),
            '&:hover': {
              backgroundColor: alpha('#2196f3', 0.12)
            }
          }
        }
      }
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          minWidth: 40
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '& fieldset': {
              borderColor: 'rgba(0, 0, 0, 0.12)'
            },
            '&:hover fieldset': {
              borderColor: 'rgba(0, 0, 0, 0.24)'
            },
            '&.Mui-focused fieldset': {
              borderColor: '#2196f3'
            }
          }
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          height: 24,
          fontSize: '0.75rem'
        },
        label: {
          paddingLeft: 8,
          paddingRight: 8
        }
      }
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          fontSize: '1rem',
          width: 32,
          height: 32
        }
      }
    },
    MuiSnackbar: {
      styleOverrides: {
        root: {
          '& .MuiAlert-root': {
            borderRadius: 8
          }
        }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          boxShadow: '0px 12px 24px rgba(0,0,0,0.16)'
        }
      }
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: '1.25rem',
          fontWeight: 600
        }
      }
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          '& .MuiTab-root': {
            textTransform: 'none',
            fontWeight: 500,
            minWidth: 100
          }
        },
        indicator: {
          height: 3,
          borderRadius: '3px 3px 0 0'
        }
      }
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          fontSize: '0.75rem',
          borderRadius: 4,
          padding: '4px 8px'
        }
      }
    },
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }
  }
});

export default theme;
