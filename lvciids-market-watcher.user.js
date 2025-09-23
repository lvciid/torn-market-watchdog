// ==UserScript==
// @name         lvciid's Market Watcher
// @namespace    https://github.com/lvciid/lvciids-market-watcher
// @version      0.3.18
// @description  Highlights deals, warns on ripoffs, and alerts watchlist items using live Torn API data. Your API key stays local and never exposed.
// @author       lvciid
// @match        *://*.torn.com/*
// @match        https://torn.com/*
// @run-at       document-idle
// @noframes
// @homepageURL  https://github.com/lvciid/lvciids-market-watcher
// @supportURL   https://github.com/lvciid/lvciids-market-watcher/issues
// @downloadURL  https://raw.githubusercontent.com/lvciid/lvciids-market-watcher/main/lvciids-market-watcher.user.js
// @updateURL    https://raw.githubusercontent.com/lvciid/lvciids-market-watcher/main/lvciids-market-watcher.user.meta.js
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @grant        GM_notification
// @grant        GM_xmlhttpRequest
// @grant        GM_addValueChangeListener
// @connect      api.torn.com
// @license      MIT
// ==/UserScript==

(function () {
  'use strict';

  // -----------------------
  // Config & Constants
  // -----------------------
  const API_BASE = 'https://api.torn.com';
  // Default dock icons as inline SVG data URIs
  // Owner-controlled LV monogram (SVG data URIs), optimized for ~22px
  // Light: near-white stroke; Dark: deep navy stroke
  // High-quality hosted icon (Iconify CDN, Phosphor storefront — bold, legible)
  const DOCK_ICON_DEFAULT_LIGHT = 'https://api.iconify.design/ph/storefront-bold.svg?color=white';
  const DOCK_ICON_DEFAULT_DARK  = 'https://api.iconify.design/ph/storefront-bold.svg?color=white';
  // Optional: set this to your image URL or data URI to use it as the dock icon
  // Example: const CUSTOM_ICON_URL = 'data:image/png;base64,...';
  const CUSTOM_ICON_URL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAEkUlEQVR4nO2ZeaxdQxzHP729qtrQUttD0Uo9tGqPJURsQSxRlPL+EPwhJRIEpQtF7YQ2VEIJESSopVH9ByGKiKaW0lbl8Uhf6OPVUkmVLvKT78iYnHPPzN1eE/eTnOS9e2bmzPfMzG870KJFixb/Z0rAaOBc4GpgKjAduAm4C5gBXAuMA/ZgM6MMnAk8D/QCm3R9CbwEPADcBkwCpgD3A68B3wPLJW54XwoYAEwEvvUm/z5wGdAW0b8fcCgwC1gNzAF2pckcCSzxBLwLHF3DeEOBu4EfgUtpAvYWrwP+koA1erD9Xg/GAp8BTwNb0sCD/Ji3Ct8B+zbgOYOBucDb+ruu2Bt/whPRBYygcZSAp4C3dBbrxvRgJZphOvsDr8oI1IUTgA0SsR44huaxNbAMuLDWgQZrBdxq3ErzOQxYBexYyyAzPBFL5Pz6gpnAQ9V23lbm1QmZEHFAB9EYtgd+qjYCuMETsVyHLw/zLb/oLJnZ3DPyGQMVwtj2/QQ4o0LbB4E7qYKlnhALO/IY77Vz1yKtUBH3BP3+lFPMYh+gO3Lcf9nfG3xjQez0YoYQu/aOeE5XRr+bK7Q3r39UipArg7dbibk5QtoTV91dtk3zuFcRdDTPJJjcCRmTWRy5BS4P+q0uWP2zgXkpQhZ5g58f0X4y8LvavwfslfCsC5S3WBw3qqDtflrFaHo8IUdE9ikrHG+0p1+T0mGtJ2RnNh/6K0yKxuUbdm3RuHn9E3yWE6PwDSn5z6+eEPPwqYwBZgO35IThljQ9rpW3OOqKyHGHqS4QzTeeEPMpKYzXGbsDeAX4WMIcbcrtvwJ2Ag4BvpAFK2KM2kbzhifErEos2+gNW8TquETCrlGu360KykivzSjl60MiXpL5raRo0wl5JKGfhTLPZfw+QgWKjYrJDshoswA4r2B8i7WmJcznP/FTV8LhslD7vpx7x0vEsTlbxlbyoILxP0qt1gxTAOfEHBfZ70BtozlB4eAcYCVweEafHYCvgY6CsXeX2GQr+ronxA5tLO1axWXaQhM1UYteQwZpy5lhKGJKtcnVWUEEXLTsPrspx7BV/Vz/Z4l4U37hlIi8pbva8lNJCZUTszDhrHRogvNz/NBWnmWcpUlaxJ2HWbwXqIFxQXRqhegiLEJdpxJSKedMLNR4D3se/lPVCEJ20dmouY62wBOyXuWhPMbKH5yWc9/OSafG+i3wG2Z6Qx9R0vazTxE106bJOTE9Fd7OcN3Pyu9N3A/edrVcPcyBJmUkUvNT09tKWFHuD0/MSn3QyeKdIIsboG8infL4A5V7LFV+MUTprX2e8M/TjdpuFi3UFbf3nZhehRwhVkFZobqtZZcfKnEKc5WLgJ815jyvDFtWZLFY56khnCrv7MSsVdmonGGVOuQfLq5g7bZTW8dI+ZWXlUQ1lHa9rTBHP7iGMYcq5O9RSF+v7y2FlGVJegOnadXzkwqKeY5+OjMzJeDRvvj05rCDen3gODfJOpkVugo4HTgROFnbbZqc2yrVqaZGfnNsGqM18SdVSVkh69apcugHwLPA7SohWRDYokULmsPf6qtUFOay8z8AAAAASUVORK5CYII=";
  // Lock the buddy as the icon; ignore runtime overrides
  const LOCK_BUDDY_ICON = true;
  
  const STORAGE_KEYS = {
    apiKey: 'tmw_api_key',
    items: 'tmw_items_dict', // { ts: number, itemsById: {...}, idByName: {...} }
    marketCache: 'tmw_market_cache', // { [itemId]: { ts: number, median: number, min: number, sample: number } }
    watchlist: 'tmw_watchlist', // { [itemId]: { name: string, target: number } }
    settings: 'tmw_settings', // { goodThreshold, overpriceMultiplier, refreshSeconds, apiBase, dockIconLight, dockIconDark, dockShape, minimal, colorblind, showOnlyDeals, hideOverpriced, alwaysConfirm, disableOverConfirm, sounds, quiet, compactBadges, badgePosition, openOnHit, monitorEnabled, monitorIntervalSec }
    monitor: 'tmw_monitor', // { [itemId]: { min:number|null, ts:number, alertedTs?:number } }
    ui: 'tmw_ui_state', // { dock:{x:number,y:number}, open:boolean, apiCollapsed?:boolean }
    mutes: 'tmw_mutes', // { [itemId]: number (muteUntilTs) }
    hits: 'tmw_hits', // [ { ts, itemId, name, price, target } ]
    userIcon: 'tmw_user_icon', // data URL for custom dock icon
  };

  // Defaults
  const DEFAULTS = {
    goodThreshold: 0.9, // price <= 90% of median -> good deal
    overpriceMultiplier: 1.75, // price >= 175% of median -> warn on buy
    refreshSeconds: 60,
    itemsTtlMs: 24 * 60 * 60 * 1000, // 24h
    marketTtlMs: 60 * 1000, // 60s
    minimal: false,
    dockShape: 'circle', // circle only
    colorblind: false,
    showOnlyDeals: false,
    hideOverpriced: false,
    alwaysConfirm: false,
    disableOverConfirm: false,
    sounds: true,
    volume: 0.08,
    compactBadges: false,
    badgePosition: 'name', // or 'price'
    openOnHit: false,
    monitorEnabled: false,
    monitorIntervalSec: 30,
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
      // Emblem is hardwired for all users (owner can change in script only)
      dockIconLight: DOCK_ICON_DEFAULT_LIGHT,
      dockIconDark: DOCK_ICON_DEFAULT_DARK,
      dockShape: s.dockShape || DEFAULTS.dockShape,
      minimal: s.minimal != null ? !!s.minimal : DEFAULTS.minimal,
      // Colorblind palette disabled by default per owner request
      colorblind: false,
      showOnlyDeals: s.showOnlyDeals != null ? !!s.showOnlyDeals : DEFAULTS.showOnlyDeals,
      hideOverpriced: s.hideOverpriced != null ? !!s.hideOverpriced : DEFAULTS.hideOverpriced,
      alwaysConfirm: s.alwaysConfirm != null ? !!s.alwaysConfirm : DEFAULTS.alwaysConfirm,
      disableOverConfirm: s.disableOverConfirm != null ? !!s.disableOverConfirm : DEFAULTS.disableOverConfirm,
      sounds: s.sounds != null ? !!s.sounds : DEFAULTS.sounds,
      volume: (s.volume != null ? Number(s.volume) : DEFAULTS.volume),
      compactBadges: s.compactBadges != null ? !!s.compactBadges : DEFAULTS.compactBadges,
      badgePosition: s.badgePosition || DEFAULTS.badgePosition,
      openOnHit: s.openOnHit != null ? !!s.openOnHit : DEFAULTS.openOnHit,
      monitorEnabled: s.monitorEnabled != null ? !!s.monitorEnabled : DEFAULTS.monitorEnabled,
      monitorIntervalSec: Number(s.monitorIntervalSec || DEFAULTS.monitorIntervalSec),
    };
  }

  function setSettings(next) {
    GM_setValue(STORAGE_KEYS.settings, next);
  }

  function getMonitorState() { return GM_getValue(STORAGE_KEYS.monitor, {}); }
  function setMonitorState(obj) { GM_setValue(STORAGE_KEYS.monitor, obj || {}); }
  function getMutes() { return GM_getValue(STORAGE_KEYS.mutes, {}); }
  function setMutes(m) { GM_setValue(STORAGE_KEYS.mutes, m||{}); }
  function getHits() { return GM_getValue(STORAGE_KEYS.hits, []); }
  function pushHit(hit) {
    try {
      const arr = getHits();
      arr.unshift(hit);
      while (arr.length > 20) arr.pop();
      GM_setValue(STORAGE_KEYS.hits, arr);
      if (ui.panel && ui.panel.style.display === 'block') {
        renderSettingsPanel();
      }
    } catch (_) {}
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

  // Compact currency formatter (e.g., $1.2k, $3.4m, $2.1b)
  function fmtMoneyCompact(n) {
    if (n == null || isNaN(n)) return '-';
    const num = Number(n);
    const abs = Math.abs(num);
    if (abs >= 1e9) return '$' + (num / 1e9).toFixed(1).replace(/\.0$/, '') + 'b';
    if (abs >= 1e6) return '$' + (num / 1e6).toFixed(1).replace(/\.0$/, '') + 'm';
    if (abs >= 1e3) return '$' + (num / 1e3).toFixed(1).replace(/\.0$/, '') + 'k';
    return '$' + Math.round(num).toLocaleString();
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
    .tmw-good-cb { background: rgba(30, 144, 255, 0.14) !important; border-left: 3px solid #1e90ff !important; }
    .tmw-bad-cb { background: rgba(255, 165, 0, 0.18) !important; border-left: 3px solid #ff9900 !important; }
    .tmw-watch { background: rgba(0, 120, 255, 0.12) !important; border-left: 3px solid #3498db !important; }
    .tmw-banner { position:fixed; top:12px; right:12px; z-index:2147483646; background:#fff3cd; color:#856404; border:1px solid #ffeeba; padding:8px 12px; border-radius:6px; box-shadow:0 6px 24px rgba(0,0,0,0.1); }
    .tmw-link { color:#2d6cdf; cursor:pointer; text-decoration:underline; }
    .tmw-menu { position:absolute; background:#111827; color:#e5e7eb; border:1px solid #1f2937; border-radius:8px; box-shadow:0 12px 40px rgba(0,0,0,.45); font-size:12px; padding:6px; z-index:2147483646; min-width:180px; }
    .tmw-menu .tmw-menu-item { padding:6px 8px; border-radius:6px; cursor:pointer; }
    .tmw-menu .tmw-menu-item:hover { background:#1f2937; }
    .tmw-menu .tmw-input { width:100%; margin-top:6px; padding:6px 8px; border-radius:6px; border:1px solid #374151; background:#0b1220; color:#e5e7eb; }
    .tmw-menu .tmw-actions { display:flex; gap:6px; justify-content:flex-end; margin-top:6px; }
    .tmw-menu button { background:#2563eb; color:#fff; border:none; padding:6px 8px; border-radius:6px; cursor:pointer; }
  `);

  // -----------------------
  // API Layer with caching
  // -----------------------
  // Use GM_xmlhttpRequest to avoid page-level interception of requests containing the key.
  let __lastReqTs = 0;
  let __backoffUntil = 0;
  async function apiFetchJson(url) {
    const apikey = getApiKey();
    if (!apikey) throw new Error('No API key set');
    const s = getSettings();
    // simple pacing
    const nowTs = Date.now();
    const spacing = Number(s.queueIntervalMs||1500);
    const wait = Math.max(0, spacing - (nowTs - __lastReqTs));
    if (wait>0) await sleep(wait);
    if (__backoffUntil && Date.now() < __backoffUntil) { await sleep(__backoffUntil - Date.now()); }
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
          __lastReqTs = Date.now();
          if (resp.status === 429) { __backoffUntil = Date.now() + 2*60*1000; notify('Cooling down after rate limit'); return reject(new Error('429')); }
          try {
            const j = JSON.parse(resp.responseText || 'null');
            if (!j) return reject(new Error('Empty response'));
            if (j.error) return reject(new Error(`Torn API error: ${j.error.code} ${j.error.error}`));
            resolve(j);
          } catch (e) { reject(e); }
        },
        onerror: () => { __lastReqTs = Date.now(); reject(new Error('Network error')); },
        ontimeout: () => { __lastReqTs = Date.now(); reject(new Error('Network timeout')); },
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
  const ui = { host: null, shadow: null, dock: null, panel: null, isDragging:false, dragMoved:false, justDragged:false };
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
        .dock-btn { position:relative; width:56px; height:56px; border-radius:22px; color:#e2e8f0; border:1px solid rgba(148,163,184,.18);
          box-shadow: 0 18px 32px rgba(8,15,40,.55), inset 0 0 0 1px rgba(148,163,184,.08);
          cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:24px; transition: transform .18s ease, filter .2s ease, box-shadow .22s ease;
          background: linear-gradient(155deg, rgba(30,41,59,.9), rgba(15,23,42,.96)), radial-gradient(circle at 30% 18%, rgba(148,197,253,.28), rgba(15,23,42,0) 58%);
          overflow:hidden; backdrop-filter: blur(6px);
        }
        .dock-btn::before { content:""; position:absolute; inset:3px; border-radius:18px; background: linear-gradient(160deg, rgba(59,130,246,.22), rgba(30,64,175,0) 70%);
          opacity:.85; transition: opacity .22s ease; pointer-events:none; }
        .dock-btn::after { content:""; position:absolute; inset:0; border-radius:22px; border:1px solid rgba(148,197,253,.65);
          opacity:0; transition: opacity .22s ease; pointer-events:none; }
        .dock-btn:hover { transform: translateY(-2px); box-shadow: 0 26px 38px rgba(2,6,23,.62), inset 0 0 0 1px rgba(148,163,184,.12);
          filter: brightness(1.05); }
        .dock-btn:hover::before { opacity:1; }
        .dock-btn:hover::after { opacity:0.9; }
        .dock-btn:active { transform: translateY(0) scale(.97); box-shadow: inset 0 6px 14px rgba(2,6,23,.65), inset 0 0 0 1px rgba(148,163,184,.18); }
        .dock-btn.tmw-breathe { animation: tmw-breath 3.2s ease-in-out infinite alternate; }
        .dock-btn.tmw-pop { animation: tmw-pop 600ms ease; }
        .dock-btn.tmw-spin { animation: tmw-spin 480ms ease-out; }
        /* Irritated effect */
        .dock-btn.tmw-irritated { animation: tmw-shake 600ms cubic-bezier(.36,.07,.19,.97) both; }
        .dock-btn.tmw-irritated .icon-preview { filter: drop-shadow(0 0 10px rgba(255,59,48,.8)); }
        .dock-btn.tmw-irritated::before { opacity:1; }
        .dock-btn.tmw-irritated::after { opacity:1; }
        /* Hover yell: show sound waves and tilt */
        .dock-btn .yell { position:absolute; left:-6px; top:50%; width:12px; height:12px; transform: translate(-50%, -50%) rotate(35deg) scale(.9); opacity:0; pointer-events:none; }
        .dock-btn .yell, .dock-btn .yell::before, .dock-btn .yell::after { box-sizing:border-box; border:2px solid #fca5a5; border-left-color: transparent; border-top-color: transparent; border-bottom-color: transparent; border-radius:50%; filter: drop-shadow(0 0 6px rgba(252,165,165,.35)); }
        .dock-btn .yell::before { content:""; position:absolute; inset:-6px; opacity:.75; }
        .dock-btn .yell::after { content:""; position:absolute; inset:-12px; opacity:.55; }
        .dock-btn:hover .yell { opacity:1; animation: tmw-yell 900ms ease-out infinite; }
        .dock-btn:hover .icon-preview, .dock-btn:hover #tmw-emoji { transform: scale(1.08) rotate(-6deg); }
        .dock-btn.state-active { background: linear-gradient(155deg, rgba(30,41,59,.9), rgba(15,23,42,.96)), radial-gradient(circle at 30% 18%, rgba(59,130,246,.35), rgba(15,23,42,0) 58%); }
        .dock-btn.state-paused { background: linear-gradient(155deg, rgba(127,29,29,.92), rgba(153,27,27,.88)), radial-gradient(circle at 28% 18%, rgba(252,165,165,.35), rgba(76,5,5,0) 60%); }
        .dock-btn.state-cooling { background: linear-gradient(155deg, rgba(124,45,18,.9), rgba(180,83,9,.9)), radial-gradient(circle at 28% 18%, rgba(255,214,165,.35), rgba(68,29,10,0) 60%); }
        .dock-btn .flare { position:absolute; top:-10px; right:-10px; width:30px; height:30px; border-radius:50%; background: radial-gradient(circle, rgba(255,99,71,.9), rgba(255,99,71,0));
          opacity:0; transform: scale(.6); transition: opacity .18s ease, transform .18s ease; filter: blur(.2px); pointer-events:none; box-shadow:0 0 18px rgba(248,113,113,.55); }
        .dock-btn .flare::after { content:"!!"; position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font:700 12px/1 "JetBrains Mono", monospace; color:#fff7ed; text-shadow:0 0 6px rgba(248,113,113,.8); }
        .dock-btn.tmw-irritated .flare { opacity:1; transform: scale(1); }
        /* Alternative dock shapes */
        .shape-tag .dock-btn { border-radius:10px; width:50px; height:36px; padding-left:8px; clip-path: polygon(0% 0%, 72% 0%, 86% 50%, 72% 100%, 0% 100%); }
        .shape-tag .ring { display:none; }
        .shape-tag .badge { bottom:-2px; left:-6px; }
        
        .ring { position:absolute; inset:-4px; border-radius:26px; pointer-events:none; background: conic-gradient(#93c5fd 0deg, transparent 0deg); opacity:.55; filter: blur(.4px); }
        .badge { position:absolute; bottom:-4px; left:-4px; min-width:18px; height:18px; padding:0 6px; border-radius:999px; background:#ef4444; color:#fff; font-size:10px; line-height:18px; display:flex; align-items:center; justify-content:center; box-shadow:0 6px 14px rgba(239,68,68,.55); }
        .dot { position:absolute; top:6px; right:6px; width:9px; height:9px; border-radius:50%; background:#10b981; box-shadow:0 0 10px rgba(16,185,129,.75); display:none; }
        .dot.show { display:block; }
        .panel { position:fixed; bottom:54px; right:0; width:340px; max-height:70vh; background:rgba(15,23,42,0.9); color:#f1f5f9; border-radius:18px; box-shadow:0 20px 52px rgba(15,23,42,.48); border:1px solid rgba(99,102,241,.2); display:none; overflow:hidden; transform-origin: bottom right; backdrop-filter: blur(14px); }
        .panel::before, .panel::after, .panel .stars { content:""; position:absolute; inset:-35%; border-radius:48px; pointer-events:none; opacity:0; transition: opacity .52s ease; }
        .panel::before { background:
            radial-gradient(70% 62% at 18% 12%, rgba(59,130,246,.32), transparent 70%),
            radial-gradient(55% 58% at 88% 6%, rgba(236,72,153,.28), transparent 74%),
            radial-gradient(65% 70% at 46% 104%, rgba(56,189,248,.24), transparent 78%);
          filter: blur(62px); mix-blend-mode: screen; animation: tmw-aurora-pulse 18s ease-in-out infinite; }
        .panel::after { background: linear-gradient(125deg, rgba(59,130,246,.40), rgba(236,72,153,.36), rgba(16,185,129,.34), rgba(59,130,246,.4));
          background-size:240% 240%; mix-blend-mode: screen; animation: tmw-aurora-flow 22s ease-in-out infinite; }
        .panel .stars { inset:-20%; border-radius:32px; background:
            radial-gradient(2px 2px at 10% 20%, rgba(226,232,240,.9), transparent 55%),
            radial-gradient(1.5px 1.5px at 30% 45%, rgba(148,197,253,.7), transparent 60%),
            radial-gradient(1.8px 1.8px at 70% 30%, rgba(191,219,254,.8), transparent 65%),
            radial-gradient(1.4px 1.4px at 55% 75%, rgba(226,232,240,.7), transparent 65%),
            radial-gradient(2px 2px at 85% 60%, rgba(191,219,254,.85), transparent 60%),
            radial-gradient(1.2px 1.2px at 42% 18%, rgba(226,232,240,.65), transparent 60%);
          opacity:.55; filter: blur(.2px); animation: tmw-stars-twinkle 8s ease-in-out infinite; }
        .panel.tmw-active::before { opacity:.55; }
        .panel.tmw-active::after { opacity:.68; }
        .panel.tmw-active .stars { opacity:.7; }
        .hdr { display:flex; align-items:center; justify-content:space-between; padding:10px 12px; border-bottom:1px solid #1f2937; }
        .ttl { font-weight:700; font-size:14px; letter-spacing:.2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .xbtn { background:none; border:none; color:#9ca3af; font-size:18px; cursor:pointer; }
        .cnt { padding:12px; overflow-y:auto; max-height: calc(70vh - 48px); overscroll-behavior: contain; }
        .brand-wrap { display:flex; align-items:center; gap:6px; position:relative; }
        .brand { font-family: ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif; font-style: italic; font-weight:600; opacity:.92;
          background: linear-gradient(120deg, #60a5fa 0%, #c084fc 45%, #34d399 90%);
          -webkit-background-clip: text; color: transparent; text-shadow:0 8px 18px rgba(37,99,235,.28);
        }
        .brand-glow { position:absolute; inset:-12px -16px -12px -16px; border-radius:24px; pointer-events:none;
          background: radial-gradient(120% 80% at 10% 30%, rgba(59,130,246,.22), transparent 70%),
                      radial-gradient(110% 85% at 80% 10%, rgba(236,72,153,.18), transparent 75%),
                      radial-gradient(120% 90% at 50% 120%, rgba(16,185,129,.16), transparent 85%);
          opacity:.65; filter: blur(26px); mix-blend-mode: screen;
          animation: tmw-aurora-glow 18s ease-in-out infinite; }
        label { display:block; font-size:12px; margin:6px 0 2px; color:#9ca3af; }
        input[type="text"], input[type="number"], input[type="password"] { width:100%; padding:8px; border-radius:8px; border:1px solid #374151; background:#0b1220; color:#e5e7eb; }
        .inline { display:flex; gap:8px; align-items:center; }
        .icon-preview { width:36px; height:36px; border-radius:10px; object-fit:contain; border:none; filter: drop-shadow(0 1px 3px rgba(2,6,23,.65)); transition: transform .18s ease, filter .18s ease; }
        #tmw-emoji { font-size:24px; transition: transform .18s ease, filter .18s ease; filter: drop-shadow(0 3px 6px rgba(15,23,42,.55)); }
        .dock-btn:hover .icon-preview { transform: scale(1.06); filter: drop-shadow(0 3px 8px rgba(37,99,235,.45)); }
        .dock-btn:hover #tmw-emoji { filter: drop-shadow(0 4px 10px rgba(37,99,235,.55)); }
        /* Signature SVG monogram (always shown with lightning effect) */
        
        @keyframes tmw-volt { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -120; } }
        @keyframes tmw-zap { 0%,18%{ opacity:.85 } 19%{ opacity:.6 } 21%{ opacity:1 } 48%{ opacity:.9 } 51%{ opacity:.7 } 70%{ opacity:1 } 100%{ opacity:.85 } }
        .row { display:flex; gap:8px; }
        .row > * { flex:1; }
        .actions { display:flex; gap:8px; justify-content:flex-end; margin-top:10px; }
        button.primary { background:#2563eb; border:none; color:#fff; padding:8px 10px; border-radius:8px; cursor:pointer; }
        button.secondary { background:#374151; border:none; color:#e5e7eb; padding:8px 10px; border-radius:8px; cursor:pointer; }
        .muted { color:#9ca3af; font-size:12px; }
        .list { margin-top:8px; max-height:160px; overflow:auto; border:1px solid #1f2937; border-radius:8px; }
        .item { display:flex; align-items:center; justify-content:space-between; padding:8px 10px; border-bottom:1px solid #1f2937; font-size:12px; }
        .item:last-child { border-bottom:none; }
        .list-header { margin-top:14px; margin-bottom:4px; font-size:12px; font-weight:600; color:#cbd5e1; }
        .panel-intro { margin-bottom:12px; }
        .panel-heading { font-size:13px; font-weight:600; color:#e5e7eb; }
        .panel-sub { font-size:11px; color:#9ca3af; margin-top:2px; }
        .section-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:10px; }
        .stat-card { background:#0f172a; border:1px solid #1f2937; border-radius:10px; padding:12px; display:flex; flex-direction:column; gap:6px; }
        .stat-label { font-size:11px; text-transform:uppercase; letter-spacing:.4px; color:#9ca3af; }
        .stat-value { font-size:16px; font-weight:600; color:#e5e7eb; }
        .stat-meta { font-size:11px; color:#94a3b8; }
        .hit-meta { font-size:11px; color:#94a3b8; margin-top:4px; display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
        .hit-meta a { color:#93c5fd; text-decoration:none; font-weight:600; }
        .hit-meta a:hover { text-decoration:underline; }
        .toggle-stack { display:flex; flex-direction:column; gap:6px; margin-top:12px; }
        .toggle { display:flex; gap:10px; align-items:center; padding:8px 10px; border-radius:10px; border:1px solid #1f2937; background:#0b1220; color:#e5e7eb; font-size:12px; }
        .toggle input { margin:0; accent-color:#2563eb; }
        .form-split { display:flex; gap:8px; flex-wrap:wrap; margin-top:10px; }
        .form-split > div { flex:1 1 150px; }
        .section-note { font-size:11px; color:#94a3b8; margin-top:8px; }
        @keyframes tmw-breath { from { transform: translateY(0) scale(1); } to { transform: translateY(-0.5px) scale(1.03); } }
        @keyframes tmw-pop { 0%{ transform: scale(1);} 40%{ transform: scale(1.08);} 100%{ transform: scale(1);} }
        @keyframes tmw-spin { from{ transform: rotate(0deg);} to{ transform: rotate(360deg);} }
        @keyframes tmw-panel-in { from { transform: translateY(8px) scale(0.98); opacity:0; } to { transform: translateY(0) scale(1); opacity:1; } }
        @keyframes tmw-flicker { 0%{ opacity:.25; } 40%{ opacity:.45; } 55%{ opacity:.2; } 80%{ opacity:.4; } 100%{ opacity:.25; } }
        @keyframes tmw-rotate { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
        .panel.tmw-anim-in { animation: tmw-panel-in 320ms cubic-bezier(.2,.7,.2,1); }
        @keyframes tmw-aurora-flow { 0%{ background-position:0% 50%; } 25%{ background-position:50% 40%; } 50%{ background-position:100% 60%; } 75%{ background-position:50% 70%; } 100%{ background-position:0% 50%; } }
        @keyframes tmw-aurora-pulse { 0%{ transform: translate3d(0,0,0) scale(1); } 30%{ transform: translate3d(-3%,2%,0) scale(1.04); } 60%{ transform: translate3d(2%,-3%,0) scale(1.07); } 100%{ transform: translate3d(0,0,0) scale(1); } }
        @keyframes tmw-stars-twinkle { 0%,100% { opacity:.6; transform: translate3d(0,0,0); } 30% { opacity:.85; transform: translate3d(-1%,-2%,0); } 55% { opacity:.5; transform: translate3d(1%,2%,0); } 80% { opacity:.75; transform: translate3d(-0.5%,1%,0); } }
        @keyframes tmw-aurora-glow { 0%{ transform: translate3d(0,0,0) scale(1); opacity:.6; } 40%{ transform: translate3d(-2%,1%,0) scale(1.05); opacity:.8; } 70%{ transform: translate3d(2%,-1%,0) scale(1.08); opacity:.55; } 100%{ transform: translate3d(0,0,0) scale(1); opacity:.6; }
        @keyframes tmw-pulse { 0%{ transform: scale(1); opacity:.8;} 70%{ transform: scale(1.35); opacity:.3;} 100%{ transform: scale(1); opacity:.8;} }
        .idle-dot { display:inline-block; width:6px; height:6px; border-radius:50%; background:#93c5fd; margin-left:8px; box-shadow:0 0 8px rgba(59,130,246,.6); animation: tmw-pulse 2.2s ease-in-out infinite; vertical-align:middle; }
        @media (prefers-reduced-motion: reduce) { .dock-btn.tmw-breathe, .dock-btn.tmw-pop, .dock-btn.tmw-spin, .dock-btn.tmw-irritated, .dock-btn .yell, .panel.tmw-anim-in, .idle-dot, .panel::before { animation: none !important; } }
        @keyframes tmw-yell { 0% { transform: translate(-50%, -50%) rotate(35deg) scale(.85); opacity:.9; } 70% { opacity:1; } 100% { transform: translate(-50%, -50%) rotate(35deg) scale(1.1); opacity:.6; } }
        @keyframes tmw-shake {
          10% { transform: translate(-1px,0) rotate(-2deg); }
          20% { transform: translate(2px,0) rotate(2deg); }
          30% { transform: translate(-3px,0) rotate(-3deg); }
          40% { transform: translate(3px,0) rotate(3deg); }
          50% { transform: translate(-4px,0) rotate(-2deg); }
          60% { transform: translate(4px,0) rotate(2deg); }
          70% { transform: translate(-3px,0) rotate(-1deg); }
          80% { transform: translate(3px,0) rotate(1deg); }
          90% { transform: translate(-2px,0) rotate(0deg); }
          100% { transform: translate(0,0) rotate(0); }
        }
        .tmw-modal { position:fixed; inset:0; z-index:2147483647; display:flex; align-items:center; justify-content:center; }
        .tmw-backdrop { position:absolute; inset:0; background:rgba(0,0,0,.5); }
        .tmw-sheet { position:relative; width:360px; max-width:90vw; background:#0b1220; color:#e5e7eb; border:1px solid #1f2937; border-radius:12px; box-shadow:0 12px 40px rgba(0,0,0,.45); padding:12px; }
        .tmw-sheet h3 { margin:0 0 8px 0; font-size:14px; }
        .tmw-row { display:flex; gap:8px; margin:6px 0; }
        .tmw-row > div { flex:1; }
        .tmw-actions { display:flex; gap:8px; justify-content:flex-end; margin-top:10px; }
        .api-pill { background:#0f5132; border:1px solid #14532d; color:#d1fae5; display:inline-block; padding:6px 10px; border-radius:999px; font-size:12px; }
        details.section { border:1px solid #1f2937; border-radius:10px; margin:8px 0; background:#0b1220; }
        details.section > summary { cursor:pointer; padding:8px 10px; font-weight:600; color:#cbd5e1; outline:none; list-style:none; }
        details.section > summary::-webkit-details-marker{ display:none; }
        details.section[open] > summary { border-bottom:1px solid #1f2937; }
        .sec-body { padding:10px; }
        /* Radial side menu */
        .tmw-radial { position:fixed; inset:0; z-index:2147483647; pointer-events:none; }
        .tmw-radial .bg { position:absolute; inset:0; backdrop-filter: blur(0px); pointer-events:auto; background: rgba(0,0,0,0); }
        .tmw-radial .node { position:absolute; width:36px; height:36px; border-radius:50%; background:#111827; color:#e5e7eb; border:1px solid #1f2937; box-shadow:0 8px 24px rgba(0,0,0,.35); display:flex; align-items:center; justify-content:center; font-size:12px; pointer-events:auto; cursor:pointer; transition: box-shadow .2s ease, transform .2s ease; }
        .tmw-radial .node:hover { background:#1f2937; box-shadow:0 10px 28px rgba(59,130,246,.4); transform: translateY(-1px); }
        .tmw-radial .legend { position:absolute; padding:4px 8px; border-radius:8px; background:#111827; color:#9ca3af; border:1px solid #1f2937; font-size:11px; box-shadow:0 8px 24px rgba(0,0,0,.35); pointer-events:none; white-space:nowrap; }
        /* (audio hint removed) */
      </style>
      <div class="dock" id="tmw-dock">
        <button class="dock-btn" id="tmw-dock-btn" title="Open Market Watcher" aria-label="Open Market Watcher">
          <span id="tmw-emoji">🐶</span>
          <img id="tmw-icon-img" class="icon-preview" style="display:none" alt="icon"/>
          <span class="yell" aria-hidden="true"></span>
          <span class="flare" aria-hidden="true"></span>
          <span class="ring" id="tmw-ring"></span>
          <span class="dot" id="tmw-dot"></span>
          <span class="badge" id="tmw-count" style="display:none" role="status" aria-live="polite">0</span>
        </button>
      </div>
      
      <div class="panel" id="tmw-panel">
        <div class="stars" aria-hidden="true"></div>
        <div class="hdr">
          <div class="ttl brand-wrap"><span class="brand-glow" aria-hidden="true"></span><span class="brand">lvciid's</span> <span class="brand">Market Watcher</span> <span class="idle-dot" title="Active"></span></div>
          <button class="xbtn" id="tmw-close">×</button>
        </div>
        <div class="cnt" id="tmw-cnt"></div>
      </div>
    `;
    ui.host = host; ui.shadow = shadow;
    ui.dock = shadow.getElementById('tmw-dock');
    ui.panel = shadow.getElementById('tmw-panel');
    const btn = shadow.getElementById('tmw-dock-btn');
    btn.classList.add('tmw-breathe');
    btn.addEventListener('click', (e) => {
      if (ui.isDragging || ui.justDragged) { e.preventDefault(); return; }
      if (e.shiftKey) {
        const s = getSettings(); s.hideOverpriced = !s.hideOverpriced; setSettings(s); notify('Toggled hide-overpriced'); scanDomSoon(); return;
      }
      togglePanel(ui.panel.style.display !== 'block');
      try { irritateDock(); } catch(_) {}
    });
    btn.addEventListener('dblclick', (e) => { e.preventDefault(); const s = getSettings(); s.showOnlyDeals = !s.showOnlyDeals; setSettings(s); notify('Toggled deals-only'); scanDomSoon(); });
    btn.addEventListener('contextmenu', (e) => { e.preventDefault(); openRadialMenu(e); });
    shadow.getElementById('tmw-close').addEventListener('click', () => togglePanel(false));
    enableDockDrag();
    GM_registerMenuCommand('TMW: Open Settings', () => togglePanel(true));
    updateDockState();
    enforceBrand();
    applyDockIcon();
    applyDockShape();
    if (!LOCK_BUDDY_ICON) bindCustomIconInputs();
    try {
      const mq = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
      if (mq && mq.addEventListener) mq.addEventListener('change', applyDockIcon);
      else if (mq && mq.addListener) mq.addListener(applyDockIcon);
    } catch(_) {}
    // Keyboard shortcuts
    window.addEventListener('keydown', (ev) => {
      // Ignore when typing in inputs or inside our UI
      const tag = (ev.target && ev.target.tagName) ? ev.target.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea' || (ev.target && (ev.target.isContentEditable || ui.shadow.contains(ev.target)))) return;
      if (ev.altKey && !ev.shiftKey && !ev.ctrlKey && !ev.metaKey && (ev.key === 'w' || ev.key === 'W')) {
        ev.preventDefault(); togglePanel(ui.panel.style.display !== 'block');
      } else if (ev.key === 'Escape' && ui.panel.style.display === 'block') {
        togglePanel(false);
      } else if (ev.altKey && !ev.shiftKey && !ev.ctrlKey && !ev.metaKey && (ev.key === 'p' || ev.key === 'P')) {
        const s = getSettings(); s.paused = !s.paused; setSettings(s); notify(s.paused?'Paused':'Resumed');
      }
    });
  }

  function applyDockIcon() {
    try {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const { dockIconLight, dockIconDark } = getSettings();
      const userIcon = (typeof GM_getValue === 'function') ? (GM_getValue(STORAGE_KEYS.userIcon, '') || '') : '';
      const BUDDY_FALLBACK_URL = 'https://lvciid.github.io/lvciids-market-watcher/assets/buddy.png';
      // Prefer baked buddy, then user override, then theme default
      let dockIcon = CUSTOM_ICON_URL || userIcon || (prefersDark ? (dockIconDark || dockIconLight) : (dockIconLight || dockIconDark));
      const btn = ui.shadow.getElementById('tmw-dock-btn');
      const emoji = ui.shadow.getElementById('tmw-emoji');
      const img = ui.shadow.getElementById('tmw-icon-img');
      if (!dockIcon || dockIcon === '🐶') {
        // default to owner-provided LV SVG
        img.src = prefersDark ? DOCK_ICON_DEFAULT_DARK : DOCK_ICON_DEFAULT_LIGHT;
        img.style.display = '';
        emoji.style.display = 'none';
      } else if (/^(https?:|data:)/i.test(dockIcon)) {
        img.onerror = null;
        img.src = dockIcon;
        img.style.display = '';
        emoji.style.display = 'none';
      } else {
        // treat as text/emoji
        emoji.textContent = dockIcon;
        emoji.style.display = '';
        img.style.display = 'none';
        img.removeAttribute('src');
      }
      // If data: URLs are blocked by CSP, fall back to hosted PNG
      if (img && CUSTOM_ICON_URL && /^data:/i.test(CUSTOM_ICON_URL)) {
        img.onerror = () => { try { img.onerror = null; img.src = BUDDY_FALLBACK_URL; } catch(_) {} };
        if (img.complete && img.naturalWidth === 0) { try { img.src = BUDDY_FALLBACK_URL; } catch(_) {} }
      }
      // Style font-based emblem (fallback only)
      if (emoji && emoji.style.display !== 'none') { emoji.style.fontFamily = "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif"; emoji.style.fontStyle='italic'; emoji.style.fontWeight='600'; emoji.style.textShadow='0 1px 0 rgba(0,0,0,.25), 0 0 6px rgba(255,255,255,.25)'; }
    } catch(_) {}
  }

  // Make the dock look irritated and hop around briefly
  function irritateDock() {
    try {
      const btn = ui.shadow.getElementById('tmw-dock-btn');
      const dock = ui.shadow.getElementById('tmw-dock');
      if (!btn || !dock) return;
      btn.classList.add('tmw-irritated');
      setTimeout(() => { try { btn.classList.remove('tmw-irritated'); } catch(_) {} }, 520);
      rageBounce(dock, 8, 26);
    } catch(_) {}
  }

  // Quick hops by applying a temporary translate() on the dock container
  function rageBounce(el, hops = 7, radius = 28) {
    let i = 0; let canceled = false;
    const origTransform = el.style.transform || 'translate(0,0)';
    const doHop = () => {
      if (canceled) return;
      if (i++ >= hops) {
        el.style.transition = 'transform 110ms cubic-bezier(.2,.7,.2,1.2)';
        el.style.transform = 'translate(0,0) scale(1.0, 0.96)';
        setTimeout(() => { el.style.transform = 'translate(0,0)'; }, 70);
        return;
      }
      const angle = Math.random() * Math.PI * 2;
      const dist = 10 + Math.random() * radius;
      const x = Math.cos(angle) * dist;
      const y = -Math.abs(Math.sin(angle) * dist);
      el.style.transition = 'transform 130ms cubic-bezier(.2,.7,.2,1.2)';
      el.style.transform = `translate(${x}px, ${y}px)`;
      setTimeout(() => {
        el.style.transform = 'translate(0,0) scale(1.02, 0.96)';
        setTimeout(() => { el.style.transform = 'translate(0,0)'; doHop(); }, 60);
      }, 130);
    };
    // If user starts dragging, cancel bounce
    const onDown = () => { canceled = true; el.style.transform = origTransform; };
    window.addEventListener('mousedown', onDown, { once: true });
    doHop();
  }

  // Allow setting a custom icon by dropping/pasting/choosing an image
  function bindCustomIconInputs() {
    try {
      const btn = ui.shadow.getElementById('tmw-dock-btn'); if (!btn) return;
      const onDrop = (e) => {
        e.preventDefault();
        const f = (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) || null;
        if (f && f.type && f.type.startsWith('image/')) { fileToDataUrl(f).then(setUserIcon).catch(()=>{}); }
      };
      const onDrag = (e) => { e.preventDefault(); };
      btn.addEventListener('dragover', onDrag);
      btn.addEventListener('drop', onDrop);
      window.addEventListener('paste', (e) => {
        const items = (e.clipboardData && e.clipboardData.items) || [];
        for (const it of items) {
          if (it.type && it.type.startsWith('image/')) {
            const f = it.getAsFile(); if (f) { fileToDataUrl(f).then(setUserIcon).catch(()=>{}); }
          }
        }
      });
    } catch(_) {}
  }

  function openIconPicker() {
    try {
      const inp = document.createElement('input');
      inp.type = 'file'; inp.accept = 'image/*';
      inp.addEventListener('change', () => { const f = inp.files && inp.files[0]; if (f) fileToDataUrl(f).then(setUserIcon).catch(()=>{}); });
      inp.click();
    } catch(_) {}
  }

  function setUserIcon(dataUrl) {
    try { GM_setValue(STORAGE_KEYS.userIcon, dataUrl); applyDockIcon(); notify('Custom icon set'); } catch(_) {}
  }

  function clearUserIcon() {
    try { GM_deleteValue(STORAGE_KEYS.userIcon); applyDockIcon(); notify('Custom icon cleared'); } catch(_) {}
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result||''));
      fr.onerror = reject; fr.readAsDataURL(file);
    });
  }

  function applyDockShape() { try { const root = ui.shadow.getElementById('tmw-dock'); if (root) { root.classList.remove('shape-tag','shape-signature'); root.classList.add('shape-circle'); } } catch(_) {} }

  function enforceBrand() { /* no-op: only circle used */ }

  function applyDockVisualState() {
    try {
      const btn = ui.shadow.getElementById('tmw-dock-btn'); if (!btn) return;
      const s = getSettings();
      const cooling = (__backoffUntil && Date.now() < __backoffUntil);
      btn.classList.remove('state-active','state-paused','state-cooling');
      if (s.paused) btn.classList.add('state-paused');
      else if (cooling) btn.classList.add('state-cooling');
      else btn.classList.add('state-active');
    } catch(_) {}
  }

  function flashSignature() { /* removed */ }

  function updateDockState() {
    try {
      const dot = ui.shadow.getElementById('tmw-dot');
      const ring = ui.shadow.getElementById('tmw-ring');
      const countEl = ui.shadow.getElementById('tmw-count');
      const s = getSettings();
      const cooling = (__backoffUntil && Date.now() < __backoffUntil);
      const btn = ui.shadow.getElementById('tmw-dock-btn');
      dot.classList.remove('show');
      if (s.paused) {
        dot.style.background = '#ef4444'; // red
        dot.style.boxShadow = '0 0 6px rgba(239,68,68,.8)';
        dot.classList.add('show');
        ui.shadow.getElementById('tmw-dock-btn').title = 'Watchdog paused — click to open';
      } else if (cooling) {
        dot.style.background = '#f59e0b'; // amber
        dot.style.boxShadow = '0 0 6px rgba(245,158,11,.8)';
        dot.classList.add('show');
        ui.shadow.getElementById('tmw-dock-btn').title = 'Cooling down — click to open';
      } else {
        ui.shadow.getElementById('tmw-dock-btn').title = 'Open Market Watcher';
      }
      // Toggle state classes for deluxe gradients
      if (btn) {
        btn.classList.remove('state-active','state-paused','state-cooling');
        if (s.paused) btn.classList.add('state-paused');
        else if (cooling) btn.classList.add('state-cooling');
        else btn.classList.add('state-active');
      }
      // Progress ring for monitor
      if (ring) {
        let ang = 0;
        if (s.monitorEnabled) {
          const wl = getWatchlist(); const ids = Object.keys(wl);
          const st = getMonitorState(); const iv = Math.max(10, s.monitorIntervalSec||30)*1000;
          if (ids.length) {
            let minRemain = iv;
            for (const id of ids) {
              const last = st[id]?.ts||0; const age = Date.now()-last; const remain = Math.max(0, iv - age);
              if (remain < minRemain) minRemain = remain;
            }
            const pct = 1 - (minRemain/iv);
            ang = Math.max(0, Math.min(360, Math.round(pct*360)));
          }
        }
        ring.style.background = `conic-gradient(#93c5fd ${ang}deg, transparent 0deg)`;
        ring.style.opacity = s.monitorEnabled ? '.65' : '0';
      }
      if (countEl && (countEl.textContent||'0') === '0') countEl.style.display = 'none';
    } catch (_) {}
  }

  function openDockMenu(ev) {
    try {
      closeQuickMenu();
      const menu = document.createElement('div');
      menu.className = 'tmw-menu';
      const s = getSettings();
      const pausedLabel = s.paused ? 'Resume' : 'Pause';
      const dealsLabel = (s.showOnlyDeals ? '✓ ' : '') + (s.showOnlyDeals ? 'Show all' : 'Show deals only');
      const overLabel = (s.hideOverpriced ? '✓ ' : '') + (s.hideOverpriced ? 'Show overpriced' : 'Hide overpriced');
      const iconControls = !LOCK_BUDDY_ICON ? '<div class="tmw-menu-item" data-act="icon-choose">Set custom icon…</div>\n        <div class="tmw-menu-item" data-act="icon-clear">Clear custom icon</div>' : '';
      menu.innerHTML = `
        <div class="tmw-menu-item" data-act="toggle-pause">${pausedLabel}</div>
        <div class="tmw-menu-item" data-act="toggle-deals">${dealsLabel}</div>
        <div class="tmw-menu-item" data-act="toggle-over">${overLabel}</div>
        ${iconControls}
        <div class="tmw-menu-item" data-act="open-settings">Open settings</div>
        <div class="tmw-menu-item" data-act="extras">Extra settings…</div>
      `;
      document.body.appendChild(menu);
      const x = (ev.clientX || 0) + window.scrollX;
      const y = (ev.clientY || 0) + window.scrollY;
      menu.style.left = `${Math.min(x, window.scrollX + window.innerWidth - 196)}px`;
      menu.style.top = `${Math.min(y, window.scrollY + window.innerHeight - 160)}px`;
      tmwActiveMenu = menu;
      const onDoc = (e2) => { if (!menu.contains(e2.target)) { closeQuickMenu(); document.removeEventListener('mousedown', onDoc, true); } };
      document.addEventListener('mousedown', onDoc, true);
      menu.addEventListener('click', (e3) => {
        const act = e3.target.getAttribute('data-act'); if (!act) return;
        const st = getSettings();
        if (act === 'toggle-pause') { st.paused = !st.paused; setSettings(st); notify(st.paused?'Paused':'Resumed'); }
        else if (act === 'toggle-deals') { st.showOnlyDeals = !st.showOnlyDeals; setSettings(st); notify(st.showOnlyDeals ? 'Deals-only: ON' : 'Deals-only: OFF'); }
        else if (act === 'toggle-over') { st.hideOverpriced = !st.hideOverpriced; setSettings(st); notify(st.hideOverpriced ? 'Hide overpriced: ON' : 'Hide overpriced: OFF'); }
        else if (act === 'open-settings') { togglePanel(true); }
        else if (act === 'icon-choose') { if (!LOCK_BUDDY_ICON) openIconPicker(); }
        else if (act === 'icon-clear') { if (!LOCK_BUDDY_ICON) clearUserIcon(); }
        else if (act === 'extras') { openExtraSettings(); }
        closeQuickMenu(); updateDockState(); scanDomSoon();
      });
    } catch(_) {}
  }

  function openExtraSettings() {
    try {
      // Remove any existing
      const old = ui.shadow.getElementById('tmw-modal'); if (old) old.remove();
      const modal = document.createElement('div'); modal.id='tmw-modal'; modal.className='tmw-modal';
      modal.innerHTML = `
        <div class="tmw-backdrop"></div>
        <div class="tmw-sheet">
          <h3>Extra Settings</h3>
          <div class="tmw-row">
            <div>
              <label>Deal threshold</label>
              <input id="ex-good" type="number" step="0.01" min="0.5" max="1.0" value="${getSettings().goodThreshold}" />
            </div>
            <div>
              <label>Overprice multiplier</label>
              <input id="ex-over" type="number" step="0.05" min="1.2" max="5.0" value="${getSettings().overpriceMultiplier}" />
            </div>
          </div>
          <div class="tmw-row">
            <div>
              <label><input id="ex-always-confirm" type="checkbox" ${getSettings().alwaysConfirm ? 'checked' : ''}/> Always confirm before buy</label>
            </div>
            <div>
              <label><input id="ex-disable-overconfirm" type="checkbox" ${getSettings().disableOverConfirm ? 'checked' : ''}/> Disable overpriced confirm</label>
            </div>
          </div>
          <div class="tmw-row">
            <div>
              <label>Auto-refresh (s)</label>
              <input id="ex-refresh" type="number" min="15" max="300" value="${getSettings().refreshSeconds}" />
            </div>
            <div>
              <label>Queue spacing (ms)</label>
              <input id="ex-queue" type="number" min="750" max="5000" value="${getSettings().queueIntervalMs||1500}" />
            </div>
          </div>
          
          <div class="tmw-row">
            <div>
              <label>Sound volume</label>
              <div>
                <input id="ex-volume" type="range" min="0" max="100" value="${Math.round((getSettings().volume!=null?getSettings().volume:DEFAULTS.volume)*100)}" />
                <span class="muted" id="ex-volume-val">${Math.round((getSettings().volume!=null?getSettings().volume:DEFAULTS.volume)*100)}%</span>
                <button class="secondary" id="ex-test-sound" style="margin-left:6px;">Test</button>
              </div>
            </div>
            <div></div>
          </div>
          <div class="tmw-row">
            <div>
              <label>API base</label>
              <input id="ex-api" type="text" value="${escapeHtml(getSettings().apiBase||'')}" />
            </div>
            <div>
              <label>Dock shape</label>
              <select id="ex-dock-shape" style="width:100%; padding:6px; border-radius:6px; border:1px solid #374151; background:#0b1220; color:#e5e7eb;" disabled>
                <option value="circle" selected>Circle (fixed)</option>
              </select>
            </div>
          </div>
          <div class="tmw-row">
            <div>
              <button class="secondary" id="ex-clear-cache">Clear Market Cache</button>
            </div>
            <div class="tmw-actions">
              <button class="secondary" id="ex-reset-all">Reset to Defaults</button>
            </div>
          </div>
          <div class="tmw-actions">
            <button id="ex-cancel" class="secondary">Cancel</button>
            <button id="ex-save" class="primary">Save</button>
          </div>
        </div>
      `;
      ui.shadow.appendChild(modal);
      modal.querySelector('.tmw-backdrop').addEventListener('click', ()=> modal.remove());
      modal.querySelector('#ex-cancel').addEventListener('click', ()=> modal.remove());
      // live volume label
      try {
        const v = modal.querySelector('#ex-volume');
        const vv = modal.querySelector('#ex-volume-val');
        v.addEventListener('input', ()=>{ vv.textContent = `${v.value}%`; });
      } catch(_){}
      // test sound button
      try {
        modal.querySelector('#ex-test-sound').addEventListener('click', ()=>{
          try {
            const v = modal.querySelector('#ex-volume');
            const level = Math.max(0, Math.min(1, Number(v.value)/100));
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            g.gain.value = level; o.connect(g); g.connect(ctx.destination);
            o.type = 'sine'; o.frequency.value = 880; o.start();
            setTimeout(()=>{ o.stop(); ctx.close(); }, 160);
          } catch(_) {}
        });
      } catch(_){}

      // Clear Market Cache
      try {
        modal.querySelector('#ex-clear-cache').addEventListener('click', ()=>{
          try { setMarketCache({}); notify('Market cache cleared.'); scanDomSoon(); } catch(_) {}
        });
      } catch(_){}
      // Reset to defaults
      try {
        modal.querySelector('#ex-reset-all').addEventListener('click', ()=>{
          if (!confirm('Reset all settings, watchlist, overrides, and cache?')) return;
          try { setSettings({}); setWatchlist({}); setOverrides({}); setMarketCache({}); notify('All settings reset.'); modal.remove(); renderSettingsPanel(); } catch(_) {}
        });
      } catch(_){}

      modal.querySelector('#ex-save').addEventListener('click', ()=>{
        try {
          const good = Number(modal.querySelector('#ex-good').value);
          const over = Number(modal.querySelector('#ex-over').value);
          const rf = Number(modal.querySelector('#ex-refresh').value);
          const q = Number(modal.querySelector('#ex-queue').value)||1500;
          const base = String(modal.querySelector('#ex-api').value||API_BASE);
          const volPct = Math.max(0, Math.min(100, Number(modal.querySelector('#ex-volume').value)||Math.round((getSettings().volume||DEFAULTS.volume)*100)));
          setSettings({ ...getSettings(), goodThreshold: good, overpriceMultiplier: over, refreshSeconds: rf, queueIntervalMs: q, apiBase: base, volume: (volPct/100) });
          try { applyDockShape(); } catch(_) {}
          notify('Extra settings saved.'); modal.remove(); scanDomSoon();
        } catch(_) { notify('Failed to save settings'); }
      });
    } catch(_) {}
  }

  function openRadialMenu(ev) {
    try {
      // remove existing menus
      closeQuickMenu();
      const old = ui.shadow.getElementById('tmw-radial'); if (old) old.remove();
      const root = document.createElement('div'); root.id='tmw-radial'; root.className='tmw-radial';
      root.innerHTML = `<div class="bg"></div>`;
      ui.shadow.appendChild(root);

      const center = ui.shadow.getElementById('tmw-dock-btn').getBoundingClientRect();
      // In shadow fixed container, use viewport coords (no scroll offsets)
      const cx = center.left + center.width/2;
      const cy = center.top + center.height/2;
      const radius = 70;
      // Define nodes: [label, act]
      const s = getSettings();
      const items = [
        { t: s.paused ? '▶' : '⏸', a: 'toggle-pause' },
        { t: s.showOnlyDeals ? '✓D' : 'D', a: 'toggle-deals' },
        { t: s.hideOverpriced ? '✓O' : 'O', a: 'toggle-over' },
        { t: '⚙', a: 'open-settings' },
        { t: '⋯', a: 'extras' },
      ];
      const titleFor = (act) => {
        switch (act) {
          case 'toggle-pause': return 'Pause / Resume';
          case 'toggle-deals': return (getSettings().showOnlyDeals ? 'Show all' : 'Show deals only');
          case 'toggle-over': return (getSettings().hideOverpriced ? 'Show overpriced' : 'Hide overpriced');
          case 'open-settings': return 'Open settings';
          case 'extras': return 'Extra settings…';
        }
        return '';
      };
      items.forEach((it, i) => {
        const node = document.createElement('div'); node.className='node'; node.textContent = it.t; node.setAttribute('data-act', it.a); node.title = titleFor(it.a);
        const angle = (Math.PI * 2) * (i / items.length) - Math.PI/2;
        const x = cx + Math.cos(angle)*radius; const y = cy + Math.sin(angle)*radius;
        node.style.left = `${x-18}px`; node.style.top = `${y-18}px`;
        root.appendChild(node);
      });
      // Add a small legend near the radial explaining D/O
      try {
        const legend = document.createElement('div'); legend.className = 'legend'; legend.textContent = 'D = Deals only • O = Hide overpriced';
        legend.style.left = `${cx}px`; legend.style.top = `${cy + radius + 22}px`; legend.style.transform = 'translate(-50%, -50%)';
        root.appendChild(legend);
      } catch(_) {}
      const close = () => { try { root.remove(); } catch(_) {} };
      root.querySelector('.bg').addEventListener('click', close);
      root.addEventListener('click', (e)=>{
        const act = e.target.getAttribute && e.target.getAttribute('data-act'); if (!act) return;
        const st = getSettings();
        if (act === 'toggle-pause') { st.paused = !st.paused; setSettings(st); notify(st.paused?'Paused':'Resumed'); }
        else if (act === 'toggle-deals') { st.showOnlyDeals = !st.showOnlyDeals; setSettings(st); notify(st.showOnlyDeals ? 'Deals-only: ON' : 'Deals-only: OFF'); }
        else if (act === 'toggle-over') { st.hideOverpriced = !st.hideOverpriced; setSettings(st); notify(st.hideOverpriced ? 'Hide overpriced: ON' : 'Hide overpriced: OFF'); }
        else if (act === 'open-settings') { togglePanel(true); }
        else if (act === 'extras') { openExtraSettings(); }
        close(); updateDockState(); scanDomSoon();
      });
      // Close on ESC
      const onKey = (ke) => { if (ke.key === 'Escape') { close(); window.removeEventListener('keydown', onKey, true); } };
      window.addEventListener('keydown', onKey, true);
    } catch(_) {}
  }

  function togglePanel(open) {
    if (!ui.panel) return;
    const state = GM_getValue(STORAGE_KEYS.ui, { dock: null, open: false, scrollTop: 0 });
    if (!open) {
      try { const cnt = ui.shadow.getElementById('tmw-cnt'); if (cnt) state.scrollTop = cnt.scrollTop || 0; } catch(_) {}
    }
    ui.panel.style.display = open ? 'block' : 'none';
    state.open = !!open; GM_setValue(STORAGE_KEYS.ui, state);
    if (open) {
      renderSettingsPanel();
      try { const st = GM_getValue(STORAGE_KEYS.ui, { scrollTop: 0 }).scrollTop || 0; requestAnimationFrame(()=>{ const cnt = ui.shadow.getElementById('tmw-cnt'); if (cnt) cnt.scrollTop = st; }); } catch(_) {}
      try { ui.panel.classList.add('tmw-anim-in'); ui.panel.classList.add('tmw-active'); setTimeout(()=>ui.panel.classList.remove('tmw-anim-in'), 350); } catch(_) {}
      try { const b = ui.shadow.getElementById('tmw-dock-btn'); b.classList.add('tmw-spin'); setTimeout(()=>b.classList.remove('tmw-spin'), 520); } catch(_) {}
      try { flashSignature(); } catch(_) {}
      try { const c = ui.shadow.getElementById('tmw-count'); if (c) { c.textContent = '0'; c.style.display='none'; } } catch(_) {}
    } else {
      try { ui.panel.classList.remove('tmw-active'); } catch(_) {}
    }
    try { const b = ui.shadow.getElementById('tmw-dock-btn'); if (b) b.setAttribute('aria-expanded', open ? 'true' : 'false'); } catch(_) {}
  }

  function enableDockDrag() {
    const btn = ui.shadow.getElementById('tmw-dock-btn');
    let dragging = false; let startX=0, startY=0; let orig = { x: 0, y: 0 };
    const state = GM_getValue(STORAGE_KEYS.ui, { dock: { x: 16, y: 16 }, open: false });
    positionDock(state.dock?.x ?? 16, state.dock?.y ?? 16);
    const onDown = (e) => {
      dragging = true; ui.isDragging = true; ui.dragMoved = false;
      startX = e.clientX; startY = e.clientY;
      const r = ui.dock.getBoundingClientRect();
      orig = { x: window.innerWidth - r.right, y: window.innerHeight - r.bottom };
      e.preventDefault();
    };
    const onMove = (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX; const dy = e.clientY - startY;
      if (!ui.dragMoved && Math.hypot(dx, dy) > 3) ui.dragMoved = true;
      const nx = Math.max(4, Math.min(orig.x - dx, window.innerWidth - 50));
      const ny = Math.max(4, Math.min(orig.y - dy, window.innerHeight - 50));
      positionDock(nx, ny);
    };
    const onUp = () => {
      if (!dragging) return;
      dragging = false; ui.isDragging = false;
      const r = ui.dock.getBoundingClientRect();
      const x = window.innerWidth - r.right; const y = window.innerHeight - r.bottom;
      const state2 = GM_getValue(STORAGE_KEYS.ui, { dock: { x: 16, y: 16 }, open: false });
      state2.dock = { x, y }; GM_setValue(STORAGE_KEYS.ui, state2);
      if (ui.dragMoved) { ui.justDragged = true; setTimeout(() => { ui.justDragged = false; }, 200); }
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
    if (!cnt) return;
    const s = getSettings();
    const hasKey = !!getApiKey();
    const wl = getWatchlist();
    const watchCount = Object.keys(wl).length;
    const hits = getHits();
    const lastHit = hits && hits.length ? hits[0] : null;
    const recentHits = hits.slice(0, 5);
    const hitsSection = recentHits.length ? `<div class="list" id="tmw-hit-list">${recentHits.map(({ itemId, name, price, target, ts }) => {
      const cleanName = escapeHtml(name || ('#' + itemId));
      const priceLabel = escapeHtml(fmtMoney(price));
      const targetLabel = target ? escapeHtml(`target ${fmtMoney(target)}`) : '';
      const timeLabel = ts ? escapeHtml(new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })) : '';
      return `
        <div class="item" data-id="${itemId}">
          <div>
            <div>${cleanName}</div>
            <div class="hit-meta">
              <span>${priceLabel}</span>
              ${targetLabel ? `<span>${targetLabel}</span>` : ''}
              ${timeLabel ? `<span>${timeLabel}</span>` : ''}
              <a href="https://www.torn.com/item.php?XID=${itemId}" class="tmw-hit-link" data-id="${itemId}" data-price="${price}">Open market</a>
            </div>
          </div>
        </div>`;
    }).join('')}</div>` : `<div class="muted">No alerts yet.</div>`;
    const monitorSummary = s.monitorEnabled ? `Every ${Math.max(10, Number(s.monitorIntervalSec || 30))}s` : 'Disabled';
    const uiState = GM_getValue(STORAGE_KEYS.ui, { apiCollapsed: hasKey });
    const apiCollapsed = uiState.apiCollapsed !== undefined ? uiState.apiCollapsed : !!hasKey;

    cnt.innerHTML = `
      <div class="panel-intro">
        <div class="panel-heading">Market watchdog control center</div>
        <div class="panel-sub">Changes save instantly. Need help? Message <a class="tmw-link" href="https://www.torn.com/profiles.php?XID=3888554" target="_blank" rel="noopener">lvciid</a> or visit <a class="tmw-link" href="https://github.com/lvciid/lvciids-market-watcher" target="_blank" rel="noopener">GitHub</a>.</div>
      </div>

      <details class="section" open>
        <summary>Overview</summary>
        <div class="sec-body">
          <div class="section-grid">
            <div class="stat-card">
              <div class="stat-label">Status</div>
              <div class="stat-value">${s.paused ? 'Paused' : 'Active'}</div>
              <div class="stat-meta">${s.paused ? 'Resume to continue scanning' : 'Scanning visible listings'}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Watchlist items</div>
              <div class="stat-value">${watchCount}</div>
              <div class="stat-meta">${watchCount ? 'Manage under Alerts & Watchlist' : 'Add items to get notified'}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Background monitor</div>
              <div class="stat-value">${s.monitorEnabled ? 'Enabled' : 'Off'}</div>
              <div class="stat-meta">${monitorSummary}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Latest hit</div>
              <div class="stat-value">${lastHit ? escapeHtml(lastHit.name) : '—'}</div>
              <div class="stat-meta">${lastHit ? `${fmtMoney(lastHit.price)} · ${new Date(lastHit.ts).toLocaleTimeString()}` : 'No hits yet'}</div>
            </div>
          </div>

          <div class="toggle-stack">
            <label class="toggle"><input type="checkbox" id="tmw-toggle-deals" ${s.showOnlyDeals ? 'checked' : ''}/> Show deals only</label>
            <label class="toggle"><input type="checkbox" id="tmw-toggle-over" ${s.hideOverpriced ? 'checked' : ''}/> Hide overpriced listings</label>
            <label class="toggle"><input type="checkbox" id="tmw-monitor-enabled" ${s.monitorEnabled ? 'checked' : ''}/> Run watchlist monitor in the background</label>
          </div>

          <div class="list-header">Recent alerts</div>
          ${hitsSection}
        </div>
      </details>

      <details class="section">
        <summary>Alerts & Watchlist</summary>
        <div class="sec-body">
          <div class="toggle-stack">
            <label class="toggle"><input type="checkbox" id="tmw-sounds" ${s.sounds ? 'checked' : ''}/> Sound on watchlist hit</label>
            <label class="toggle"><input type="checkbox" id="tmw-open-hit" ${s.openOnHit ? 'checked' : ''}/> Open panel on hit</label>
          </div>

          <div class="form-split" style="margin-top:12px;">
            <div>
              <label>Monitor interval (seconds)</label>
              <input id="tmw-monitor-interval" type="number" min="10" max="300" value="${Number(s.monitorIntervalSec || 30)}" />
            </div>
            <div>
              <label class="muted">Tip</label>
              <div class="section-note">Lower values poll faster but increase API load. Stay ≥30s for TOS-friendly pacing.</div>
            </div>
          </div>

          <div class="form-split" style="margin-top:16px; align-items:flex-end;">
            <div>
              <label>Watchlist item</label>
              <input id="tmw-watch-name" type="text" placeholder="e.g. Xanax" />
            </div>
            <div>
              <label>Target price</label>
              <input id="tmw-watch-price" type="number" placeholder="1800000" />
            </div>
            <div style="min-width:140px;">
              <button id="tmw-add-watch" class="primary" type="button" style="width:100%;">Add to Watchlist</button>
            </div>
          </div>

          <div class="list-header">Watchlist & monitor</div>
          <div class="list" id="tmw-watch-monitor"></div>
        </div>
      </details>

      <details class="section">
        <summary>Appearance</summary>
        <div class="sec-body">
          <div class="toggle-stack">
            <label class="toggle"><input type="checkbox" id="tmw-minimal" ${s.minimal ? 'checked' : ''}/> Minimal highlight (badge only)</label>
            <label class="toggle"><input type="checkbox" id="tmw-compact" ${s.compactBadges ? 'checked' : ''}/> Compact currency format</label>
          </div>
          <div style="margin-top:14px;">
            <label>Badge position</label>
            <select id="tmw-badge-pos" style="width:100%; padding:8px 10px; border-radius:10px; border:1px solid #1f2937; background:#0b1220; color:#e5e7eb;">
              <option value="name" ${s.badgePosition === 'name' ? 'selected' : ''}>After item name</option>
              <option value="price" ${s.badgePosition === 'price' ? 'selected' : ''}>Next to price</option>
            </select>
          </div>
          <div class="section-note">Dock icon and signature emblem remain fixed for branding consistency.</div>
        </div>
      </details>

      <details class="section">
        <summary>API & Diagnostics</summary>
        <div class="sec-body">
          <label>API key</label>
          ${hasKey && apiCollapsed ? `
            <div class="api-pill">Key stored ✓</div>
            <div class="section-note">Your key stays inside Tampermonkey. <span class="tmw-link" id="tmw-api-change">Update key</span></div>
          ` : `
            <div class="form-split">
              <div>
                <input id="tmw-api-key" type="text" placeholder="${hasKey ? 'Enter to replace existing key' : 'Paste your Torn API key'}" autocomplete="new-password" name="tmw_key_${Date.now()}" style="-webkit-text-security: disc; text-security: disc;" />
              </div>
              <div style="display:flex; gap:8px;">
                <button class="primary" id="tmw-save-key" type="button">${hasKey ? 'Update' : 'Save'}</button>
                ${hasKey ? '<button class="secondary" id="tmw-clear-key" type="button">Clear</button>' : ''}
              </div>
            </div>
            <div class="section-note" id="tmw-key-status">Status: ${hasKey ? 'Key set ✓' : 'Not set'}</div>
          `}

          <div class="section-note" style="margin-top:12px;">Diagnostics bundle settings and counts for quick sharing.</div>
          <div class="actions" style="margin-top:8px;">
            <button id="tmw-diagnostics" class="secondary" type="button">Copy diagnostics</button>
          </div>
        </div>
      </details>
    `;

    const apiChange = ui.shadow.getElementById('tmw-api-change');
    if (apiChange) apiChange.onclick = () => {
      try {
        const st = GM_getValue(STORAGE_KEYS.ui, { apiCollapsed: true });
        st.apiCollapsed = false;
        GM_setValue(STORAGE_KEYS.ui, st);
        renderSettingsPanel();
      } catch (_) {}
    };

    const saveKeyBtn = ui.shadow.getElementById('tmw-save-key');
    if (saveKeyBtn) saveKeyBtn.onclick = async () => {
      const val = ui.shadow.getElementById('tmw-api-key').value.trim();
      if (!val) { notify('Enter a valid API key to save.'); return; }
      setApiKey(val);
      ui.shadow.getElementById('tmw-api-key').value = '';
      notify('API key saved securely.');
      removeKeyBanner();
      const st = ui.shadow.getElementById('tmw-key-status'); if (st) st.textContent = 'Status: Key set ✓';
      try { const sst = GM_getValue(STORAGE_KEYS.ui, { apiCollapsed:true }); sst.apiCollapsed = true; GM_setValue(STORAGE_KEYS.ui, sst); } catch(_) {}
      // quick validation
      try { await loadItemsDict(true); notify('API key validated.'); } catch(_) { notify('API key may be invalid.'); }
      try { scanDomSoon(); } catch(_) {}
      renderSettingsPanel();
    };
    // Reduce browser password manager prompts
    try {
      const apiInput = ui.shadow.getElementById('tmw-api-key');
      apiInput.setAttribute('autocomplete','new-password');
      apiInput.setAttribute('autocapitalize','off');
      apiInput.setAttribute('autocorrect','off');
      apiInput.setAttribute('spellcheck','false');
      apiInput.setAttribute('enterkeyhint','done');
      apiInput.setAttribute('data-1p-ignore','true');
      apiInput.setAttribute('data-lpignore','true');
      apiInput.setAttribute('data-bwignore','true');
      apiInput.setAttribute('data-form-type','other');
      apiInput.readOnly = true;
      apiInput.addEventListener('focus', () => { apiInput.readOnly = false; }, { once: true });
    } catch(_) {}
    const clearKeyBtn = ui.shadow.getElementById('tmw-clear-key');
    if (clearKeyBtn) clearKeyBtn.onclick = () => {
      if (!confirm('Clear the saved API key?')) return;
      setApiKey('');
      notify('API key cleared.');
      const st = ui.shadow.getElementById('tmw-key-status'); if (st) st.textContent = 'Status: Not set';
      try { const sst = GM_getValue(STORAGE_KEYS.ui, { apiCollapsed:false }); sst.apiCollapsed = false; GM_setValue(STORAGE_KEYS.ui, sst); } catch(_) {}
      renderSettingsPanel();
    };

    const dealsToggle = ui.shadow.getElementById('tmw-toggle-deals');
    if (dealsToggle) dealsToggle.addEventListener('change', () => {
      const st = getSettings();
      st.showOnlyDeals = !!dealsToggle.checked;
      setSettings(st);
      notify(`Deals-only ${st.showOnlyDeals ? 'enabled' : 'disabled'}`);
      scanDomSoon();
    });

    const overToggle = ui.shadow.getElementById('tmw-toggle-over');
    if (overToggle) overToggle.addEventListener('change', () => {
      const st = getSettings();
      st.hideOverpriced = !!overToggle.checked;
      setSettings(st);
      notify(`${st.hideOverpriced ? 'Hiding' : 'Showing'} overpriced listings`);
      scanDomSoon();
    });

    const monitorToggle = ui.shadow.getElementById('tmw-monitor-enabled');
    if (monitorToggle) monitorToggle.addEventListener('change', () => {
      const st = getSettings();
      st.monitorEnabled = !!monitorToggle.checked;
      setSettings(st);
      updateDockState();
      notify(`Background monitor ${st.monitorEnabled ? 'enabled' : 'paused'}`);
      renderSettingsPanel();
    });

    const soundsToggle = ui.shadow.getElementById('tmw-sounds');
    if (soundsToggle) soundsToggle.addEventListener('change', () => {
      const st = getSettings();
      st.sounds = !!soundsToggle.checked;
      setSettings(st);
    });

    const openHitToggle = ui.shadow.getElementById('tmw-open-hit');
    if (openHitToggle) openHitToggle.addEventListener('change', () => {
      const st = getSettings();
      st.openOnHit = !!openHitToggle.checked;
      setSettings(st);
    });

    const monitorInterval = ui.shadow.getElementById('tmw-monitor-interval');
    if (monitorInterval) monitorInterval.addEventListener('change', () => {
      const val = Math.max(10, Math.min(300, Number(monitorInterval.value) || 30));
      monitorInterval.value = String(val);
      const st = getSettings();
      st.monitorIntervalSec = val;
      setSettings(st);
      notify(`Monitor interval set to ${val}s`);
      renderSettingsPanel();
    });

    const minimalToggle = ui.shadow.getElementById('tmw-minimal');
    if (minimalToggle) minimalToggle.addEventListener('change', () => {
      const st = getSettings();
      st.minimal = !!minimalToggle.checked;
      setSettings(st);
      scanDomSoon();
    });

    const compactToggle = ui.shadow.getElementById('tmw-compact');
    if (compactToggle) compactToggle.addEventListener('change', () => {
      const st = getSettings();
      st.compactBadges = !!compactToggle.checked;
      setSettings(st);
      scanDomSoon();
    });

    const badgeSelect = ui.shadow.getElementById('tmw-badge-pos');
    if (badgeSelect) badgeSelect.addEventListener('change', () => {
      const st = getSettings();
      st.badgePosition = badgeSelect.value === 'price' ? 'price' : 'name';
      setSettings(st);
      scanDomSoon();
    });

    ui.shadow.querySelectorAll('.tmw-hit-link').forEach((link) => {
      link.addEventListener('click', (ev) => {
        ev.preventDefault();
        const itemId = Number(link.getAttribute('data-id') || 0);
        const price = Number(link.getAttribute('data-price') || 0) || null;
        try { sessionStorage.setItem('tmw_jump', JSON.stringify({ itemId, markPrice: price, ts: Date.now() })); } catch (_) {}
        location.assign(link.href);
      });
    });

    // Clear cache / Reset moved to Extra settings

    ui.shadow.getElementById('tmw-diagnostics').onclick = () => {
      const s2 = getSettings(); const wl = getWatchlist(); const ov = getOverrides();
      const diag = {
        version: (typeof GM_info!=='undefined' && GM_info.script && GM_info.script.version) || 'n/a',
        settings: { ...s2, apiBase: s2.apiBase },
        counts: { watchlist: Object.keys(wl).length, overrides: Object.keys(ov).length },
      };
      const txt = JSON.stringify(diag, null, 2);
      try { navigator.clipboard.writeText(txt).then(() => notify('Diagnostics copied.')); } catch(_) { notify('Copy failed.'); }
    };

    // Volume controls moved to Extra settings (right-click radial → Extra settings…)

    ui.shadow.getElementById('tmw-add-watch').onclick = async () => {
      const name = ui.shadow.getElementById('tmw-watch-name').value.trim();
      const price = parseMoney(ui.shadow.getElementById('tmw-watch-price').value);
      if (!name || !price) { notify('Enter item name and target price.'); return; }
      try {
        const dict = await loadItemsDict();
        const id = dict.idByName[name.toLowerCase()];
        if (!id) { notify(`Item not found: ${name}`); return; }
        const wl = getWatchlist();
        wl[id] = { name, target: price };
        setWatchlist(wl);
        notify(`Added to watchlist: ${name} ≤ ${fmtMoney(price)}`);
        renderSettingsPanel();
        return;
      } catch (e) {
        notify('Failed to add watch item. Check API key.');
      }
    };

    // Emblem customization disabled for users

    renderWatchMonitor();
  }

  function renderWatchMonitor() {
    try {
      const root = ui.shadow.getElementById('tmw-watch-monitor'); if (!root) return;
      const wl = getWatchlist();
      const mon = getMonitorState();
      const entries = Object.entries(wl);
      if (!entries.length) {
        root.innerHTML = '<div class="item muted">No watchlist items yet.</div>';
        return;
      }
      const rows = entries.map(([id, info]) => {
        const monitor = mon[id] || {};
        const target = Number(info.target) || 0;
        const min = typeof monitor.min === 'number' ? monitor.min : null;
        const ts = Number(monitor.ts) || 0;
        const age = ts ? `${Math.max(0, Math.round((Date.now() - ts) / 1000))}s ago` : '—';
        const diff = (min != null && target) ? min - target : null;
        const diffLabel = diff != null ? `${diff >= 0 ? '+' : ''}${fmtMoney(diff)}` : null;
        const minLabel = min != null ? fmtMoney(min) : '—';
        const marketLink = min != null ? `<a class=\"tmw-link tmw-goto\" data-id=\"${id}\" data-p=\"${min}\">[Market]</a>` : '';
        const monitorLine = `<div class=\"muted\">min: ${minLabel}${diffLabel ? ` • Δ ${diffLabel}` : ''} • ${age} ${marketLink}</div>`;
        return `
          <div class="item" data-id="${id}">
            <div>
              <div>${escapeHtml(info.name)} <span class="muted">≤ ${fmtMoney(target)}</span></div>
              ${monitorLine}
            </div>
            <div><button data-id="${id}" class="secondary tmw-remove">Remove</button></div>
          </div>
        `;
      }).join('');
      root.innerHTML = rows;
      root.querySelectorAll('.tmw-remove').forEach((btn) => {
        btn.addEventListener('click', () => {
          if (!confirm('Remove this watchlist item?')) return;
          const id = btn.getAttribute('data-id');
          const updated = getWatchlist();
          delete updated[id];
          setWatchlist(updated);
          renderSettingsPanel();
        });
      });
      root.querySelectorAll('.tmw-goto').forEach((a) => {
        a.addEventListener('click', (e) => {
          e.preventDefault();
          const id = a.getAttribute('data-id');
          const price = Number(a.getAttribute('data-p') || 0) || null;
          try { sessionStorage.setItem('tmw_jump', JSON.stringify({ itemId: Number(id), markPrice: price, ts: Date.now() })); } catch (_) {}
          location.assign(`https://www.torn.com/item.php?XID=${id}`);
        });
      });
    } catch (_) {}
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
      GM_notification({ text, title: "lvciid's Market Watcher", timeout: 4000, silent: true });
    } catch (_) {
      console.log('[TMW]', text);
    }
  }

  function removeKeyBanner() {
    const b = document.getElementById('tmw-banner');
    if (b) b.remove();
  }

  function showKeyBanner() {
    if (document.querySelector('#tmw-banner')) return;
    const div = document.createElement('div');
    div.id = 'tmw-banner';
    div.className = 'tmw-banner';
    div.innerHTML = `⚠️ Market Watcher: Set your API key in <span class="tmw-link">Settings</span>.`;
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
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) scanDomSoon();
    });
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
      updateDockState();
      try { runMonitorTick(); } catch(_) {}
    }, 1000);
  }

  // Background watchlist monitor using API (optional)
  let __monBusy = false;
  async function runMonitorTick() {
    if (__monBusy) return;
    const s = getSettings();
    if (!s.monitorEnabled || s.paused) return;
    if (!getApiKey()) return;
    const wl = getWatchlist(); const ids = Object.keys(wl);
    if (!ids.length) return;
    const st = getMonitorState();
    const iv = Math.max(10, s.monitorIntervalSec||30)*1000;
    // Find one due item to check this tick (single-flight)
    let pick = null; let oldestAge = -1;
    const nowTs = Date.now();
    for (const id of ids) {
      const last = st[id]?.ts || 0; const age = nowTs - last;
      if (age >= iv && age > oldestAge) { oldestAge = age; pick = id; }
    }
    if (!pick) return;
    __monBusy = true;
    try {
      const itemId = Number(pick);
      const m = await fetchMarketMedian(itemId);
      const next = { ...(st||{}) };
      next[pick] = { ...(next[pick]||{}), min: m.min ?? m.median ?? null, ts: Date.now() };
      setMonitorState(next);
      // Compare to target and alert once per interval window
      const target = Number(wl[pick]?.target || 0);
      const min = next[pick].min;
      if (min != null && target > 0 && min <= target) {
        const mutedUntil = Number(getMutes()[pick]||0);
        const muted = mutedUntil && Date.now() < mutedUntil;
        const alertedTs = Number(next[pick]?.alertedTs||0);
        const cool = 90*1000; // avoid spam
        if (!muted && (!alertedTs || (Date.now()-alertedTs) > cool)) {
          next[pick].alertedTs = Date.now(); setMonitorState(next);
          const name = wl[pick]?.name || ('#'+pick);
          notify(`Deal found: ${name} at ${fmtMoney(min)} (target ≤ ${fmtMoney(target)})`);
          pushHit({ ts: Date.now(), itemId, name, price: min, target });
          try { const b = ui.shadow.getElementById('tmw-dock-btn'); b.classList.add('tmw-pop'); setTimeout(()=>b.classList.remove('tmw-pop'), 650); } catch(_) {}
          try { playHitSound(); } catch(_) {}
          try { const c = ui.shadow.getElementById('tmw-count'); if (c && ui.panel && ui.panel.style.display!=='block') { c.textContent = String((Number(c.textContent||'0')||0)+1); c.style.display=''; } } catch(_) {}
          try { if (s.openOnHit) togglePanel(true); } catch(_) {}
        }
      }
    } catch(_) {
      // ignore
    } finally {
      __monBusy = false;
    }
  }

  function handlePotentialBuy(e) {
    const target = e.target;
    if (!target) return;
    // Ignore clicks inside our UI
    try { if (ui && ui.host && ui.host.contains(target)) return; } catch(_) {}
    const btn = target.closest('button, a');
    if (!btn) return;
    // Heuristic: buy buttons typically contain text like "Buy" / "Purchase" and link to market/bazaar actions
    const txt = (btn.textContent || '').trim().toLowerCase();
    const href = (btn.getAttribute('href') || '').toLowerCase();
    if (!txt && !href) return;
    const looksLikeBuy = txt.includes('buy') || txt.includes('purchase') || /action=buy|confirm/.test(href);
    if (!looksLikeBuy) return;
    // Find the listing container and price
    const row = findListingRow(btn);
    if (!row) return;
    const info = extractListingInfo(row);
    if (!info || !info.itemId || !info.price) return;
    // Check overpriced against fair value (cached or fallback)
    ;(async () => {
      try {
        const s = getSettings();
        if (s.alwaysConfirm) {
          const ok = confirm('Confirm purchase?');
          if (!ok) { e.preventDefault(); e.stopPropagation(); return; }
        }
        const dict = await loadItemsDict();
        const fv = await getFairValue(info.itemId, dict);
        const fair = fv?.median || fv?.min;
        if (!fair) return;
        const overpriced = info.price >= fair * s.overpriceMultiplier;
        if (overpriced && !s.disableOverConfirm && !s.alwaysConfirm) {
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

  let tmwActiveMenu = null;
  function closeQuickMenu() { if (tmwActiveMenu) { tmwActiveMenu.remove(); tmwActiveMenu = null; } }
  function attachQuickActions(anchorEl, info) {
    try {
      const trigger = document.createElement('span');
      trigger.textContent = ' ⋯';
      trigger.style.cursor = 'pointer';
      trigger.title = 'Quick actions';
      anchorEl.appendChild(trigger);
      trigger.addEventListener('click', (ev) => {
        ev.stopPropagation();
        closeQuickMenu();
        const r = trigger.getBoundingClientRect();
        const menu = document.createElement('div');
        menu.className = 'tmw-menu';
        menu.innerHTML = `
          <div class="tmw-menu-item" data-act="watch">Add to watchlist…</div>
          <div class="tmw-menu-item" data-act="ignore">Ignore item</div>
          <div class="tmw-menu-item" data-act="override">Set override…</div>
          <div class="tmw-menu-item" data-act="clear">Clear overrides</div>
        `;
        document.body.appendChild(menu);
        const top = window.scrollY + r.bottom + 4;
        const left = Math.min(window.scrollX + r.left, window.scrollX + window.innerWidth - menu.offsetWidth - 8);
        menu.style.top = `${top}px`;
        menu.style.left = `${left}px`;
        tmwActiveMenu = menu;
        const onDoc = (e2) => { if (!menu.contains(e2.target)) { closeQuickMenu(); document.removeEventListener('mousedown', onDoc, true); } };
        document.addEventListener('mousedown', onDoc, true);
        menu.addEventListener('click', async (e3) => {
          const act = e3.target.getAttribute('data-act');
          if (!act) return;
          if (act === 'watch') {
            const val = prompt('Target price to watch for:');
            const price = Number((val||'').replace(/[^0-9]/g,''));
            if (!price) { notify('Enter a valid number.'); return; }
            const wl = getWatchlist(); wl[info.itemId] = { name: info.itemName || ('#'+info.itemId), target: price }; setWatchlist(wl); notify('Watchlist updated');
          } else if (act === 'ignore') {
            const o = getOverrides(); o[info.itemId] = { ...(o[info.itemId]||{}), ignore: true }; setOverrides(o); notify('Item ignored');
          } else if (act === 'override') {
            const raw = prompt('Enter deal,over (e.g., 0.9, 1.8):');
            if (!raw) return;
            const vals = raw.split(',').map(t=>Number(t.trim())).filter(n=>!isNaN(n));
            if (!vals.length) { notify('Provide values like: 0.9, 1.8'); return; }
            const o = getOverrides(); o[info.itemId] = { ...(o[info.itemId]||{}), goodThreshold: vals[0], overMult: vals[1] }; setOverrides(o); notify('Override saved');
          } else if (act === 'clear') {
            const o = getOverrides(); delete o[info.itemId]; setOverrides(o); notify('Overrides cleared');
          }
          closeQuickMenu();
        });
      });
    } catch(_) {}
  }

  function playHitSound() {
    const s = getSettings();
    if (!s.sounds) return;
    // Quiet hours disabled: always allow hit sound when sounds are enabled
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const g = ctx.createGain();
      const vol = Math.max(0, Math.min(1, Number(s.volume != null ? s.volume : DEFAULTS.volume)));
      g.gain.value = vol; g.connect(ctx.destination);
      // two-tone chime: A5 then E5
      const o1 = ctx.createOscillator(); o1.type = 'sine'; o1.frequency.value = 880; o1.connect(g); o1.start();
      setTimeout(()=>{ o1.stop(); }, 140);
      const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = 659.25; o2.connect(g);
      setTimeout(()=>{ o2.start(); }, 110);
      setTimeout(()=>{ o2.stop(); ctx.close(); }, 280);
    } catch(_) {}
  }

  // (Buddy hover sound removed per owner request)

  async function annotateRow(info, itemsDict) {
    if (!info || !info.itemId || !info.price) return;
    if (info.row.getAttribute('data-tmw') === '1') return;
    info.row.setAttribute('data-tmw', '1');

    let fairBlock = document.createElement('span');
    fairBlock.className = 'tmw-badge';
    fairBlock.textContent = '…fetching';
    // Attach badge near name or price based on setting
    try {
      const s0 = getSettings();
      let anchor = null;
      if (s0.badgePosition === 'price') {
        anchor = Array.from(info.row.querySelectorAll('span, div, b, strong, td')).find((n) => /\$\s?\d[\d,]*/.test(n.textContent || ''));
      }
      if (!anchor) {
        anchor = info.row.querySelector('a[href*="item.php?XID="]') || info.row.querySelector('b, strong, .name');
      }
      if (anchor && anchor.parentElement) {
        anchor.parentElement.insertBefore(fairBlock, anchor.nextSibling);
      } else {
        info.row.appendChild(fairBlock);
      }
    } catch(_) { info.row.appendChild(fairBlock); }

    const settings = getSettings();
    const watchlist = getWatchlist();
    const watched = watchlist[info.itemId];
    const priceHit = watched && info.price <= watched.target;
    let badgeTxt = '';
    let labelSuffix = '';
    let fairValue = null;
    let isGood = false;
    let isBad = false;
    let isStrong = false;
    let quickActionsAttached = false;
    const ensureQuickActions = () => {
      if (quickActionsAttached) return;
      attachQuickActions(fairBlock, info);
      quickActionsAttached = true;
    };

    try {
      const fv = await getFairValue(info.itemId, itemsDict);
      fairValue = fv?.median ?? fv?.min ?? null;
      if (fairValue != null) {
        const fairStr = settings.compactBadges ? fmtMoneyCompact(fairValue) : fmtMoney(fairValue);
        const labelName = settings.compactBadges ? 'med' : 'median';
        const countStr = fv?.sample ? ` • n=${fv.sample}` : '';
        badgeTxt = `${labelName} ${fairStr}${countStr}`;
        isGood = info.price <= fairValue * settings.goodThreshold;
        isStrong = info.price <= fairValue * Math.min(0.8, settings.goodThreshold || 0.9);
        isBad = info.price >= fairValue * settings.overpriceMultiplier;
        const goodClass = settings.colorblind ? 'tmw-good-cb' : 'tmw-good';
        const badClass = settings.colorblind ? 'tmw-bad-cb' : 'tmw-bad';
        if (settings.minimal) {
          if (isGood) fairBlock.classList.add(goodClass);
          if (isBad) fairBlock.classList.add(badClass);
        } else {
          if (isGood) info.row.classList.add(goodClass);
          if (isBad) info.row.classList.add(badClass);
        }
        if (isStrong) fairBlock.classList.add('tmw-strong');
        labelSuffix = isStrong ? ' • strong' : (isGood ? ' • deal' : (isBad ? ' • over' : ''));
        fairBlock.textContent = badgeTxt + labelSuffix;
      } else {
        fairBlock.textContent = 'median n/a';
      }
    } catch (e) {
      fairBlock.textContent = 'API error';
      console.warn('TMW annotate error', e);
    }

    if (priceHit) {
      const mutes = getMutes();
      const muteUntil = Number(mutes[info.itemId] || 0);
      const muted = muteUntil && Date.now() < muteUntil;
      info.row.classList.add('tmw-watch');
      const baseText = badgeTxt ? `${badgeTxt}${labelSuffix}` : (fairBlock.textContent || '');
      const prefix = baseText ? `${baseText} • ` : '';
      fairBlock.textContent = `${prefix}watch hit ≤ ${fmtMoney(watched.target)}`;
      ensureQuickActions();
      try {
        const link = document.createElement('a'); link.textContent=' [Market]'; link.className='tmw-link'; link.href=`https://www.torn.com/item.php?XID=${info.itemId}`;
        link.addEventListener('click',(ev)=>{ ev.preventDefault(); try{ sessionStorage.setItem('tmw_jump', JSON.stringify({ itemId: info.itemId, markPrice: info.price, ts: Date.now() })); }catch(_){}; location.assign(link.href); });
        fairBlock.appendChild(link);
        const mute = document.createElement('a'); mute.textContent=' [Mute 1h]'; mute.className='tmw-link'; mute.href='#';
        mute.addEventListener('click',(ev)=>{ ev.preventDefault(); const mu = getMutes(); mu[info.itemId] = Date.now()+60*60*1000; setMutes(mu); notify('Muted alerts for 1h'); });
        fairBlock.appendChild(mute);
      } catch(_){}
      pushHit({ ts: Date.now(), itemId: info.itemId, name: watched.name || info.itemName, price: info.price, target: watched.target });
      if (!muted) {
        notify(`Deal found: ${watched.name || info.itemName} at ${fmtMoney(info.price)} (target ≤ ${fmtMoney(watched.target)})`);
        try { const b = ui.shadow.getElementById('tmw-dock-btn'); b.classList.add('tmw-pop'); setTimeout(()=>b.classList.remove('tmw-pop'), 650); flashSignature(); } catch(_) {}
        try { playHitSound(); } catch(_) {}
        try { const c = ui.shadow.getElementById('tmw-count'); if (c && ui.panel && ui.panel.style.display!=='block') { c.textContent = String((Number(c.textContent||'0')||0)+1); c.style.display=''; } } catch(_) {}
      }
    }

    ensureQuickActions();

    if (fairValue != null) {
      if (settings.showOnlyDeals && !isGood && !priceHit) {
        info.row.style.display = 'none';
      } else if (settings.hideOverpriced && isBad) {
        info.row.style.display = 'none';
      }
    }
  }

  async function scanDom() {
    ensureUiShell();
    if (document.hidden) return;
    const settingsScan = getSettings();
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
    // Apply jump marker if present (item.php landing)
    try { applyJumpMarker(); } catch(_) {}
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
  } else {
    window.addEventListener('DOMContentLoaded', init);
  }
  
  function getXidFromLocation() {
    try { const m = location.search.match(/XID=(\d+)/i); if (m) return Number(m[1]); } catch(_) {}
    return null;
  }
  
  function applyJumpMarker() {
    const dataRaw = sessionStorage.getItem('tmw_jump'); if (!dataRaw) return;
    let data=null; try { data = JSON.parse(dataRaw); } catch(_) { sessionStorage.removeItem('tmw_jump'); return; }
    if (!data || !data.itemId || (Date.now()- (data.ts||0) > 90*1000)) { sessionStorage.removeItem('tmw_jump'); return; }
    const xid = getXidFromLocation(); if (!xid || xid !== Number(data.itemId)) return;
    // Try to find rows with prices; highlight the lowest or matching price
    const candidates = Array.from(document.querySelectorAll('li, tr, .item, .market-item, .bazaar-item, .table-row'));
    let bestEl = null; let bestPrice = Infinity;
    for (const row of candidates) {
      const moneyMatches = (row.textContent||'').match(/\$\s?\d[\d,]*/g);
      if (!moneyMatches) continue;
      const price = Math.min(...moneyMatches.map(parseMoney).filter(Boolean));
      if (!isFinite(price)) continue;
      if (data.markPrice && Math.abs(price - data.markPrice) < 1) { bestEl = row; bestPrice = price; break; }
      if (price < bestPrice) { bestPrice = price; bestEl = row; }
    }
    if (bestEl) {
      try { bestEl.classList.add('tmw-target'); bestEl.scrollIntoView({ behavior:'smooth', block:'center'}); } catch(_) {}
      // expire marker sooner
      setTimeout(()=>{ try { sessionStorage.removeItem('tmw_jump'); } catch(_) {} }, 60*1000);
      // remove highlight after some seconds
      setTimeout(()=>{ try { bestEl.classList.remove('tmw-target'); } catch(_) {} }, 10*1000);
    }
  }
})();
