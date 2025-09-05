# Torn Market Watchdog

A Tampermonkey userscript that highlights deals, warns on ripoffs, and alerts watchlist hits on Torn’s item market and bazaars — powered by your own Torn API key. Keys stay local; no telemetry.

## Install

1) Install a userscript manager (Tampermonkey or Violentmonkey).

2) Install the script from the raw URL:

   https://raw.githubusercontent.com/lvciid/torn-market-watchdog/main/torn-market-watchdog.user.js

3) Open torn.com. A small 🐶 dock button appears (bottom‑right). Click it to open settings and paste your Torn API key (Limited Access recommended).

Tip: In Tampermonkey, the script auto‑updates from the URL above. Updates apply faster when the `@version` is bumped.

## Features

- API‑powered prices: Fetches live market listings and computes medians.
- Smart highlighting: Green for deals, red for overpriced; badges show median/min/sample and age.
- Scam shield: Optional confirm when a listing looks far above fair value.
- Watchlist: Alerts and highlights when items fall below your target price.
- Per‑item overrides: Custom deal/overprice thresholds; ignore specific items.
- Route toggles: Enable/disable on Item Market, Bazaars, Points.
- Performance & TOS‑friendly: Single‑flight queue, 60s market caching, backoff + cool‑down after failures.
- Privacy: API key never enters the page context; requests use `GM_xmlhttpRequest` and `@connect api.torn.com` only.

## Settings Overview

- API key: Stored locally in your userscript manager; never shared.
- Deal threshold and Ripoff multiplier: Control green/red classification.
- Auto‑refresh: How often to refresh cached medians and rescan.
- Queue spacing: Minimum delay between API calls (default 1500ms).
- Route toggles: Choose where scanning is active.
- Pause: Temporarily stop scanning from the dock or panel.
- Overrides: Per‑item custom thresholds or mark items to ignore.

## Compatibility

- UI isolation: The dock + panel are rendered in a Shadow DOM to avoid CSS/JS clashes with Torn or other scripts.
- Minimal page CSS: Only `.tmw-*` classes are applied to listing rows.
- SPA‑safe: MutationObserver + IntersectionObserver annotate visible rows and avoid heavy reflows.
- @noframes: Script does not inject into iframes.

## Permissions

- `@connect api.torn.com` is required for API calls via `GM_xmlhttpRequest`.
- If you change the API base in settings to a different host, you must add an additional `@connect <host>` in the metadata for your manager to allow it.

## Privacy

- Your API key is only stored by Tampermonkey/Violentmonkey and never exposed to page scripts.
- No analytics, no third‑party calls. Only Torn’s API is contacted.

## Troubleshooting

- “Access to … is not allowed by @connect”: Add the host to `@connect` or reset the API base to `https://api.torn.com`.
- “Invalid/Empty response” or Torn error codes: Check your API key and its access level; Limited Access is sufficient for market data.
- Cooling down banner: After repeated failures, the script pauses API calls for ~2 minutes to be gentle on the API. It resumes automatically.
- No highlights appearing: Ensure route toggles are enabled for your current page (market/bazaar/points) and the script isn’t paused.

## Development

- Bump the `@version` in the userscript header to trigger quicker updates.
- Keep changes minimal and TOS‑friendly (no automation, conservative API usage).

## License

MIT
