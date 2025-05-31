// ==UserScript==
// @name         Grepolis Manager
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Popup met werkbalk en buttons, inclusief Afwezigheidsassistent en Militaire Manager
// @author       Zambia1972
// @match        *://*.grepolis.com/*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @require      https://github.com/zambia1972/Grepolis-Manager/raw/refs/heads/main//core/main.js
// @require      https://github.com/zambia1972/Grepolis-Manager/raw/refs/heads/main//modules/forumManager.js
// @require      https://github.com/zambia1972/Grepolis-Manager/raw/refs/heads/main//modules/helpers/attackRangeHelper.js
// @require      https://github.com/zambia1972/Grepolis-Manager/raw/refs/heads/main//modules/helpers/feestenFixedHelper.js
// @require      https://github.com/zambia1972/Grepolis-Manager/raw/refs/heads/main//modules/helpers/afwezigheidsassistent.js
// @require      https://github.com/zambia1972/Grepolis-Manager/raw/refs/heads/main//modules/militaryManager.js
// @require      https://github.com/zambia1972/Grepolis-Manager/raw/refs/heads/main//modules/utils/dom.js
// ==/UserScript==

// Laad hoofdcomponent
(function() {
    'use strict';
    new ForumManager();
})();
