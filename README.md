# 🐱 OUR LITTLE PET

A private, two-person shared virtual cat for Android. Native React Native + TypeScript (no WebView, no Expo Go), Firebase backend.

Two people sign in with Google, pair with a 6-digit code, then share one cat: feed it, pet it, play, put it to bed, dress it, decorate its room, chat, play mini-games and collect memories. Cooperative only: no streaks, no punishment.

> **Read `STATUS.md` first.** It lists exactly what was written, what has been verified, and what has NOT been tested on a device yet.

## What's inside
```
src/            React Native app (screens, components, services, context, games, config)
functions/      Firebase Cloud Functions (pairing, pet, room, game rewards, push)
firestore.rules / storage.rules / database.rules.json
scripts/        bootstrap-android.js (creates + patches android/), gen-catalog.js
.github/workflows/android.yml          builds the debug APK
.github/workflows/deploy-firebase.yml  deploys rules + functions (manual)
```
Edit your personal text in **`src/config/content.ts`** (reminders and the secret love letter). Unlock threshold is in `src/config/app.ts`.

## Upload to GitHub (phone friendly)
1. Unzip on your phone and upload the folder contents to a new repo (GitHub web: *Add file → Upload files*).
2. Hidden folders (`.github`) may not upload from a phone. If `.github/workflows/` is missing in the repo, open the repo → *Add file → Create new file*, type the path `.github/workflows/android.yml`, and paste the contents of `workflow-android.yml.txt`. Do the same for `deploy-firebase.yml` with `workflow-deploy-firebase.yml.txt`.
3. The native `android/` folder is NOT included. CI generates it automatically (React Native 0.76.5 template) on every build.

## Firebase setup (all in the browser)
1. https://console.firebase.google.com → **Add project**.
2. **Upgrade to Blaze** (pay-as-you-go; required for Cloud Functions; a two-person app stays in the free quotas).
3. Enable: **Authentication → Google**, **Firestore** (production mode), **Storage**, **Realtime Database**.
4. **Project settings → Add app → Android**, package name `com.ourlittlepet`. (Skip the SHA-1 for now.)
5. Download `google-services.json`.
6. GitHub repo → **Settings → Secrets and variables → Actions → New secret**: name `GOOGLE_SERVICES_JSON`, value = the whole file's text.

## Get your SHA-1 (no computer needed) and finish Google Sign-In
1. Run the **Android Debug APK** workflow (Actions tab → *Run workflow*). Open the log of the *Bootstrap native Android project* step and copy the `SHA1:` line.
2. Firebase → Project settings → your Android app → **Add fingerprint** → paste it.
3. Download `google-services.json` again, update the `GOOGLE_SERVICES_JSON` secret, run the workflow again. CI reads the Web client ID from that file automatically.
4. Google Sign-In only works with the **same keystore**, and the debug keystore RN ships is the same each build, so the SHA-1 stays stable.

## Deploy rules + functions (also from the browser)
1. Firebase → Project settings → **Service accounts → Generate new private key**. Save it somewhere safe. **Never commit it.**
2. GitHub secret `FIREBASE_SERVICE_ACCOUNT` = the whole JSON text. In Google Cloud console → IAM, make sure that service account can deploy (Editor/Firebase Admin is the simplest) and, for Storage rules that read Firestore, accept the IAM prompt when deploying (or grant "Firebase Rules Firestore Service Agent"-style access if the deploy tells you to).
3. Actions → **Deploy Firebase** → Run workflow → enter your project ID.
4. Rules (`firestore.rules`, `storage.rules`, `database.rules.json`) and the 10 functions go live together.

## Two-device test (do this before the surprise!)
1. Install the APK artifact from the Actions run on **two** Android phones (enable "install unknown apps").
2. Phone A: sign in → *Create Our World* → note the code. Phone B (other Google account): sign in → *Join* → enter code. Phone A: **Approve**.
3. Check: pairing animation on both, pet synced both ways, chat both ways, decorate room, add a memory photo, close/reopen app (still signed in).
4. Also try: wrong code 5 times (locked out), expired code, reusing a code, a third account trying the same code.

## Important notes
- Rewards are computed on the server with daily caps, but a client can always lie about a game score. The caps limit the damage; they cannot make it impossible.
- Image URLs use Firebase download tokens: anyone holding the exact URL can view it. Storage rules still block listing/reading by path for non-members.
- Pairing codes are hashed (SHA-256) server-side, single-use, expire in 10 minutes, and wrong guesses are rate-limited per account (5 misses → 30 min lock).
- Unlinking never deletes data: the room is archived and both people keep read-only access to old messages/memories.
