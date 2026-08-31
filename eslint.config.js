// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierRecommended = require('eslint-plugin-prettier/recommended');

module.exports = defineConfig([
  expoConfig,
  prettierRecommended,
  {
    // Jest: cho phép require() trong jest.mock factory (bắt buộc do mock hoisting)
    files: ['__tests__/**', 'jest.setup.js'],
    languageOptions: {
      globals: { jest: 'readonly' },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    ignores: ['dist/*', '.expo/*', 'web-build/*'],
  },
]);
