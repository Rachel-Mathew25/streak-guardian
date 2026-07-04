# Streak Guardian

A Chrome extension that keeps your GitHub contribution graph honest. Instead of relying on empty, automated commits to fake a streak, Streak Guardian checks your **real** contribution activity every day and, only if nothing genuine happened, helps you log something meaningful before the day ends — either through a notification or an automatic, honest devlog commit built from notes you actually wrote.

## Why

Most "streak keeper" tools just push a blank commit at midnight to keep a graph green. That defeats the point of the graph entirely. Streak Guardian is built around the opposite principle: every commit it makes should be traceable to something you actually did or noted that day. If you did nothing, it says so — it doesn't pretend otherwise.

## How it works

- A Manifest V3 background service worker wakes on a recurring `chrome.alarms` schedule (Chrome kills idle workers after ~30s, so a persistent loop isn't possible — alarms are the correct mechanism for this)
- At a configurable check-in time, it queries GitHub's **GraphQL API** for your real contribution count for the current day, matched against GitHub's own date boundaries (not naive local-time math, which breaks across timezones)
- If nothing's been contributed:
  - **With auto-commit configured:** it compiles any quick notes you jotted during the day (via the popup) into a single markdown entry and pushes it to a `devlog.md` file in a repo of your choice, via GitHub's Contents API
  - **Without auto-commit:** it sends a native desktop notification instead
- A toolbar popup shows today's real contribution count at a glance, and lets you jot quick notes throughout the day — these are what get compiled into the auto-commit entry if needed
- A secondary reminder alarm nudges you earlier in the evening if no notes have been logged yet, so the auto-commit (if it fires) has something real to draw from

## Tech

- **Manifest V3** — service worker background model, `chrome.alarms`, `chrome.notifications`, `chrome.storage.local`
- **GitHub GraphQL API** — for accurate, timezone-correct contribution data (not available via REST)
- **GitHub REST Contents API** — for reading/writing `devlog.md`, including proper handling of file `sha` versioning to avoid overwriting existing content
- Vanilla JavaScript throughout — no build step, no frameworks, deliberately kept dependency-free for a browser extension of this size

## Setup

1. Clone this repo
2. Go to `chrome://extensions`, enable Developer Mode, click **Load unpacked**, select the project folder
3. Open the extension's settings (right-click the icon → Options, or click the gear in the popup)
4. Generate a GitHub [personal access token](https://github.com/settings/tokens) with `read:user` scope (and `repo` scope if using auto-commit)
5. Enter your token, GitHub username, and desired check-in time
6. *(Optional)* Set an auto-commit target repo if you want automatic devlog commits instead of just notifications

## Security notes

- The token is stored only in `chrome.storage.local` — scoped to this extension, this device, never synced or transmitted anywhere except directly to `api.github.com` over HTTPS
- No backend server exists or is required; all requests are made client-side from the extension itself
- Tokens are fully revocable anytime from GitHub's own token settings page

## What I learned building this

- Manifest V3's service worker lifecycle (why persistent background scripts aren't possible, and why alarms are the correct pattern)
- Diagnosing and fixing a real timezone bug when naive local-time date math didn't match GitHub's own day boundaries
- Diagnosing and fixing a Base64/Unicode encoding bug (`btoa` only supports Latin1) when committing text containing punctuation like em dashes
- Structuring a small multi-file extension (background worker, popup, options page) that shares logic cleanly across contexts with different script-loading rules (`importScripts` vs `<script>` tags)

## License

MIT