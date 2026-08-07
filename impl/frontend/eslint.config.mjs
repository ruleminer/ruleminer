import eslintPluginUnusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: globals.browser },
    plugins: {
      'unused-imports': eslintPluginUnusedImports,
    },
    rules: {
      'no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
    },
  },
];
