import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';

export default [
  // Global ignores
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.vite/**', '**/coverage/**'],
  },

  // Base config for all JS/TS files
  {
    files: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        Buffer: 'readonly',
        setImmediate: 'readonly',
        clearImmediate: 'readonly',
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-console': 'off',
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },

  // TypeScript files
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },

  // Backend and OAuth server files (Node.js environment)
  {
    files: ['backend/src/**/*.js', 'backend/src/**/*.ts', 'oauth-server/src/**/*.js', 'oauth-server/src/**/*.ts'],
    languageOptions: {
      globals: {
        NodeJS: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
      },
    },
  },

  // Integration tests (Playwright - browser + Node.js environment)
  {
    files: ['integration-tests/tests/**/*.js', 'integration-tests/tests/**/*.ts'],
    languageOptions: {
      globals: {
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        window: 'readonly',
        document: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
      },
    },
  },

  // Frontend files (all JS/TS in frontend and frontend-standalone)
  {
    files: [
      'frontend/src/**/*.js',
      'frontend/src/**/*.jsx',
      'frontend/src/**/*.ts',
      'frontend/src/**/*.tsx',
      'frontend-standalone/src/**/*.js',
      'frontend-standalone/src/**/*.jsx',
      'frontend-standalone/src/**/*.ts',
      'frontend-standalone/src/**/*.tsx',
    ],
    languageOptions: {
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        NodeJS: 'readonly',
        crypto: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        TextEncoder: 'readonly',
        btoa: 'readonly',
      },
    },
  },

  // React JSX/TSX files (frontend and frontend-standalone)
  {
    files: [
      'frontend/src/**/*.jsx',
      'frontend/src/**/*.tsx',
      'frontend-standalone/src/**/*.jsx',
      'frontend-standalone/src/**/*.tsx',
    ],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        crypto: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        TextEncoder: 'readonly',
        btoa: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'jsx-a11y': jsxA11yPlugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      ...jsxA11yPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off', // Not needed with React 17+
      'react/prop-types': 'off', // Using TypeScript for prop validation
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/purity': 'off', // Too strict for practical use
    },
  },
];
