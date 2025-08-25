module.exports = {
  extends: ['../.eslintrc.js'],
  env: {
    browser: true,
    es2022: true,
  },
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  overrides: [
    {
      files: ['**/*.tsx', '**/*.jsx'],
      plugins: ['react', 'react-hooks', 'jsx-a11y'],
      extends: [
        '../.eslintrc.js',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
        'plugin:jsx-a11y/recommended',
      ],
      rules: {
        // React-specific rules
        'react/react-in-jsx-scope': 'off', // Not needed with React 17+
        'react/prop-types': 'off', // Using TypeScript for prop validation
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
        'no-console': 'off',
      },
    },
  ],
};
