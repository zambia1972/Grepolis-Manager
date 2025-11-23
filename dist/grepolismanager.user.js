// ==UserScript==
// @name         Grepolis Manager
// @namespace    https://github.com/zambia1972/Grepolis-Manager
// @version      1.0.0
// @match        https://*.grepolis.com/*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @run-at       document-end
// ==/UserScript==

(function() {
    "use strict";

    const loadModule = url =>
        new Promise(resolve => {
            GM_xmlhttpRequest({
                method: "GET",
                url,
                onload: r => resolve(r.responseText)
            });
        });

    async function startGM() {

        // Modules laden via fetch → eval in sandbox → GEEN conflicten met Grepolis
        const css = await loadModule("https://raw.githubusercontent.com/zambia1972/Grepolis-Manager/main/src/styles/styles.css");
        const ui = await loadModule("https://raw.githubusercontent.com/zambia1972/Grepolis-Manager/main/src/core/ui.js");
        const popup = await loadModule("https://raw.githubusercontent.com/zambia1972/Grepolis-Manager/main/src/core/popup.js");

        GM_addStyle(css);
        GM_addStyle(cssText);

        eval(ui);
        eval(popup);

        // Wachten tot Grepolis klaar is
        function wait() {
            if (!unsafeWindow.Layout || !unsafeWindow.Layout.wnd) {
                return setTimeout(wait, 200);
            }
            initUI();
        }
        wait();
    }

    function initUI() {
        const container = GM_UI.createButtonContainer();
        const toggle = GM_UI.createToggleButton(container);

        toggle.addEventListener("click", () => {
            GM_Popup.open();
        });
    }

    startGM();

})();

