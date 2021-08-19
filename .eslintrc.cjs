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
    'max-classes-per-file': 'off',
    'lines-between-class-members': [
      'error', 'always', { 'exceptAfterSingleLine': true },
    ],
    'import/extensions': ['error', {
      'js': 'always'
    }],
  },
  settings: {
    'import/resolver': {
      'node': {
        'extensions': [".js", ".jsx", ".ts", ".tsx"],
      }
    },
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.d.ts'],
    },
    'typescript': {
      'directory': '.',
    },
  }
};
 