(function() {
    console.log("Grepolis Manager geladen – versie", GM_CONFIG.VERSION);

    // Only run the initialization once
    if (window.gmInitialized) return;
    window.gmInitialized = true;

    function init() {
        try {
            // Create or get the container
            const container = GM_UI.createButtonContainer();
            
            // Create or get the toggle button
            const toggle = GM_UI.createToggleButton(container);

            // Add click handler
            toggle.addEventListener("click", (e) => {
                e.stopPropagation();
                console.log("GM Toggle button clicked");
                try {
                    GM_Popup.open({
                        title: "Grepolis Manager",
                        contentHtml: "<div style='padding: 20px; color: white;'>Grepolis Manager is working!</div>"
                    });
                } catch (err) {
                    console.error("Error opening popup:", err);
                    alert("Error opening Grepolis Manager. Please check the console for details.");
                }
            });

            console.log("Grepolis Manager UI initialized");
        } catch (err) {
            console.error("Error initializing Grepolis Manager:", err);
        }
    }

    // If the game is already loaded, initialize immediately
    if (typeof unsafeWindow !== "undefined" && unsafeWindow.Layout && unsafeWindow.Layout.wnd) {
        init();
    } 
    // Otherwise, wait for the game to load
    else {
        const checkGameLoaded = setInterval(() => {
            if (typeof unsafeWindow !== "undefined" && unsafeWindow.Layout && unsafeWindow.Layout.wnd) {
                clearInterval(checkGameLoaded);
                init();
            }
        }, 500);
        
        // Give up after 10 seconds
        setTimeout(() => {
            clearInterval(checkGameLoaded);
            console.log("Grepolis Manager: Game not detected, initializing anyway");
            init();
        }, 10000);
    }
})();
