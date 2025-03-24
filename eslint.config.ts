import parser from '@typescript-eslint/parser'
import compat from 'eslint-plugin-compat'

export default [
  {
    ignores: ['dist/**', 'webroot/**/*.js'],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser,
      parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module',
      },
    },
    plugins: {
      compat,
    },
    rules: {
      'compat/compat': 'error',
    },
  },
]
