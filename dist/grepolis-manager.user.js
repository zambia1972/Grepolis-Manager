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

    function initWhenReady() {
        if (
            typeof window.injectGlobalStyles === 'function' &&
            typeof window.initializeButtons === 'function' &&
            typeof window.startAttackRangeHelper === 'function' &&
            typeof window.startFeestenManager === 'function' &&
            typeof window.startTroopManager === 'function' &&
            typeof window.startForumManager === 'function'
        ) {
            window.injectGlobalStyles();

            window.initializeButtons([
                () => console.log("Startscherm volgt"),
                (on) => window.startAttackRangeHelper(on),
                (on) => window.startFeestenManager(on),
                () => console.log("Chat volgt later"),
                (on) => window.startTroopManager(on),
                () => console.log("Kaart volgt later"),
                (on) => window.startForumManager(on)
            ]);
        } else {
            setTimeout(initWhenReady, 200);
        }
    }

    initWhenReady();
})();
