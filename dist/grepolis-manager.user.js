// ==UserScript==
// @name         Grepolis Manager
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Modulair script: knoppen, popup, modules
// @author       Zambia1972
// @match        *://*.grepolis.com/*
// @grant        none
//
// @require      https://raw.githubusercontent.com/zambia1972/Grepolis-Manager/refs/heads/main/src/core/styles.js
// @require      https://raw.githubusercontent.com/zambia1972/Grepolis-Manager/refs/heads/main/src/core/popup.js
// @require      https://raw.githubusercontent.com/zambia1972/Grepolis-Manager/refs/heads/main/src/core/ui.js
//
// @require      https://raw.githubusercontent.com/zambia1972/Grepolis-Manager/refs/heads/main/src/modules/attackRangeHelper.js
// @require      https://raw.githubusercontent.com/zambia1972/Grepolis-Manager/refs/heads/main/src/modules/feestenManager.js
// @require      https://raw.githubusercontent.com/zambia1972/Grepolis-Manager/refs/heads/main/src/modules/troopManager.js
// @require      https://raw.githubusercontent.com/zambia1972/Grepolis-Manager/refs/heads/main/src/modules/forumManager.js
// ==/UserScript==

(function () {
  'use strict';
  injectGlobalStyles();   // uit styles.js
  initializeButtons();    // uit ui.js
})();
