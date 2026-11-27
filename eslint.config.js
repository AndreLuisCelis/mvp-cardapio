import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';
import tseslint from 'typescript-eslint';

const rulesRecommended = firebaseRulesPlugin.configs['flat/recommended'];
const scopedRulesConfig = Array.isArray(rulesRecommended)
  ? rulesRecommended.map((cfg) => ({ ...cfg, files: ['**/*.rules'] }))
  : [{ ...rulesRecommended, files: ['**/*.rules'] }];

export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'public/**'],
  },
  ...tseslint.configs.recommended.map((cfg) => ({
    ...cfg,
    files: ['src/**/*.{ts,tsx}', 'server/**/*.ts', 'api/**/*.ts', 'tests/**/*.ts', 'scripts/**/*.mjs', '*.ts'],
  })),
  {
    files: ['src/**/*.{ts,tsx}', 'server/**/*.ts', 'api/**/*.ts', 'tests/**/*.ts', 'scripts/**/*.mjs', '*.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  ...scopedRulesConfig,
];
