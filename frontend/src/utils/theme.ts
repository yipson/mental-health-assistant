import { extendTheme, ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

const colors = {
  brand: {
    50: '#e6f7ff',
    100: '#b3e0ff',
    200: '#80caff',
    300: '#4db3ff',
    400: '#1a9dff',
    500: '#0086e6',
    600: '#0069b3',
    700: '#004d80',
    800: '#00304d',
    900: '#00141f',
  },
  accent: {
    50: '#f0e6ff',
    100: '#d1b3ff',
    200: '#b280ff',
    300: '#944dff',
    400: '#751aff',
    500: '#6600e6',
    600: '#5000b3',
    700: '#3a0080',
    800: '#23004d',
    900: '#0d001f',
  },
};

const fonts = {
  heading: '"Inter", sans-serif',
  body: '"Inter", sans-serif',
};

const theme = extendTheme({
  config,
  colors,
  fonts,
  components: {
    Button: {
      baseStyle: {
        fontWeight: 'semibold',
        borderRadius: 'md',
      },
      variants: {
        primary: {
          bg: 'brand.500',
          color: 'white',
          _hover: {
            bg: 'brand.600',
          },
        },
        secondary: {
          bg: 'accent.500',
          color: 'white',
          _hover: {
            bg: 'accent.600',
          },
        },
        outline: {
          border: '2px solid',
          borderColor: 'brand.500',
          color: 'brand.500',
        },
      },
      defaultProps: {
        variant: 'primary',
      },
    },
    Card: {
      baseStyle: {
        container: {
          borderRadius: 'lg',
          boxShadow: 'md',
          p: 4,
        },
      },
    },
  },
});

export default theme;
