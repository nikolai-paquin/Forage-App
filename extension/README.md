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

## Notes

- This is a Manifest V3 extension. It only needs `contextMenus` + `activeTab`.
- A Firefox build needs minor manifest tweaks (background `scripts` instead of
  `service_worker`).
