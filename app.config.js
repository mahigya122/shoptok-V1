/* Expose .env variables to Expo via `extra`. */
const { config } = require("dotenv");
const fs = require("fs");

// Load .env if present
try {
  if (fs.existsSync(".env")) {
    config();
  }
} catch (e) {
  // ignore
}

module.exports = ({ config: expoConfig }) => {
  return {
    ...expoConfig,
    extra: {
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      RECOMMENDATION_FUNCTION_URL: process.env.RECOMMENDATION_FUNCTION_URL,
      EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    },
  };
};
