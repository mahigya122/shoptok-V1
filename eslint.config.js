// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      'dist/*',
      // Supabase Edge Functions are Deno-based and import via https:// URLs.
      // Those are valid in Deno but will fail Node-based ESLint resolvers.
      'supabase/functions/**',
    ],
  },
]);
