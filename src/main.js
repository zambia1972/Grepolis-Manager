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

            // Add click handler with detailed logging
            function handleButtonClick(e) {
                console.log('Button click event:', e);
                console.log('Event target:', e.target);
                console.log('Current target:', e.currentTarget);
                
                e.preventDefault();
                e.stopPropagation();
                
                console.log("GM Toggle button clicked - handler executed");
                
                try {
                    console.log('Attempting to open popup...');
                    const popup = GM_Popup.open({
                        title: "Grepolis Manager",
                        contentHtml: "<div style='padding: 20px; color: white;'>Grepolis Manager is working!</div>"
                    });
                    console.log('Popup opened successfully:', popup);
                } catch (err) {
                    console.error("Error opening popup:", err);
                    alert("Error opening Grepolis Manager. Please check the console for details.");
                }
                
                return false;
            }
            
            // Add multiple event listeners to ensure we catch the click
            toggle.addEventListener("click", handleButtonClick);
            toggle.addEventListener("mousedown", (e) => {
                console.log('Mousedown on button');
                e.stopPropagation();
            });
            toggle.addEventListener("mouseup", (e) => {
                console.log('Mouseup on button');
                e.stopPropagation();
            });
            
            // Also make the button focusable and add keyboard support
            toggle.setAttribute('role', 'button');
            toggle.setAttribute('aria-label', 'Open Grepolis Manager');
            toggle.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleButtonClick(e);
                }
            });

            console.log("Grepolis Manager UI initialized");
            
            // Test the button after a short delay
            setTimeout(() => {
                console.log('Running button test...');
                const btn = document.getElementById('gm-toggle-button');
                if (btn) {
                    console.log('Button found in DOM, testing click...');
                    // Try both click() and dispatchEvent to ensure one works
                    try {
                        btn.click();
                        console.log('Programmatic click triggered');
                    } catch (e) {
                        console.log('Error with click():', e);
                    }
                    
                    try {
                        const event = new MouseEvent('click', {
                            view: window,
                            bubbles: true,
                            cancelable: true
                        });
                        btn.dispatchEvent(event);
                        console.log('Dispatched click event');
                    } catch (e) {
                        console.log('Error dispatching event:', e);
                    }
                } else {
                    console.error('Button not found in DOM');
                }
            }, 1000);
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
