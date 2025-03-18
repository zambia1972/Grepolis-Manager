// ==UserScript==
// @name         Grepolis Script Loader
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Laad meerdere Grepolis-scripts vanaf GitHub
// @author       Zambia1972
// @match        *://*.grepolis.com/*
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function () {
    'use strict';

    // Lijst van externe scripts om te laden
    const scripts = [

        'https://github.com/zambia1972/Grepolis-Manager/raw/refs/heads/main/scripts/Grepolis%20Spelersnaam%20en%20Player-ID%20Ophalen%20(localStorage)-1.3.user.js',
        'https://github.com/zambia1972/Grepolis-Manager/raw/refs/heads/main/scripts/DIO-TOOLS-David1327-4.36.user.js',
        'https://github.com/zambia1972/Grepolis-Manager/raw/refs/heads/main/scripts/GrepoData%20City%20Indexer-2.0.0.user.js',
        'https://github.com/zambia1972/Grepolis-Manager/raw/refs/heads/main/scripts/GrepoTools-1.9.7.user.js',
        'https://github.com/zambia1972/Grepolis-Manager/raw/refs/heads/main/scripts/Grepolis%20Manager%20(GM)-0.1.user.js',
        'https://github.com/zambia1972/Grepolis-Manager/raw/refs/heads/main/scripts/Grepolis%20Map%20Enhancer-2024.11.24.1.user.js',
        'https://github.com/zambia1972/Grepolis-Manager/raw/refs/heads/main/scripts/Grepolis%20Notepad%20Forum%20Template%203-1.9%20(1).user.js',
        'https://github.com/zambia1972/Grepolis-Manager/raw/refs/heads/main/scripts/Grepolis%20Report%20Converter-5.4.4.user.js'
    ];

    // Functie om een extern script te laden
    function loadScript(url) {
        GM_xmlhttpRequest({
            method: 'GET',
            url: url,
            onload: (response) => {
                if (response.status === 200) {
                    const script = document.createElement('script');
                    script.textContent = response.responseText;
                    document.body.appendChild(script);
                    console.log(`Script loaded: ${url}`);
                } else {
                    console.warn(`Script not found: ${url}`);
                }
            },
            onerror: (error) => {
                console.warn(`Error loading script: ${url}`, error);
            }
        });
    }

    // Laad alle scripts
    scripts.forEach(loadScript);
})();