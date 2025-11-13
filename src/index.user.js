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
            if (!document.getElementById('grepolis-manager-container')) {
                const container = document.createElement('div');
                container.id = 'grepolis-manager-container';
                container.style.position = 'fixed';
                container.style.top = '10px';
                container.style.right = '10px';
                container.style.zIndex = '9999';
                container.style.display = 'flex';
                container.style.flexDirection = 'column';
                container.style.gap = '5px';
                container.style.background = 'rgba(0, 0, 0, 0.7)';
                container.style.padding = '10px';
                container.style.borderRadius = '5px';
                document.body.appendChild(container);
            }
            
            // Initialize UI elements
            const uiContainer = document.getElementById('grepolis-manager-container');
            if (uiContainer) {
                // Clear any existing buttons
                uiContainer.innerHTML = '';
                
                // Create main toggle button
                const toggleButton = manager.ui.createButton('GM', () => {
                    const buttons = uiContainer.querySelectorAll('.gm-feature-btn');
                    buttons.forEach(btn => {
                        btn.style.display = btn.style.display === 'none' ? 'block' : 'none';
                    });
                });
                
                // Style the main toggle button
                toggleButton.style.background = '#4CAF50';
                toggleButton.style.color = 'white';
                toggleButton.style.border = 'none';
                toggleButton.style.borderRadius = '4px';
                toggleButton.style.padding = '8px 12px';
                toggleButton.style.cursor = 'pointer';
                toggleButton.style.marginBottom = '5px';
                toggleButton.style.fontWeight = 'bold';
                
                // Add main toggle button to container
                uiContainer.appendChild(toggleButton);
                
                // Create feature buttons container
                const buttonsContainer = document.createElement('div');
                buttonsContainer.className = 'gm-buttons-container';
                buttonsContainer.style.display = 'flex';
                buttonsContainer.style.flexDirection = 'column';
                buttonsContainer.style.gap = '5px';
                
                // Create buttons for each feature
                const buttons = [
                    { id: 'settings', text: 'Instellingen', color: '#2196F3' },
                    { id: 'wereldinfo', text: 'Wereldinfo', color: '#9C27B0' },
                    { id: 'troop', text: 'Troop Manager', color: '#FF9800' },
                    { id: 'forum', text: 'Forum Manager', color: '#E91E63' },
                    { id: 'map', text: 'Map Overlay', color: '#00BCD4' }
                ];
                
                // Add each button to the container
                buttons.forEach(btnInfo => {
                    const btn = manager.ui.createButton(btnInfo.text, () => {
                        // Handle button click - this will be connected to the respective module
                        console.log(`Button clicked: ${btnInfo.text}`);
                        
                        // Toggle active state
                        btn.classList.toggle('active');
                        if (btn.classList.contains('active')) {
                            btn.style.opacity = '0.8';
                            // Call the appropriate module's show method if it exists
                            if (manager.modules[`modules/${btnInfo.id}.js`] && 
                                typeof manager.modules[`modules/${btnInfo.id}.js`].show === 'function') {
                                manager.modules[`modules/${btnInfo.id}.js`].show();
                            }
                        } else {
                            btn.style.opacity = '1';
                            // Call the appropriate module's hide method if it exists
                            if (manager.modules[`modules/${btnInfo.id}.js`] && 
                                typeof manager.modules[`modules/${btnInfo.id}.js`].hide === 'function') {
                                manager.modules[`modules/${btnInfo.id}.js`].hide();
                            }
                        }
                    });
                    
                    // Style the button
                    btn.className = 'gm-feature-btn';
                    btn.style.display = 'none'; // Initially hidden
                    btn.style.background = btnInfo.color;
                    btn.style.color = 'white';
                    btn.style.border = 'none';
                    btn.style.borderRadius = '4px';
                    btn.style.padding = '6px 10px';
                    btn.style.cursor = 'pointer';
                    btn.style.transition = 'opacity 0.2s';
                    btn.style.textAlign = 'left';
                    
                    // Add hover effect
                    btn.onmouseover = () => btn.style.opacity = '0.8';
                    btn.onmouseout = function() {
                        if (!this.classList.contains('active')) {
                            this.style.opacity = '1';
                        }
                    };
                    
                    // Add to container
                    buttonsContainer.appendChild(btn);
                });
                
                // Add buttons container to UI
                uiContainer.appendChild(buttonsContainer);
                
                // Show the UI
                uiContainer.style.display = 'block';
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