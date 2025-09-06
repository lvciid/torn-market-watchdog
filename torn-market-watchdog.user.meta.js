// ==UserScript==
// @name         Torn Market Watchdog
// @namespace    https://github.com/lvciid/torn-market-watchdog
// @version      0.3.17
// @description  Highlights deals, warns on ripoffs, and alerts watchlist items using live Torn API data. Your API key stays local and never exposed.
// @author       lvciid
// @match        *://*.torn.com/*
// @match        https://torn.com/*
// @run-at       document-idle
// @noframes
// @homepageURL  https://github.com/lvciid/torn-market-watchdog
// @supportURL   https://github.com/lvciid/torn-market-watchdog/issues
// @downloadURL  https://lvciid.github.io/torn-market-watchdog/torn-market-watchdog.user.js
// @updateURL    https://lvciid.github.io/torn-market-watchdog/torn-market-watchdog.user.meta.js
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
