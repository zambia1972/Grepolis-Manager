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

