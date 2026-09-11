export const T = {
  terra: '#C4704F',
  terraLight: '#E8956D',
  terraDark: '#A05535',
  sage: '#7A9E7E',
  sageDark: '#5A7E5E',
  sageLight: '#A8C8AC',
  bg: '#FAF9F6',
  bg2: '#F2EFE9',
  dark: '#1C1C1E',
  mid: '#6E6E73',
  light: '#AEAEB2',
  border: '#E5E0D8',
  white: '#FFFFFF',
  purple: '#9B7EC8',
  gold: '#F5A623',
  red: '#E05C5C',

  phases: {
    menstrual:  { color: '#E05C5C', bg: '#FDF0F0', label: 'Menstrual',  emoji: '🩸', days: 'D1–D5'  },
    follicular: { color: '#7A9E7E', bg: '#F0F5F1', label: 'Follicular', emoji: '🌱', days: 'D6–D13' },
    ovulation:  { color: '#F5A623', bg: '#FDF6ED', label: 'Ovulation',  emoji: '✨', days: 'D14–D16' },
    luteal:     { color: '#9B7EC8', bg: '#F5F0FB', label: 'Luteal',     emoji: '🌙', days: 'D17–D28' },
  },

  fonts: {
    serif: 'Fraunces',
    sans: 'DMSans',
  },

  radius: {
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },

  shadow: {
    sm: {
      shadowColor: '#1C1C1E',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    md: {
      shadowColor: '#1C1C1E',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.10,
      shadowRadius: 16,
      elevation: 4,
    },
  },
};
