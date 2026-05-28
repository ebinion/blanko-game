// @ts-check

import js from '@eslint/js'
import { defineConfig } from 'eslint/config'
import tseslint from 'typescript-eslint'

import eslint from '@eslint/js'
import prettierConfig from 'eslint-config-prettier'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'

export default defineConfig(
  {
    ignores: ['build/**/*', '.vscode/**/*', '.react-router/**/*'],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  eslint.configs.recommended,
  tseslint.configs.recommended,
  tseslint.configs.stylistic,
  jsxA11y.flatConfigs.recommended,
  reactPlugin.configs.flat.recommended,
  reactPlugin.configs.flat['jsx-runtime'],
  reactHooksPlugin.configs.flat.recommended,
  prettierConfig,
  {
    rules: {
      '@typescript-eslint/consistent-type-definitions': ['warn', 'type'],
      '@typescript-eslint/no-explicit-any': 'warn',
      'jsx-a11y/no-autofocus': 'warn',
      'no-console': 'warn',
      'no-extra-semi': 2,
      'no-warning-comments': 'warn',
      'react-hooks/exhaustive-deps': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react/react-in-jsx-scope': 0,
      semi: 'off',
    },
  }
)
