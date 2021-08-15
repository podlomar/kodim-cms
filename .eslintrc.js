module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: ['airbnb-base', 'prettier'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: ['import', '@typescript-eslint', 'prettier'],
  rules: {
    'import/prefer-default-export': 'off',
  },
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.d.ts'],
    },
    'typescript': {
      'directory': '.',
    },
  }
};
 