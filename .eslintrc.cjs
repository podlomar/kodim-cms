module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'airbnb-base',
    'plugin:@typescript-eslint/recommended',
    'prettier',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: ['import', '@typescript-eslint', 'prettier'],
  rules: {
    'import/prefer-default-export': 'off',
    'max-classes-per-file': 'off',
    'lines-between-class-members': [
      'error', 'always', { 'exceptAfterSingleLine': true },
    ],
    'import/extensions': ['error', {
      'js': 'always'
    }],
    'no-use-before-define': 'off',
    '@typescript-eslint/no-use-before-define': ['error'],
    'no-unused-vars': "off",
    '@typescript-eslint/no-unused-vars': ['error'],
  },
  settings: {
    'import/resolver': {
      'typescript': {},
    },
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.d.ts'],
    },
    'typescript': {
      'directory': '.',
    },
  }
};
 