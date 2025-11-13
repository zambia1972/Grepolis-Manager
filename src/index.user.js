// ==UserScript==
// @name         Grepolis Manager (Loader)
// @namespace    https://github.com/zambia1972/Grepolis-Manager
// @version      1.0.0
// @description  Minimal loader — rest op GitHub
// @match        https://*.grepolis.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @grant        GM_info
// @grant        GM_notification
// @grant        GM_openInTab
// @grant        unsafeWindow
// @resource     css https://raw.githubusercontent.com/zambia1972/Grepolis-Manager/main/src/css/grepolis-manager.css
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
        console.log(`Loading module: ${modulePath}`);
        
        try {
            const url = `${REPO_BASE}${modulePath}`;
            const response = await manager.fetchWithRetry(url);
            const code = await response.text();
            
            // Create a blob URL for the module
            const blob = new Blob([code], { type: 'application/javascript' });
            const blobUrl = URL.createObjectURL(blob);
            
            try {
                // Import the module
                const module = await import(blobUrl);
                
                // Initialize the module if it has an init function
                if (module.default) {
                    try {
                        const instance = new module.default(manager);
                        instance.manager = manager;
                        instance.uw = manager.uw;
                        if (typeof instance.init === 'function') {
                            await instance.init(manager);
                        }
                        manager.modules[modulePath] = instance;
                        console.log(`Loaded module: ${modulePath}`);
                        return true;
                    } catch (e) {
                        console.error(`Error initializing module ${modulePath}:`, e);
                        return false;
                    }
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
        console.log('Initializing Grepolis Manager...');
        
        // Load CSS
        await loadCSS();
        
        // Load modules in sequence
        for (const modulePath of MODULE_LIST) {
            await loadModule(modulePath);
        }
        
        console.log('Grepolis Manager initialized');
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