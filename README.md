# lvciid's Market Watcher

A Tampermonkey userscript that highlights deals, warns on ripoffs, and alerts watchlist hits on Torn’s markets — powered by your own Torn API key. Keys stay local; no telemetry.

## Install

1) Install a userscript manager (Tampermonkey or Violentmonkey).
2) Install from GitHub Pages (auto‑update ready):

https://raw.githubusercontent.com/lvciid/lvciids-market-watcher/main/lvciids-market-watcher.user.js
3) Open torn.com. A dock button appears (bottom‑right). Click it to open settings and paste your Torn API key (Limited Access recommended).

Tip: Tampermonkey checks the URL above for updates. Updates apply faster when `@version` increases.

## Help / Support

- Message on Torn: https://www.torn.com/profiles.php?XID=3888554
- GitHub: https://github.com/lvciid/lvciids-market-watcher
- See this README for full functionality and usage tips.

## Highlights

- Live pricing: Listings via Torn API; medians cached 60s.
- Highlights: “deal/over” labels; tooltips show median/min/sample and last updated.
- Scam shield: Confirm on overpriced; optional “always confirm before buy” or disable our confirm.
- Watchlist: Alerts and highlights when a listing price drops at or below your target, plus optional spike alerts when a listing posts at or above your chosen ceiling; optional two‑tone chime with quiet hours and volume control; can auto‑open panel on hit.
- Overrides: Per‑item thresholds; ignore items.
- Filters: “Show deals only”, “Hide overpriced”.
- Color/UX: Colorblind palette; Minimal (badge‑only) mode; compact money; badge position (by name/price).
- Quick actions: Small “⋯” next to badge → Watch, Ignore, Override, Clear, Mute 1h.
- Dock UX: Click toggles panel; status dot shows paused (red) or cooling (amber). Right-click the dock for an anchored quick-controls panel (volume, sound toggle, background monitor) or jump to full settings.
- Panel UI: Overview / Alerts / Appearance / API sections stay open at a glance, with an aurora header highlighting “lvciid’s Market Watcher”.
- Dock button: Animated aurora capsule that glows and spins on alerts—no icon needed. State-aware gradients show active, paused, or cooling status, and the hit sound remains a short two-tone chime.
- Progress ring: shows time to next monitor tick. Badge count shows new hits.
- Shortcuts: Alt+W (panel), Alt+D (deals), Alt+O (hide overpriced), Alt+P (pause).
- Icons: Built‑in light/dark LV emblem, auto theme switch. Emblem is fixed in the script (not user‑configurable).
- TOS‑friendly: Single‑flight queue, conservative pacing, retries + cooldown; no automation.

## Settings Overview

- API key: Stored locally; never shared.
- Thresholds: Deal threshold, Overprice multiplier.
- Auto‑refresh & Queue: Re‑scan cadence and API pacing (default 1.5s spacing ≈ 40 req/min, safely under Torn’s 100 req/min limit).
- Filters: Use the quick controls (right‑click dock) for Deals only, Hide overpriced, sound toggle, and test chime.
- Safety: Always confirm; Disable overpriced confirm.
- Appearance: Minimal mode; Colorblind palette; Badge position; Compact badges.
- Watchlist & Overrides: Add low and high target prices; per-item thresholds; ignore item.
- Notifications: Two‑tone chime on hit (only when price ≤ your watchlist target). Quiet hours and Open panel on hit. Volume control + Test live in Extra settings (right‑click the dock → Extra settings…).
- Progress ring: shows time to next monitor check.
- Branding: The dock uses a fixed “Signature shield” with an LV monogram (the creator’s calling card). This is intentional and not user‑configurable.

### Extra Settings (right‑click dock → Extra settings…)
- Deal threshold, Overprice multiplier
- Auto‑refresh (seconds), Queue spacing (ms)
- Quiet hours (start/end)
- Volume slider with Test button
- API base
- Clear Market Cache, Reset to Defaults
- Safety: Always confirm before buy; Disable overpriced confirm

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
- No update in Tampermonkey: the script uses a separate meta file for updates. Ensure Tampermonkey is using the Pages URL; bump `@version` and use “Check for updates”. CDN propagation can take 1–2 minutes.
- “Access not allowed by @connect”: reset API base to `https://api.torn.com` or add the host to `@connect`.
- Cooling down: after repeated failures or 429, the queue cools down (~2 minutes). It resumes automatically.

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
