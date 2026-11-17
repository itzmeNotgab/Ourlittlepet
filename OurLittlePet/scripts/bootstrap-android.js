/* Creates the native android/ project (React Native 0.76.5 template) if missing, then patches it:
 *  - Firebase google-services plugin (only if google-services.json is provided)
 *  - POST_NOTIFICATIONS permission
 *  - new architecture off (widest library compatibility)
 * Also prints the debug SHA-1 so you can paste it into Firebase (no PC needed).
 */
const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const root = process.cwd();
const androidDir = path.join(root, 'android');
const run = (cmd, opts = {}) => execSync(cmd, { stdio: 'inherit', ...opts });

if (!fs.existsSync(androidDir)) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rn-'));
  const dir = path.join(tmp, 'OurLittlePet');
  run(`npx --yes @react-native-community/cli@15.0.1 init OurLittlePet --version 0.76.5 --skip-install --skip-git-init --directory "${dir}"`);
  fs.cpSync(path.join(dir, 'android'), androidDir, { recursive: true });
  console.log('Created android/ from template');
}

// google-services.json from secrets (raw JSON or base64)
const gsPath = path.join(androidDir, 'app', 'google-services.json');
const b64 = process.env.GOOGLE_SERVICES_JSON_B64;
const raw = process.env.GOOGLE_SERVICES_JSON;
if (b64 && b64.trim()) fs.writeFileSync(gsPath, Buffer.from(b64.trim(), 'base64'));
else if (raw && raw.trim()) fs.writeFileSync(gsPath, raw);
const hasGs = fs.existsSync(gsPath);

if (hasGs) {
  try {
    const gs = JSON.parse(fs.readFileSync(gsPath, 'utf8'));
    const web = (gs.client || []).flatMap(c => c.oauth_client || []).find(o => o.client_type === 3);
    if (web) {
      fs.writeFileSync(path.join(root, 'src/config/generated.ts'),
        `export const GENERATED_WEB_CLIENT_ID = '${web.client_id}';\n`);
      console.log('Web client ID extracted from google-services.json');
    } else {
      console.warn('No web client (client_type 3) in google-services.json. Enable Google sign-in in Firebase, add your SHA-1, then re-download the file.');
    }
  } catch (e) { console.warn('Could not parse google-services.json:', e.message); }
} else {
  console.warn('No google-services.json provided: building WITHOUT Firebase. The app will not work until you add the secret.');
}

const edit = (file, fn) => { const p = path.join(androidDir, file); const s = fs.readFileSync(p, 'utf8'); const o = fn(s); if (o !== s) fs.writeFileSync(p, o); };

if (hasGs) {
  edit('build.gradle', s => s.includes('google-services') ? s :
    s.replace(/(classpath\("com\.facebook\.react:react-native-gradle-plugin"\))/, '$1\n        classpath("com.google.gms:google-services:4.4.2")'));
  edit('app/build.gradle', s => s.includes('google-services') ? s : s + '\napply plugin: "com.google.gms.google-services"\n');
}
edit('app/src/main/AndroidManifest.xml', s => s.includes('POST_NOTIFICATIONS') ? s :
  s.replace(/(<uses-permission android:name="android\.permission\.INTERNET"\s*\/>)/, '$1\n    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />'));
edit('gradle.properties', s => s.replace(/newArchEnabled=true/, 'newArchEnabled=false'));

try {
  console.log('\n===== DEBUG SHA-1 (add to Firebase > Project settings > your Android app) =====');
  run(`keytool -list -v -keystore "${path.join(androidDir, 'app', 'debug.keystore')}" -alias androiddebugkey -storepass android -keypass android | grep -E "SHA1|SHA256"`);
  console.log('===============================================================================\n');
} catch (e) { console.warn('Could not print SHA-1'); }
