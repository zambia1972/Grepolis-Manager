(function() {
    console.log("Grepolis Manager geladen – versie", GM_CONFIG.VERSION);

    // container maken
    const container = GM_UI.createButtonContainer();

    // toggle button
    const toggle = GM_UI.createToggleButton(container);

    // open popup
    toggle.addEventListener("click", () => {
        GM_Popup.open();
    });
})();

(function initializeGM() {

    const ready = () =>
        typeof unsafeWindow !== "undefined" &&
        unsafeWindow.Layout &&
        unsafeWindow.Layout.wnd &&
        document.querySelector("#ui_box");

    if (!ready()) {
        return setTimeout(initializeGM, 300);
    }

    console.log("Grepolis Manager geladen na game init.");

    GM_UI.createButtonContainer();
    const toggle = GM_UI.createToggleButton(document.getElementById("gm-button-container"));

    toggle.addEventListener("click", () => {
        GM_Popup.open();
    });

})();
