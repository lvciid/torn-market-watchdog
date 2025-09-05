# Torn Market Watchdog

A Tampermonkey userscript that highlights deals, warns on ripoffs, and alerts watchlist hits on Torn’s markets — powered by your own Torn API key. Keys stay local; no telemetry.

## Install

1) Install a userscript manager (Tampermonkey or Violentmonkey).
2) Install from GitHub Pages (auto‑update ready):

   https://lvciid.github.io/torn-market-watchdog/torn-market-watchdog.user.js

3) Open torn.com. A dock button appears (bottom‑right). Click it to open settings and paste your Torn API key (Limited Access recommended).

Tip: Tampermonkey checks the URL above for updates. Updates apply faster when `@version` increases.

## Highlights

- Live pricing: Listings via Torn API; medians cached 60s.
- Highlights: “deal/over” labels; tooltips show median/min/sample and last updated.
- Scam shield: Confirm on overpriced; optional “always confirm before buy” or disable our confirm.
- Watchlist: Alerts and highlight when ≤ target; optional beep with quiet hours; can auto‑open panel on hit.
- Overrides: Per‑item thresholds; ignore items.
- Filters: “Show deals only”, “Hide overpriced”.
- Color/UX: Colorblind palette; Minimal (badge‑only) mode; compact money; badge position (by name/price).
- Quick actions: Small “⋯” next to badge → Watch, Ignore, Override, Clear.
- Dock UX: Click toggles panel; status dot shows paused (red), cooling (amber), snoozed (blue). Right‑click menu (pause/snooze/filters/settings).
- Shortcuts: Alt+W (panel), Alt+D (deals), Alt+O (hide overpriced), Alt+P (pause).
- Icons: Separate light/dark dock icons (emoji or URL/data URI); built‑in fancy “L” defaults; auto theme switch.
- TOS‑friendly: Single‑flight queue, conservative pacing, retries + cooldown, snooze; no automation.

## Settings Overview

- API key: Stored locally; never shared.
- Thresholds: Deal threshold, Overprice multiplier.
- Auto‑refresh & Queue: Re‑scan cadence and API pacing.
- Routes: Enable/disable on Item Market, Bazaars, Points.
- Filters: Deals only / Hide overpriced.
- Safety: Always confirm; Disable overpriced confirm.
- Appearance: Minimal mode; Colorblind palette; Badge position; Compact badges.
- Watchlist & Overrides: Add target price; per‑item thresholds; ignore item.
- Notifications: Sound on hit; quiet hours; Open panel on hit.
- Snooze: Pause scanning for 5/15/30m from the dock menu; clear snooze.
- Dock icons: Separate light/dark icons (emoji/URL/data URI) or keep defaults; example in `assets/logo.svg`.

## Compatibility

- Shadow‑DOM UI prevents CSS/JS collisions; minimal `.tmw-*` classes on rows.
- SPA‑safe: Throttled mutations; IntersectionObserver annotates visible rows only.
- `@noframes`: Won’t inject in iframes.

## Permissions & Privacy

- `@connect api.torn.com` for API calls via `GM_xmlhttpRequest`.
- If you change API base, add `@connect <host>` in the userscript header.
- Your API key is stored locally by your userscript manager; never exposed to page scripts.

## Privacy

- Your API key is only stored by Tampermonkey/Violentmonkey and never exposed to page scripts.
- No analytics, no third‑party calls. Only Torn’s API is contacted.

## Troubleshooting

- No UI: ensure the script is enabled on torn.com and `@match` includes `*://*.torn.com/*`; hard‑refresh the page.
- No update in Tampermonkey: installed script must use the Pages URL; bump `@version` (auto‑bumped on commit) and Check for updates.
- “Access not allowed by @connect”: reset API base to `https://api.torn.com` or add the host to `@connect`.
- Cooling down: after repeated failures, the queue cools down (~2 minutes). It resumes automatically.

## Development

- Keep changes minimal and TOS‑friendly.
- Version bump helper and an optional pre‑commit hook are included so Tampermonkey always sees updates.

Auto‑bump setup (once per clone):

  git config core.hooksPath .githooks

Manual bumping:

- Patch: `scripts/bump_version.sh`
- Minor: `scripts/bump_version.sh minor`
- Major: `scripts/bump_version.sh major`
- Set explicit: `scripts/bump_version.sh set 1.2.3`


## License

MIT
