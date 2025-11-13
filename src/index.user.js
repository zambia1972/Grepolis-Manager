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
    function loadCSS() {
        const cssUrl = GM_getResourceURL('css');
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = cssUrl;
        document.head.appendChild(link);
    }

    // Load a module
    async function loadModule(modulePath) {
        console.log(`Loading module: ${modulePath}`);
        
        try {
            const url = `${REPO_BASE}${modulePath}`;
            const code = await fetch(url).then(r => r.text());
            
            // Create a blob URL for the module
            const blob = new Blob([code], { type: 'application/javascript' });
            const blobUrl = URL.createObjectURL(blob);
            
            // Import the module
            const module = await import(blobUrl);
            
            // Initialize the module if it has an init function
            if (module.default && typeof module.default.init === 'function') {
                const instance = new module.default(manager);
                await instance.init();
                manager.modules[modulePath] = instance;
            }
            
            console.log(`Loaded module: ${modulePath}`);
            return true;
        } catch (error) {
            console.error(`Error loading module ${modulePath}:`, error);
            return false;
        }
    }

    // Initialize the manager
    async function initialize() {
        console.log('Initializing Grepolis Manager...');
        
        // Load CSS
        loadCSS();
        
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