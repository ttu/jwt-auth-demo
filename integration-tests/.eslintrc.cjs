module.exports = {
  extends: ['../.eslintrc.js'],
  env: {
    node: true,
    es2022: true,
  },
  globals: {
    test: 'readonly',
    expect: 'readonly',
  },
  rules: {
    // Test-specific rules
    'no-console': 'off', // Allow console.log in tests
  },
  overrides: [
    {
      files: ['**/*.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off', // Allow any in tests for mocking
      },
    },
  ],
};
