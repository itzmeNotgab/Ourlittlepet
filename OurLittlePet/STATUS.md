# STATUS (honest)

Last updated: 2026-11-17. **Nothing here has been run on an Android device or emulator.** The code was written in an offline sandbox without `npm install`, Gradle, Firebase or two phones.

## Verified
- Pure logic executed with Node: pet decay/mood (client matches server), catalog sync (app = functions), memory-match deck, heart-catcher physics, level math. ✅
- Syntax and unused-import check across `src/` and `functions/src/` with TypeScript (module/React type errors can't be checked offline). ✅

## NOT verified (treat as untested until you run it)
- `npm install` resolving (versions pinned to the RN 0.76.5 era; one may need a bump).
- Full `tsc` type-check against real library types (CI runs it; **first run may fail on small type errors**; fix from the log).
- Gradle build, the bootstrap script's patching of the generated `android/` project, APK install.
- Everything involving Firebase: Google Sign-In, Functions, rules, push, presence.
- All acceptance tests in the spec (auth, pairing, sync, messaging, security, Android). **None performed.**

## Implemented (code written)
Milestones 1-8 in code: design system + navigation + Home; Google auth + profiles; 6-digit pairing (create/join/approve/reject/cancel/unlink, rate limiting, hashing, expiry); shared cat (feed/pet/play/sleep/wake/rename/equip, real-time sync, reactions, activity log); chat (text + photos, unread, sent/seen ticks); shared room + wardrobe + unlock system; Heart Catcher + Memory Match with server-capped rewards; memories (Polaroid gallery, edit/delete own); Little Reminders; Secret Love Letter; presence; push notifications + preferences; security rules.

## Known gaps / not done
- **App icon and splash artwork:** default React Native icon is used. Needs original art.
- **Offline action queue:** cat actions need a connection (they show an error offline). Firestore caches cat/room/chat for viewing; chat messages queue and show "sending" until the server confirms.
- **Archived-world viewer:** unlink keeps data and rules allow read-only access, but there is no screen to browse an archived world yet.
- Image upload/delete failure edge cases only lightly handled.
- Milestone 9 (security audit, performance testing, release APK) not performed. Debug APK only.
- Per-commit milestone history isn't included (delivered as a zip); commit however you like.
- "Liquid glass" is approximated with translucent white + border (no native blur).
- New Architecture is disabled by the bootstrap script for library compatibility.

## Likely first-run fixes
1. Run the Android workflow; read the first failing step.
2. Type errors → fix the named file. Dependency version errors → adjust `package.json`.
3. Sign-in "DEVELOPER_ERROR" → SHA-1 missing/mismatch in Firebase, or stale `google-services.json`.
4. Functions "not found" → deploy workflow hasn't run, or region mismatch (functions default to us-central1).
