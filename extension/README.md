# Forage browser extension

Saves the page/image/link/selection you're looking at into your Forage library.

It works by handing the capture to the Forage web app via a URL
(`?forage=<json>`); the app ingests it on load and adds the save.

When you forage a **page**, the extension reads that page's own OpenGraph/meta
tags (title, description, preview image, site/author) and sends them along, so
links arrive as rich bookmarks immediately — no server-side unfurl needed. This
uses the `scripting` + `activeTab` permissions, which only grant access to a tab
at the moment you invoke the extension on it.

## Install (Chrome / Edge / Brave — unpacked)

1. Open `chrome://extensions`
2. Turn on **Developer mode** (top-right)
3. Click **Load unpacked** and select this `extension/` folder
4. Pin the Forage icon if you like

## Use

- Click the toolbar icon → **Forage this page**
- Right-click an **image / link / selection / page** → **Forage this …**

A Forage tab opens and the save lands in your **Library**.

## Configure

The target app URL is set at the top of `background.js` and `popup.js`
(`APP_URL`). Point it at your own deployment or `http://localhost:5173/` for
local dev.

## Use (more)

- The popup also has a **"forage any link / image URL"** field — paste a URL,
  hit Add. Links are fetched and their meta tags parsed, so they arrive as rich
  bookmarks (title · description · preview image).
- Right-click **link** saves fetch + parse the target page too; **image** saves
  borrow the host page's title/description; **page** saves read the open page.
- Saves **reuse an open Forage tab** instead of opening a new one each time, and
  the app shows a **toast** when the save lands.

## Background save (no tab)

Open the popup → **⚙ Background save & sync** → paste the same **Sync endpoint
URL** and **Sync key** you use in Forage → Settings → Sync, then tick **Save in
background**. Captures now push straight to your library via the sync Worker —
no tab opens. The toolbar icon flashes a ✓ on success (or ! on failure, in which
case it falls back to opening a tab). The new save shows up on your devices on
their next sync pull. Requires the Sync Worker (`server/sync-worker.js`) and
auto-sync enabled in the app.

## Firefox

Firefox needs a slightly different manifest (background `scripts` instead of a
`service_worker`). A ready-made one is included:

1. Rename `manifest.firefox.json` → `manifest.json` (back up the Chrome one first)
2. Go to `about:debugging` → **This Firefox** → **Load Temporary Add-on** →
   pick any file in this folder

## Notes

- Manifest V3, permissions: `contextMenus`, `activeTab`, `tabs`, `scripting`,
  `storage`, and `host_permissions: *://*/*`. The host permission is what lets
  the extension fetch a link's page to read its preview metadata; `storage`
  holds your background-save settings locally. Your sync key never leaves the
  extension except in requests to your own sync endpoint.
