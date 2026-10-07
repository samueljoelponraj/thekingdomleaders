/**
 * Netlify Build Script for The Kingdom Leaders (TKL)
 * Injects Netlify Environment Variables into env-config.js for client-side Supabase runtime.
 */
const fs = require('fs');

const envUrl = process.env.SUPABASE_URL || '';
const envKey = process.env.SUPABASE_ANON_KEY || '';
const envUserId = process.env.MASTER_USER_ID || '';
const envPasscode = process.env.MASTER_PASSCODE || '';

const content = `// Generated automatically during Netlify build.
window.TKL_ENV = {
  SUPABASE_URL: "${envUrl.trim()}",
  SUPABASE_ANON_KEY: "${envKey.trim()}",
  MASTER_USER_ID: "${envUserId.trim()}",
  MASTER_PASSCODE: "${envPasscode.trim()}"
};
`;

try {
  fs.writeFileSync('env-config.js', content, 'utf8');
  console.log('[Netlify Build] Successfully generated env-config.js with Netlify environment variables.');
  console.log(`[Netlify Build] Supabase URL detected: ${envUrl ? 'YES (' + envUrl.substring(0, 16) + '...)' : 'NO (empty)'}`);
  console.log(`[Netlify Build] Supabase Anon Key detected: ${envKey ? 'YES' : 'NO (empty)'}`);
} catch (err) {
  console.error('[Netlify Build] Error writing env-config.js:', err);
}
