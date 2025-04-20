// ==UserScript==
// @name         Grepolis Script Loader
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Laad meerdere Grepolis-scripts vanaf GitHub en controleer op updates
// @author       Zambia1972
// @match        *://*.grepolis.com/*
// @grant        GM_xmlhttpRequest
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// @updateURL    https://github.com/zambia1972/Grepolis-Manager/raw/refs/heads/main/Grepolis%20Script%20Loader-1.1.user.js
// @downloadURL  https://github.com/zambia1972/Grepolis-Manager/raw/refs/heads/main/Grepolis%20Script%20Loader-1.1.user.js
// ==/UserScript==

(function() {
    'use strict';

    EventTarget.prototype.addEventListener = (function(original) {
        return function(type, listener, options) {
            if (type === 'touchstart' || type === 'touchmove' || type === 'wheel') {
                options = Object.assign({}, options, { passive: true });
            }
            return original.call(this, type, listener, options);
        };
    })(EventTarget.prototype.addEventListener);

    const scripts = [
        'https://github.com/zambia1972/Grepolis-Manager/raw/refs/heads/main/scripts/Grepolis%20Spelersnaam%20en%20Player-ID%20Ophalen%20(localStorage)-1.3.user.js',
        'https://github.com/zambia1972/Grepolis-Manager/raw/refs/heads/main/scripts/DIO-TOOLS-David1327-4.36.user.js',
        'https://github.com/zambia1972/Grepolis-Manager/raw/refs/heads/main/scripts/GrepoData%20City%20Indexer-2.0.0.user.js',
        'https://github.com/zambia1972/Grepolis-Manager/raw/refs/heads/main/scripts/GrepoTools-1.9.7.user.js',
        'https://github.com/zambia1972/Grepolis-Manager/raw/refs/heads/main/scripts/Grepolis%20Manager%20(GM)-0.1.user.js',
        'https://github.com/zambia1972/Grepolis-Manager/raw/refs/heads/main/scripts/Grepolis%20Map%20Enhancer-2024.11.24.1.user.js',
        'https://github.com/zambia1972/Grepolis-Manager/raw/refs/heads/main/scripts/Grepolis%20Notepad%20Forum%20Template%203-1.9%20(1).user.js',
        'https://github.com/zambia1972/Grepolis-Manager/raw/refs/heads/main/scripts/Grepolis%20Report%20Converter-5.4.4.user.js',
    ];

    function loadScript(url) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                onload: (response) => {
                    if (response.status === 200) {
                        try {
                            const scriptContent = response.responseText;
                            const scriptName = url.split('/').pop().split('-')[0];
                            const wrappedScript = `
                        (function(){
                            const unsafeWindow = window;
                            const GM_info = {
                                script: {
                                    name: '${scriptName}',
                                    version: '1.0',
                                    namespace: 'http://tampermonkey.net/',
                                    description: 'Loaded by Grepolis Script Loader',
                                    author: 'Unknown',
                                    // Add other properties as needed
                                },
                                // Add other GM_info properties as needed
                            };
                            const GM = {
                                getValue: (key, defaultValue) => localStorage.getItem(key) || defaultValue,
                                setValue: (key, value) => localStorage.setItem(key, value),
                                deleteValue: (key) => localStorage.removeItem(key),
                                xmlHttpRequest: (details) => {
                                    // Basic implementation of GM_xmlhttpRequest
                                    const xhr = new XMLHttpRequest();
                                    xhr.open(details.method, details.url);
                                    xhr.onload = () => details.onload({ responseText: xhr.responseText, status: xhr.status });
                                    xhr.onerror = details.onerror;
                                    xhr.send(details.data);
                                },
                                // Add other GM_ functions as needed
                            };
                            const GM_getValue = GM.getValue;
                            const GM_setValue = GM.setValue;
                            const GM_deleteValue = GM.deleteValue;
                            const GM_xmlhttpRequest = GM.xmlHttpRequest;
                            // Add other GM_ functions as needed
                            try {
                                ${scriptContent}
                            } catch (e) {
                                console.error('Error in script ${url}:', e);
                            }
                        })();
                        `;
                            const script = document.createElement('script');
                            script.textContent = wrappedScript;
                            document.body.appendChild(script);
                            console.log(`Script loaded: ${url}`);
                            resolve();
                        } catch (error) {
                            console.warn(`Error loading script: ${url}`, error);
                            reject(error);
                        }
                    } else {
                        console.warn(`Script not found: ${url}`);
                        reject(new Error(`Script not found: ${url}`));
                    }
                },
                onerror: (error) => {
                    console.warn(`Error loading script: ${url}`, error);
                    reject(error);
                }
            });
        });
    }

    function loadScriptsSequentially(scripts) {
        return scripts.reduce((promise, script) => {
            return promise.then(() => loadScript(script));
        }, Promise.resolve());
    }

    // Wait for jQuery to be fully loaded
    function waitForJQuery() {
        return new Promise((resolve) => {
            const checkJQuery = () => {
                if (window.jQuery) {
                    resolve();
                } else {
                    setTimeout(checkJQuery, 100);
                }
            };
            checkJQuery();
        });
    }

    // Check for updates
    function checkForUpdates() {
        const currentVersion = GM_info.script.version;
        const updateURL = 'https://github.com/zambia1972/Grepolis-Manager/raw/refs/heads/main/Grepolis%20Script%20Loader-1.1.user.js';

        GM_xmlhttpRequest({
            method: 'GET',
            url: updateURL,
            onload: function(response) {
                if (response.status === 200) {
                    const remoteScript = response.responseText;
                    const remoteVersionMatch = remoteScript.match(/@version\s+([\d.]+)/);
                    if (remoteVersionMatch && remoteVersionMatch[1]) {
                        const remoteVersion = remoteVersionMatch[1];
                        if (remoteVersion > currentVersion) {
                            console.log(`New version available: ${remoteVersion}`);
                            if (confirm(`A new version (${remoteVersion}) of Grepolis Script Loader is available. Do you want to update?`)) {
                                window.location.href = updateURL;
                            }
                        } else {
                            console.log('No updates available.');
                        }
                    }
                }
            },
            onerror: function(error) {
                console.warn('Error checking for updates:', error);
            }
        });
    }

    // Main execution
    waitForJQuery()
        .then(() => loadScriptsSequentially(scripts))
        .then(() => {
            console.log('All scripts loaded successfully');
            checkForUpdates();
        })
        .catch((error) => {
            console.error('Error loading scripts:', error);
        });

    // Example of adding a passive event listener
    window.addEventListener('scroll', function(event) {
        // Your scroll event logic here
    }, { passive: true });
    EventTarget.prototype.addEventListener = (function(original) {
        return function(type, listener, options) {
            if (type === 'touchstart' || type === 'touchmove' || type === 'wheel' || type === 'scroll') {
                options = Object.assign({}, options, { passive: true });
            }
            return original.call(this, type, listener, options);
        };
    })(EventTarget.prototype.addEventListener);
})();
