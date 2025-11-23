import { GM_CONFIG } from "./config.js";
import "./core/popup.js";
import "./core/ui.js";
import "./core/events.js";
import "./modules/utils.js";

(function() {
    console.log("Grepolis Manager geladen – versie", GM_CONFIG.VERSION);

    // Styles laden
    fetch(GM_CONFIG.CSS_URL)
        .then(r => r.text())
        .then(css => GM_addStyle(css));

    // Container + toggle button plaatsen
    const container = document.createElement("div");
    container.id = "gm-button-container";
    document.body.appendChild(container);

    const toggle = document.createElement("div");
    toggle.id = "gm-toggle-button";
    container.appendChild(toggle);

    toggle.addEventListener("click", () => {
        openGrepolisManagerPopup();
    });
})();
