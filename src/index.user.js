// ==UserScript==
// @name         Grepolis Manager (Loader)
// @namespace    https://github.com/zambia1972/Grepolis-Manager
// @version      1.0.0
// @description  Minimal loader — rest op GitHub
// @match        https://*.grepolis.com/*
// @grant        GM_getResourceURL
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @grant        GM_info
// @grant        GM_notification
// @grant        GM_openInTab
// @grant        unsafeWindow
// @resource     iconGM https://raw.githubusercontent.com/zambia1972/Grepolis-Manager/main/assets/icons/iconGM.png
// @resource     iconInstellingen https://raw.githubusercontent.com/zambia1972/Grepolis-Manager/main/assets/icons/instellingen.png
// @resource     iconWereldinfo https://raw.githubusercontent.com/zambia1972/Grepolis-Manager/main/assets/icons/wereldinfo.png
// @resource     iconForum https://raw.githubusercontent.com/zambia1972/Grepolis-Manager/main/assets/icons/icioon-forummanager.png
// @resource     iconTroop https://raw.githubusercontent.com/zambia1972/Grepolis-Manager/main/assets/icons/icioon-troopmanager.png
// @resource     css https://raw.githubusercontent.com/zambia1972/Grepolis-Manager/main/src/css/grepolis-manager.css
// ==/UserScript==

(function() {
    'use strict';

    const DEBUG = true;
    const REPO_BASE = 'https://raw.githubusercontent.com/zambia1972/Grepolis-Manager/main/src/';
    
    // List of modules to load in order
    const MODULE_LIST = [
        'libs/gm-fetch.js',
        'modules/base-manager.js',
        'modules/settings.js',
        'modules/troop-manager.js',
        'modules/wereldinfo.js',
        'modules/forum-manager.js',
        'modules/map-overlay.js',
        'modules/supabase-sync.js',
        'modules/ui-helpers.js'
    ];

    // Helper function to fetch text content
    async function fetchText(url) {
        return new Promise((resolve, reject) => {
            // Try native fetch first, fall back to GM_xmlhttpRequest
            fetch(url)
                .then(response => {
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    return response.text();
                })
                .then(resolve)
                .catch(() => {
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url: url,
                        onload: (response) => {
                            if (response.status >= 200 && response.status < 300) {
                                resolve(response.responseText);
                            } else {
                                reject(new Error(`HTTP ${response.status}`));
                            }
                        },
                        onerror: (error) => reject(error)
                    });
                });
        });
    }

    // Load and inject CSS
    function injectStyles() {
        try {
            const cssUrl = GM_getResourceURL('css');
            if (cssUrl) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = cssUrl;
                document.head.appendChild(link);
                if (DEBUG) console.log('Injected CSS');
            }
        } catch (e) {
            console.error('Failed to load CSS:', e);
        }
    }

    // Load a single module
    async function loadModule(path) {
        const url = REPO_BASE + path;
        try {
            const code = await fetchText(url);
            const blob = new Blob([code], { type: 'text/javascript' });
            const blobUrl = URL.createObjectURL(blob);
            const module = await import(blobUrl);
            URL.revokeObjectURL(blobUrl);
            return module;
        } catch (error) {
            console.error(`Failed to load module ${path}:`, error);
            throw error;
        }
    }

    // Main initialization
    async function initialize() {
        if (DEBUG) console.log('Initializing Grepolis Manager...');
        
        // Inject CSS first
        injectStyles();
        
        // Create a global object to store the manager and modules
        if (!window.GrepoManager) {
            window.GrepoManager = {
                modules: {},
                config: {},
                settings: {},
                debug: DEBUG
            };
        }

        // Load all modules in sequence
        for (const path of MODULE_LIST) {
            try {
                const moduleName = path.split('/').pop().replace(/\.js$/, '');
                if (DEBUG) console.log(`Loading module: ${moduleName}`);
                
                const module = await loadModule(path);
                window.GrepoManager.modules[moduleName] = module;
                
                // If the module has an init function, call it
                if (module.default && typeof module.default.init === 'function') {
                    await module.default.init(window.GrepoManager);
                }
                
                if (DEBUG) console.log(`Loaded module: ${moduleName}`);
            } catch (error) {
                console.error(`Error loading module ${path}:`, error);
            }
        }

        if (DEBUG) console.log('Grepolis Manager initialized');
    }

    // Start initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();
