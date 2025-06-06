const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['./src/core/main.js'],
  bundle: true,
  outfile: './dist/grepolis-manager.user.js',
  banner: {
    js: `// ==UserScript==
// @name         Grepolis Manager
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Popup met werkbalk en modules
// @author       Zambia1972
// @match        *://*.grepolis.com/*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// ==/UserScript==`
  },
  format: 'iife',
  target: ['chrome58', 'firefox57'],
}).catch(() => process.exit(1));
