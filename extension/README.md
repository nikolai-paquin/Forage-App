# Forage browser extension

Saves the page/image/link/selection you're looking at into your Forage library.

It works by handing the capture to the Forage web app via a URL
(`?forage=<json>`); the app ingests it on load and adds the save.

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
  hit Add.
- Saves **reuse an open Forage tab** instead of opening a new one each time, and
  the app shows a **toast** when the save lands.

## Firefox

Firefox needs a slightly different manifest (background `scripts` instead of a
`service_worker`). A ready-made one is included:

1. Rename `manifest.firefox.json` → `manifest.json` (back up the Chrome one first)
2. Go to `about:debugging` → **This Firefox** → **Load Temporary Add-on** →
   pick any file in this folder

## Notes

- Manifest V3, permissions: `contextMenus`, `activeTab`, `tabs` (the last is for
  reusing an existing Forage tab).
