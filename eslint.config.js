import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['dist/', 'node_modules/', 'playwright-report/', 'test-results/', 'coverage/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  // World generation and simulation must be deterministic: no Math.random, no Date.now.
  {
    files: ['src/core/**/*.ts', 'src/world/**/*.ts', 'src/sim/**/*.ts'],
    rules: {
      'no-restricted-properties': [
        'error',
        {
          object: 'Math',
          property: 'random',
          message: 'Use core/prng (seeded) instead of Math.random.',
        },
        {
          object: 'Date',
          property: 'now',
          message: 'Simulation time comes from the tick counter, not the clock.',
        },
      ],
    },
  },
  // Module boundaries (see AGENTS.md): core imports nothing; world/sim never import render/ui.
  {
    files: ['src/core/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: ['@/world/*', '@/sim/*', '@/render/*', '@/ui/*', '@/io/*', '@/audio/*', '../*'],
        },
      ],
    },
  },
  {
    files: ['src/world/**/*.ts', 'src/sim/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: ['@/render/*', '@/ui/*', '@/audio/*', 'three', 'three/*'] },
      ],
    },
  },
);
