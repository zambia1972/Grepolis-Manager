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
            
            // Add main container for UI elements if it doesn't exist
            if (!document.getElementById('gm-button-container')) {
                const container = document.createElement('div');
                container.id = 'gm-button-container';
                container.style.position = 'fixed';
                container.style.top = '10px';
                container.style.right = '10px';
                container.style.zIndex = '9999';
                container.style.display = 'flex';
                container.style.flexDirection = 'column';
                container.style.gap = '5px';
                container.style.background = 'rgba(0, 0, 0, 0.7)';
                container.style.padding = '5px';
                container.style.borderRadius = '5px';
                document.body.appendChild(container);
            }
            
            // Initialize UI elements
            const buttonContainer = document.getElementById('gm-button-container');
            if (buttonContainer) {
                // Clear any existing buttons
                buttonContainer.innerHTML = '';
                
                // Create main GM button
                const gmButton = document.createElement('div');
                gmButton.className = 'gm-button';
                gmButton.title = 'Grepolis Manager';
                gmButton.style.background = 'url(https://gpnl.innogamescdn.com/images/game/autogenerated/layout/layout_095495a.png) no-repeat -607px -182px';
                gmButton.style.width = '32px';
                gmButton.style.height = '32px';
                gmButton.style.cursor = 'pointer';
                gmButton.style.margin = '2px';
                gmButton.style.border = '1px solid #444';
                gmButton.style.borderRadius = '4px';
                gmButton.style.display = 'flex';
                gmButton.style.alignItems = 'center';
                gmButton.style.justifyContent = 'center';
                gmButton.style.color = 'white';
                gmButton.style.fontWeight = 'bold';
                gmButton.style.fontSize = '14px';
                gmButton.textContent = 'GM';
                
                // Create settings button
                const settingsButton = createIconButton('iconInstellingen', 'Instellingen', 'https://gpnl.innogamescdn.com/images/game/autogenerated/layout/layout_095495a.png -607px -182px');
                
                // Create wereldinfo button
                const wereldinfoButton = createIconButton('iconWereldinfo', 'Wereldinfo', 'https://gpnl.innogamescdn.com/images/game/autogenerated/layout/layout_095495a.png -607px -182px');
                
                // Create troop manager button
                const troopButton = createIconButton('iconTroop', 'Troop Manager', 'https://gpnl.innogamescdn.com/images/game/autogenerated/layout/layout_095495a.png -607px -182px');
                
                // Create forum manager button
                const forumButton = createIconButton('iconForum', 'Forum Manager', 'https://gpnl.innogamescdn.com/images/game/autogenerated/layout/layout_095495a.png -607px -182px');
                
                // Add buttons to container
                buttonContainer.appendChild(gmButton);
                buttonContainer.appendChild(settingsButton);
                buttonContainer.appendChild(wereldinfoButton);
                buttonContainer.appendChild(troopButton);
                buttonContainer.appendChild(forumButton);
                
                // Add click handlers
                settingsButton.addEventListener('click', () => {
                    console.log('Settings button clicked');
                    // Toggle settings panel or open settings popup
                    if (manager.modules['modules/settings.js'] && 
                        typeof manager.modules['modules/settings.js'].toggle === 'function') {
                        manager.modules['modules/settings.js'].toggle();
                    }
                });
                
                wereldinfoButton.addEventListener('click', () => {
                    console.log('Wereldinfo button clicked');
                    // Toggle wereldinfo panel
                    if (manager.modules['modules/wereldinfo.js'] && 
                        typeof manager.modules['modules/wereldinfo.js'].toggle === 'function') {
                        manager.modules['modules/wereldinfo.js'].toggle();
                    }
                });
                
                troopButton.addEventListener('click', () => {
                    console.log('Troop Manager button clicked');
                    // Toggle troop manager panel
                    if (manager.modules['modules/troop-manager.js'] && 
                        typeof manager.modules['modules/troop-manager.js'].toggle === 'function') {
                        manager.modules['modules/troop-manager.js'].toggle();
                    }
                });
                
                forumButton.addEventListener('click', () => {
                    console.log('Forum Manager button clicked');
                    // Toggle forum manager panel
                    if (manager.modules['modules/forum-manager.js'] && 
                        typeof manager.modules['modules/forum-manager.js'].toggle === 'function') {
                        manager.modules['modules/forum-manager.js'].toggle();
                    }
                });
                
                // Function to create icon button
                function createIconButton(id, title, icon) {
                    const button = document.createElement('div');
                    button.id = id;
                    button.className = 'gm-icon-button';
                    button.title = title;
                    
                    // Set icon if provided
                    if (icon) {
                        const [url, position] = icon.split(' ');
                        button.style.background = `url(${url}) ${position || '0 0'}`;
                    }
                    
                    // Style the button
                    button.style.width = '32px';
                    button.style.height = '32px';
                    button.style.cursor = 'pointer';
                    button.style.margin = '2px';
                    button.style.border = '1px solid #444';
                    button.style.borderRadius = '4px';
                    button.style.backgroundSize = 'auto';
                    button.style.backgroundRepeat = 'no-repeat';
                    button.style.backgroundColor = '#333';
                    
                    // Add hover effect
                    button.addEventListener('mouseover', () => {
                        button.style.backgroundColor = '#444';
                    });
                    button.addEventListener('mouseout', () => {
                        button.style.backgroundColor = '#333';
                    });
                    
                    return button;
                }
                
                // Show the UI
                buttonContainer.style.display = 'block';
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