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
    files: ['web/_static/static/**/*.js'],
    rules: {
      'no-alert': 'off',
      'no-console': 'off',
    },
  },
);
