// ==UserScript==
// @name         lvciid's Market Watcher
// @namespace    https://github.com/lvciid/lvciids-market-watcher
// @version      0.3.20
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
