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

    // Forceer passive event listeners voor scroll-gerelateerde events
    EventTarget.prototype.addEventListener = (function(original) {
        return function(type, listener, options) {
            if (type === 'touchstart' || type === 'touchmove' || type === 'wheel' || type === 'scroll' || type === 'mousewheel') {
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
        'https://github.com/zambia1972/Grepolis-Manager/raw/refs/heads/main/scripts/Grepolis%20Auto%20send%20grepodata.js'
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
                                },
                            };
                            const GM = {
                                getValue: (key, defaultValue) => localStorage.getItem(key) || defaultValue,
                                setValue: (key, value) => localStorage.setItem(key, value),
                                deleteValue: (key) => localStorage.removeItem(key),
                                xmlHttpRequest: (details) => {
                                    const xhr = new XMLHttpRequest();
                                    xhr.open(details.method, details.url);
                                    xhr.onload = () => details.onload({ responseText: xhr.responseText, status: xhr.status });
                                    xhr.onerror = details.onerror;
                                    xhr.send(details.data);
                                },
                            };
                            const GM_getValue = GM.getValue;
                            const GM_setValue = GM.setValue;
                            const GM_deleteValue = GM.deleteValue;
                            const GM_xmlhttpRequest = GM.xmlHttpRequest;
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
            return promise.then(() => loadScript(script).catch((error) => {
                console.warn(`Skipping script due to error: ${script}`, error);
            }));
        }, Promise.resolve());
    }

    // Wacht tot jQuery is geladen
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

    // Hoofduitvoering
    waitForJQuery()
        .then(() => loadScriptsSequentially(scripts))
        .then(() => {
            console.log('All scripts loaded successfully');
        })
        .catch((error) => {
            console.error('Error loading scripts:', error);
        });
})();
