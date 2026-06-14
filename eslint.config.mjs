import antfu from '@antfu/eslint-config';

export default antfu(
  {
    typescript: true,
    react: true,
    stylistic: {
      semi: true,
    },
    yaml: false,
    jsonc: false,
  },
  {
    files: ['packages/userscripts/src/dummy.js'],
    rules: {
      'unicorn/no-empty-file': 'off',
    },
  },
  {
    files: ['packages/web/src/**/*.{ts,tsx}'],
    rules: {
      'no-alert': 'off',
    },
  },
);
