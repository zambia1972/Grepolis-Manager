// ==UserScript==
// @name         Grepolis Manager
// @namespace    https://github.com/zambia1972/Grepolis-Manager
// @version      1.0.1
// @match        https://*.grepolis.com/*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @grant        GM_log
// @run-at       document-end
// ==/UserScript==

(function() {
    "use strict";

    // Debug functies
    const DEBUG = true;
    function debugLog(...args) {
        if (DEBUG) {
            console.log('[GM_DEBUG]', ...args);
            try { GM_log('[GM_DEBUG] ' + args.join(' ')); } catch (e) {}
        }
    }

    // Verbeterde module loader met foutafhandeling
    const loadModule = (url, moduleName = '') => {
        debugLog(`Laden van module: ${moduleName || url}`);
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "GET",
                url,
                onload: (response) => {
                    if (response.status >= 200 && response.status < 300) {
                        debugLog(`Module geladen: ${moduleName || url}`);
                        resolve(response.responseText);
                    } else {
                        const error = `Fout bij laden ${url}: ${response.status} ${response.statusText}`;
                        console.error(error);
                        reject(new Error(error));
                    }
                },
                onerror: (error) => {
                    const errorMsg = `Fout bij ophalen ${url}: ${error}`;
                    console.error(errorMsg);
                    reject(new Error(errorMsg));
                },
                timeout: 10000 // 10 seconden timeout
            });
        });
    };

    // Fallback modules voor als de externe bronnen niet beschikbaar zijn
    const fallbackModules = {
        styles: `
            #gm-button-container {
                position: fixed;
                top: 10px;
                right: 10px;
                z-index: 99999 !important;
                border: 2px solid #ff0000;
                background: rgba(255, 255, 255, 0.9);
                padding: 5px;
                border-radius: 5px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
            }
            .gm-toggle-button {
                background: #ff5722;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 4px;
                cursor: pointer;
                font-weight: bold;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 1px;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
                transition: all 0.3s ease;
            }
            .gm-toggle-button:hover {
                background: #f4511e;
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
            }
        `,
        ui: `
            window.GM_UI = {
                createButtonContainer: function() {
                    debugLog('Aanmaken van button container');
                    let container = document.getElementById('gm-button-container');
                    if (!container) {
                        container = document.createElement('div');
                        container.id = 'gm-button-container';
                        container.style.position = 'fixed';
                        container.style.top = '10px';
                        container.style.right = '10px';
                        container.style.zIndex = '99999';
                        document.body.appendChild(container);
                    }
                    return container;
                },
                createToggleButton: function(container) {
                    debugLog('Aanmaken van toggle knop');
                    const button = document.createElement('button');
                    button.className = 'gm-toggle-button';
                    button.textContent = 'GM MANAGER';
                    button.style.padding = '10px 15px';
                    button.style.fontWeight = 'bold';
                    button.style.fontSize = '14px';
                    button.style.color = 'white';
                    button.style.backgroundColor = '#ff5722';
                    button.style.border = '2px solid #e64a19';
                    button.style.borderRadius = '4px';
                    button.style.cursor = 'pointer';
                    button.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
                    button.style.zIndex = '99999';
                    button.style.position = 'relative';
                    
                    // Hover effect
                    button.onmouseover = function() {
                        this.style.backgroundColor = '#e64a19';
                        this.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
                    };
                    button.onmouseout = function() {
                        this.style.backgroundColor = '#ff5722';
                        this.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
                    };
                    
                    container.appendChild(button);
                    return button;
                }
            };
        `,
        popup: `
            console.log('Initializing GM_Popup...');
            
            if (typeof window.GM_Popup === 'undefined') {
                console.log('Creating new GM_Popup instance');
                window.GM_Popup = {
                    open: function() {
                        console.log('GM_Popup.open() called');
                        debugLog('Openen van popup');
                        
                        // Create a simple popup container
                        let popup = document.getElementById('gm-popup');
                        
                        if (!popup) {
                            popup = document.createElement('div');
                            popup.id = 'gm-popup';
                            popup.style.position = 'fixed';
                            popup.style.top = '50%';
                            popup.style.left = '50%';
                            popup.style.transform = 'translate(-50%, -50%)';
                            popup.style.background = 'white';
                            popup.style.padding = '20px';
                            popup.style.borderRadius = '8px';
                            popup.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                            popup.style.zIndex = '100000';
                            popup.style.maxWidth = '400px';
                            popup.style.width = '90%';
                            popup.style.color = '#333';
                            
                            // Add close button
                            const closeBtn = document.createElement('button');
                            closeBtn.textContent = 'X';
                            closeBtn.style.position = 'absolute';
                            closeBtn.style.top = '5px';
                            closeBtn.style.right = '5px';
                            closeBtn.style.background = 'none';
                            closeBtn.style.border = 'none';
                            closeBtn.style.fontSize = '16px';
                            closeBtn.style.cursor = 'pointer';
                            closeBtn.onclick = function() {
                                document.body.removeChild(popup);
                                if (overlay && overlay.parentNode) {
                                    document.body.removeChild(overlay);
                                }
                            };
                            popup.appendChild(closeBtn);
                            
                            // Add content
                            const content = document.createElement('div');
                            content.innerHTML = \`
                                <h2 style="margin-top: 0; color: #2196F3;">Grepolis Manager</h2>
                                <p>Deze functie is nog in ontwikkeling.</p>
                                <p>Versie: 1.0.1</p>
                            \`;
                            popup.appendChild(content);
                            
                            // Add to body
                            document.body.appendChild(popup);
                            
                            // Add overlay
                            const overlay = document.createElement('div');
                            overlay.style.position = 'fixed';
                            overlay.style.top = '0';
                            overlay.style.left = '0';
                            overlay.style.width = '100%';
                            overlay.style.height = '100%';
                            overlay.style.background = 'rgba(0,0,0,0.5)';
                            overlay.style.zIndex = '99999';
                            overlay.onclick = function() {
                                document.body.removeChild(popup);
                                document.body.removeChild(overlay);
                            };
                            document.body.appendChild(overlay);
                        }
                        
                        return true;
                    },
                    close: function() {
                        const popup = document.getElementById('gm-popup');
                        if (popup && popup.parentNode) {
                            document.body.removeChild(popup);
                        }
                        const overlay = document.querySelector('div[style*="background: rgba(0, 0, 0, 0.5)"]');
                        if (overlay && overlay.parentNode) {
                            document.body.removeChild(overlay);
                        }
                    }
                };
            } else {
                console.log('Using existing GM_Popup instance');
            }
        `
    };

    async function startGM() {
        try {
            debugLog('Starten van Grepolis Manager...');
            
            // Laad modules parallel
            let cssText, ui, popup;
            
            try {
                [cssText, ui, popup] = await Promise.all([
                    loadModule("https://raw.githubusercontent.com/zambia1972/Grepolis-Manager/main/src/styles/styles.css", 'styles.css')
                        .catch(() => fallbackModules.styles),
                    loadModule("https://raw.githubusercontent.com/zambia1972/Grepolis-Manager/main/src/core/ui.js", 'ui.js')
                        .catch(() => fallbackModules.ui),
                    loadModule("https://raw.githubusercontent.com/zambia1972/Grepolis-Manager/main/src/core/popup.js", 'popup.js')
                        .catch(() => fallbackModules.popup)
                ]);
            } catch (error) {
                console.error('Fout bij het laden van modules, gebruik fallback:', error);
                cssText = fallbackModules.styles;
                ui = fallbackModules.ui;
                popup = fallbackModules.popup;
            }

            // Voeg stijlen toe
            GM_addStyle(cssText);
            
            // Voer modules uit in een veilige omgeving
            try {
                (0, eval)(ui);
                (0, eval)(popup);
                debugLog('Modules succesvol geladen en uitgevoerd');
            } catch (e) {
                console.error('Fout bij uitvoeren van modules:', e);
                throw e;
            }

            // Wacht tot Grepolis volledig is geladen
            let attempts = 0;
            const maxAttempts = 30; // 30 pogingen * 200ms = 6 seconden max wachten
            
            function waitForGame() {
                attempts++;
                if (unsafeWindow.Layout && unsafeWindow.Layout.wnd) {
                    debugLog('Grepolis UI gevonden, initialiseer UI');
                    initUI();
                } else if (attempts < maxAttempts) {
                    debugLog(`Wachten op Grepolis UI... (poging ${attempts}/${maxAttempts})`);
                    setTimeout(waitForGame, 200);
                } else {
                    console.warn('Grepolis UI niet gevonden na meerdere pogingen');
                    // Toch proberen de UI te initialiseren met fallback
                    initUI();
                }
            }
            
            waitForGame();

        } catch (error) {
            console.error('Er is een kritieke fout opgetreden in Grepolis Manager:', error);
            // Toon een foutmelding aan de gebruiker
            const errorDiv = document.createElement('div');
            errorDiv.style.position = 'fixed';
            errorDiv.style.top = '10px';
            errorDiv.style.right = '10px';
            errorDiv.style.background = '#ffebee';
            errorDiv.style.color = '#b71c1c';
            errorDiv.style.padding = '10px';
            errorDiv.style.border = '1px solid #ef9a9a';
            errorDiv.style.borderRadius = '4px';
            errorDiv.style.zIndex = '99999';
            errorDiv.innerHTML = '<strong>Grepolis Manager Fout:</strong> ' + 
                               'Er is een fout opgetreden. Bekijk de console voor meer details.';
            document.body.appendChild(errorDiv);
        }
    }

    function initUI() {
        try {
            debugLog('Initialiseren van gebruikersinterface');
            debugLog('Controleren of GM_UI bestaat:', typeof GM_UI);
            
            if (typeof GM_UI === 'undefined') {
                console.error('GM_UI is niet gedefinieerd!');
                return;
            }
            
            debugLog('Aanmaken van button container...');
            const container = GM_UI.createButtonContainer();
            debugLog('Container aangemaakt:', container);
            
            if (!container) {
                console.error('Kon de button container niet aanmaken!');
                return;
            }
            
            debugLog('Aanmaken van toggle knop...');
            const toggle = GM_UI.createToggleButton(container);
            debugLog('Toggle knop aangemaakt:', toggle);
            
            if (!toggle) {
                console.error('Kon de toggle knop niet aanmaken!');
                return;
            }

            // Remove any existing click handlers
            toggle.onclick = null;
            
            // Add a simple, reliable click handler
            toggle.addEventListener('click', function(e) {
                console.log('Button clicked!');
                
                // Show immediate feedback
                const originalText = toggle.textContent;
                toggle.textContent = 'Loading...';
                
                try {
                    console.log('Attempting to open popup...');
                    
                    // Check if GM_Popup exists and has the open method
                    if (window.GM_Popup && typeof window.GM_Popup.open === 'function') {
                        console.log('Calling GM_Popup.open()');
                        window.GM_Popup.open();
                    } else {
                        console.error('GM_Popup not available:', window.GM_Popup);
                        alert('GM_Popup is not available. Please refresh the page.');
                    }
                } catch (error) {
                    console.error('Error in click handler:', error);
                    alert('Error: ' + (error.message || 'Unknown error occurred'));
                } finally {
                    // Restore button text after a short delay
                    setTimeout(() => {
                        toggle.textContent = originalText;
                    }, 1000);
                }
                
                // Stop event propagation
                e.stopPropagation();
                e.preventDefault();
                return false;
            });
            
            // Add visual feedback on click
            toggle.style.transition = 'all 0.2s';
            toggle.addEventListener('mousedown', function() {
                this.style.transform = 'scale(0.95)';
            });
            toggle.addEventListener('mouseup', function() {
                this.style.transform = 'scale(1)';
            });
            toggle.addEventListener('mouseleave', function() {
                this.style.transform = 'scale(1)';
            });
            
            // Voeg een zichtbare indicator toe voor debuggen
            const debugDiv = document.createElement('div');
            debugDiv.style.position = 'fixed';
            debugDiv.style.top = '50px';
            debugDiv.style.right = '10px';
            debugDiv.style.background = '#4CAF50';
            debugDiv.style.color = 'white';
            debugDiv.style.padding = '5px 10px';
            debugDiv.style.borderRadius = '3px';
            debugDiv.style.zIndex = '99999';
            debugDiv.textContent = 'GM Geladen';
            document.body.appendChild(debugDiv);
            
            debugLog('UI succesvol geïnitialiseerd');
        } catch (e) {
            console.error('Fout bij initialiseren van UI:', e);
            const errorDiv = document.createElement('div');
            errorDiv.style.position = 'fixed';
            errorDiv.style.top = '10px';
            errorDiv.style.right = '10px';
            errorDiv.style.background = '#f44336';
            errorDiv.style.color = 'white';
            errorDiv.style.padding = '10px';
            errorDiv.style.borderRadius = '4px';
            errorDiv.style.zIndex = '99999';
            errorDiv.textContent = 'GM Fout: ' + (e.message || 'Onbekende fout');
            document.body.appendChild(errorDiv);
        }
    }

    startGM();

})();