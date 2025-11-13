// ==UserScript==
// @name         Grepolis Manager
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  A comprehensive manager for Grepolis
// @author       You
// @match        https://*.grepolis.com/game/*
// @icon         https://www.google.com/s2/favicons?domain=grepolis.com
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @grant        GM_notification
// @grant        GM_getResourceText
// @grant        GM_getResourceURL
// @resource     css https://raw.githubusercontent.com/zambia1972/Grepolis-Manager/main/src/css/grepolis-manager.css
// @resource     unitsJson https://raw.githubusercontent.com/zambia1972/Grepolis-Manager/main/src/data/units.json
// @connect      raw.githubusercontent.com
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    const DEBUG = true;
    const REPO_BASE = 'https://raw.githubusercontent.com/zambia1972/Grepolis-Manager/main/src/';
    
    // List of modules to load in order
    const MODULE_LIST = [
        'modules/base-manager.js',
        'modules/ui-helpers.js',
        'modules/settings.js',
        'modules/troop-manager.js',
        'modules/wereldinfo.js',
        'modules/forum-manager.js',
        'modules/map-overlay.js'
    ];

    // Main manager object
    const manager = {
        modules: {},
        uw: typeof unsafeWindow !== 'undefined' ? unsafeWindow : window,
        settings: {
            debug: DEBUG,
            getSetting: function(key, defaultValue) {
                try {
                    const value = GM_getValue(`setting_${key}`, defaultValue);
                    return value;
                } catch (e) {
                    console.error('Error getting setting:', e);
                    return defaultValue;
                }
            },
            setSetting: function(key, value) {
                try {
                    GM_setValue(`setting_${key}`, value);
                    return true;
                } catch (e) {
                    console.error('Error setting setting:', e);
                    return false;
                }
            }
        },
        storage: {
            get: function(key, defaultValue) {
                try {
                    const value = GM_getValue(`data_${key}`, defaultValue);
                    return value;
                } catch (e) {
                    console.error('Error getting storage:', e);
                    return defaultValue;
                }
            },
            set: function(key, value) {
                try {
                    GM_setValue(`data_${key}`, value);
                    return true;
                } catch (e) {
                    console.error('Error setting storage:', e);
                    return false;
                }
            }
        },
        ui: {
            showNotification: function(message, type = 'info') {
                GM_notification({
                    text: message,
                    title: 'Grepolis Manager',
                    timeout: 3000
                });
            },
            createButton: function(text, onClick, className = '') {
                const button = document.createElement('button');
                button.textContent = text;
                button.className = `gm-button ${className}`;
                button.addEventListener('click', onClick);
                return button;
            },
            createElement: function(tag, className = '', attributes = {}) {
                const element = document.createElement(tag);
                if (className) element.className = className;
                Object.entries(attributes).forEach(([key, value]) => {
                    element.setAttribute(key, value);
                });
                return element;
            },
            createIcon: function(iconName, className = '') {
                const icon = document.createElement('i');
                icon.className = `gm-icon gm-icon-${iconName} ${className}`;
                return icon;
            }
        },
        debug: DEBUG ? console.debug.bind(console) : function() {}
    };

    // Add storage and settings methods to main manager
    manager.getSetting = manager.settings.getSetting.bind(manager.settings);
    manager.setSetting = manager.settings.setSetting.bind(manager.settings);
    manager.getStorage = manager.storage.get.bind(manager.storage);
    manager.setStorage = manager.storage.set.bind(manager.storage);

    // Load CSS
    async function loadCSS() {
        const cssUrl = 'https://raw.githubusercontent.com/zambia1972/Grepolis-Manager/main/src/css/grepolis-manager.css';
        
        try {
            const response = await manager.fetchWithRetry(cssUrl);
            if (!response.ok) throw new Error('Failed to fetch CSS');
            
            const cssText = await response.text();
            const style = document.createElement('style');
            style.textContent = cssText;
            document.head.appendChild(style);
            console.log('CSS loaded successfully');
        } catch (error) {
            console.error('Failed to load CSS:', error);
            // Fallback to inline styles
            const fallbackStyle = document.createElement('style');
            fallbackStyle.textContent = `
                .gm-button {
                    padding: 5px 10px;
                    margin: 2px;
                    border: 1px solid #ccc;
                    background: #f5f5f5;
                    cursor: pointer;
                }
                .gm-button:hover {
                    background: #e5e5e5;
                }
                .gm-icon {
                    display: inline-block;
                    width: 16px;
                    height: 16px;
                    background-size: contain;
                    background-repeat: no-repeat;
                    margin-right: 5px;
                    vertical-align: middle;
                }
            `;
            document.head.appendChild(fallbackStyle);
        }
    }

    // Add fetchWithRetry to manager
    manager.fetchWithRetry = async function(url, options = {}, retries = 3, delay = 1000) {
        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(url, options);
                if (response.ok) return response;
                throw new Error(`HTTP error! status: ${response.status}`);
            } catch (error) {
                if (i === retries - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    };

    // Load a module
    async function loadModule(modulePath) {
        try {
            const fullUrl = `${REPO_BASE}${modulePath}`;
            console.log(`Loading module: ${modulePath}`);
            
            // Fetch the module code
            const response = await manager.fetchWithRetry(fullUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const code = await response.text();
            
            // Create a blob URL for the module
            const blob = new Blob([code], { type: 'application/javascript' });
            const blobUrl = URL.createObjectURL(blob);
            
            try {
                // Import the module
                const module = await import(blobUrl);
                
                // Initialize the module if it has a default export with an init method
                if (module && module.default) {
                    const instance = new module.default(manager);
                    instance.manager = manager;
                    instance.uw = manager.uw;
                    
                    if (typeof instance.init === 'function') {
                        await instance.init(manager);
                    }
                    
                    manager.modules[modulePath] = instance;
                    console.log(`Loaded module: ${modulePath}`);
                    return true;
                }
                
                console.log(`Loaded module (no default export): ${modulePath}`);
                return true;
            } catch (error) {
                console.error(`Failed to load module ${modulePath}:`, error);
                return false;
            } finally {
                URL.revokeObjectURL(blobUrl);
            }
        } catch (error) {
            console.error(`Error in loadModule for ${modulePath}:`, error);
            return false;
        }
    }

    // Add storage methods to manager for easier access
    manager.getStorage = manager.storage.get.bind(manager.storage);
    manager.setStorage = manager.storage.set.bind(manager.storage);

    // Load CSS
    async function loadCSS() {
    const cssUrl = 'https://raw.githubusercontent.com/zambia1972/Grepolis-Manager/main/src/css/grepolis-manager.css';
    
    try {
        const response = await manager.fetchWithRetry(cssUrl);
        if (!response.ok) throw new Error('Failed to fetch CSS');
        
        const cssText = await response.text();
        const style = document.createElement('style');
        style.textContent = cssText;
        document.head.appendChild(style);
        console.log('CSS loaded successfully');
    } catch (error) {
        console.error('Failed to load CSS:', error);
        // Fallback to inline styles
        const fallbackStyle = document.createElement('style');
        fallbackStyle.textContent = `
            .gm-button {
                padding: 5px 10px;
                margin: 2px;
                border: 1px solid #ccc;
                background: #f5f5f5;
                cursor: pointer;
            }
            .gm-button:hover {
                background: #e5e5e5;
            }
            .gm-icon {
                display: inline-block;
                width: 16px;
                height: 16px;
                background-size: contain;
                background-repeat: no-repeat;
                margin-right: 5px;
                vertical-align: middle;
            }
        `;
        document.head.appendChild(fallbackStyle);
    }
}

// Add fetchWithRetry to manager
manager.fetchWithRetry = async function(url, options = {}, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.ok) return response;
            throw new Error(`HTTP error! status: ${response.status}`);
        } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
};

// Load a module
async function loadModule(modulePath) {
    try {
        const fullUrl = `${REPO_BASE}${modulePath}`;
        console.log(`Loading module: ${modulePath}`);
        
        // Fetch the module code
        const response = await manager.fetchWithRetry(fullUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const code = await response.text();
        
        // Create a blob URL for the module
        const blob = new Blob([code], { type: 'application/javascript' });
        const blobUrl = URL.createObjectURL(blob);
        
        try {
            // Import the module
            const module = await import(blobUrl);
            
            // Initialize the module if it has a default export with an init method
            if (module && module.default) {
                const instance = new module.default(manager);
                instance.manager = manager;
                instance.uw = manager.uw;
                
                if (typeof instance.init === 'function') {
                    await instance.init(manager);
                }
                
                manager.modules[modulePath] = instance;
                console.log(`Loaded module: ${modulePath}`);
                return true;
            }
            
            console.log(`Loaded module (no default export): ${modulePath}`);
            return true;
        } finally {
            URL.revokeObjectURL(blobUrl);
        }
    } catch (error) {
        console.error(`Error loading module ${modulePath}:`, error);
        return false;
    }
}

// Initialize the manager
async function initialize() {
    try {
        console.log('Initializing Grepolis Manager...');
        
        // Load CSS first
        await loadCSS();
        
        // Load all modules
        for (const modulePath of MODULE_LIST) {
            await loadModule(modulePath);
        }
        
        // Prevent duplicate container
        if (document.getElementById('gm-button-container')) return;

        // Create main button container
        const container = document.createElement('div');
        container.id = 'gm-button-container';
        container.style.position = 'fixed';
        container.style.top = '1px';
        container.style.left = '380px';
        container.style.display = 'inline-flex';
        container.style.flexDirection = 'row';
        container.style.gap = '1px';
        container.style.zIndex = '9999';
        container.style.background = 'rgba(0,0,0,0.2)';
        container.style.padding = '2px';
        container.style.width = 'auto';
        container.style.height = 'auto';
        document.body.appendChild(container);

        // Button titles (tooltips)
        const buttonTitles = [
            'Grepolis Manager Startscherm',
            'Instellingen',
            'Wereldinfo',
            'Troop Manager',
            'Forum Manager',
            'Afwezigheids Manager'
        ];

        // Callbacks for each button
        const callbacks = [
            // Start screen
            (active) => {
                if (active) {
                    openPanel('startscreen', (container) => {
                        container.innerHTML = '<h2>Grepolis Manager</h2><p>Welcome to Grepolis Manager</p>';
                    });
                } else {
                    document.getElementById('gm-panel-startscreen')?.remove();
                }
            },
            // Settings
            (active) => {
                if (active) {
                    openPanel('settings', (container) => {
                        if (manager.modules['modules/settings.js']?.render) {
                            manager.modules['modules/settings.js'].render(container);
                        }
                    });
                } else {
                    document.getElementById('gm-panel-settings')?.remove();
                }
            },
            // Wereldinfo
            (active) => {
                if (active) {
                    openPanel('wereldinfo', (container) => {
                        if (manager.modules['modules/wereldinfo.js']?.render) {
                            manager.modules['modules/wereldinfo.js'].render(container);
                        }
                    });
                } else {
                    document.getElementById('gm-panel-wereldinfo')?.remove();
                }
            },
            // Troop Manager
            (active) => {
                if (manager.modules['modules/troop-manager.js']) {
                    if (active) {
                        manager.modules['modules/troop-manager.js'].toggle(true);
                    } else {
                        manager.modules['modules/troop-manager.js'].toggle(false);
                    }
                }
            },
            // Forum Manager
            (active) => {
                if (manager.modules['modules/forum-manager.js']) {
                    if (active) {
                        manager.modules['modules/forum-manager.js'].toggle(true);
                    } else {
                        manager.modules['modules/forum-manager.js'].toggle(false);
                    }
                }
            },
            // Afwezigheids Manager
            (active) => {
                if (active) {
                    openPanel('afwezigheid', (container) => {
                        container.innerHTML = '<h2>Afwezigheids Manager</h2><p>Afwezigheids Manager content here</p>';
                    });
                } else {
                    document.getElementById('gm-panel-afwezigheid')?.remove();
                }
            }
        ];

        // Button states
        const buttonStates = new Array(buttonTitles.length).fill(false);

        // Sprite URL for buttons
        const spriteUrl = 'https://gpnl.innogamescdn.com/images/game/autogenerated/layout/layout_095495a.png';

        // Create buttons
        callbacks.forEach((callback, index) => {
            const button = document.createElement('div');
            button.className = 'gm-toggle-button gm-original-button';
            button.title = buttonTitles[index];
            button.dataset.index = index;

            // Base style (sprite)
            button.style.background = `url(${spriteUrl}) no-repeat -607px -182px`;
            button.style.width = '32px';
            button.style.height = '32px';
            button.style.display = 'flex';
            button.style.alignItems = 'center';
            button.style.justifyContent = 'center';
            button.style.cursor = 'pointer';
            button.style.margin = '0 1px';

            // Add icon or text for GM button
            if (index === 0) {
                // GM button with text
                button.textContent = 'GM';
                button.style.color = 'white';
                button.style.fontWeight = 'bold';
                button.style.fontSize = '14px';
            } else {
                // Other buttons with icons
                const iconEl = document.createElement('div');
                iconEl.className = `gm-icon-${index}`;
                iconEl.style.width = '20px';
                iconEl.style.height = '20px';
                iconEl.style.background = `url(${spriteUrl}) no-repeat`;
                
                // Set different background positions for different icons
                const positions = [
                    '', // GM button (handled separately)
                    '0 -50px', // Settings
                    '0 -100px', // Wereldinfo
                    '0 -150px', // Troop
                    '0 -200px'  // Forum
                ];
                
                if (positions[index]) {
                    iconEl.style.backgroundPosition = positions[index];
                }
                
                button.appendChild(iconEl);
            }

            // Click handler
            button.addEventListener('click', () => {
                const idx = parseInt(button.dataset.index);
                buttonStates[idx] = !buttonStates[idx];

                // Toggle button state
                button.style.background = buttonStates[idx]
                    ? `url(${spriteUrl}) no-repeat -639px -214px`
                    : `url(${spriteUrl}) no-repeat -607px -182px`;

                // Call the callback
                try {
                    callback(buttonStates[idx]);
                } catch (err) {
                    console.error('Button callback error:', err);
                }
            });

            container.appendChild(button);
        });

        // Add openPanel function to manager
        manager.openPanel = openPanel;

        // Panel management
        function openPanel(id, renderFn, sizeClass = 'gm-panel-medium') {
            // Close existing panel with same id
            const old = document.getElementById(`gm-panel-${id}`);
            if (old) old.remove();

            // Create panel
            const panel = document.createElement('div');
            panel.id = `gm-panel-${id}`;
            panel.className = `gm-panel ${sizeClass} active`;

            // Close button
            const closeBtn = document.createElement('button');
            closeBtn.className = 'gm-close-btn';
            closeBtn.textContent = '×';
            closeBtn.onclick = () => panel.remove();
            panel.appendChild(closeBtn);

            // Content container
            const content = document.createElement('div');
            content.className = 'gm-panel-body';
            panel.appendChild(content);

            // Render content
            if (typeof renderFn === 'function') {
                renderFn(content);
            } else {
                content.textContent = `Panel: ${id}`;
            }

            document.body.appendChild(panel);
        }      
        console.log('Grepolis Manager initialized');
    } catch (error) {
        console.error('Failed to initialize Grepolis Manager:', error);
    }
}

// Start the manager when the page is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}

// Expose the manager to the window for debugging
window.gm = manager;
})();