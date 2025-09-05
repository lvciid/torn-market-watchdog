// ==UserScript==
// @name         Torn Market Watchdog
// @namespace    https://github.com/lvciid/torn-market-watchdog
// @version      0.1.0
// @description  Highlights deals, warns on ripoffs, and alerts watchlist items using live Torn API data.
// @author       lvciid
// @match        https://www.torn.com/*
// @run-at       document-idle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @grant        GM_notification
// @grant        GM_xmlhttpRequest
// @connect      api.torn.com
// @license      MIT
// ==/UserScript==

(function () {
  'use strict';

  // -----------------------
  // Config & Constants
  // -----------------------
  const API_BASE = 'https://api.torn.com';
  const STORAGE_KEYS = {
    apiKey: 'tmw_api_key',
    items: 'tmw_items_dict', // { ts: number, itemsById: {...}, idByName: {...} }
    marketCache: 'tmw_market_cache', // { [itemId]: { ts: number, median: number, min: number, sample: number } }
    watchlist: 'tmw_watchlist', // { [itemId]: { name: string, target: number } }
    settings: 'tmw_settings', // { goodThreshold, overpriceMultiplier, refreshSeconds, apiBase }
    ui: 'tmw_ui_state', // { dock:{x:number,y:number}, open:boolean }
  };

  // Defaults
  const DEFAULTS = {
    goodThreshold: 0.9, // price <= 90% of median -> good deal
    overpriceMultiplier: 1.75, // price >= 175% of median -> warn on buy
    refreshSeconds: 60,
    itemsTtlMs: 24 * 60 * 60 * 1000, // 24h
    marketTtlMs: 60 * 1000, // 60s
  };

  // -----------------------
  // Utilities
  // -----------------------
  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
  const now = () => Date.now();

  function getSettings() {
    const s = GM_getValue(STORAGE_KEYS.settings, {});
    return {
      goodThreshold: Number(s.goodThreshold) || DEFAULTS.goodThreshold,
      overpriceMultiplier: Number(s.overpriceMultiplier) || DEFAULTS.overpriceMultiplier,
      refreshSeconds: Number(s.refreshSeconds) || DEFAULTS.refreshSeconds,
      apiBase: String(s.apiBase || API_BASE),
    };
  }

  function setSettings(next) {
    GM_setValue(STORAGE_KEYS.settings, next);
  }

  function getApiKey() {
    return (GM_getValue(STORAGE_KEYS.apiKey, '') || '').trim();
  }

  function setApiKey(key) {
    GM_setValue(STORAGE_KEYS.apiKey, (key || '').trim());
  }

  function getItemsDict() {
    return GM_getValue(STORAGE_KEYS.items, null);
  }

  function setItemsDict(obj) {
    GM_setValue(STORAGE_KEYS.items, obj);
  }

  function getMarketCache() {
    return GM_getValue(STORAGE_KEYS.marketCache, {});
  }

  function setMarketCache(cache) {
    GM_setValue(STORAGE_KEYS.marketCache, cache);
  }

  function getWatchlist() {
    return GM_getValue(STORAGE_KEYS.watchlist, {});
  }

  function setWatchlist(list) {
    GM_setValue(STORAGE_KEYS.watchlist, list || {});
  }

  function fmtMoney(n) {
    if (n == null || isNaN(n)) return '-';
    return '$' + Math.round(Number(n)).toLocaleString();
  }

  function parseMoney(text) {
    if (!text) return null;
    const m = String(text).replace(/[^0-9]/g, '');
    if (!m) return null;
    return Number(m);
  }

  function median(arr) {
    if (!arr || arr.length === 0) return null;
    const a = [...arr].sort((x, y) => x - y);
    const mid = Math.floor(a.length / 2);
    return a.length % 2 ? a[mid] : Math.round((a[mid - 1] + a[mid]) / 2);
  }

  function oncePerTick(fn) {
    let queued = false;
    return (...args) => {
      if (queued) return;
      queued = true;
      queueMicrotask(() => {
        queued = false;
        try { fn(...args); } catch (e) { console.error('TMW error in oncePerTick', e); }
      });
    };
  }

  // -----------------------
  // Styles (page-level only for highlights). UI runs in shadow DOM.
  // -----------------------
  GM_addStyle(`
    .tmw-badge { display:inline-block; margin-left:6px; padding:2px 6px; border-radius:4px; font-size:11px; font-weight:600; color:#222; background:rgba(0,0,0,0.03); }
    .tmw-good { background: rgba(0, 200, 0, 0.12) !important; border-left: 3px solid #2ecc71 !important; }
    .tmw-bad { background: rgba(200, 0, 0, 0.12) !important; border-left: 3px solid #e74c3c !important; }
    .tmw-watch { background: rgba(0, 120, 255, 0.12) !important; border-left: 3px solid #3498db !important; }
    .tmw-banner { position:fixed; top:12px; right:12px; z-index:2147483646; background:#fff3cd; color:#856404; border:1px solid #ffeeba; padding:8px 12px; border-radius:6px; box-shadow:0 6px 24px rgba(0,0,0,0.1); }
    .tmw-link { color:#2d6cdf; cursor:pointer; text-decoration:underline; }
  `);

  // -----------------------
  // API Layer with caching
  // -----------------------
  // Use GM_xmlhttpRequest to avoid page-level interception of requests containing the key.
  async function apiFetchJson(url) {
    const apikey = getApiKey();
    if (!apikey) throw new Error('No API key set');
    const s = getSettings();
    const base = (s.apiBase || API_BASE).replace(/\/$/, '');
    const rel = url.replace(/^https?:\/\/[^/]+/, '');
    const glue = rel.includes('?') ? '&' : '?';
    const final = `${base}${rel}${glue}key=${encodeURIComponent(apikey)}`;
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: 'GET',
        url: final,
        headers: { 'Accept': 'application/json' },
        anonymous: true,
        onload: (resp) => {
          try {
            const j = JSON.parse(resp.responseText || 'null');
            if (!j) return reject(new Error('Empty response'));
            if (j.error) return reject(new Error(`Torn API error: ${j.error.code} ${j.error.error}`));
            resolve(j);
          } catch (e) { reject(e); }
        },
        onerror: () => reject(new Error('Network error')),
        ontimeout: () => reject(new Error('Network timeout')),
      });
    });
  }

  async function loadItemsDict(force = false) {
    const cached = getItemsDict();
    const ttl = DEFAULTS.itemsTtlMs;
    if (!force && cached && cached.ts && now() - cached.ts < ttl) {
      return cached;
    }
    const data = await apiFetchJson(`${API_BASE}/torn/?selections=items`);
    const items = data.items || {};
    const itemsById = {};
    const idByName = {};
    for (const [id, info] of Object.entries(items)) {
      itemsById[id] = { id: Number(id), name: info.name, market_value: info.market_value };
      idByName[info.name.toLowerCase()] = Number(id);
    }
    const packed = { ts: now(), itemsById, idByName };
    setItemsDict(packed);
    return packed;
  }

  async function fetchMarketMedian(itemId) {
    const j = await apiFetchJson(`${API_BASE}/market/${itemId}?selections=market`);
    const listings = (j?.market || []).map((x) => Number(x.cost)).filter((n) => !isNaN(n));
    const med = median(listings);
    const min = listings.length ? Math.min(...listings) : null;
    return { median: med, min: min ?? med ?? null, sample: listings.length };
  }

  async function getFairValue(itemId, itemsDict) {
    const cache = getMarketCache();
    const entry = cache[itemId];
    const ttl = DEFAULTS.marketTtlMs;
    if (entry && entry.ts && now() - entry.ts < ttl) {
      return entry; // { ts, median, min, sample }
    }
    try {
      const m = await fetchMarketMedian(itemId);
      const fresh = { ts: now(), ...m };
      cache[itemId] = fresh;
      setMarketCache(cache);
      return fresh;
    } catch (e) {
      console.warn('TMW: market median fetch failed; falling back to market_value', e);
      const fallback = itemsDict?.itemsById?.[itemId]?.market_value || null;
      const fresh = { ts: now(), median: fallback, min: fallback, sample: 0 };
      cache[itemId] = fresh;
      setMarketCache(cache);
      return fresh;
    }
  }

  // -----------------------
  // UI: Shadow DOM dock + panel (to avoid clashing with other scripts)
  // -----------------------
  const ui = { host: null, shadow: null, dock: null, panel: null };
  function ensureUiShell() {
    if (ui.host) return;
    const host = document.createElement('div');
    host.id = 'tmw-host';
    host.style.position = 'fixed';
    host.style.zIndex = '2147483647';
    host.style.inset = 'auto 16px 16px auto';
    document.body.appendChild(host);
    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host { all: initial; }
        .dock { position:fixed; bottom:0; right:0; transform: translate(0,0); }
        .dock-btn { width:42px; height:42px; border-radius:50%; background:linear-gradient(135deg,#2d6cdf,#5b8def); color:#fff; border:none; box-shadow:0 8px 24px rgba(0,0,0,.35); cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:18px; }
        .dock-btn:hover { filter: brightness(1.05); }
        .panel { position:fixed; bottom:54px; right:0; width:340px; background:#111827; color:#e5e7eb; border-radius:12px; box-shadow:0 12px 40px rgba(0,0,0,.45); border:1px solid #1f2937; display:none; }
        .hdr { display:flex; align-items:center; justify-content:space-between; padding:10px 12px; border-bottom:1px solid #1f2937; }
        .ttl { font-weight:700; font-size:14px; letter-spacing:.2px; }
        .xbtn { background:none; border:none; color:#9ca3af; font-size:18px; cursor:pointer; }
        .cnt { padding:12px; }
        label { display:block; font-size:12px; margin:6px 0 2px; color:#9ca3af; }
        input[type="text"], input[type="number"], input[type="password"] { width:100%; padding:8px; border-radius:8px; border:1px solid #374151; background:#0b1220; color:#e5e7eb; }
        .row { display:flex; gap:8px; }
        .row > * { flex:1; }
        .actions { display:flex; gap:8px; justify-content:flex-end; margin-top:10px; }
        button.primary { background:#2563eb; border:none; color:#fff; padding:8px 10px; border-radius:8px; cursor:pointer; }
        button.secondary { background:#374151; border:none; color:#e5e7eb; padding:8px 10px; border-radius:8px; cursor:pointer; }
        .muted { color:#9ca3af; font-size:12px; }
        .list { margin-top:8px; max-height:160px; overflow:auto; border:1px solid #1f2937; border-radius:8px; }
        .item { display:flex; align-items:center; justify-content:space-between; padding:8px 10px; border-bottom:1px solid #1f2937; font-size:12px; }
        .item:last-child { border-bottom:none; }
      </style>
      <div class="dock" id="tmw-dock">
        <button class="dock-btn" id="tmw-dock-btn" title="Open Torn Market Watchdog">🐶</button>
      </div>
      <div class="panel" id="tmw-panel">
        <div class="hdr">
          <div class="ttl">Torn Market Watchdog</div>
          <button class="xbtn" id="tmw-close">×</button>
        </div>
        <div class="cnt" id="tmw-cnt"></div>
      </div>
    `;
    ui.host = host; ui.shadow = shadow;
    ui.dock = shadow.getElementById('tmw-dock');
    ui.panel = shadow.getElementById('tmw-panel');
    const btn = shadow.getElementById('tmw-dock-btn');
    btn.addEventListener('click', () => togglePanel(true));
    shadow.getElementById('tmw-close').addEventListener('click', () => togglePanel(false));
    enableDockDrag();
    GM_registerMenuCommand('TMW: Open Settings', () => togglePanel(true));
  }

  function togglePanel(open) {
    if (!ui.panel) return;
    const state = GM_getValue(STORAGE_KEYS.ui, { dock: null, open: false });
    ui.panel.style.display = open ? 'block' : 'none';
    state.open = !!open; GM_setValue(STORAGE_KEYS.ui, state);
    if (open) renderSettingsPanel();
  }

  function enableDockDrag() {
    const btn = ui.shadow.getElementById('tmw-dock-btn');
    let dragging = false; let startX=0, startY=0; let orig = { x: 0, y: 0 };
    const state = GM_getValue(STORAGE_KEYS.ui, { dock: { x: 16, y: 16 }, open: false });
    positionDock(state.dock?.x ?? 16, state.dock?.y ?? 16);
    const onDown = (e) => {
      dragging = true;
      startX = e.clientX; startY = e.clientY;
      const r = ui.dock.getBoundingClientRect();
      orig = { x: window.innerWidth - r.right, y: window.innerHeight - r.bottom };
      e.preventDefault();
    };
    const onMove = (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX; const dy = e.clientY - startY;
      const nx = Math.max(4, Math.min(orig.x - dx, window.innerWidth - 50));
      const ny = Math.max(4, Math.min(orig.y - dy, window.innerHeight - 50));
      positionDock(nx, ny);
    };
    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      const r = ui.dock.getBoundingClientRect();
      const x = window.innerWidth - r.right; const y = window.innerHeight - r.bottom;
      const state2 = GM_getValue(STORAGE_KEYS.ui, { dock: { x: 16, y: 16 }, open: false });
      state2.dock = { x, y }; GM_setValue(STORAGE_KEYS.ui, state2);
    };
    btn.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    // Touch support
    btn.addEventListener('touchstart', (e) => onDown(e.touches[0]), { passive: false });
    window.addEventListener('touchmove', (e) => onMove(e.touches[0]), { passive: false });
    window.addEventListener('touchend', onUp);
  }

  function positionDock(x, y) {
    // stick to bottom-right offsets
    ui.dock.style.right = `${Math.max(0, x)}px`;
    ui.dock.style.bottom = `${Math.max(0, y)}px`;
    ui.panel.style.right = `${Math.max(0, x)}px`;
    ui.panel.style.bottom = `${Math.max(54, y + 54)}px`;
  }

  function renderSettingsPanel() {
    const cnt = ui.shadow.getElementById('tmw-cnt');
    const s = getSettings();
    const hasKey = !!getApiKey();
    cnt.innerHTML = `
      <div>
        <label>API Key (Limited Access)</label>
        <div class="row">
          <input id="tmw-api-key" type="password" placeholder="${hasKey ? 'Key is set — enter to replace' : 'Enter your Torn API key'}" />
          <button class="secondary" id="tmw-save-key">${hasKey ? 'Update' : 'Save'}</button>
        </div>
        <div class="muted">Your key is stored locally in Tampermonkey and never exposed to the page or other scripts.</div>

        <div class="row" style="margin-top:8px;">
          <div>
            <label>Deal threshold</label>
            <input id="tmw-good-threshold" type="number" step="0.01" min="0.5" max="1.0" value="${s.goodThreshold}" />
            <div class="muted">Green if price ≤ threshold × median.</div>
          </div>
          <div>
            <label>Ripoff warning</label>
            <input id="tmw-over-mult" type="number" step="0.05" min="1.2" max="5.0" value="${s.overpriceMultiplier}" />
            <div class="muted">Confirm if price ≥ multiplier × median.</div>
          </div>
        </div>
        <div class="row">
          <div>
            <label>Auto-refresh (seconds)</label>
            <input id="tmw-refresh" type="number" min="15" max="300" value="${s.refreshSeconds}" />
            <div class="muted">Refresh cached medians and re-scan page.</div>
          </div>
          <div>
            <label>API base (optional)</label>
            <input id="tmw-api-base" type="text" placeholder="${API_BASE}" value="${escapeHtml(s.apiBase || API_BASE)}" />
            <div class="muted">Leave default unless you use a compatible mirror.</div>
          </div>
        </div>

        <div style="margin-top:10px;">
          <div class="row">
            <div>
              <label>Watchlist item</label>
              <input id="tmw-watch-name" type="text" placeholder="e.g. Xanax" />
            </div>
            <div>
              <label>Target price</label>
              <input id="tmw-watch-price" type="number" placeholder="e.g. 1800000" />
            </div>
          </div>
          <div class="actions">
            <button id="tmw-save" class="primary">Save Settings</button>
            <button id="tmw-add-watch" class="secondary">Add to Watchlist</button>
          </div>
        </div>
        <div class="list" id="tmw-watch-list"></div>
      </div>
    `;

    ui.shadow.getElementById('tmw-save-key').onclick = () => {
      const val = ui.shadow.getElementById('tmw-api-key').value.trim();
      if (!val) { notify('Enter a valid API key to save.'); return; }
      setApiKey(val);
      ui.shadow.getElementById('tmw-api-key').value = '';
      notify('API key saved securely.');
    };

    ui.shadow.getElementById('tmw-save').onclick = () => {
      const good = Number(ui.shadow.getElementById('tmw-good-threshold').value);
      const over = Number(ui.shadow.getElementById('tmw-over-mult').value);
      const rf = Number(ui.shadow.getElementById('tmw-refresh').value);
      const base = String(ui.shadow.getElementById('tmw-api-base').value || API_BASE);
      setSettings({ goodThreshold: good, overpriceMultiplier: over, refreshSeconds: rf, apiBase: base });
      notify('Watchdog settings saved.');
    };

    ui.shadow.getElementById('tmw-add-watch').onclick = async () => {
      const name = ui.shadow.getElementById('tmw-watch-name').value.trim();
      const price = Number(ui.shadow.getElementById('tmw-watch-price').value);
      if (!name || !price) { notify('Enter item name and target price.'); return; }
      try {
        const dict = await loadItemsDict();
        const id = dict.idByName[name.toLowerCase()];
        if (!id) { notify(`Item not found: ${name}`); return; }
        const wl = getWatchlist();
        wl[id] = { name, target: price };
        setWatchlist(wl);
        renderWatchList();
        notify(`Added to watchlist: ${name} ≤ ${fmtMoney(price)}`);
      } catch (e) {
        notify('Failed to add watch item. Check API key.');
      }
    };

    renderWatchList();
  }

  function renderWatchList() {
    const el = ui.shadow.getElementById('tmw-watch-list');
    const wl = getWatchlist();
    const items = Object.entries(wl).map(([id, v]) => ({ id, ...v }));
    if (!items.length) { el.innerHTML = '<div class="item muted">No watchlist items yet.</div>'; return; }
    el.innerHTML = items.map(({ id, name, target }) => `
      <div class="item">
        <div>${escapeHtml(name)} <span class="muted">≤ ${fmtMoney(target)}</span></div>
        <div>
          <button data-id="${id}" class="secondary tmw-remove">Remove</button>
        </div>
      </div>
    `).join('');
    el.querySelectorAll('.tmw-remove').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const wl2 = getWatchlist();
        delete wl2[id];
        setWatchlist(wl2);
        renderWatchList();
      });
    });
  }

  function escapeHtml(s) {
    return String(s || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');
  }

  function notify(text) {
    try {
      GM_notification({ text, title: 'Torn Market Watchdog', timeout: 4000, silent: true });
    } catch (_) {
      console.log('[TMW]', text);
    }
  }

  function showKeyBanner() {
    if (document.querySelector('#tmw-banner')) return;
    const div = document.createElement('div');
    div.id = 'tmw-banner';
    div.className = 'tmw-banner';
    div.innerHTML = `⚠️ Torn Market Watchdog: Set your API key in <span class="tmw-link">Settings</span>.`;
    div.querySelector('.tmw-link').addEventListener('click', () => {
      togglePanel(true);
      div.remove();
    });
    document.body.appendChild(div);
  }

  // -----------------------
  // DOM Processing
  // -----------------------
  const scanDomSoon = oncePerTick(scanDom);
  let lastRefreshTs = 0;
  let observerStarted = false;

  function startObservers() {
    if (observerStarted) return;
    observerStarted = true;
    const obs = new MutationObserver(() => scanDomSoon());
    obs.observe(document.documentElement, { childList: true, subtree: true });
    document.addEventListener('click', (e) => handlePotentialBuy(e), true);
    setInterval(() => {
      const s = getSettings();
      const intervalMs = Math.max(15, s.refreshSeconds || DEFAULTS.refreshSeconds) * 1000;
      if (now() - lastRefreshTs >= intervalMs) {
        lastRefreshTs = now();
        // soft clear expired entries by updating ts to force refetch on next access
        const cache = getMarketCache();
        for (const k of Object.keys(cache)) {
          if (now() - (cache[k]?.ts || 0) > DEFAULTS.marketTtlMs) delete cache[k];
        }
        setMarketCache(cache);
        scanDomSoon();
      }
    }, 3000);
  }

  function handlePotentialBuy(e) {
    const target = e.target;
    if (!target) return;
    // Ignore clicks inside our UI
    try { if (ui && ui.host && ui.host.contains(target)) return; } catch(_) {}
    const btn = target.closest('button, a');
    if (!btn) return;
    // Heuristic: buy buttons typically contain text like "Buy" / "Purchase"
    const txt = (btn.textContent || '').trim().toLowerCase();
    if (!txt) return;
    if (!(txt.includes('buy') || txt.includes('purchase'))) return;
    // Find the listing container and price
    const row = findListingRow(btn);
    if (!row) return;
    const info = extractListingInfo(row);
    if (!info || !info.itemId || !info.price) return;
    // Check overpriced against fair value (cached or fallback)
    ;(async () => {
      try {
        const dict = await loadItemsDict();
        const fv = await getFairValue(info.itemId, dict);
        const s = getSettings();
        const fair = fv?.median || fv?.min;
        if (!fair) return;
        const overpriced = info.price >= fair * s.overpriceMultiplier;
        if (overpriced) {
          const pct = Math.round((info.price / fair) * 100);
          const ok = confirm(`This looks overpriced (≈${pct}% of median ${fmtMoney(fair)}).\nStill proceed to buy?`);
          if (!ok) {
            e.preventDefault();
            e.stopPropagation();
          }
        }
      } catch (err) {
        // ignore
      }
    })();
  }

  function findListingRow(el) {
    // Try common container types
    return el.closest('li, tr, .item, .market-item, .bazaar-item, .item___, .table-row');
  }

  function extractListingInfo(row) {
    try {
      // Find item link and deduce ID from href ?XID= or /XID=
      const link = row.querySelector('a[href*="item.php?XID="], a[href*="/item.php?XID="]') || row.querySelector('a[href*="/iteminfo.php?XID="]');
      let itemId = null;
      let itemName = null;
      if (link) {
        const href = link.getAttribute('href') || '';
        const m = href.match(/XID=(\d+)/i);
        if (m) itemId = Number(m[1]);
        itemName = (link.textContent || '').trim();
      }
      // Fallback: try data attributes
      if (!itemId) {
        const dataId = row.getAttribute('data-item-id') || row.getAttribute('data-id');
        if (dataId && /\d+/.test(dataId)) itemId = Number(dataId);
      }
      // Find price text
      let price = null;
      // Common patterns: elements containing $ and numbers
      const priceEl = Array.from(row.querySelectorAll('span, div, b, strong, td')).find((n) => /\$\s?\d[\d,]*/.test(n.textContent || ''));
      if (priceEl) price = parseMoney(priceEl.textContent);
      // Heuristic fallback: pick the largest $ amount in the row
      if (!price) {
        const moneyMatches = (row.textContent || '').match(/\$\s?\d[\d,]*/g);
        if (moneyMatches && moneyMatches.length) {
          price = Math.max(...moneyMatches.map(parseMoney).filter(Boolean));
        }
      }
      if (!itemName) {
        // Try title attribute or bold text
        const nameEl = row.querySelector('[title]') || row.querySelector('b, strong, .name');
        if (nameEl) itemName = (nameEl.getAttribute('title') || nameEl.textContent || '').trim();
      }
      return { itemId, itemName, price, row };
    } catch (e) {
      return null;
    }
  }

  async function annotateRow(info, itemsDict) {
    if (!info || !info.itemId || !info.price) return;
    if (info.row.getAttribute('data-tmw') === '1') return;
    info.row.setAttribute('data-tmw', '1');

    let fairBlock = document.createElement('span');
    fairBlock.className = 'tmw-badge';
    fairBlock.textContent = '…fetching';
    // Try to attach next to price element or name
    const anchor = info.row.querySelector('a[href*="item.php?XID="]') || info.row.querySelector('b, strong, .name');
    if (anchor && anchor.parentElement) {
      anchor.parentElement.insertBefore(fairBlock, anchor.nextSibling);
    } else {
      info.row.appendChild(fairBlock);
    }

    try {
      const fv = await getFairValue(info.itemId, itemsDict);
      const fair = fv?.median || fv?.min || null;
      const s = getSettings();
      if (fair) {
        const badgeTxt = `median ${fmtMoney(fair)}${fv?.sample ? ` • n=${fv.sample}` : ''}`;
        fairBlock.textContent = badgeTxt;
        // classify
        const isGood = info.price <= fair * s.goodThreshold;
        const isBad = info.price >= fair * s.overpriceMultiplier;
        if (isGood) info.row.classList.add('tmw-good');
        if (isBad) info.row.classList.add('tmw-bad');
        // watchlist
        const wl = getWatchlist();
        const watched = wl[info.itemId];
        if (watched && info.price <= watched.target) {
          info.row.classList.add('tmw-watch');
          fairBlock.textContent = `${badgeTxt} • watch hit ≤ ${fmtMoney(watched.target)}`;
          notify(`Deal found: ${watched.name || info.itemName} at ${fmtMoney(info.price)} (target ≤ ${fmtMoney(watched.target)})`);
        }
      } else {
        fairBlock.textContent = 'median n/a';
      }
    } catch (e) {
      fairBlock.textContent = 'API error';
      console.warn('TMW annotate error', e);
    }
  }

  async function scanDom() {
    ensureUiShell();
    if (!getApiKey()) showKeyBanner();
    // Collect potential rows from visible page
    // Broad net: find containers with an item link to item.php?XID and some $ price
    const candidates = new Set();
    document.querySelectorAll('a[href*="item.php?XID="]').forEach((a) => {
      const row = findListingRow(a);
      if (row) candidates.add(row);
    });

    if (!candidates.size) return;
    let dict;
    try {
      dict = await loadItemsDict();
    } catch (e) {
      console.warn('TMW: cannot load items dict (missing/invalid API key?)', e);
      return;
    }

    const jobs = [];
    for (const row of candidates) {
      const info = extractListingInfo(row);
      if (info && info.itemId && info.price) {
        jobs.push(annotateRow(info, dict));
      }
    }
    // Stagger to reduce burst
    for (let i = 0; i < jobs.length; i++) {
      // eslint-disable-next-line no-await-in-loop
      await jobs[i];
      await sleep(30);
    }
  }

  // -----------------------
  // Bootstrap
  // -----------------------
  function init() {
    ensureUiShell();
    startObservers();
    scanDomSoon();
    // Restore panel open state
    const state = GM_getValue(STORAGE_KEYS.ui, { open: false });
    if (state.open) togglePanel(true);
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
  } else {
    window.addEventListener('DOMContentLoaded', init);
  }
})();
