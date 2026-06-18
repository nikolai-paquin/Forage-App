# Forage Desktop (Tauri 2)

This wraps the Forage web app in a native **Tauri 2** shell — a small, fast,
real downloadable macOS app (and Windows/Linux from the same code).

> **Build on your Mac.** A macOS app can only be compiled and notarized on
> macOS, so these steps run locally — not in CI / the cloud sandbox.

## Prerequisites (one-time)

1. **Rust** — https://rustup.rs (`curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`)
2. **Xcode Command Line Tools** — `xcode-select --install`
3. Node deps — from `app/`: `npm install`

## Run in dev (hot-reload native window)

```bash
cd app
npm run tauri dev
```

This starts Vite (`npm run dev`) and opens the native Forage window pointing at
it, with hot reload.

## Build a distributable app

```bash
cd app
npm run tauri build
```

Output (under `app/src-tauri/target/release/bundle/`):
- `macos/Forage.app` — the app bundle
- `dmg/Forage_0.1.0_*.dmg` — a drag-to-install disk image

### Real app icons (recommended before shipping)

The scaffold ships a single placeholder `icons/icon.png`. Generate the full
platform icon set from any 1024×1024 PNG:

```bash
npm run tauri icon path/to/forage-1024.png
```

### Signing & notarization (for distributing outside your Mac)

Set up an Apple Developer ID and configure signing in `src-tauri/tauri.conf.json`
(`bundle.macOS`) plus notarization env vars. See
https://tauri.app/distribute/sign/macos/.

## What's configured

- `src-tauri/tauri.conf.json` — window (overlay title bar), build hooks
  (`beforeDevCommand`/`beforeBuildCommand`), bundle targets
- `src-tauri/src/{main,lib}.rs` — minimal Tauri entry point (mobile-ready via
  `mobile_entry_point`)
- `src-tauri/capabilities/default.json` — default permission set

## iOS / Android (later)

Tauri 2 supports mobile. Once you want it:

```bash
npm run tauri ios init   # or: android init
npm run tauri ios dev
```

This is where a real **iOS share extension** would live (the one piece the PWA
share target can't do on iPhone).
