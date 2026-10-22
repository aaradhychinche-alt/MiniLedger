import tsPlugin from 'typescript-eslint';

export default tsPlugin.config(
  {
    ignores: ['dist/', 'node_modules/', 'coverage/'],
  },
  ...tsPlugin.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-namespace': 'off',
      'no-console': 'off',
    },
  }
);
