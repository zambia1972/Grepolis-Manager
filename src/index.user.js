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
                /* Main container */
                #gm-button-container {
                    position: fixed;
                    top: 1px;
                    left: 380px;
                    display: flex;
                    flex-direction: row;
                    gap: 1px;
                    z-index: 9999;
                    background: rgba(0,0,0,0.2);
                    padding: 2px;
                }

                /* Buttons */
                .gm-toggle-button {
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    background: url('https://grepodata.com/images/ui/button.png') no-repeat -32px 0;
                    transition: all 0.2s ease;
                    position: relative;
                    overflow: hidden;
                }

                .gm-toggle-button:hover {
                    background-position: -64px 0;
                }

                .gm-toggle-button.active {
                    background-position: 0 0;
                }

                /* Icons */
                .gm-icon {
                    width: 20px;
                    height: 20px;
                    background-image: url('https://grepodata.com/images/ui/icons.png');
                    background-repeat: no-repeat;
                    pointer-events: none;
                }

                /* GM Button */
                .gm-toggle-button[title="Grepolis Manager Startscherm"] {
                    color: #fff;
                    font-weight: bold;
                    font-size: 14px;
                    text-shadow: 0 0 2px #000;
                    line-height: 32px;
                }

                /* Panel styles */
                .gm-panel {
                    position: fixed;
                    top: 40px;
                    right: 10px;
                    width: 400px;
                    max-width: 90%;
                    background: #1a1a1a;
                    border: 1px solid #444;
                    border-radius: 4px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
                    z-index: 10000;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    opacity: 0;
                    transform: translateY(-20px);
                    transition: opacity 0.2s ease, transform 0.2s ease;
                }

                .gm-panel.active {
                    opacity: 1;
                    transform: translateY(0);
                }

                .gm-panel-header {
                    padding: 10px 15px;
                    background: #2a2a2a;
                    border-bottom: 1px solid #444;
                    color: #fff;
                    font-weight: bold;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .gm-panel-content {
                    padding: 15px;
                    overflow-y: auto;
                    max-height: 70vh;
                    color: #eee;
                }

                .gm-close-btn {
                    position: absolute;
                    top: 5px;
                    right: 5px;
                    width: 24px;
                    height: 24px;
                    background: transparent;
                    border: none;
                    color: #ccc;
                    font-size: 20px;
                    line-height: 1;
                    cursor: pointer;
                    z-index: 10;
                }

                .gm-close-btn:hover {
                    color: #fff;
                }

                /* Notification styles */
                .gm-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 10px 15px;
                    border-radius: 4px;
                    color: white;
                    z-index: 9999;
                    animation: slideIn 0.3s ease-out;
                    max-width: 300px;
                }

                .gm-notification.success {
                    background-color: #4caf50;
                }

                .gm-notification.error {
                    background-color: #f44336;
                }

                .gm-notification.info {
                    background-color: #2196f3;
                }

                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
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
        document.body.appendChild(container);

        // Button configurations
        const buttonConfigs = [
            {
                title: 'Grepolis Manager Startscherm',
                icon: 'icon-gm',
                action: (active) => {
                    if (active) {
                        openPanel('startscreen', (container) => {
                            container.innerHTML = `
                                <div class="gm-panel-header">
                                    <h2>Grepolis Manager</h2>
                                </div>
                                <div class="gm-panel-content">
                                    <p>Welcome to Grepolis Manager</p>
                                </div>
                            `;
                        }, 'gm-panel-medium');
                    } else {
                        document.getElementById('gm-panel-startscreen')?.remove();
                    }
                }
            },
            {
                title: 'Instellingen',
                icon: 'icon-settings',
                action: (active) => {
                    if (active) {
                        openPanel('settings', (container) => {
                            if (manager.modules['modules/settings.js']?.render) {
                                manager.modules['modules/settings.js'].render(container);
                            } else {
                                container.innerHTML = `
                                    <div class="gm-panel-header">
                                        <h2>Instellingen</h2>
                                    </div>
                                    <div class="gm-panel-content">
                                        <p>Settings module not loaded</p>
                                    </div>
                                `;
                            }
                        }, 'gm-panel-medium');
                    } else {
                        document.getElementById('gm-panel-settings')?.remove();
                    }
                }
            },
            {
                title: 'Wereldinfo',
                icon: 'icon-world',
                action: (active) => {
                    if (active) {
                        openPanel('wereldinfo', (container) => {
                            if (manager.modules['modules/wereldinfo.js']?.render) {
                                manager.modules['modules/wereldinfo.js'].render(container);
                            } else {
                                container.innerHTML = `
                                    <div class="gm-panel-header">
                                        <h2>Wereldinfo</h2>
                                    </div>
                                    <div class="gm-panel-content">
                                        <p>Wereldinfo module not loaded</p>
                                    </div>
                                `;
                            }
                        }, 'gm-panel-large');
                    } else {
                        document.getElementById('gm-panel-wereldinfo')?.remove();
                    }
                }
            },
            {
                title: 'Troop Manager',
                icon: 'icon-troop',
                action: (active) => {
                    if (manager.modules['modules/troop-manager.js']) {
                        manager.modules['modules/troop-manager.js'].toggle(active);
                        // Toggle button state
                        const button = document.querySelector(`#gm-button-container [data-index="${index}"]`);
                        if (button) {
                            button.classList.toggle('active', active);
                        }
                    } else {
                        console.error('Troop Manager module not found');
                        manager.ui.showNotification('Troop Manager module not loaded', 'error');
                    }
                }
            },
            {
                title: 'Forum Manager',
                icon: 'icon-forum',
                action: (active) => {
                    if (manager.modules['modules/forum-manager.js']) {
                        manager.modules['modules/forum-manager.js'].toggle(active);
                        // Toggle button state
                        const button = document.querySelector(`#gm-button-container [data-index="${index}"]`);
                        if (button) {
                            button.classList.toggle('active', active);
                        }
                    } else {
                        console.error('Forum Manager module not found');
                        manager.ui.showNotification('Forum Manager module not loaded', 'error');
                    }
                }
            },
            {
                title: 'Afwezigheids Manager',
                icon: 'icon-afk',
                action: (active) => {
                    if (active) {
                        openPanel('afwezigheid', (container) => {
                            if (manager.modules['modules/afwezigheid.js']?.render) {
                                manager.modules['modules/afwezigheid.js'].render(container);
                            } else {
                                container.innerHTML = `
                                    <div class="gm-panel-header">
                                        <h2>Afwezigheids Manager</h2>
                                    </div>
                                    <div class="gm-panel-content">
                                        <p>Afwezigheids Manager module not loaded</p>
                                    </div>
                                `;
                            }
                        }, 'gm-panel-medium');
                    } else {
                        document.getElementById('gm-panel-afwezigheid')?.remove();
                    }
                }
            }
        ];

        // Create buttons
        buttonConfigs.forEach((config, index) => {
            const button = document.createElement('div');
            button.className = 'gm-toggle-button gm-original-button';
            button.title = config.title;
            button.dataset.index = index;

            // Add icon
            const iconEl = document.createElement('div');
            iconEl.className = `gm-icon ${config.icon}`;

            // Set icon position based on type
            if (config.icon === 'icon-gm') {
                // GM button with text
                button.textContent = 'GM';
            } else {
                // Other buttons with icons
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

                // Call the action
                try {
                    config.action(buttonStates[idx]);
                } catch (err) {
                    console.error('Button action error:', err);
                    manager.ui.showNotification(`Error in ${config.title}: ${err.message}`, false);
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
            if (old) {
                old.remove();
                return; // Don't reopen if already open
            }

            // Create panel
            const panel = document.createElement('div');
            panel.id = `gm-panel-${id}`;
            panel.className = `gm-panel ${sizeClass} active`;
            panel.style.cssText = `
                position: fixed;
                top: 40px;
                right: 10px;
                width: 400px;
                max-width: 90%;
                background: #1a1a1a;
                border: 1px solid #444;
                border-radius: 4px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
                z-index: 10000;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                opacity: 0;
                transform: translateY(-20px);
                transition: opacity 0.2s ease, transform 0.2s ease;
            `;

            // Add animation
            setTimeout(() => {
                panel.style.opacity = '1';
                panel.style.transform = 'translateY(0)';
            }, 10);

            // Close button
            const closeBtn = document.createElement('button');
            closeBtn.className = 'gm-close-btn';
            closeBtn.textContent = '×';
            closeBtn.style.cssText = `
                position: absolute;
                top: 5px;
                right: 5px;
                width: 24px;
                height: 24px;
                background: transparent;
                border: none;
                color: #ccc;
                font-size: 20px;
                line-height: 1;
                cursor: pointer;
                z-index: 10;
            `;
            closeBtn.addEventListener('click', () => {
                panel.style.opacity = '0';
                panel.style.transform = 'translateY(-20px)';
                setTimeout(() => panel.remove(), 200);
                
                // Update button state
                const button = document.querySelector(`#gm-button-container [data-action="${id}"]`);
                if (button) {
                    button.classList.remove('active');
                }
            });
            panel.appendChild(closeBtn);

            // Content container
            const content = document.createElement('div');
            content.className = 'gm-panel-body';
            content.style.cssText = `
                padding: 15px;
                overflow-y: auto;
                max-height: 80vh;
                color: #eee;
            `;
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