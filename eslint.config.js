const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
module.exports = defineConfig([
  expoConfig,
  { ignores: ['dist/**', 'dist-android/**', 'artifacts/**'] },
  {
    files: ['src/domain/**/*.ts', 'src/application/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          group: ['react', 'react-*', 'expo', 'expo-*', 'pdf-lib', 'qrcode', '@/infrastructure/**', '@/presentation/**', '@/composition/**', '**/infrastructure/**', '**/presentation/**', '**/composition/**'],
          message: 'The domain and application layers depend only on business types and ports.',
        }],
      }],
    },
  },
]);
