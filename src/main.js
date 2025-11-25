(function() {
    console.log("Grepolis Manager initializing...");

    // Clean up any existing instances
    const existingContainer = document.getElementById('gm-button-container');
    if (existingContainer) {
        existingContainer.remove();
    }
    const existingPopup = document.getElementById('gm-gpwindow-backdrop');
    if (existingPopup) {
        existingPopup.remove();
    }

    // Only run the initialization once
    if (window.gmInitialized) {
        console.log('Grepolis Manager already initialized');
        return;
    }
    window.gmInitialized = true;
    
    // Fallback popup in case the main one fails to load
    function ensurePopupModule() {
        if (typeof window.GM_Popup === 'undefined') {
            console.warn('GM_Popup not available, using fallback implementation');
            window.GM_Popup = {
                open: function(payload) {
                    console.warn('Using fallback popup');
                    const fallbackDiv = document.createElement('div');
                    fallbackDiv.style.position = 'fixed';
                    fallbackDiv.style.top = '50%';
                    fallbackDiv.style.left = '50%';
                    fallbackDiv.style.transform = 'translate(-50%, -50%)';
                    fallbackDiv.style.padding = '20px';
                    fallbackDiv.style.background = '#2c3e50';
                    fallbackDiv.style.color = 'white';
                    fallbackDiv.style.borderRadius = '5px';
                    fallbackDiv.style.zIndex = '999999';
                    fallbackDiv.style.maxWidth = '80%';
                    fallbackDiv.style.maxHeight = '80vh';
                    fallbackDiv.style.overflow = 'auto';
                    
                    const title = document.createElement('h3');
                    title.textContent = payload.title || 'Grepolis Manager';
                    title.style.marginTop = '0';
                    title.style.color = '#3498db';
                    
                    const content = document.createElement('div');
                    content.innerHTML = payload.contentHtml || 'No content';
                    
                    const closeBtn = document.createElement('button');
                    closeBtn.textContent = 'Close';
                    closeBtn.style.marginTop = '10px';
                    closeBtn.style.padding = '5px 15px';
                    closeBtn.style.background = '#e74c3c';
                    closeBtn.style.color = 'white';
                    closeBtn.style.border = 'none';
                    closeBtn.style.borderRadius = '3px';
                    closeBtn.style.cursor = 'pointer';
                    
                    closeBtn.onclick = function() {
                        document.body.removeChild(fallbackDiv);
                    };
                    
                    fallbackDiv.appendChild(title);
                    fallbackDiv.appendChild(content);
                    fallbackDiv.appendChild(closeBtn);
                    document.body.appendChild(fallbackDiv);
                    
                    return {
                        close: function() {
                            if (document.body.contains(fallbackDiv)) {
                                document.body.removeChild(fallbackDiv);
                            }
                        }
                    };
                }
            };
        }
        return window.GM_Popup;
    }
    
    // Initialize popup module
    ensurePopupModule();

    // Force initialize GM_Popup if not already available
    if (typeof window.GM_Popup === 'undefined') {
        console.warn('Creating new GM_Popup instance');
        window.GM_Popup = {
            open: function(payload) {
                console.log('Opening popup with:', payload);
                const popup = document.createElement('div');
                popup.id = 'gm-popup';
                popup.style.position = 'fixed';
                popup.style.top = '50%';
                popup.style.left = '50%';
                popup.style.transform = 'translate(-50%, -50%)';
                popup.style.background = '#2c3e50';
                popup.style.padding = '20px';
                popup.style.borderRadius = '5px';
                popup.style.zIndex = '100000';
                popup.style.color = 'white';
                popup.style.maxWidth = '80%';
                popup.style.maxHeight = '80vh';
                popup.style.overflow = 'auto';
                popup.style.boxShadow = '0 0 20px rgba(0,0,0,0.5)';
                
                const closeBtn = document.createElement('button');
                closeBtn.textContent = '×';
                closeBtn.style.position = 'absolute';
                closeBtn.style.top = '5px';
                closeBtn.style.right = '10px';
                closeBtn.style.background = 'none';
                closeBtn.style.border = 'none';
                closeBtn.style.color = 'white';
                closeBtn.style.fontSize = '24px';
                closeBtn.style.cursor = 'pointer';
                closeBtn.onclick = function() {
                    document.body.removeChild(backdrop);
                };
                
                const title = document.createElement('h3');
                title.textContent = payload.title || 'Grepolis Manager';
                title.style.marginTop = '0';
                title.style.color = '#3498db';
                
                const content = document.createElement('div');
                content.innerHTML = payload.contentHtml || 'No content';
                content.style.marginTop = '20px';
                
                popup.appendChild(closeBtn);
                popup.appendChild(title);
                popup.appendChild(content);
                
                const backdrop = document.createElement('div');
                backdrop.id = 'gm-popup-backdrop';
                backdrop.style.position = 'fixed';
                backdrop.style.top = '0';
                backdrop.style.left = '0';
                backdrop.style.width = '100%';
                backdrop.style.height = '100%';
                backdrop.style.background = 'rgba(0,0,0,0.5)';
                backdrop.style.zIndex = '99999';
                backdrop.style.display = 'flex';
                backdrop.style.justifyContent = 'center';
                backdrop.style.alignItems = 'center';
                backdrop.onclick = function(e) {
                    if (e.target === backdrop) {
                        document.body.removeChild(backdrop);
                    }
                };
                
                backdrop.appendChild(popup);
                document.body.appendChild(backdrop);
                
                return {
                    close: function() {
                        if (document.body.contains(backdrop)) {
                            document.body.removeChild(backdrop);
                        }
                    }
                };
            }
        };
    }

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
