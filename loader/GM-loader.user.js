// ==UserScript==
// @name         Grepolis Manager Loader
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Main loader for GM modules
// @author       Zambia1972
// @match        *://*.grepolis.com/game*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    const scriptBase = "https://cdn.jsdelivr.net/gh/Zambia1972/Grepolis-Manager/modules/";
    const modules = [
        "firebase-handler.js",
        "chat-core.js",
        "mentions.js",
        "notifier.js",
        "voicechat.js",
        "ui-manager.js",
        "cleanup.js"
    ];
    modules.forEach(m => {
        const s = document.createElement('script');
        s.src = scriptBase + m;
        document.head.appendChild(s);
    });
})();
