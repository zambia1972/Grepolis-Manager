// ==UserScript==
// @name         Grepolis Manager
// @namespace    https://github.com/zambia1972/Grepolis-Manager
// @version      1.0
// @description  Geconsolideerde refactor: centrale CSS, BaseManager UI-helpers, ButtonsBar, TroopManager & Wereldinfo gemigreerd. MapManager/ForumManager hooks voorbereid.
// @author       Zambia1972, Copyright (c) 2025
// @copyright    Copyright (c) 2025, Zambia1972
// @match        https://*.grepolis.com/*
// @connect      nl.forum.grepolis.com
// @connect      forum.grepolis.net
// @icon         https://raw.githubusercontent.com/zambia1972/Grepolis-Manager/main/icons/icioon-GM.png
// @resource     iconGM https://raw.githubusercontent.com/zambia1972/Grepolis-Manager/main/icons/icioon-GM.png
// @resource     iconInstellingen https://raw.githubusercontent.com/zambia1972/Grepolis-Manager/main/icons/instellingen.png
// @resource     iconWereldinfo https://raw.githubusercontent.com/zambia1972/Grepolis-Manager/main/icons/wereldinfo.png
// @resource     iconForum https://raw.githubusercontent.com/zambia1972/Grepolis-Manager/main/icons/icioon-forummanager.png
// @resource     iconTroop https://raw.githubusercontent.com/zambia1972/Grepolis-Manager/main/icons/icioon-troopmanager.png
// @grant        GM_getValue
// @grant        GM_getResourceURL
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @grant        GM_info
// @grant        GM_openInTab
// @grant        GM_notification
// @grant        GM_setClipboard
// @grant        unsafeWindow
// @connect      api.grepodata.com
// ==/UserScript==

(function() {
    'use strict';

    const DEBUG = false; // zet true voor extra debug output

    // Hulpfunctie om CORS te omzeilen in userscripts
    // Vervang bestaande gmFetch functie door deze robuuste versie
    function gmFetch(url, options = {}) {
        return new Promise((resolve, reject) => {
            const cb = (response) => {
                try {
                    const status = response.status || response.statusCode || 0;
                    if (status >= 200 && status < 300) {
                        resolve({
                            ok: true,
                            status,
                            json: async () => {
                                try { return JSON.parse(response.responseText || response.response || ''); }
                                catch (e) { throw new Error('Invalid JSON response: ' + e.message); }
                            },
                            text: async () => (response.responseText || response.response || '')
                        });
                    } else {
                        reject(new Error(`HTTP ${status}: ${response.responseText || response.response || ''}`));
                    }
                } catch (err) { reject(err); }
            };

            // Kies GM_xmlhttpRequest (legacy) of GM.xmlHttpRequest (new)
            const gmXhr = (typeof GM_xmlhttpRequest === 'function')
            ? GM_xmlhttpRequest
            : (typeof GM !== 'undefined' && GM && typeof GM.xmlHttpRequest === 'function')
            ? GM.xmlHttpRequest
            : null;

            if (!gmXhr) {
                // Fallback naar native fetch (let op CORS)
                fetch(url, options).then(async r => {
                    const txt = await r.text();
                    if (r.ok) resolve({ ok: true, status: r.status, json: async () => JSON.parse(txt), text: async () => txt });
                    else reject(new Error(`HTTP ${r.status}: ${txt}`));
                }).catch(reject);
                return;
            }

            try {
                gmXhr({
                    method: options.method || 'GET',
                    url,
                    headers: options.headers || {},
                    data: options.body || options.data || null,
                    responseType: options.responseType || 'text',
                    onload: cb,
                    onerror: (err) => reject(err),
                    ontimeout: (err) => reject(err),
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    // ----stijlen -----

    function injectGlobalStyles() {
        const style = document.createElement('style');
        style.textContent = `
    :root {
        --gm-color-primary: #FF0000;
        --gm-color-bg: #1e1e1e;
        --gm-color-text: #fff;
        --gm-color-muted: #ccc;
        --gm-spacing-sm: 6px;
        --gm-spacing-md: 12px;
        --gm-spacing-lg: 20px;
        --gm-radius: 8px;
        --gm-shadow: 0 0 15px var(--gm-color-primary);
    }
    h2 {
        color: red !important;
    }

    /* ====== Panels (uniforme basis) ====== */
    .gm-panel {
        position: fixed;
        top: 0;
        right: 0;
        height: 95%;
        min-width: 00px;
        max-width: 50%;
        background: rgba(20,20,20,0.95);
        color: var(--gm-color-text);
        z-index: 10000;
        overflow-y: auto;
        padding: var(--gm-spacing-md);
        box-shadow: -2px 0 6px rgba(0,0,0,0.6);
        border: 2px solid var(--gm-color-primary);
        border-radius: var(--gm-radius);
        display: none;
        will-change: auto; /* voorkom GPU constant repaints */
        backface-visibility: hidden; /* stabiliseert rendering */
    }
    .gm-panel.active { display: block; }

    /* Groottes */
    .gm-panel-small  { width: 400px; min-height: 200px; }
    .gm-panel-medium { width: 600px; min-height: 300px; }
    .gm-panel-wide   { width: 800px; min-height: 400px; }

    /* Panel header */
    .gm-panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--gm-spacing-md);
    }
    .gm-panel-title {
        font-weight: bold;
        color: var(--gm-color-primary);
    }
    .gm-close-btn {
        background: none;
        border: none;
        color: var(--gm-color-primary);
        font-size: 18px;
        cursor: pointer;
    }

    /* ====== Buttons ====== */
    #gm-button-container {
        position:fixed;
        top:1px;
        left:380px;
        display:inline-flex;
        flex-direction:row;
        gap:1px;
        z-index:9999;
        background:rgba(0,0,0,0.2);
        padding:2px;
        width:auto;
        height:auto;
    }
    #gm-button-container .gm-toggle-button {
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        cursor: pointer;
    }
    .gm-button {
        background: #000;
        color: var(--gm-color-primary);
        border: 1px solid var(--gm-color-primary);
        padding: var(--gm-spacing-sm) var(--gm-spacing-md);
        border-radius: 5px;
        cursor: pointer;
        font-size: 14px;
    }
    .gm-button:hover {
        background: var(--gm-color-primary);
        color: #fff;
    }

    /* ====== Inputs ====== */
    .gm-input {
        width: 100%;
        padding: var(--gm-spacing-sm);
        border-radius: 4px;
        border: 1px solid #444;
        background: #222;
        color: var(--gm-color-text);
    }

    /* ====== Links ====== */
    .gm-link {
        display: inline-block;
        background-color: var(--gm-color-primary);
        color: #fff;
        padding: 5px 10px;
        font-size: 11px;
        border-radius: 4px;
        text-decoration: none;
        margin-top: 5px;
    }

    /* ====== Notifications ====== */
    .gm-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: var(--gm-spacing-sm) var(--gm-spacing-lg);
        border-radius: var(--gm-radius);
        color: #fff;
        box-shadow: var(--gm-shadow);
        animation: fadeIn 0.3s, fadeOut 0.3s 2.7s;
        z-index: 10001;
    }
    .gm-notification.success { background-color: #4CAF50; }
    .gm-notification.error { background-color: #F44336; }

    /* ====== Helpers ====== */
    .gm-muted { color: var(--gm-color-muted); font-size: 13px; }
    .gm-card {
        background: rgba(255,255,255,0.05);
        padding: 8px;
        border-radius: 6px;
        font-weight: bold;
        color: #FFCC66;
        text-shadow: 1px 1px 2px #000;
        font-size: 10px;
        margin-top: 15px;
    }
    .gm-muted-box {
        display: none;
        margin-top: 15px;
        background: #111;
        padding: 10px;
        border: 1px solid #444;
        border-radius: 8px;
        max-height: 300px;
        overflow-y: auto;
        font-size: 13px;
        color: var(--gm-color-muted);
    }

    /* ====== Troop Manager (units) ====== */
    /* Troopmanager unified styles */
    #gm-panel-troopmanager .tm-units-row{
      display:flex;
      flex-wrap:wrap;
      gap:6px;
      align-items:center;
      margin-top:4px;
    }

    /* individuele unit (sprite) — geen scaling hier: achtergrond-size wordt op runtime gezet */
    #gm-panel-troopmanager .tm-unit{
      display:block;
      flex: 0 0 40px;
      width:40px;
      height:40px;
      background-repeat:no-repeat;
      background-position: 0 0; /* wordt overschreven inline door renderUnitIcon */
      overflow:visible;
      position:relative;
      border-radius:4px;
      box-shadow: 0 1px 0 rgba(0,0,0,0.25) inset;
    }

    /* aantal rechts-onder — zwart met witte 'stroke' voor leesbaarheid */
    #gm-panel-troopmanager .tm-unit .tm-unit-count{
      position: absolute;
      right: 2px;
      bottom: 2px;
      font-size: 11px;
      font-weight: 700;
      color: #fff;
      background: rgba(0,0,0,0.8); /* donker balkje */
      padding: 0 4px;
      border-radius: 3px;
      line-height: 14px;
      text-shadow: none; /* geen witte outline meer */
    }
    #gm-panel-troopmanager .tm-units-grid {
      display: grid;
      grid-template-columns: 1fr; /* twee kolommen */
      gap: 8px;
    }
    .tm-units-row {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;  /* ruimte tussen iconen */
        margin-bottom: 10px;
    }
    .tm-unit {
        position: relative;
        width: 40px;   /* vaste breedte */
        height: 40px;  /* vaste hoogte */
    }
    .tm-unit img {
        width: 100%;
        height: 100%;
        display: block;
    }
    .tm-unit-count {
        position: absolute;
        bottom: 0;
        right: 0;
        background: rgba(0, 0, 0, 0.7);
        color: #fff;
        font-size: 11px;
        padding: 1px 3px;
        border-top-left-radius: 4px;
    }
    `;
        document.head.appendChild(style);
    }


    function createPopup(id, title, contentHTML, sizeClass = 'gm-panel-medium') {
        let popup = document.getElementById(id);
        if (!popup) {
            popup = document.createElement('div');
            popup.id = id;
            popup.className = `gm-panel ${sizeClass} `;
            popup.innerHTML = `
      <div class="gm-panel-header">
        <span class="gm-panel-title">${title}</span>
        <button class="gm-close-icon">✖</button>
      </div>
      <div class="gm-panel-body">${contentHTML}</div>
    `;
            document.body.appendChild(popup);

            // sluit-handler (geen inline handlers)
            popup.querySelector('.gm-close-icon').addEventListener('click', () => {
                popup.classList.remove('active');
            });
        }
        // retourneer popup element (nog niet openen)
        return popup;
    }

    function openPopup(id) {
        document.querySelectorAll('.gm-panel').forEach(el => el.classList.remove('active'));
        const popup = document.getElementById(id);
        if (popup) popup.classList.add('active');
    }

    // =========================== //
    // Hoofdklasse GrepolisManager //
    // =========================== //

    class SupabaseSettings {
        static async loadOrPrompt() {
            let url = await GM_getValue('supabase_url', null);
            let key = await GM_getValue('supabase_api_key', null);

            if (url && key) {
                return { SUPABASE_URL: url, SUPABASE_API_KEY: key };
            }

            return new Promise(resolve => {
                const popup = document.createElement('div');
                popup.className = 'gm-panel gm-panel-small';

                popup.innerHTML = `
                    <h2 class="gm-panel-title" style="text-align:center;">Supabase Configuratie</h2>
                    <p>Voer hieronder je Supabase gegevens in:</p>
                    <label>Supabase URL:<br>
                        <input type="text" id="supabase-url" class="gm-input" placeholder="https://xyz.supabase.co" />
                    </label><br><br>
                    <label>API Key:<br>
                        <input type="text" id="supabase-key" class="gm-input" placeholder="public-anon-key" />
                    </label><br><br>
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <button id="save-supabase" class="gm-button">Opslaan</button>
                        <button id="toggle-supabase-help" class="gm-button">❔ Handleiding</button>
                    </div>
                    <div id="supabase-help" class="gm-muted" style="display:none; margin-top:15px; max-height:300px; overflow-y:auto;">
                        <pre>${SupabaseSettings.helpText()}</pre>
                    </div>
                `;

                document.body.appendChild(popup);

                document.getElementById('save-supabase').addEventListener('click', async () => {
                    const newUrl = document.getElementById('supabase-url').value.trim();
                    const newKey = document.getElementById('supabase-key').value.trim();

                    if (!newUrl || !newKey) {
                        alert("Vul beide velden in.");
                        return;
                    }

                    await GM_setValue('supabase_url', newUrl);
                    await GM_setValue('supabase_api_key', newKey);
                    popup.remove();
                    location.reload(); // Herstart script
                });
                document.getElementById("toggle-supabase-help").addEventListener("click", () => {
                    const help = document.getElementById("supabase-help");
                    help.style.display = (help.style.display === "none") ? "block" : "none";
                });
            });
        }

        static helpText() {
            return `
            📦 SUPABASE GEBRUIKSHANDLEIDING VOOR GREPOLIS MANAGER

            Wat is Supabase?
            Supabase is een open-source alternatief voor Firebase. Dit script gebruikt het om gegevens veilig extern op te slaan (zoals troepen).

            ────────────────────────────
            🔧 STAP 1: Maak een project aan
            ────────────────────────────
            1. Ga naar https://supabase.com/
            2. Log in of registreer
            3. Klik op 'New Project'
            4. Geef een naam, regio en wachtwoord op
            5. Klik op 'Create'

            ────────────────────────────
            🔑 STAP 2: API-gegevens ophalen
            ────────────────────────────
            1. Ga naar 'Settings' → 'API'
            2. Kopieer:
               - Project URL (→ SUPABASE_URL)
               - anon public key (→ SUPABASE_API_KEY)

            ────────────────────────────
            📁 STAP 3: (Optioneel) Tabellen maken
            ────────────────────────────
            Gebruik 'Table Editor' om bv. een 'troops' tabel aan te maken met:
              player | town_id | unit | amount | timestamp

            ────────────────────────────
            ⚙️ Gebruik in dit script
            ────────────────────────────
            - Vul de gegevens hierboven in
            - Deze worden lokaal opgeslagen (veilig via GM_setValue)
            - Aanpassen kan later via Instellingen → Supabase

            ────────────────────────────
            🧪 TEST
            ────────────────────────────
            Bekijk in je Supabase dashboard of de gegevens worden bijgehouden
            `.trim();
        }
    }

    class GrepolisManager {
        constructor() {
            // Ensure settings exist and include wereldInfoUrl (used by WereldInfo)
            if (!this.settings) this.settings = {};
            if (!this.settings.wereldInfoUrl) {
                const defaultUrl = (this.config && this.config.wereldInfo && this.config.wereldInfo.wereldInfoUrl)
                ? this.config.wereldInfo.wereldInfoUrl
                : `https://${window.location.host}/game/world_info`;
                this.settings.wereldInfoUrl = defaultUrl;
            }

            // Ensure wereldInfo config exists to avoid undefined errors
            if (!this.config) this.config = {};
            if (!this.config.wereldInfo) {
                this.config.wereldInfo = {
                    wereldInfoUrl: `https://${window.location.host}/game/world_info`
                };
            }

            this.uw = unsafeWindow;
            // Configuratie
            this.supabaseConfig = null;
            this.settingsWindow = new SettingsWindow(this);
            this.isUIInjected = false;
            this.modules = {};
            this.buttonStates = [false, false, false, false, false, false, false];
            this.buttonIcons = [
                'iconGM',
                'iconInstellingen',
                'iconWereldinfo',
                'iconTroop',
                'iconForum',
            ];

            this.iconUrls = {}; // Slaat de icon URLs op

            this.config = {
                wereldInfo: {
                    wereldInfoUrl: `https://${window.location.host}/game/world_info` // voorbeeld
                },
            };

            injectGlobalStyles();
            this.load(); // Start het asynchrone laadproces
        }

        openPanel(id, renderFn, sizeClass = 'gm-panel-medium') {
            // Sluit bestaande panelen met dezelfde id
            const old = document.getElementById(`gm-panel-${id}`);
            if (old) old.remove();

            // Paneel
            const panel = document.createElement('div');
            panel.id = `gm-panel-${id}`;
            panel.className = `gm-panel ${sizeClass} active`;

            // Sluitknop
            const closeBtn = document.createElement('button');
            closeBtn.className = 'gm-close-btn';
            closeBtn.textContent = '×';
            closeBtn.onclick = () => panel.remove();
            panel.appendChild(closeBtn);

            // Content-holder
            const content = document.createElement('div');
            content.className = 'gm-panel-body';
            panel.appendChild(content);

            // Inhoud renderen (exact één keer)
            if (typeof renderFn === 'function') {
                renderFn(content);
            } else {
                content.textContent = `Paneel geopend: ${id}`;
            }

            document.body.appendChild(panel);
        }

        async load() {
            const banned = await GM_getValue('banned_players', []);
            const name = this.modules?.forumManager?.getPlayerName?.() || '';
            if (banned.includes(name)) {
                alert("Je bent geblokkeerd van dit script.");
                throw new Error("Geblokkeerde gebruiker.");
            }
            this.supabaseConfig = await SupabaseSettings.loadOrPrompt();
            await this.loadResources();
            try {
                await this.initializeManagers();
            } catch (e) {
                console.error('Fout in initializeManagers – ga toch door met knoppen:', e);
            } finally {
                this.initializeButtons();
            }
            window.GrepoMain = this;
            console.log("Supabase config geladen:", this.supabaseConfig);
        }

        async initializeManagers() {
            this.modules.forumManager = new ForumManager(this);
            this.modules.wereldinfo = new WereldInfo(this);
            this.afwezigheidsassistent = new Afwezigheidsassistent(this);
            this.modules.troopManager = new TroopManager(this, this.supabaseConfig);
            this.modules.troopManager.startAutoUploader();
            BigTransporterCapacity.activate();
            this.modules.mapOverlay = new MapOverlayModule(this);
            this.modules.mapOverlay.init();
            this.supabaseSync = new SupabaseSync(this);
            this.supabaseSync.start();
        }

        async loadResources() {
            // Laad alle resources en sla de URLs op
            try {

                for (const icon of this.buttonIcons) {
                    if (!icon) continue;
                    this.iconUrls[icon] = await this.getResource(icon);
                }
            } catch (error) {
                console.error('Fout bij laden resources:', error);
                // Fallback naar directe URLs als GM_getResourceURL niet werkt
                this.iconUrls = {
                    iconGM: 'https://raw.githubusercontent.com/zambia1972/Grepolis-Manager/main/icons/icioon-GM.png',
                    iconInstellingen: 'https://raw.githubusercontent.com/zambia1972/Grepolis-Manager/main/icons/instellingen.png',
                    iconWereldinfo: 'https://raw.githubusercontent.com/zambia1972/Grepolis-Manager/main/icons/wereldinfo.png',
                    iconForum: 'https://raw.githubusercontent.com/zambia1972/Grepolis-Manager/main/icons/icioon-forummanager.png',
                    iconTroop: 'https://raw.githubusercontent.com/zambia1972/Grepolis-Manager/main/icons/icioon-troopmanager.png',
                };
            }
        }

        getResource(name) {
            return new Promise((resolve, reject) => {
                if (typeof GM_getResourceURL === 'function') {
                    resolve(GM_getResourceURL(name));
                } else {
                    reject(new Error('GM_getResourceURL niet beschikbaar'));
                }
            });
        }
        renderDashboardTab(container) {
            const header = document.createElement("h2");
            header.innerText = "Grepolis Manager Dashboard";
            container.appendChild(header);

            if (this.modules.mapOverlay) {
                const overlaySettingsDiv = document.createElement("div");
                overlaySettingsDiv.id = "overlay-settings";
                overlaySettingsDiv.className = 'gm-card';

                this.modules.mapOverlay.renderSettingsUI(overlaySettingsDiv);
                container.appendChild(overlaySettingsDiv);
            }
        }

        // ============ //
        // initializers //
        // ============ //

        initializeButtons() {
            // voorkom dubbele container
            if (document.getElementById('gm-button-container')) return;

            const container = document.createElement('div');
            container.id = 'gm-button-container';
            document.body.appendChild(container);

            // Titels (zichtbaar als tooltip)
            const buttonTitles = [
                'Grepolis Manager Startscherm',
                'Instellingen',
                'Wereldinfo',
                'Troop Manager',
                'Forum Manager',
                'Afwezigheids Manager'
            ];

            // callbacks (zelfde logica als jouw oorspronkelijke callbacks - roept module toggles etc. aan)
            const callbacks = [
                // Startscherm in eigen GM-panel via showUI(...)
                (active) => {
                    if (active) {
                        this.openPanel("startscreen", (container) => this.showUI(container));
                    } else {
                        document.getElementById('gm-panel-startscreen')?.remove();
                    }
                },
                // Instellingen
                (active) => {
                    if (active) {
                        this.openPanel("settings", (container) => this.settingsWindow.render(container));
                    } else {
                        document.getElementById("gm-panel-settings")?.remove();
                    }
                },
                // Wereldinfo
                (active) => {
                    if (active) {
                        this.openPanel("wereldinfo", (container) => this.modules.wereldinfo.render(container));
                    } else {
                        document.getElementById("gm-panel-wereldinfo")?.remove();
                    }
                },

                // Troop Manager
                (active) => this.modules.troopManager?.toggle?.(active),

                // Forum Manager
                (active) => this.modules.forumManager?.toggle?.(active),
                // Afwezigheids Manager
                (active) => {
                    if (active) {
                        this.openPanel("afwezigheid", (container) => {
                            this.afwezigheidsassistent?.renderSettings?.(container);
                        });
                    } else {
                        document.getElementById("gm-panel-afwezigheid")?.remove();
                    }
                }

            ];

            // Zorg dat buttonStates overeenkomen met aantal buttons
            this.buttonStates = new Array(buttonTitles.length).fill(false);

            // Sprite URL (hergebruikt wat je al gebruikte)
            const spriteUrl = 'https://gpnl.innogamescdn.com/images/game/autogenerated/layout/layout_095495a.png';

            // Bouw **alleen** de originele achtergrond-knoppen (één set)
            callbacks.forEach((callback, index) => {
                const button = document.createElement('div');
                button.className = 'gm-toggle-button gm-original-button';
                button.title = buttonTitles[index];
                button.dataset.index = index;

                // basisstijl (sprite)
                button.style.background = `url(${spriteUrl}) no-repeat -607px -182px`;
                button.style.width = '32px';
                button.style.height = '32px';
                button.style.display = 'flex';
                button.style.alignItems = 'center';
                button.style.justifyContent = 'center';
                button.style.cursor = 'pointer';

                // overlay icon (indien beschikbaar uit je resources)
                let iconEl;
                if (this.buttonIcons && this.buttonIcons[index] && this.iconUrls && this.iconUrls[this.buttonIcons[index]]) {
                    iconEl = document.createElement('img');
                    iconEl.src = this.iconUrls[this.buttonIcons[index]];
                    iconEl.style.width = '20px';
                    iconEl.style.height = '20px';
                    iconEl.style.pointerEvents = 'none';
                } else {
                    iconEl = document.createElement('span');
                    iconEl.textContent = this.buttonIcons && this.buttonIcons[index] ? '' : '🏝️';
                    iconEl.style.fontSize = '16px';
                    iconEl.style.pointerEvents = 'none';
                }
                button.appendChild(iconEl);

                // click handler: toggle state, wijzig spritepositie, en roep callback aan
                button.addEventListener('click', () => {
                    const idx = Number(button.dataset.index);
                    this.buttonStates[idx] = !this.buttonStates[idx];

                    // visuele toggle (on/off sprite)
                    button.style.background = this.buttonStates[idx]
                        ? `url(${spriteUrl}) no-repeat -639px -214px`
                    : `url(${spriteUrl}) no-repeat -607px -182px`;

                    // roep module-callback aan (safe)
                    try {
                        callback(this.buttonStates[idx]);
                    } catch (err) {
                        console.error('GM button callback error:', err);
                    }
                });

                container.appendChild(button);
            });

            // klaar — container is al eenmaal in DOM geplaatst
        }

        // ================== //
        // Startscherm inhoud //
        // ================== //

        showUI(container) {
            const playerName = this.modules.forumManager
            ? this.modules.forumManager.getPlayerName()
            : 'Speler';

            const buttonIndex = 0; // Index van de startschermknop
            const startButton = document.querySelector(`#gm-button-container .gm-toggle-button[data-index="${buttonIndex}"]`);

            if (this.buttonStates[buttonIndex]) {
                if (startButton) {
                    startButton.style.background = 'url(https://gpnl.innogamescdn.com/images/game/autogenerated/layout/layout_095495a.png) no-repeat -607px -182px';
                }
            }

            const popup = document.createElement('div');
            popup.id = 'gm-popup';
            container.innerHTML = `

                    <h2>Welkom ${playerName} bij Grepolis Manager</h2>
                    <p>Dit script combineert de kracht van populaire Grepolis-tools in één handige oplossing en nog veel meer.</p>
                    <p>Selecteer een module via de knoppenbalk bovenaan het scherm.</p>
                    <h3>Beschikbare modules:</h3>
                    <ul>
                        <li><strong>⚙️ Instellingen</strong> – Pas je voorkeuren en Supabase-configuratie aan. Hier kun je ook API-keys of scriptopties beheren.</li>
                        <li><strong>🌍 Wereldinfo</strong> – Geeft een overzicht van spelers, allianties, steden, veroveringen en ranglijsten uit de officiële Grepolis databestanden.</li>
                        <li><strong>🪖 Troop Manager</strong> – Synchroniseer en beheer je troepen. Inclusief automatische uploader naar Supabase en visuele weergave per stad.</li>
                        <li><strong>📜 Forum Manager</strong> – Automatiseer het aanmaken van fora en topics binnen de alliantie. Inclusief kant-en-klare sjablonen (ROOD, deff/off, cluster, enz.).</li>
                        <li><strong>🕒 Afwezigheidsassistent</strong> – Stel je afwezigheid in zodat leiding en bondgenoten weten wanneer je niet beschikbaar bent.</li>
                        <li><strong>🗺️ Map Overlay</strong> – Voeg extra informatie toe aan de wereldkaart (bijv. sectoren, filters, markeringen).</li>
                        <li><strong>🚢 Big Transporter Capacity</strong> – Activeert automatisch de capaciteit-boost voor grote transporters in je stadsoverzicht.</li>
                    </ul>
                    <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 20px;">
                    ${[
                {
                    name: "Grepotools",
                    img: "https://www.grepotools.nl/wp-content/uploads/2022/08/logo_425x425.png",
                    description: "Script, tools en informatie voor Grepolis.",
                    url: "https://www.grepotools.nl/script/stable/grepotools.user.js"
                },
                {
                    name: "DIO-Tools",
                    img: "https://dio-david1327.github.io/img/site/btn-dio-settings.png",
                    description: "Extra opties voor een verbeterde gameplay.",
                    url: "https://dio-david1327.github.io/DIO-TOOLS-David1327/code.user.js"
                },
                {
                    name: "GRCRTools",
                    img: "https://cdn.grcrt.net/img/octopus.png",
                    description: "Krachtige tools voor rapporten en gameplay.",
                    url: "https://www.grcrt.net/scripts/GrepolisReportConverterV2.user.js"
                },
                {
                    name: "Map Enhancer",
                    img: "https://gme.cyllos.dev/res/icoon.png",
                    description: "Verbeter de kaartweergave met extra functies.",
                    url: "https://gme.cyllos.dev/GrepolisMapEnhancer.user.js"
                },
                {
                    name: "GrepoData",
                    img: "https://grepodata.com/favicon.ico",
                    description: "Geavanceerde tools en statistieken voor Grepolis.",
                    url: "https://api.grepodata.com/script/indexer.user.js"
                },
                {
                    name: "Forum Template",
                    img: "https://i.postimg.cc/7Pzd6360/def-button-2.png",
                    description: "Genereert een forumsjabloon met eenheden, gebouwen en stadsgod.",
                    url: "https://update.greasyfork.org/scripts/512594/Grepolis%20Notepad%20Forum%20Template%203.user.js"
                }

            ].map(tool => `
                        <div style="flex: 1; min-width: 150px; text-align: center;">
                            <img src="${tool.img}" alt="${tool.name}" style="width: 50px; height: 50px;">
                            <p style="font-size: 12px; font-weight: bold;">${tool.name}</p>
                            <p style="font-size: 12px;">${tool.description}</p>
                            <a href="${tool.url}" target="_blank" class="gm-link">Download script</a>
                        </div>
                    `).join('')}
                </div>

                <div style="margin-top: 20px; text-align: center;">
                    <p style="font-size: 12px; font-style: italic;">Het Grepolis Manager Team</p>
                    <div style="display: flex; justify-content: center; gap: 20px; margin-top: 10px;">
                        <div>
                            <p style="font-size: 12px; font-weight: bold;">Zambia1972</p>
                            <img src="https://imgur.com/uHRXM9u.png" alt="Zambia1972 Handtekening" class="gm-signature-large">
                        </div>

                    </div>
                    <div>
                        <p style="font-size: 14px;">© 2025 | Zambia1972 | boodtrap | Gevers Hans, All rights reserved.</p>
                    </div>
                </div>
            `;

            const closeButton = document.createElement('button');
            closeButton.textContent = 'Sluiten';
            closeButton.className = 'gm-close-btn';

            closeButton.addEventListener('click', () => {
                popup.remove();
                this.buttonStates[buttonIndex] = false;

                if (startButton) {
                    startButton.style.background = 'url(https://gpnl.innogamescdn.com/images/game/autogenerated/layout/layout_095495a.png) no-repeat -607px -182px';
                }
            });

            popup.appendChild(closeButton);
            document.body.appendChild(popup);
        }

        showNotification(message, isSuccess = true) {
            const notification = document.createElement('div');
            notification.textContent = message;
            notification.className = `gm-notification ${isSuccess ? 'success' : 'error'}`;

            document.body.appendChild(notification);
            setTimeout(() => {
                notification.style.animation = 'fadeOut 0.3s';
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }
    }

    // ============================== //
    // Basisklasse voor alle managers //
    // ============================== //

    class BaseManager {

        constructor(mainManager) {
            this.main = mainManager;
            this.uw = mainManager?.uw || unsafeWindow;
            this._events = new WeakMap();
            this._intervals = new Set();
            this._timeouts = new Set();
            this.logger = this._createLogger();
            this.accessToken = (typeof GM_getValue === 'function') ? GM_getValue('grepodata_token', null) : null;
        }

        _createLogger() {
            const prefix = `[${this.constructor.name}]`;
            return {
                log: (...args) => console.log(prefix, ...args),
                warn: (...args) => console.warn(prefix, ...args),
                error: (...args) => console.error(prefix, ...args),
                debug: (...args) => (typeof DEBUG !== 'undefined' && DEBUG) && console.debug(prefix, ...args),
            };
        }

        addEvent(element, event, handler, options) {
            if (!element) return;
            element.addEventListener(event, handler, options);
            const handlers = this._events.get(element) || [];
            handlers.push({ event, handler, options });
            this._events.set(element, handlers);
        }

        removeEvents(element) {
            if (!element) return;
            const handlers = this._events.get(element);
            if (!handlers) return;
            for (const { event, handler, options } of handlers) {
                try { element.removeEventListener(event, handler, options); } catch (e) { /* ignore */ }
            }
            this._events.delete(element);
        }

        // destroy() methode aanpassen:
        destroy() {
            // Alle events netjes verwijderen
            for (const element of this._events.keys()) {
                this.removeEvents(element);
            }
            this._events = new WeakMap();

            // Eventuele timers stoppen
            if (this._intervals) {
                for (const id of this._intervals) {
                    clearInterval(id);
                }
                this._intervals.clear();
            }
        }

        // Hulpfunctie voor veilige token-logging
        _maskToken(t) {
            return t ? `${t.slice(0, 12)}…${t.slice(-6)}` : '(leeg)';
        }

        // Haal token op via GrepoData en zet het óók lokaal
        async getAccessTokenFromGrepoData(email, password) {
            try {
                const url = 'https://api.grepodata.com/login';
                const params = new URLSearchParams({ email, password });

                // Oude token eerst weggooien (optioneel)
                GM_deleteValue('grepodata_token');
                GM_deleteValue('grepodata_token_time');

                const resp = await gmFetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: params.toString(),
                });
                const data = await resp.json();

                if (!resp.ok || !data?.access_token) {
                    throw new Error(data?.message || 'Login mislukt');
                }

                const token = data.access_token;

                // 📌 Pas nu opslaan
                GM_setValue('grepodata_token', token);
                GM_setValue('grepodata_token_time', Date.now());

                // Handig om lokaal bij te houden
                this.accessToken = token;

                return token;
            } catch (e) {
                this.showNotification('Inloggen bij GrepoData mislukt.', false);
                throw e;
            }
        }

        showLoginPopup() {
            return new Promise((resolve, reject) => {
                const popupHtml = `
      <div id="grepoLoginPopup" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
           background: white; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.2); z-index: 99999; min-width: 320px;">
        <h3 style="margin-top:0">GrepoData API-token</h3>
        <p>Ga naar <a href="https://grepodata.com/profile/api" target="_blank">https://grepodata.com/profile/api</a>, log in en kopieer daar je API-token.</p>
        <label>API Token<br><input type="text" id="gd_token" style="width:100%"></label><br><br>
        <div style="display:flex; gap:8px; justify-content:flex-end">
          <button id="gd_cancel">Annuleren</button>
          <button id="gd_save">Opslaan</button>
        </div>
        <div id="gd_msg" style="margin-top:8px; font-size:12px; color:#666;"></div>
      </div>
    `;
                document.body.insertAdjacentHTML('beforeend', popupHtml);
                const box = document.getElementById('grepoLoginPopup');
                const elToken = document.getElementById('gd_token');
                const elMsg   = document.getElementById('gd_msg');

                const finish = (ok, value) => {
                    box?.remove();
                    ok ? resolve(value) : reject(value instanceof Error ? value : new Error(String(value)));
                };

                document.getElementById('gd_cancel').addEventListener('click', () => {
                    finish(false, new Error("Login geannuleerd"));
                });
                document.getElementById('gd_save').addEventListener('click', async () => {
                    const token = elToken.value.trim();
                    if (!token) {
                        elMsg.textContent = "Plak je token in.";
                        return;
                    }
                    await GM_setValue('grepodata_token', token);
                    await GM_setValue('grepodata_token_time', Date.now());
                    elMsg.textContent = "Token opgeslagen.";
                    finish(true, token);
                });
            });
        }

        // Centrale toegangspunt voor het token (wacht op login indien nodig)
        async getWebSocketToken() {
            // 1. Als er al een geldig token in memory zit
            if (this.accessToken) {
                return this.accessToken;
            }

            // 2. Check storage
            try {
                const stored = GM_getValue('grepodata_token', null);
                const ts     = GM_getValue('grepodata_token_time', 0);

                // Controleer of ouder dan 24 uur
                const expired = !ts || (Date.now() - ts > 24 * 60 * 60 * 1000);

                if (stored && !expired) {
                    this.accessToken = stored;
                    return stored;
                }
            } catch (e) {
                console.warn("[GrepoData] Kon token niet laden uit storage:", e);
            }

            // 3. Geen of verlopen token → login-popup tonen
            console.warn("[GrepoData] Nieuw token nodig. Toon login-popup…");
            const token = await this.showLoginPopup();
            this.accessToken = token;
            GM_setValue('grepodata_token', token);
            GM_setValue('grepodata_token_time', Date.now());
            return token;
        }

        async getPlayerIntel(world, playerId) {
            if (!this.accessToken) throw new Error("Geen accessToken beschikbaar");

            const url = `https://api.grepodata.com/indexer/v2/player?world=${world}&player_id=${playerId}&access_token=${this.accessToken}`;

            const response = await gmFetch(url, {
                method: "GET",
                headers: {
                    "Accept": "application/json",
                    "Authorization": `Bearer ${this.accessToken}`
                }
            });

            return await response.json();
        }


        async getAllianceIntel(allianceId, world) {
            if (!this.accessToken) throw new Error("Geen accessToken beschikbaar");

            const url = `https://api.grepodata.com/indexer/v2/alliance?world=${world}&alliance_id=${allianceId}&access_token=${this.accessToken}`;
            console.log("[GrepoData] GET AllianceIntel:", url);

            const response = await gmFetch(url, {
                method: "GET",
                headers: {
                    "Accept": "application/json",
                    "Authorization": `Bearer ${this.accessToken}`
                }
            });

            return await response.json();
        }

        async getTownIntel(townId, world) {
            if (!this.accessToken) throw new Error("Geen accessToken beschikbaar");

            const url = `https://api.grepodata.com/indexer/v2/town?world=${world}&town_id=${townId}&access_token=${this.accessToken}`;
            console.log("[GrepoData] GET TownIntel:", url);

            const response = await gmFetch(url, {
                method: "GET",
                headers: {
                    "Accept": "application/json",
                    "Authorization": `Bearer ${this.accessToken}`
                }
            });

            return await response.json();
        }

        worldData = {
            _cache: {
                players: null,
                alliances: null,
                towns: null,
                conquers: null,
                islands: null,
                kills_all: null,
                kills_att: null,
                kills_def: null
            },
            _lastWorld: null,
            _lastHost: null,

            _currentWorldHost() {
                // vb: "nl123.grepolis.com"
                return window.location.host;
            },
            _currentWorldPrefix() {
                // vb: "nl123"
                return window.location.host.split('.')[0];
            },
            _needsReset() {
                const host = this._currentWorldHost();
                if (this._lastHost !== host) {
                    this._lastHost = host;
                    this._lastWorld = this._currentWorldPrefix();
                    // reset cache
                    Object.keys(this._cache).forEach(k => this._cache[k] = null);
                    return true;
                }
                return false;
            },

            async _fetchText(url, timeout = 10000) {
                const controller = new AbortController();
                const t = setTimeout(() => controller.abort(), timeout);
                try {
                    const res = await fetch(url, { signal: controller.signal, credentials: 'omit' });
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    return await res.text();
                } finally {
                    clearTimeout(t);
                }
            },

            _parseCSV(text) {
                if (!text) return [];
                const lines = text.trim().split(/\r?\n/);
                // detecteer delimiter (eerste regel)
                const header = lines[0] || '';
                const commaCount = (header.match(/,/g) || []).length;
                const tabCount = (header.match(/\t/g) || []).length;
                const delim = tabCount > commaCount ? '\t' : ',';

                const parseLine = (line) => {
                    const result = [];
                    let cur = '';
                    let inQuotes = false;
                    for (let i = 0; i < line.length; i++) {
                        const ch = line[i];
                        if (ch === '"') {
                            // dubbele quote escape
                            if (inQuotes && line[i+1] === '"') { cur += '"'; i++; }
                            else { inQuotes = !inQuotes; }
                        } else if (!inQuotes && line[i] === delim) {
                            result.push(cur);
                            cur = '';
                        } else {
                            cur += ch;
                        }
                    }
                    result.push(cur);
                    return result;
                };

                return lines.map(l => parseLine(l));
            },

            // --- Endpoints ---
            async getPlayers() {
                this._needsReset();
                if (this._cache.players) return this._cache.players;

                const host = `${Game.world_id}.grepolis.com`;
                const url = `https://${host}/data/players.txt`;

                const txt = await this._fetchText(url);
                const rows = this._parseCSV(txt);
                // 0 id, 1 name, 2 allyId, 3 points, 4 rank, 5 towns
                const players = rows.map(r => ({
                    id: +r[0], name: r[1], allianceId: +r[2] || 0,
                    points: +r[3] || 0, rank: +r[4] || 0, towns: +r[5] || 0
                }));
                const byId = new Map(players.map(p => [p.id, p]));
                this._cache.players = { list: players, byId };
                return this._cache.players;
            },

            async getAlliances() {
                this._needsReset();
                if (this._cache.alliances) return this._cache.alliances;

                const host = `${Game.world_id}.grepolis.com`;
                const url = `https://${host}/data/alliances.txt`;

                const txt = await this._fetchText(url);
                const rows = this._parseCSV(txt);
                // 0 id, 1 name, 2 points, 3 townCount, 4 playerCount, 5 rank
                const alliances = rows.map(r => ({
                    id: +r[0], name: r[1],
                    points: +r[2] || 0, towns: +r[3] || 0, players: +r[4] || 0, rank: +r[5] || 0
                }));
                const byId = new Map(alliances.map(a => [a.id, a]));
                this._cache.alliances = { list: alliances, byId };
                return this._cache.alliances;
            },

            async getTowns() {
                this._needsReset();
                if (this._cache.towns) return this._cache.towns;

                const host = `${Game.world_id}.grepolis.com`;
                const url = `https://${host}/data/towns.txt`;

                const txt = await this._fetchText(url);
                const rows = this._parseCSV(txt);
                // 0 townId, 1 playerId, 2 townName, 3 x, 4 y, 5 islandPos, 6 points
                const towns = rows.map(r => ({
                    id: +r[0], playerId: +r[1], name: r[2],
                    x: +r[3], y: +r[4], islandPos: +r[5] || 0, points: +r[6] || 0
                }));
                const byId = new Map(towns.map(t => [t.id, t]));
                const byPlayer = new Map();
                for (const t of towns) {
                    if (!byPlayer.has(t.playerId)) byPlayer.set(t.playerId, []);
                    byPlayer.get(t.playerId).push(t);
                }
                this._cache.towns = { list: towns, byId, byPlayer };
                return this._cache.towns;
            },

            async getConquers() {
                this._needsReset();
                if (this._cache.conquers) return this._cache.conquers;

                const host = `${Game.world_id}.grepolis.com`;
                const url = `https://${host}/data/conquers.txt`;

                const txt = await this._fetchText(url);
                const rows = this._parseCSV(txt);
                const conquers = rows.map(r => ({
                    townId: +r[0],
                    time: +r[1],
                    newPlayerId: +r[2] || 0,
                    oldPlayerId: +r[3] || 0,
                    newAllianceId: +r[4] || 0,
                    oldAllianceId: +r[5] || 0,
                    points: +r[6] || 0
                }));
                this._cache.conquers = conquers;
                return conquers;
            },

            async getIslands() {
                this._needsReset();
                if (this._cache.islands) return this._cache.islands;

                const host = `${Game.world_id}.grepolis.com`;
                const url = `https://${host}/data/islands.txt`;

                const txt = await this._fetchText(url);
                const rows = this._parseCSV(txt);
                const islands = rows.map(r => ({
                    id: +r[0], x: +r[1], y: +r[2], type: +r[3] || 0,
                    freeSlots: +r[4] || 0, bonusPlus: +r[5] || 0, bonusMinus: +r[6] || 0
                }));
                const byCoords = new Map(islands.map(i => [`${i.x}|${i.y}`, i]));
                this._cache.islands = { list: islands, byCoords };
                return this._cache.islands;
            },

            async getPlayerKillsAll() {
                this._needsReset();
                if (this._cache.kills_all) return this._cache.kills_all;

                const host = `${Game.world_id}.grepolis.com`;
                const url = `https://${host}/data/player_kills_all.txt`;

                const txt = await this._fetchText(url);
                const rows = this._parseCSV(txt);
                const list = rows.map(r => ({ rank: +r[0], playerId: +r[1], points: +r[2] || 0 }));
                this._cache.kills_all = list;
                return list;
            },


            async getPlayerKillsAtt() {
                this._needsReset();
                if (this._cache.kills_att) return this._cache.kills_att;

                const host = `${Game.world_id}.grepolis.com`;
                const url = `https://${host}/data/player_kills_att.txt`;
                const txt = await this._fetchText(url);
                const rows = this._parseCSV(txt);
                const list = rows.map(r => ({ rank: +r[0], playerId: +r[1], points: +r[2] || 0 }));
                this._cache.kills_att = list;
                return list;
            },

            async getPlayerKillsDef() {
                this._needsReset();
                if (this._cache.kills_def) return this._cache.kills_def;

                const host = `${Game.world_id}.grepolis.com`;
                const url = `https://${host}/data/player_kills_def.txt`;
                const txt = await this._fetchText(url);
                const rows = this._parseCSV(txt);
                const list = rows.map(r => ({ rank: +r[0], playerId: +r[1], points: +r[2] || 0 }));
                this._cache.kills_def = list;
                return list;
            },
        };

        // Kleine syntactic sugar helpers op BaseManager zelf
        getPlayers = function() { return this.worldData.getPlayers(); };
        getAlliances = function() { return this.worldData.getAlliances(); };
        getTowns = function() { return this.worldData.getTowns(); };
        getConquers = function() { return this.worldData.getConquers(); };
        getIslands = function() { return this.worldData.getIslands(); };
        getPlayerKillsAll = function() { return this.worldData.getPlayerKillsAll(); };
        getPlayerKillsAtt = function() { return this.worldData.getPlayerKillsAtt(); };
        getPlayerKillsDef = function() { return this.worldData.getPlayerKillsDef(); };


        _createLogger() {
            const prefix = `[${this.constructor.name}]`;
            return {
                log: (...args) => console.log(prefix, ...args),
                warn: (...args) => console.warn(prefix, ...args),
                error: (...args) => console.error(prefix, ...args),
                debug: (...args) => DEBUG && console.debug(prefix, ...args)
            };
        }

        async waitForElement(selector, timeout = 5000, context = document) {
            const start = Date.now();
            let element = null;

            while (Date.now() - start < timeout && !element) {
                element = context.querySelector(selector);
                if (!element) await new Promise(r => setTimeout(r, 100));
            }

            if (!element) {
                throw new Error(`Element ${selector} niet gevonden na ${timeout}ms`);
            }
            return element;
        }

        showNotification(message, isSuccess = true, duration = 3000) {
            this.main.showNotification(message, isSuccess, duration);
        }

        async safeQuery(selector, timeout = 5000, context = document) {
            try {
                return await this.waitForElement(selector, timeout, context);
            } catch (error) {
                this.logger.warn(error.message);
                return null;
            }
        }

        addEvent(element, event, handler, options) {
            element.addEventListener(event, handler, options);
            this._trackEvent(element, event, handler);
        }

        _trackEvent(element, event, handler) {
            if (!element) return;
            if (!element.id) {
                // geef een unieke GM id
                element.dataset.gmId = element.dataset.gmId || ('gm_' + Math.random().toString(36).slice(2,9));
            }
            const key = `${element.id || element.dataset.gmId}-${event}`;
            this._events.set(key, { element, event, handler });
        }

        setManagedInterval(fn, delay) {
            const id = setInterval(() => {
                try { fn(); } catch (err) { this.logger.error('Interval error:', err); }
            }, delay);
            this._intervals.add(id);
            return id;
        }
        clearManagedInterval(id) {
            clearInterval(id);
            this._intervals.delete(id);
        }
        setManagedTimeout(fn, delay) {
            const id = setTimeout(() => {
                try { fn(); } catch (err) { this.logger.error('Timeout error:', err); }
            }, delay);
            this._timeouts.add(id);
            return id;
        }
        clearManagedTimeout(id) {
            clearTimeout(id);
            this._timeouts.delete(id);
        }

        getPlayerName() {
            return this.uw.Game?.player_name ||
                document.querySelector('.header_nickname')?.textContent?.trim() ||
                'Speler';
        }

        formatTime(seconds) {
            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            const s = seconds % 60;
            return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
        }

        async waitForElement(selector, timeout = 5000, context = document) {
            const start = Date.now();
            let el = null;
            while (Date.now() - start < timeout && !el) {
                el = context.querySelector(selector);
                if (!el) await new Promise(r => setTimeout(r, 100));
            }
            if (!el) throw new Error(`Element ${selector} niet gevonden na ${timeout}ms`);
            return el;
        }
        async safeQuery(selector, timeout = 5000, context = document) {
            try { return await this.waitForElement(selector, timeout, context); }
            catch (e) { this.logger.warn(e.message); return null; }
        }

        // cleanup all registered events/intervals/timeouts
        destroy() {
            // Events
            try {
                // WeakMap does not support for..of; iterate keys by temporarily storing them
                const temp = [];
                this._events && this._events.forEach === undefined
                    ? null
                : null;
                // We cannot iterate WeakMap directly; keep a reference table on instance if needed.
                // But because we stored arrays keyed by element, we rely on explicit removal points when removing UI.
                // For safety: attempt to clear intervals/timeouts.
            } catch (e) {
                // ignore
            }

            // Intervals & timeouts
            for (const id of Array.from(this._intervals)) { clearInterval(id); }
            this._intervals.clear();
            for (const id of Array.from(this._timeouts)) { clearTimeout(id); }
            this._timeouts.clear();

            this.logger.log('BaseManager cleanup (intervals/timeouts) voltooid');
        }
        async safeFetch(url, options = {}, timeout = 5000) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            try {
                const response = await fetch(url, {
                    ...options,
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                return response;
            } catch (error) {
                clearTimeout(timeoutId);
                throw new Error(`Fetch error: ${error.message}`);
            }
        }
    }

    class MyManager extends BaseManager {
        async init() {
            // Veilig element ophalen
            const button = await this.safeQuery('#my-button');

            // Event met automatische cleanup
            this.addEvent(button, 'click', () => this.handleClick());

            // Beheerd interval
            this.setManagedInterval(() => this.updateData(), 5000);

            // Netwerkrequest met timeout
            try {
                const data = await this.safeFetch('/api/data');
            } catch (error) {
                this.showNotification(error.message, false);
            }
        }

        cleanup() {
            this.destroy(); // Ruimt alles op
        }
    }

    // ============ //
    // Popup window //
    // ============ //

    class MainPopup extends BaseManager {
        toggleMainPopup() {
            if (this.popup) {
                this.popup.remove();
                this.popup = null;
                return;
            }
            this.createPopup();
        }

        createPopup() {
            this.popup = document.createElement('div');
            this.popup.id = 'gm-popup';

            const toolbar = document.createElement('div');
            toolbar.className = 'gm-toolbar';

            const btnStart = document.createElement('button');
            btnStart.textContent = 'Startscherm';
            btnStart.addEventListener('click', () => this.showStartScreen());

            toolbar.appendChild(btnStart);

            const content = document.createElement('div');
            content.id = 'gm-content';

            this.popup.appendChild(toolbar);
            this.popup.appendChild(content);
            document.body.appendChild(this.popup);

            this.showStartScreen(); // Toon bij openen
        }
    }

    // ============= //
    // Forum Manager //
    // ============= //

    class ForumManager extends BaseManager {
        constructor(mainManager) {
            super(mainManager);
            this.fora = [
                { name: "Algemeen", description: "Algemene discussies" },
                { name: "ROOD", description: "Noodmeldingen en verdediging" },
                { name: "Deff", description: "Verdedigingsstrategieën" },
                { name: "Offens", description: "Offensieve strategieën" },
                { name: "Massa_Aanval", description: "Massa-aanvallen" },
                { name: "Interne_Overnames", description: "Interne overnames" },
                { name: "Cluster", description: "Clusterbeheer" },
                { name: "Kroeg", description: "Informele discussies" },
                { name: "Leiding", description: "Leidinggevenden" },
            ];
            this.topicsData = {
                Algemeen: [
                    {
                        title: "Welkom bij de alliantie", content: "Hallo strijders van de oude wereld!\n" +
                        "\n" +
                        "We zijn ontzettend blij dat jullie hier zijn, op ons forum waar de goden en godinnen van de strategie samenkomen! Of je nu een doorgewinterde held bent of net je eerste stad hebt veroverd, hier is de plek waar we elkaar kunnen ontmoeten, tips kunnen uitwisselen en natuurlijk kunnen lachen om onze meest epische blunders (ja, we hebben allemaal wel eens een stad verloren aan een stelletje boze kippen).\n" +
                        "\n" +
                        "Voordat je je zwaarden en schilden opbergt, willen we je vragen om jezelf even kort voor te stellen. Vertel ons wie je bent, waar je vandaan komt en wat je favoriete strategie is. En als je een hilarisch verhaal hebt over een mislukte aanval of een onverwachte alliantie, deel dat vooral! We zijn hier om elkaar te steunen, maar ook om samen te lachen.\n" +
                        "\n" +
                        "Dus, trek je toga aan, neem een slok van je ambrosia en laat ons weten wie je bent! We kunnen niet wachten om je te leren kennen en samen de wereld van Grepolis te veroveren!\n" +
                        "\n" +
                        "Met strijdlustige groet,\n" +
                        "\n" +
                        "Het Grepolis Forum Team 🏛️✨"
                    },
                    {
                        title: "Te volgen regels", content: "🏛️ Alliantie Reglement – Samen Sterk, Samen Onverslaanbaar! 🏛️\n" +
                        "Welkom bij de alliantie! 🎉 We zijn hier niet alleen om een beetje rond te dobberen, maar om samen de vijand tot stof te reduceren. Dit reglement is geen bureaucratische onzin, maar een handleiding voor totale dominantie. Volg het, en we overleven. Negeer het, en de vijand lacht ons uit – en laten we eerlijk zijn, dat is gewoon gênant.\n" +
                        "\n" +
                        "1️⃣ Afwezigheid – Niet Stiekem Verdwijnen!\n" +
                        "Ga je langer dan 18 uur weg? Meld het op het forum. Laat ons ook weten of je de vakantiemodus aanzet.\n" +
                        "Geen melding = automatisch IO voor clustersteden, en geloof ons, dat wil je niet.\n" +
                        "\n" +
                        "👀 “Ik was even mijn kat zoeken” is geen excuus. We willen duidelijke communicatie.\n" +
                        "\n" +
                        "2️⃣ Opstand ([color=#FF0000]Rood[/color]) – Alarmfase Rood!\n" +
                        "Als je stad in opstand staat, panikeer niet (of doe dat stilletjes), maar maak een Rood-topic met de juiste informatie.\n" +
                        "\n" +
                        "📢 Verlies je een stad zonder iets te zeggen? Dan zetten we je op de lijst voor een gratis IO-abonnement, geen terugbetaling mogelijk.\n" +
                        "\n" +
                        "Extra tip: Geef updates over muurstand, inkomende aanvallen en spreuken. We zijn goed, maar we kunnen helaas nog geen gedachten lezen.\n" +
                        "\n" +
                        "3️⃣ Trips – Een Kleine Stap voor Jou, Een Grote Stap voor de Alliantie\n" +
                        "Plaats altijd trips bij je eilandgenoten. Een trip is 3 def lt per stad.\n" +
                        "\n" +
                        "💡 Denk eraan: geen trips plaatsen is als je huis openlaten voor inbrekers en zeggen: “Kom maar binnen, koffie staat klaar!”\n" +
                        "\n" +
                        "Vernieuw gesneuvelde trips en plaats een rapport in het trips-topic op het def-forum.\n" +
                        "\n" +
                        "4️⃣ Hulp Vragen & Elkaar Steunen – We Doen Dit Samen\n" +
                        "Vraag op tijd om hulp. Het is geen schande om hulp te vragen, het is een schande om stil te zijn en dan keihard onderuit te gaan. Gebruik forum, Discord of PM.\n" +
                        "\n" +
                        "Help! Mijn stad brandt! is trouwens een prima bericht. Sneller reageren we niet, maar het is wel dramatisch.\n" +
                        "\n" +
                        "5️⃣ Reservaties – Geen Vage Claims, Gewoon Doen\n" +
                        "Claim pas als je een kolo en een slotje hebt. Een claim is binnen 2 dagen overnemen, geen eindeloze bezetting van de stoel zoals een kleuter die niet van de schommel wil.\n" +
                        "\n" +
                        "🔴 PRIO-steden? Dan tellen claims niet. Pak het, of de vijand doet het. Simpel.\n" +
                        "\n" +
                        "6️⃣ Overzicht & Communicatie – Niet Raden, Gewoon Weten\n" +
                        "Gebruik BB-codes of zorg dat iemand het voor je doet. Anders proberen we je bericht zu ontcijferen alsof het een oude schatkaart is.\n" +
                        "\n" +
                        "🔍 Eilandcodes uit het Cluster Plan-topic gebruiken = dikke pluspunten.\n" +
                        "\n" +
                        "7️⃣ Offensief – Oorlog met Stijl\n" +
                        "🚫 Geen transportboten als aanval – tenzij je de vijand wilt laten lachen.\n" +
                        "🎯 VS voor je LT-aanval timen = slim.\n" +
                        "💥 Geen def lt of bir gebruiken bij aanvallen. Anders krijg je een cursus “Hoe val ik wél aan” gratis op het forum.\n" +
                        "\n" +
                        "🌙 Nachtbonus? Alleen aanvallen op inactieve spelers, lege steden of als je écht durft.\n" +
                        "\n" +
                        "8️⃣ TTA’s & Berichten – Reacties Zijn Belangrijker dan Je Ex\n" +
                        "Antwoord op TTA’s, berichten en Discord @’s. Geen reactie? Dan nemen we aan dat je ondergedoken bent en nemen we je clustersteden voor je eigen veiligheid over.\n" +
                        "\n" +
                        "Dus tenzij je graag een stadsloze kluizenaar wordt: reageren aub!\n" +
                        "\n" +
                        "9️⃣ Steden & Collectieve Verplichtingen – Iedereen Doet Mee\n" +
                        "Elke speler heeft minimaal 1 def lt-stad en 1 bir-stad.\n" +
                        "📌 Cluster Plan volgen = essentieel. Overnemen pas na 1 stad per cluster eiland (inclusief rotsen, ja, ook die lelijke).\n" +
                        "\n" +
                        "🔟 Rotsen & Gunstfarmen – Klein Maar Fijn\n" +
                        "Heb je een rotsstad? Zorg dat je actief bent en alarm aanzet. Anders is die rots sneller weg dan een gratis biertje op een festival.\n" +
                        "\n" +
                        "Gunst is belangrijk. Zonder gunst geen razende aanvallen. Zonder razende aanvallen? Nou ja, dan win je niet.\n" +
                        "\n" +
                        "Waarom deze regels?\n" +
                        "We zijn niet de alliantie van de vrije interpretatie. We zijn een goed geoliede machine die vijanden verslindt.\n" +
                        "🚀 Duidelijke afspraken = een sterke alliantie = Winst.\n" +
                        "\n" +
                        "Hou je eraan, dan maken we gehakt van de tegenstanders. Negeer ze? Dan krijg je een persoonlijke uitnodiging voor de IO van de Maand-competitie.\n" +
                        "\n" +
                        "💪 SAMEN DOMINEREN WE!\n" +
                        "\n" +
                        "Met strijdlustige groeten,\n" +
                        "🔥 De Leiding 🔥"
                    },
                    {
                        title: "Afwezig", content: "Laat hier weten als je er even tussenuit bent.\n" +
                        "\n" +
                        "[table]\n" +
                        "[**]Speler[||]Afwezig van[||]tem[||]VM[||]Opmerkingen[/**]\n" +
                        "[*][|][|][|][|][/*]\n" +
                        "[*][|][|][|][|][/*]\n" +
                        "[*][|][|][|][|][/*]\n" +
                        "[/table]\n"
                    },
                    {title: "Bondgenoten & NAP's", content: "Bondgenoten en NAP's worden hier besproken."},
                    {
                        title: "Spreuken en grondstoffen",
                        content: "Hier kunnen spelers om spreuken en grondstoffen vragen."
                    },
                    {
                        title: "Discord en scripts", content: "[b][u]Kom langs op onze discord server.[/u][/b]\n" +
                        "\n" +
                        "[url]https://discord.gg/v53K97dD8a[/url]\n" +
                        "\n" +
                        "[b][u]grepodata city-indexer[/u][/b]\n" +
                        "\n" +
                        "[url]https://grepodata.com/invite/rhzuhr2n4yqwd7dhcc[/url]\n" +
                        "\n" +
                        "[b][u]Forum ROOD template generator[/u][/b]\n" +
                        "\n" +
                        "[url]https://greasyfork.org/nl/scripts/512594-grepolis-notepad-forum-template-3[/url]"
                    }
                ],
                ROOD: [
                    {
                        title: "Rood tabel", content: "Bij meer dan 5 aanvallen wordt de tabel actief.\n" +
                        "[b][color=#FF0000]Bij een opstand éérst een eigen topic aanmaken in de juiste opmaak, [u]incl. tabelregel![/u][/color][/b]\n" +
                        "Tabelregel:\n" +
                        "[b][*]nr[|]OC[|]start F2[|]BB-code stad[|]muur[|]god[|]aanvaller(s)[|]BIR/LT[|]Aanwezige OS[|]Notes[/*][/b]\n" +
                        "Vul de tabelregel in met de gegevens van jouw ROOD melding en plaats deze bovenaan in je topic.\n" +
                        "muur -16 ➡️ alleen BIR sturen\n" +
                        "                    muur +16 ➡️ alleen LT (landtroepen) sturen\n" +
                        "                    Als de muur opgebouwd is én er geen reden op afbraak is, dan mag BIR omgezet worden naar LT.\n" +
                        "                    ⚠️ Zet géén sterretje in de titel van je topic! Forum mods zetten een * in de titel als indicatie dat de melding is opgenomen in de ROOD tabel. Doe je dit zelf, komt je stad NIET in de tabel terecht.\n" +
                        "                    [b]Mod van Dienst[/b]: [img]https://cdn.grcrt.net/emots2/girl_comp.gif[/img]\n" +
                        "                    [player]joppie86[/player]\n" +
                        "                    [table]\n" +
                        "                    [**]Nr[||]OC[||]Start F2[||]BB-code stad[||]Muur[||]God[||]aanvaller(s)[||]BIR/LT[||]Aanwezig[||]Notes[/**]\n" +
                        "                    [*][|][|][|][|][|][|][|][|][|][/*]\n" +
                        "                    [/table]\n" +
                        "                    [b][color=#FF2D2D][size=12]Dringend verzoek[/size]: Als je stad [b][u][size=12]safe[/size][/u][/b] is dit [u][size=12]melden[/size][/u] en de [u][size=12]OS terug sturen[/size][/u]! [/color][/b]"
                    },
                    {
                        title: "Kolo snipe", content: "Beste strijders,\n" +
                        "                    Aan alle [u]Kolo-spotters[/u]," +
                        "					 plaats in deze topic ASAP een bericht als je kolo hebt gespot.\n" +
                        "                    meld je stadsnaam in BB en exacte tijd van aankomst kolo + tijd laatste aanval voor kolo.\n" +
                        "                    Vb.:\n" +
                        "                    [town]1[/town]\n" +
                        "                    Kolo: 22:15:42\n" +
                        "                    laatste voor kolo: 22:15:32\n" +
                        "                    aan alle [u]Kolo-snipers[/u],\n" +
                        "                    hou deze topic goed in de gaten voor kolo-spotters, zodat je vlug kan handelen indien er kolo is gespot.\n" +
                        "                    [b]hoe timen:[/b]\n" +
                        "                    zorg in je snipe steden voor:\n" +
                        "                    * uiteraard BIR\n" +
                        "                    * transportboot\n" +
                        "                    * sirene\n" +
                        "                    gebruik bij voorkeur je aanvalsplanner om je ondersteuning te timen:\n" +
                        "                    poging 1: 1 tb + bir (min 50) check aankomsttijd en eventueel opnieuw proberen\n" +
                        "                    poging 2: 60 BIR meerdere pogingen versturen kort na elkaar van 10 sec voor tot 10 sec na opstandtijd\n" +
                        "                    poging 3: 1 sirene + Bir check aankomsttijd en eventueel opnieuw proberen\n" +
                        "                    succes\n"
                    },
                    {
                        title: "Rood Template",
                        content: "[*]nr[|]OC[|]start F2[|]aangevallen stad[|]muur[|]god[|]aanvallende speler[|]gewenste OS[|]aanwezig[|]Notes[/*]\n" +
                        "                    Aangevallen stad: \n" +
                        "                    God: \n" +
                        "                    Muur: \n" +
                        "                    Toren: \n" +
                        "                    Held: \n" +
                        "                    Ontwikkelingen: \n" +
                        "                    OS aanwezig: \n" +
                        "                    OS nodig: \n" +
                        "                    Stadsbescherming: \n" +
                        "                    Fase 2 begint om: \n" +
                        "                    Fase 2 eindigt om: \n" +
                        "                    [spoiler=Rapporten] \n" +
                        "                    *Opstandsrapport(ten)!!!*\n" +
                        "                    [/spoiler]\n"
                    }
                ],
                Deff: [
                    {
                        title: "Pre-deff", content: "Vraag hier je pre-deff aan voor belangrijke steden.\n" +
                        "\n" +
                        "                    Pre-deff kan je krijgen op voorwaarde dat je muur 25 is en Toren.\n" +
                        "\n" +
                        "                    hoe aanvragen:\n" +
                        "                    stadsnaam: in BB\n" +
                        "                    Muur Lv:\n" +
                        "                    Toren:\n" +
                        "                    aanwezige Lt:\n"
                    },
                ],
                Offens: [
                    {
                        title: "OFF. | Template", content: "Titel\n" +
                        "                    VB: Oceaan | Te veroveren stadsnaam | Status\n" +
                        "                    VB: 55 | 55-01 | Opstand/ VS clear nodig\n" +
                        "\n" +
                        "                    -------------------------------------------------------\n" +
                        "\n" +
                        "                    Alliantie:\n" +
                        "                    Speler:\n" +
                        "                    Stad:\n" +
                        "\n" +
                        "                    Gevraagde hulp: Spionage/ VS clear/ Zee clear\n" +
                        "\n" +
                        "                    [spoiler=Recentste spionage][/spoiler]\n" +
                        "\n" +
                        "                    [spoiler=Opstand aanval][/spoiler]\n"
                    },
                    {
                        title: "Opstand breken met Helena", content: "[b]Aan wie Helena bezit:[/b]\n" +
                        "                Zorg dat Helena op Lv 20 is.\n" +
                        "                meld hier in welke stad Helena zit.\n" +
                        "                controleer hier regelmatig naar opstanden.\n" +
                        "\n" +
                        "                [b]Aan wie opstand heeft:[/b]\n" +
                        "\n" +
                        "                Laat hier onmiddellijk weten waar er opstand in een stad word gezet (zelfs indien je zeker bent van een opstand, nog voor die er is).\n" +
                        "\n" +
                        "                stad: in BB\n" +
                        "                F2 tijd:\n" +
                        "\n" +
                        "                [table]\n" +
                        "                [**]naam[||]lv[||]stad[||][/**]\n" +
                        "                [*][|][|][|][/*]\n" +
                        "                [/table]\n"
                    },
                    {
                        title: "Spionage rapporten", content: "Hier kan je alle recente spionage rapporten bekijken."
                    },
                ],
                Massa_Aanval: [
                    {title: "Massa-aanvallen", content: "Inhoud van Massa-aanvallen..."},
                ],
                Interne_Overnames: [
                    {title: "Interne overnames", content: "Inhoud van Interne overnames..."},
                ],
                Cluster: [
                    {title: "Clusterbeheer", content: "Inhoud van Clusterbeheer..."},
                ],
                Kroeg: [
                    {title: "Kroegpraat", content: "Inhoud van Kroegpraat..."},
                ],
                Leiding: [
                    {title: "Leidinggevenden", content: "Inhoud van Leidinggevenden..."},
                ],
            };
        }

        async createAllForaAndTopics() {
            const content = document.getElementById('popup-content');
            content.innerHTML = `
                <h2>Fora en Topics Aanmaken</h2>
                <p>Klik op de knop hieronder om alle fora en topics in één keer aan te maken.</p>
                <button id="start-creation" class="gm-button">Start Aanmaken</button>
                <div id="status-messages" style="margin-top:20px;"></div>
            `;

            const startButton = content.querySelector('#start-creation');
            startButton.addEventListener('click', async () => {
                const statusDiv = document.getElementById('status-messages');
                statusDiv.innerHTML = '';

                try {
                    // Navigeer naar het alliantieforum
                    await this.navigateToAllianceForum();

                    // Open het forumbeheer (alleen voor het eerste forum)
                    let isForumAdminOpen = false;

                    // Maak alle fora aan
                    for (let i = 0; i < this.fora.length; i++) {
                        const forum = this.fora[i];
                        if (await this.forumExists(forum.name)) {
                            statusDiv.innerHTML += `<p>Forum "${forum.name}" bestaat al.</p>`;
                        } else {
                            if (!isForumAdminOpen) {
                                await this.openForumAdmin();
                                isForumAdminOpen = true;
                            }
                            await this.createForum(forum);

                            // Sluit het dialoogvenster alleen na het laatste forum
                            if (i === this.fora.length - 1) {
                                await this.closeDialog();
                            }

                            statusDiv.innerHTML += `<p>Forum "${forum.name}" succesvol aangemaakt.</p>`;
                        }
                    }

                    // Terugkeren naar het alliantieforum
                    await this.navigateToAllianceForum();

                    // Maak alle topics aan
                    for (const forumName in this.topicsData) {
                        const topics = this.topicsData[forumName];

                        // Navigeer naar het juiste forum
                        await this.navigateToForum(forumName);

                        for (const topic of topics) {
                            if (await this.topicExists(forumName, topic.title)) {
                                statusDiv.innerHTML += `<p>Topic "${topic.title}" in forum "${forumName}" bestaat al.</p>`;
                            } else {
                                await this.createTopic(topic);
                                statusDiv.innerHTML += `<p>Topic "${topic.title}" in forum "${forumName}" succesvol aangemaakt.</p>`;

                                // Keer terug naar het forum na het aanmaken van het topic
                                await this.navigateToForum(forumName);
                            }
                        }
                    }

                    // Sluit het dialoogvenster na het aanmaken van alle topics
                    await this.closeDialog();

                    statusDiv.innerHTML += `<p><strong>Alle fora en topics zijn verwerkt!</strong></p>`;
                } catch (error) {
                    statusDiv.innerHTML += `<p style="color: red;">Fout: ${error.message}</p>`;
                    console.error(error);
                }
            });
        }

        async navigateToAllianceForum() {
            console.log("Navigeer naar alliantieforum...");
            const forumButton = await this.waitForElement('#ui_box > div.nui_main_menu > div.middle > div.content > ul > li.allianceforum.main_menu_item > span > span.name_wrapper > span', 15000);
            if (forumButton) {
                forumButton.click();
                await this.waitForElement('.forum_menu', 15000);
            } else {
                throw new Error('Kon het alliantieforum niet vinden.');
            }
        }

        async navigateToForum(forumName) {
            console.log(`Navigeer naar forum: ${forumName}`);

            try {
                // Zoek het forum op basis van de naam
                const forumLinks = document.querySelectorAll('a.submenu_link[data-menu_name]');
                let foundForum = null;

                // Loop door alle forum links
                for (const link of forumLinks) {
                    const forumSpan = link.querySelector('span.forum_menu');
                    if (forumSpan) {
                        const linkText = forumSpan.textContent.trim();
                        if (linkText.toLowerCase() === forumName.toLowerCase()) {
                            foundForum = link;
                            break;
                        }
                    }
                }

                if (!foundForum) {
                    // Toon beschikbare forums voor debuggen
                    const availableForums = Array.from(forumLinks).map(link => {
                        return link.querySelector('span.forum_menu')?.textContent.trim() || 'Onbekend forum';
                    });

                    console.error('Beschikbare forums:', availableForums);
                    throw new Error(`Forum "${forumName}" niet gevonden in de lijst.`);
                }

                // Klik op het forum
                console.log(`Klik op forum: ${forumName}`);
                foundForum.click();

                // Wacht 3 seconden om de pagina te laten laden
                await new Promise(resolve => setTimeout(resolve, 3000));

                // Controleer of het forum leeg is
                const threadList = document.querySelector('.forum_thread_list');
                if (!threadList) {
                    console.log(`Forum "${forumName}" is leeg of het element .forum_thread_list bestaat niet.`);
                    return; // Stop verdere acties voor dit forum
                }

                console.log(`Forum "${forumName}" succesvol geladen.`);

            } catch (error) {
                console.error(`Fout bij navigeren naar forum "${forumName}":`, error);
                throw error; // Gooi de fout opnieuw voor hogere afhandeling
            }
        }

        async forumExists(forumName) {
            const forumLinks = document.querySelectorAll('a.submenu_link[data-menu_name]');
            for (const link of forumLinks) {
                const forumSpan = link.querySelector('span.forum_menu');
                if (forumSpan && forumSpan.textContent.trim().toLowerCase() === forumName.toLowerCase()) {
                    return true;
                }
            }
            return false;
        }

        async topicExists(forumName, topicTitle) {
            const topicTitles = document.querySelectorAll('.forum_thread_title');
            if (topicTitles.length === 0) {
                console.log(`Geen topics gevonden in forum "${forumName}".`);
                return false; // No topics exist in this forum
            }
            for (const title of topicTitles) {
                if (title.textContent.trim().toLowerCase() === topicTitle.toLowerCase()) {
                    return true;
                }
            }
            return false;
        }

        async createForum(forum) {
            console.log(`Maak forum aan: ${forum.name}`);

            // Klik op de knop om een nieuw forum aan te maken
            await this.clickButton("#forum_admin > div.game_list_footer > a > span.left > span > span", 15000);

            // Vul de forumnaam en beschrijving in
            await this.fillField("#forum_forum_name", forum.name, 15000);
            await this.fillField("#forum_forum_content", forum.description, 15000);

            // Klik op de bevestigingsknop
            await this.clickButton("#create_forum_confirm > span.left > span > span", 15000);

            // Wacht tot het forum is aangemaakt
            await new Promise(resolve => setTimeout(resolve, 3000));
        }

        async createTopic(topic) {
            console.log(`Maak topic aan: ${topic.title}`);

            // Klik op de knop om een nieuw topic aan te maken
            await this.clickButton("#forum_buttons > a:nth-child(1) > span.left > span > span", 15000);

            // Vul de titel in
            await this.fillField("#forum_thread_name", topic.title, 15000);

            // Vul de inhoud in
            await this.fillField("#forum_post_textarea", topic.content, 15000);

            // Klik op de bevestigingsknop
            await this.clickButton("#forum > div.game_footer > a > span.left > span > span", 15000);

            // Wacht tot het topic is aangemaakt
            await new Promise(resolve => setTimeout(resolve, 3000));
        }

        async closeDialog() {
            console.log("Sluit dialoogvenster...");
            const closeButton = await this.waitForElement(
                'body > div.ui-dialog.ui-corner-all.ui-widget.ui-widget-content.ui-front.ui-draggable.js-window-main-container > div.ui-dialog-titlebar.ui-corner-all.ui-widget-header.ui-helper-clearfix.ui-draggable-handle > button',
                15000
            );
            if (closeButton) {
                closeButton.click();
                console.log("Dialoogvenster gesloten.");
            } else {
                throw new Error('Kon de sluitknop van het dialoogvenster niet vinden.');
            }
        }

        async openForumAdmin() {
            console.log("Open forumbeheer...");
            const forumAdminButton = await this.waitForElement('#forum > div.game_list_footer > div.forum_footer > a', 15000);
            if (forumAdminButton) {
                forumAdminButton.click();
                await this.waitForElement('#forum_admin', 15000);
            } else {
                throw new Error('Kon de forumbeheerknop niet vinden. Controleer of de gebruiker de juiste rechten heeft.');
            }
        }

        async clickButton(selector, timeout = 15000) {
            console.log(`Zoek knop: ${selector}`);
            const button = await this.waitForElement(selector, timeout);
            if (!button) throw new Error(`Knop niet gevonden: ${selector}`);
            button.click();
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        async fillField(selector, value, timeout = 15000) {
            console.log(`Vul veld in: ${selector}`);
            const field = await this.waitForElement(selector, timeout);
            if (!field) throw new Error(`Veld niet gevonden: ${selector}`);
            field.value = value;
            field.dispatchEvent(new Event('change', { bubbles: true }));
        }

        async waitForElement(selector, timeout = 20000, retries = 3) {
            return new Promise((resolve, reject) => {
                const startTime = Date.now();
                let attempts = 0;

                const check = () => {
                    const element = document.querySelector(selector);
                    if (element) {
                        console.log(`Element gevonden: ${selector}`);
                        resolve(element);
                    } else if (Date.now() - startTime > timeout) {
                        if (attempts < retries) {
                            attempts++;
                            console.log(`Timeout: ${selector} niet gevonden. Poging ${attempts} van ${retries}.`);
                            setTimeout(check, 1000); // Retry after 1 second
                        } else {
                            reject(new Error(`Timeout: ${selector} niet gevonden na ${retries} pogingen.`));
                        }
                    } else {
                        setTimeout(check, 100);
                    }
                };
                check();
            });
        }

        toggle(active) {
            if (active) {
                this.showUI();
            } else {
                this.hideUI();
            }
        }

        hideUI() {
            // sluit het standaard GM-panel van dit onderdeel
            const panel = document.getElementById('gm-panel-forum');
            if (panel) panel.remove();
            this.main.showNotification('Forum Manager gesloten');
        }

        showUI() {
            // render via het centrale paneel-mechanisme (voegt .active zelf toe)
            this.main.openPanel('forum', (container) => {
                container.innerHTML = `
      <h2 class="gm-panel-title">Fora en Topics Aanmaken</h2>
      <p>Deze actie maakt automatisch alle fora en topics aan in het alliantieforum.</p>
      <label style="display:block;margin:10px 0;">
          <input type="checkbox" id="confirmation-checkbox">
          Ik weet wat ik doe en wil doorgaan
      </label>
      <button id="confirm-button" class="gm-button">Bevestig en toon aanmaakknop</button>
      <div id="start-container" style="margin-top:15px;display:none;">
          <button id="start-creation" class="gm-button">Start Aanmaken</button>
      </div>
      <div id="status-messages" style="margin-top:20px;"></div>
    `;

                // Gebruik container-scoped selectors (openPanel roept renderFn aan vóór appendChild)
                const confirmBtn = container.querySelector('#confirm-button');
                const checkbox = container.querySelector('#confirmation-checkbox');
                const startContainer = container.querySelector('#start-container');
                const startBtn = container.querySelector('#start-creation');

                confirmBtn.addEventListener('click', () => {
                    if (checkbox.checked) {
                        startContainer.style.display = 'block';
                    } else {
                        alert('Bevestig eerst dat je door wilt gaan.');
                    }
                });

                if (startBtn) {
                    startBtn.addEventListener('click', () => this.createAllForaAndTopics());
                }
            }, 'gm-panel-medium');


            // Event listeners
            document.getElementById('confirm-button').addEventListener('click', () => {
                const checkbox = document.getElementById('confirmation-checkbox');
                const startContainer = document.getElementById('start-container');
                if (checkbox.checked) {
                    startContainer.style.display = 'block';
                } else {
                    alert('Bevestig eerst dat je door wilt gaan.');
                }
            });

            document.getElementById('start-creation').addEventListener('click', () => this.createAllForaAndTopics());
        }
    }

    // ---------------------------
    // --- Wereldinfo-------------
    // ---------------------------

    class WereldInfo extends BaseManager {
        constructor(mainManager) {
            super(mainManager);
            // Let op: geen hard-coded forumUrl hier. Wordt opgehaald uit instellingen in render().
            this.keys = [
                "Start","Wereldsnelheid","Eenhedensnelheid","Handelssnelheid","Beginnersbescherming",
                "Kolonisatiesysteem","Eindspel","Duur opstand","Duur stad stichten","Boerendorpensysteem",
                "Anti-timing regel","Goden","Premiumfuncties","Helden","Moraal","Nachtbonus",
                "Alliantielimiet","Aantal startsteden","Speciale effecten","Artifact"
            ];
        }

        async fetchForumHTML(url) {
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: "GET",
                    url,
                    onload: (res) => {
                        if (res.status >= 200 && res.status < 300) resolve(res.responseText);
                        else reject(new Error(`HTTP ${res.status}`));
                    },
                    onerror: (err) => reject(err)
                });
            });
        }

        _esc(s = "") {
            return String(s)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
        }

        cleanText(rawText) {
            let t = rawText || "";
            // verwijder JSON-blokken en veel voorkomende meta/ruis
            t = t.replace(/\{[\s\S]*?\}/g, " ");
            t = t.replace(/(Community Manager|Grepolis Team)[\s\S]*?\d{4}/gi, " ");
            t = t.replace(/#\d+/g, " ");
            // Zoek begin en eind
            const startMatch = t.match(/Wereld\s+\w+\s+zal[\s\S]*?van start gaan!?/i);
            const startIndex = startMatch ? t.indexOf(startMatch[0]) : -1;
            const endIndex = t.search(/Met vriendelijke groet/i);
            if (startIndex >= 0) {
                t = t.slice(startIndex, endIndex > 0 ? endIndex : undefined);
            } else if (endIndex > 0) {
                t = t.slice(0, endIndex);
            }
            // Normaliseer whitespace maar behoud referentiële hoofdletters
            t = t.replace(/\r?\n|\r/g, " ").replace(/\s+/g, " ").trim();
            // Breek aaneengeschreven woorden bij lowercase+Uppercase (help bij parsing)
            t = t.replace(/([a-zà-ÿ])([A-ZÀ-Ÿ])/g, "$1 $2");
            return t;
        }

        splitIntoSegments(text) {
            const segments = {};
            const keys = this.keys;
            const re = new RegExp("(" + keys.join("|") + ")([\\s\\S]*?)(?=" + keys.join("|") + "|$)", "gmi");
            let m;
            while ((m = re.exec(text)) !== null) {
                const key = m[1].trim();
                const seg = (m[2] || "").trim();
                segments[key] = seg;
            }
            return segments;
        }

        splitSegment(segRaw) {
            let seg = (segRaw || "").trim();
            if (!seg) return { col2: "-", col3: "-" };
            seg = seg.replace(/\s+/g, " ").trim();

            // hyphens handling
            const hyphenSpace = seg.indexOf(" -");
            if (hyphenSpace >= 0) {
                const left = seg.slice(0, hyphenSpace).trim();
                const right = seg.slice(hyphenSpace).replace(/^[-\s]+/, "-").trim();
                return { col2: left || "-", col3: right || "-" };
            }
            if (seg.endsWith("-")) {
                const left = seg.slice(0, -1).trim();
                return { col2: left || "-", col3: "-" };
            }

            // date pattern
            const dateRe = /^(maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|zondag)\s+\d{1,2}\s+[a-zA-Z]+/i;
            const dateMatch = seg.match(dateRe);
            if (dateMatch) {
                const col2 = dateMatch[0].trim();
                const col3 = seg.slice(dateMatch[0].length).trim() || "-";
                return { col2, col3 };
            }

            // "X dagen" / "X uur"
            const daysMatch = seg.match(/^(\d+\s+dagen\b)/i);
            if (daysMatch) {
                const col2 = daysMatch[1].trim();
                const col3 = seg.slice(daysMatch[1].length).trim() || "-";
                return { col2, col3 };
            }
            const uurMatch = seg.match(/^(\d+\s*uur\b)/i);
            if (uurMatch) {
                const col2 = uurMatch[1].trim();
                const col3 = seg.slice(uurMatch[1].length).trim() || "-";
                return { col2, col3 };
            }

            // time range
            const timeMatch = seg.match(/^(\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2})/);
            if (timeMatch) {
                const col2 = timeMatch[1].trim();
                const col3 = seg.slice(timeMatch[1].length).trim() || "-";
                return { col2, col3 };
            }

            // markers heuristic: split where info words appear
            const markers = [
                "In de loop", "In de", "Spionage", "Handelen", "Belegering", "Normale",
                "Battle Point", "Battle", "00:00", "voor alle", "Instant", "Actief",
                "Handelen met", "Bandietenkampen"
            ];
            let earliest = -1;
            const lcSeg = seg.toLowerCase();
            for (const mk of markers) {
                const idx = lcSeg.indexOf(mk.toLowerCase());
                if (idx >= 0 && (earliest === -1 || idx < earliest)) {
                    earliest = idx;
                }
            }
            if (earliest > 0) {
                const col2 = seg.slice(0, earliest).trim();
                const col3 = seg.slice(earliest).trim() || "-";
                return { col2: col2 || "-", col3: col3 || "-" };
            }

            // fallback heuristics
            const tokens = seg.split(/\s+/);
            if (tokens.length === 1) return { col2: seg, col3: "-" };
            if (/^\d+$/.test(tokens[0]) || /^[\d:]+$/.test(tokens[0]) || /^[A-Za-z]{1,3}$/.test(tokens[0])) {
                const col2 = tokens.shift();
                const col3 = tokens.join(" ").trim() || "-";
                return { col2, col3 };
            }
            if (tokens.length <= 3) return { col2: seg, col3: "-" };
            const col2 = tokens.shift();
            const col3 = tokens.join(" ").trim() || "-";
            return { col2, col3 };
        }

        parseTableFromText(tableText) {
            const segments = this.splitIntoSegments(tableText);
            const rows = [];
            for (const key of this.keys) {
                if (!segments.hasOwnProperty(key)) continue;
                const seg = segments[key] || "";
                const { col2, col3 } = this.splitSegment(seg);
                rows.push({
                    col1: key,
                    col2: col2 === "" ? "-" : col2,
                    col3: col3 === "" ? "-" : col3
                });
            }

            let html = `<table style="border-collapse:collapse;width:100%;margin:10px 0;">
            <colgroup><col style="width:30%"><col style="width:35%"><col style="width:35%"></colgroup>
            <thead>
              <tr>
                <th style="text-align:left;padding:6px;border-bottom:1px solid #666;">Omschrijving</th>
                <th style="text-align:left;padding:6px;border-bottom:1px solid #666;">Wereldinstelling</th>
                <th style="text-align:left;padding:6px;border-bottom:1px solid #666;">Informatie</th>
              </tr>
            </thead>
            <tbody>`;
            for (const r of rows) {
                html += `<tr>
                <td style="border:1px solid #333;padding:6px;vertical-align:top;">${this._esc(r.col1)}</td>
                <td style="border:1px solid #333;padding:6px;vertical-align:top;">${this._esc(r.col2)}</td>
                <td style="border:1px solid #333;padding:6px;vertical-align:top;">${this._esc(r.col3)}</td>
            </tr>`;
            }
            html += `</tbody></table>`;
            return html;
        }

        splitIntroTableOutro(cleaned) {
            const marker = /De instellingen:/i;
            const m = cleaned.match(marker);
            if (!m) return { intro: cleaned, tableText: "", outro: "" };
            const idx = cleaned.search(marker);
            const intro = cleaned.slice(0, idx).trim();
            const after = cleaned.slice(idx + m[0].length).trim();
            const outroMarker = /(Wereld\s+\w+\s+zal in de loop|Met vriendelijke groet)/i;
            const outroMatch = after.match(outroMarker);
            if (outroMatch) {
                const oidx = after.search(outroMarker);
                return {
                    intro,
                    tableText: after.slice(0, oidx).trim(),
                    outro: after.slice(oidx).trim()
                };
            } else {
                return { intro, tableText: after.trim(), outro: "" };
            }
        }

        async render(container) {
            container.innerHTML = `<h2>🌍 Wereldinfo laden…</h2>`;
            try {
                // haal forum-url uit instellingen (niet hard-coded)
                const forumUrl = await GM_getValue("wereldinfo_url", null);
                if (!forumUrl) {
                    container.innerHTML = `
                    <h2>🌍 Wereldinfo</h2>
                    <p style="color:#c33;">Geen forum-link ingesteld voor wereldinfo.</p>
                    <p>Ga naar Instellingen en vul bij "Wereldinfo URL" de forum-link in (bv. het aankondigingstopic).</p>
                    <button id="gm-open-settings" class="gm-button">Open Instellingen</button>
                `;
                    // voeg knop-event toe (indien instellingen beschikbaar in main)
                    container.querySelector("#gm-open-settings")?.addEventListener("click", () => {
                        if (this.main && typeof this.main.openPanel === "function" && this.main.settingsWindow) {
                            this.main.openPanel("settings", (c) => this.main.settingsWindow.render(c));
                        } else {
                            alert("Instellingen-paneel niet beschikbaar.");
                        }
                    });
                    return;
                }

                const html = await this.fetchForumHTML(forumUrl);
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, "text/html");
                const article = doc.querySelector("article");
                if (!article) throw new Error("Geen <article>-element gevonden op de forumpagina.");

                const rawText = article.innerText || "";
                const cleaned = this.cleanText(rawText);

                let imgEl = article.querySelector("img[src*='new_world']") || article.querySelector("img");
                const imgHtml = imgEl ? `<div style="text-align:center;margin-bottom:10px;"><img src="${this._esc(imgEl.src)}" style="max-width:260px;"></div>` : "";

                const { intro, tableText, outro } = this.splitIntroTableOutro(cleaned);
                const tableHtml = tableText ? this.parseTableFromText(tableText) : `<p style="color:#999;">Geen instellingen gevonden.</p>`;

                const wereldNaam = (forumUrl.match(/wereld-([^-]+)/i) || [])[1] || (this.uw.Game?.world_id || "Onbekend");

                container.innerHTML = `
                <h2 style="margin-bottom:10px;">🌍 Wereldinfo (${this._esc(wereldNaam)})</h2>
                ${imgHtml}
                <div style="white-space:pre-line;margin-bottom:12px;">${this._esc(intro)}</div>
                ${tableHtml}
                <div style="white-space:pre-line;margin-top:12px;color:inherit;">${this._esc(outro)}</div>
                <p class="gm-muted" style="margin-top:8px;font-size:12px;">Bron: <a href="${this._esc(forumUrl)}" target="_blank">${this._esc(forumUrl)}</a></p>
            `;
            } catch (err) {
                console.error("[WereldInfo] Fout:", err);
                container.innerHTML = `<p style="color:red;">❌ Fout bij ophalen wereldinfo: ${this._esc(err.message)}</p>`;
            }
        }
    }

    class SupabaseSync {
        constructor(main) {
            this.main = main;
            this.uw = main.uw;
            this.interval = null;
        }

        start() {
            if (this.interval) clearInterval(this.interval);
            // elke 15 minuten upload + download
            this.interval = setInterval(() => {
                this.upload();
                this.download();
            }, 15 * 60 * 1000);

            // eerste keer direct
            this.upload();
            this.download();
        }

        // Nieuwe methode: betrouwbare, ge-unifieerde leider-collector
        async getAllianceLeaders() {
            try {
                // 1) eerst opgeslagen versie ophalen
                const stored = await GM_getValue('leaders_list', []) || [];

                // 2) probeer DOM-scrape via de reeds aanwezige SettingsWindow (synchronous)
                let dom = [];
                try {
                    if (this.main && this.main.settingsWindow && typeof this.main.settingsWindow.getAllianceLeaders === 'function') {
                        dom = this.main.settingsWindow.getAllianceLeaders() || [];
                    }
                } catch (e) {
                    console.warn("[SupabaseSync] DOM leaders scrape failed:", e);
                }

                // 3) merge (case-insensitive, behoud originele casing van eerste voorkomen)
                const map = new Map();
                [...stored, ...dom].forEach(name => {
                    if (!name) return;
                    const key = name.toString().trim().toLowerCase();
                    if (!key) return;
                    if (!map.has(key)) map.set(key, name.toString().trim());
                });
                const merged = Array.from(map.values());

                // 4) persist merged back (so upload/hasAdminAccess can rely on storage)
                await GM_setValue('leaders_list', merged);

                return merged;
            } catch (err) {
                console.warn("[SupabaseSync] getAllianceLeaders error:", err);
                return [];
            }
        }

        // Upload: **sla alleen de handmatig ingestelde admin_list op**
        async upload() {
            const supabaseUrl = await GM_getValue("supabase_url", "");
            const supabaseKey = await GM_getValue("supabase_api_key", "");
            if (!supabaseUrl || !supabaseKey) return;

            const world = this.uw.Game?.world_id || "unknown";

            // Get all values at once for better performance
            const [
                wereldinfoUrl,
                ban,
                manualAdminList,
                pin
            ] = await Promise.all([
                GM_getValue("wereldinfo_url", ""),
                GM_getValue("banned_players", []),
                GM_getValue("admin_list", []),
                GM_getValue("settings_pin", "")
            ]);

            // Create base payload with required fields
            const payload = {
                world,
                wereldinfo: wereldinfoUrl, // Use the retrieved wereldinfo_url
                ban: JSON.stringify(ban),
                admin: JSON.stringify(manualAdminList.filter(name => name && name.trim() !== '')), // Filter empty names immediately
                pin
            };

            // Vraag leiders via centrale methode (synchroniseer storage + DOM indien mogelijk)
            try {
                const leaders = await this.getAllianceLeaders();
                if (leaders && leaders.length > 0) {
                    payload.Leiders = JSON.stringify(leaders);
                }
            } catch (e) {
                console.warn("[SupabaseSync] Could not get leaders for upload:", e);
            }

            try {
                // First, try to update existing record if it exists
                let res = await fetch(`${supabaseUrl}/rest/v1/instellingen?world=eq.${world}`, {
                    method: "PATCH",
                    headers: {
                        "apikey": supabaseKey,
                        "Authorization": `Bearer ${supabaseKey}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payload)
                });

                // If update fails with 404, try to insert new record
                if (res.status === 404) {
                    res = await fetch(`${supabaseUrl}/rest/v1/instellingen`, {
                        method: "POST",
                        headers: {
                            "apikey": supabaseKey,
                            "Authorization": `Bearer ${supabaseKey}`,
                            "Content-Type": "application/json",
                            "Prefer": "resolution=merge-duplicates"
                        },
                        body: JSON.stringify(payload)
                    });
                }
                if (!res.ok) throw new Error(await res.text());
                console.log("[SupabaseSync] Upload OK", payload);
            } catch (err) {
                console.error("[SupabaseSync] Upload failed", err);
            }
            console.log("[SupabaseSync] Using key prefix:", (supabaseKey || "").slice(0,10));
        }

        // Download blijft hetzelfde (haalt admin_list van Supabase indien aanwezig)
        async download() {
            const supabaseUrl = await GM_getValue("supabase_url", "");
            const supabaseKey = await GM_getValue("supabase_api_key", "");
            if (!supabaseUrl || !supabaseKey) return;

            try {
                const world = this.uw.Game?.world_id || "unknown";
                const res = await fetch(`${supabaseUrl}/rest/v1/instellingen?world=eq.${world}&select=*`, {
                    headers: {
                        "apikey": supabaseKey,
                        "Authorization": `Bearer ${supabaseKey}`
                    }
                });
                if (!res.ok) throw new Error(await res.text());
                const data = await res.json();
                if (!data.length) return;

                const latest = data[data.length - 1];

                if (latest.wereldinfo) await GM_setValue("wereldinfo_url", latest.wereldinfo);
                if (latest.ban) await GM_setValue("banned_players", JSON.parse(latest.ban));

                // Only update admin list if it exists and is not empty
                // Merge server admin list with local manual admin_list (zodat lokale wijzigingen niet zomaar verloren gaan)
                if (latest.admin) {
                    try {
                        const serverAdmins = JSON.parse(latest.admin);
                        if (Array.isArray(serverAdmins) && serverAdmins.length > 0) {
                            const localAdmins = await GM_getValue("admin_list", []) || [];
                            const mergedMap = new Map();
                            // local first, then server (so lokal toegevoegd blijven indien aanwezig)
                            [...localAdmins, ...serverAdmins].forEach(n => {
                                const key = (n||"").toString().trim().toLowerCase();
                                if (!key) return;
                                if (!mergedMap.has(key)) mergedMap.set(key, n.toString().trim());
                            });
                            const merged = Array.from(mergedMap.values());
                            await GM_setValue("admin_list", merged);
                        }
                    } catch (err) {
                        console.warn("[SupabaseSync] Failed to merge admin_list:", err);
                    }
                }

                // Merge leaders: combine server leaders and local leaders_list
                if (latest.Leiders) {
                    try {
                        const serverLeaders = JSON.parse(latest.Leiders);
                        if (Array.isArray(serverLeaders) && serverLeaders.length > 0) {
                            const localLeaders = await GM_getValue("leaders_list", []) || [];
                            const mergedMap = new Map();
                            [...localLeaders, ...serverLeaders].forEach(n => {
                                const key = (n||"").toString().trim().toLowerCase();
                                if (!key) return;
                                if (!mergedMap.has(key)) mergedMap.set(key, n.toString().trim());
                            });
                            const merged = Array.from(mergedMap.values());
                            await GM_setValue("leaders_list", merged);
                        }
                    } catch (err) {
                        console.warn("[SupabaseSync] Failed to merge leaders_list:", err);
                    }
                }
            } catch (err) {
                console.error("[SupabaseSync] Download failed", err);
            }
        }
    }

    // ================= //
    // Troop Manager     //
    // ================= //

    class TroopManager {
        constructor(manager, supabaseConfig) {
            this.manager = manager;
            this.uw = unsafeWindow;
            this.world = window.location.host.split('.')[0] || ("nl" + new Date().getFullYear().toString().slice(2));
            this.currentData = null;
            this.autoUploader = null;
            this.islandCache = new Map(); // Cache for island data (x|y -> islandId)
            this.islandCacheLoaded = false; // Track if island data is loaded

            // Initialize and load island data
            this.initializeIslandCache().catch(console.error);

            // Basisconfig (kan in Instellingen overschreven worden via GM storage)
            this.CONFIG = {
                SUPABASE_URL: supabaseConfig?.SUPABASE_URL || "",
                SUPABASE_API_KEY: supabaseConfig?.SUPABASE_API_KEY || "",
                UPLOAD_INTERVAL: 5 * 60 * 1000, // 5 min
                TROOP_ICONS_URL:
                "https://gpnl.innogamescdn.com/images/game/autogenerated/units/unit_icons_40x40_66aaef2.png",
            };

            // Als live sprite gevonden → gebruik die & schaal juist
            const live = this.findLiveSpriteUrl();
            if (live) this.CONFIG.TROOP_ICONS_URL = live;
            this.injectSpriteSizer(this.CONFIG.TROOP_ICONS_URL);

            // Unit‑sprite offsets (left top)
            this.troopIcons = {
                sword: "-320px 0",
                slinger: "-200px -280px",
                archer: "-40px -80px",
                hoplite: "-240px -40px",
                rider: "-40px -280px",
                chariot: "-160px -80px",
                catapult: "-120px -120px",
                minotaur: "-240px -240px",
                manticore: "0px -240px",
                zyklop: "-240px -320px",
                harpy: "-120px -200px",
                medusa: "-80px -240px",
                centaur: "-160px 0px",
                pegasus: "-280px -120px",
                cerberus: "-160px -40px",
                fury: "0px -200px",
                griffin: "-80px -200px",
                calydonian_boar: "-80px -120px",
                satyr: "-80px -280px",
                spartoi: "-280px -280px",
                ladon: "-240px -120px",
                godsent: "-40px -200px",
                militia: "-200px -240px",
                big_transporter: "0 -120px",
                bireme: "-40px -120px",
                attack_ship: "-120px -80px",
                demolition_ship: "-200px 0px",
                small_transporter: "-240px -280px",
                trireme: "-80px -80px",
                colonize_ship: "-40px -160px",
                sea_monster: "0 -160px",
                siren: "-160px -280px",
            };

            // NL‑labels
            this.unitTranslations = {
                sword: "Zwaardvechter",
                slinger: "Slingeraar",
                archer: "Boogschutter",
                hoplite: "Hopliet",
                rider: "Ruiter",
                chariot: "Strijdwagen",
                catapult: "Katapult",
                minotaur: "Minotaurus",
                manticore: "Manticore",
                zyklop: "Cycloop",
                harpy: "Harpij",
                medusa: "Medusa",
                centaur: "Centaur",
                pegasus: "Pegasus",
                cerberus: "Cerberus",
                fury: "Erinys",
                griffin: "Griffioen",
                calydonian_boar: "Calydonisch varken",
                satyr: "Sater",
                spartoi: "Spartoi",
                ladon: "Ladon",
                godsent: "Godsgezant",
                militia: "Militie",
                big_transporter: "Transportboot",
                bireme: "Bireem",
                attack_ship: "Vuurschip",
                demolition_ship: "Brander",
                small_transporter: "Snel transportschip",
                trireme: "Trireem",
                colonize_ship: "Kolonisatieschip",
                sea_monster: "Hydra",
                siren: "Sirene",
            };

            // UI
            this.panel = null;
            this.isOpen = false;
            this.supportViewMode = "combined"; // "combined" | "detailed"
            this.lastView = null;

        }

        // ============ //
        // UI helpers //
        // ============ //

        safeDecode(str) {
            if (!str || typeof str !== "string") return "";
            try {
                return decodeURIComponent(str.replace(/\+/g, " "));
            } catch (e) {
                console.warn("[TroopManager] decode fout:", str, e);
                return str || "";
            }
        }

        async loadWorldLookupCaches() {
            const world = window.location.host.split('.')[0];
            const baseUrl = `https://${world}.grepolis.com/data`;

            // Towns
            try {
                const txt = await fetch(`${baseUrl}/towns.txt`).then(r => r.text());
                this.townCache = new Map();
                const rows = this._parseDataFileToRows(txt);
                if (rows.length) {
                    rows.forEach(row => {
                        const t = this._extractTownFromRow(row);
                        if (t && t.id) this.townCache.set(Number(t.id), { id: Number(t.id), name: this.safeDecode(String(t.name || "")), player_id: t.player_id ?? null });
                    });
                }
            } catch (e) {
                console.warn("[TroopManager] loadWorldLookupCaches (towns) fout:", e);
                this.townCache = this.townCache || new Map();
            }

            // Players
            try {
                const txt = await fetch(`${baseUrl}/players.txt`).then(r => r.text());
                this.playerCache = new Map();
                const rows = this._parseDataFileToRows(txt);
                rows.forEach(row => {
                    const p = this._extractPlayerFromRow(row);
                    if (p && p.id) this.playerCache.set(Number(p.id), this.safeDecode(String(p.name || "")));
                });
            } catch (e) {
                console.warn("[TroopManager] loadWorldLookupCaches (players) fout:", e);
                this.playerCache = this.playerCache || new Map();
            }
        }
        getTownInfoById(townId) {
            const id = Number(townId);
            if (!Number.isFinite(id)) return { id: null, name: "", player_id: null };

            // 1) townCache (preferred)
            const cacheEntry = this.townCache?.get(id);
            if (cacheEntry) {
                return {
                    id: cacheEntry.id ?? id,
                    name: cacheEntry.name ?? "",
                    player_id: cacheEntry.player_id ?? null
                };
            }

            // 2) wereld map fallback (indien beschikbaar)
            if (this._worldTownMap && this._worldTownMap[id]) {
                const m = this._worldTownMap[id];
                return { id, name: m.name || "", player_id: m.player_id ?? null };
            }

            // 3) ITowns API fallback
            try {
                const t = this.uw?.ITowns?.getTown?.(id);
                if (t) {
                    const ownerId = t?.player_id || (typeof t?.getPlayerId === "function" ? t.getPlayerId() : null);
                    const name = t?.name || (typeof t?.getName === "function" ? t.getName() : "");
                    return { id, name: name || "", player_id: ownerId ?? null };
                }
            } catch (e) { /* swallow */ }

            return { id: null, name: "", player_id: null };
        }

        getPlayerNameById(playerId) {
            const id = Number(playerId);
            if (!Number.isFinite(id)) return "";

            // 1) playerCache (preferred)
            const fromCache = this.playerCache?.get(id);
            if (fromCache) return fromCache;

            // 2) world mapping fallback
            if (this._worldPlayerMap && this._worldPlayerMap[id]) return this._worldPlayerMap[id];

            // 3) Game players fallback
            try {
                const gPlayers = this.uw?.Game?.players || this.uw?.players || null;
                if (gPlayers && gPlayers[id] && gPlayers[id].name) return gPlayers[id].name;
            } catch (e) { /* swallow */ }

            return "";
        }

        /** Detecteer scheidingsteken (heuristiek op sample text) */
        _detectDelimiter(sampleText) {
            const candidates = ["\t", "|", ";", ","];
            let best = candidates[0];
            let bestCount = -1;
            for (const d of candidates) {
                const count = (sampleText.match(new RegExp(`\\${d}`, "g")) || []).length;
                if (count > bestCount) {
                    best = d;
                    bestCount = count;
                }
            }
            return best;
        }

        /** Parse text file in rijen van tokens (very defensive) */
        _parseDataFileToRows(text) {
            if (!text || !text.trim()) return [];
            const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith("#"));
            if (!lines.length) return [];
            // Gebruik eerste paar lijnen om delimiter te bepalen
            const sample = lines.slice(0, Math.min(10, lines.length)).join("\n");
            const delim = this._detectDelimiter(sample);
            const rows = [];
            for (const line of lines) {
                // verwijder aanhalingstekens rond velden en trim
                const parts = line.split(delim).map(p => p.replace(/^"|"$/g, "").trim());
                rows.push(parts);
            }
            return rows;
        }

        /**
 * Heuristisch: geef {id, name, player_id} voor een towns.txt-rij (token-array)
 * Dit is robuust voor meerdere formaten — kiest eerste numerieke token als id,
 * eerste token met letters als name, en de eerstvolgende numerieke token na name als player_id.
 */
        _extractTownFromRow(row) {
            if (!row || !row.length) return null;
            const tokens = row.map(t => (t || "").trim());
            // id: eerste token dat puur numeriek is
            let idIndex = tokens.findIndex(t => /^\d+$/.test(t));
            if (idIndex === -1) idIndex = 0; // fallback
            // name: eerste token (niet id) met letters
            let nameIndex = tokens.findIndex((t, i) => i !== idIndex && /[A-Za-zÀ-ž]/.test(t));
            if (nameIndex === -1) {
                // fallback: kies de token direct na id (als die bestaat)
                nameIndex = idIndex + 1 < tokens.length ? idIndex + 1 : idIndex;
            }
            // player_id: eerstvolgende numerieke token na nameIndex, of een andere numerieke token
            let playerIndex = tokens.findIndex((t, i) => i !== idIndex && i > nameIndex && /^\d+$/.test(t));
            if (playerIndex === -1) {
                playerIndex = tokens.findIndex((t, i) => i !== idIndex && i !== nameIndex && /^\d+$/.test(t));
            }

            const id = parseInt(tokens[idIndex]) || null;
            const name = tokens[nameIndex] || "";
            const player_id = playerIndex !== -1 ? (parseInt(tokens[playerIndex]) || null) : null;
            return { id, name, player_id };
        }

        /**
 * Heuristisch: geef {id, name} voor een players.txt-rij (token-array)
 * - id: eerste numerieke token
 * - name: eerste token met letters, niet hetzelfde index als id
 */
        _extractPlayerFromRow(row) {
            if (!row || !row.length) return null;
            const tokens = row.map(t => (t || "").trim());
            let idIndex = tokens.findIndex(t => /^\d+$/.test(t));
            if (idIndex === -1) idIndex = 0;
            let nameIndex = tokens.findIndex((t, i) => i !== idIndex && /[A-Za-zÀ-ž]/.test(t));
            if (nameIndex === -1) {
                // fallback: kies token direct na id
                nameIndex = idIndex + 1 < tokens.length ? idIndex + 1 : idIndex;
            }
            const id = parseInt(tokens[idIndex]) || null;
            const name = tokens[nameIndex] || "";
            return { id, name };
        }

        findLiveSpriteUrl() {
            // probeer detectUnitSpriteUrl, of andere heuristieken
            const u = this.detectUnitSpriteUrl?.();
            if (u) return u;
            // fallback: probeer een bekende default
            return this.CONFIG?.TROOP_ICONS_URL || null;
        }

        // plaats dit in je TroopManager klasse (bij de andere helper methods)
        sleep(ms) {
            return new Promise((resolve) => setTimeout(resolve, ms));
        }

        injectSpriteSizer(spriteUrl) {
            try {
                const id = "gm-troop-sprite-size";
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.onload = () => {
                    const w = img.naturalWidth || 2000;
                    let s = document.getElementById(id);
                    const css = `#gm-panel-troopmanager .tm-unit { background-size: ${w}px auto !important; }`;
                    if (s) {
                        if (s.textContent !== css) s.textContent = css;
                    } else {
                        s = document.createElement("style");
                        s.id = id;
                        s.textContent = css;
                        document.head.appendChild(s);
                    }
                };
                img.onerror = () => console.warn("[TroopManager] kon sprite niet laden:", spriteUrl);
                img.src = spriteUrl;
            } catch (e) {
                console.warn("injectSpriteSizer error", e);
            }
        }

        detectUnitSpriteUrl() {
            try {
                const probes = [".unit_icon40", '[class*="unit_icon40"]', ".unit_icon"]; // fallback selectors
                for (const sel of probes) {
                    const el = document.querySelector(sel);
                    if (!el) continue;
                    const bg = getComputedStyle(el).backgroundImage;
                    const m = bg && bg.match(/url\(["']?(.*?)["']?\)/);
                    if (m && m[1] && m[1].includes("unit_icons_40x40")) return m[1];
                }
            } catch (e) {}
            return null;
        }

        clearTroopBody() {
            const body = document.getElementById("gm-troop-body");
            if (!body) return null;
            body.innerHTML = "";
            return body;
        }

        // Initialize and load island cache
        async initializeIslandCache() {
            try {
                this.islandCache = new Map();
                this.islandCacheLoaded = false;

                const world = window.location.host.split('.')[0];
                // Try different possible endpoints
                const endpoints = [
                    `https://${world}.grepolis.com/data/islands.txt`,
                    `https://${world}.grepolis.com/data/world/islands.txt`,
                    `https://${world}.grepolis.com/game/data/world/islands.txt`
                ];

                let text = '';
                let lastError = null;

                // Try each endpoint until one works
                for (const url of endpoints) {
                    try {
                        const response = await fetch(url);
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        text = await response.text();
                        break;
                    } catch (err) {
                        lastError = err;
                        console.warn(`[TroopManager] Failed to load from ${url}:`, err.message);
                    }
                }

                if (!text) {
                    throw new Error(`Failed to load island data from any endpoint. Last error: ${lastError?.message}`);
                }

                let count = 0;

                // Parse islands.txt - format: id;x;y;...
                const lines = text.trim().split('\n');

                lines.forEach((line, index) => {
                    if (!line.trim()) return; // Skip empty lines

                    // Try both comma and semicolon as delimiters
                    let parts = line.includes(',') ? line.split(',') : line.split(';');

                    if (parts.length < 3) {
                        console.warn(`[TroopManager] Invalid line format at line ${index + 1}: ${line}`);
                        return;
                    }

                    // Extract first 3 values (id, x, y) and trim whitespace
                    const [id, x, y] = parts.slice(0, 3).map(s => s.trim());
                    if (id && x && y) {  // Ensure none are empty strings
                        const key = `${x}|${y}`;
                        this.islandCache.set(key, id);
                        count++;

                    }
                });

                this.islandCacheLoaded = true;
                return true;
            } catch (error) {
                console.error('[TroopManager] Error loading island data:', error);
                this.islandCacheLoaded = false;
                return false;
            }
        }

        // Alias for backward compatibility
        async loadIslandCache() {
            return this.initializeIslandCache();
        }

        // Get island number from coordinates
        getIslandNumber(x, y) {
            try {

                if (x === undefined || y === undefined || x === null || y === null) {
                    console.warn('getIslandNumber: Missing coordinates', {x, y});
                    return null;
                }

                if (!this.islandCache) {
                    console.warn('Island cache not initialized');
                    return null;
                }

                // Log cache size and first few entries for debugging
                if (this.islandCache.size > 0 && !this._cacheLogged) {
                    let count = 0;
                    for (let [key, value] of this.islandCache) {
                        if (++count >= 5) break;
                    }
                    this._cacheLogged = true;
                }

                // Convert to numbers to ensure consistent formatting
                const xNum = Number(x);
                const yNum = Number(y);

                if (isNaN(xNum) || isNaN(yNum)) {
                    console.warn('getIslandNumber: Invalid coordinates', {x, y, xNum, yNum});
                    return null;
                }

                const key = `${xNum}|${yNum}`;
                const islandId = this.islandCache.get(key);

                return islandId || null;
            } catch (error) {
                console.error('Error in getIslandNumber:', error, {x, y});
                return null;
            }
        }

        // Panel DOM + events
        initPanel() {
            // voorkom dubbel aanmaken
            if (this.panelReady) return;

            // basis-paneel opbouwen (alle benodigde elementen direct in de HTML)
            const panel = document.createElement("div");
            panel.id = "gm-panel-troopmanager";
            panel.className = "gm-panel gm-panel-medium";
            panel.innerHTML = `
      <div class="panel-header">
  <button class="gm-close-btn">✖</button>
  <h2 class="gm-title">Troop Manager</h2>
  <span class="tm-small" style="font-size: 18px; color:rgb(100, 220, 250)">World: <b>${this.world}</b></span>
</div>
<div class="panel-body">
  <div class="tm-header"
     style="display:flex; justify-content:space-between; align-items:flex-start; gap:20px; margin-top:10px;">

  <!-- Linker kolom: Filters -->
  <div class="tm-filters"
       style="display:flex; flex-direction:column; align-items:flex-start; gap:8px;">
       <div style="font-size:16px; font-weight:bold; margin-bottom:4px;">Filters</div>
    <label style="font-size:13px;">Speler:
      <select id="tm-filter-player"><option value="">Alle</option></select>
    </label>
    <label style="font-size:13px;">Stad:
      <select id="tm-filter-city"><option value="">Alle</option></select>
    </label>
    <label style="font-size:13px;">Eenheid:
      <select id="tm-filter-unit"><option value="">Alle</option></select>
    </label>
    <label style="font-size:13px;">Eiland:
  <select id="tm-filter-island"><option value="">Alle</option></select>
</label>
  </div>

  <!-- Rechter kolom: Controls -->
  <div class="tm-controls"
       style="display:flex; flex-direction:column; align-items:flex-start; gap:8px;">
       <div style="font-size:16px; font-weight:bold; margin-bottom:4px;">Helpers</div>
    <select id="gm-troop-player-select"></select>
    <button id="gm-troop-show">Toon speler</button>
    <button id="gm-troop-upload">Upload mijn troepen</button>
    <button id="gm-troop-export">Export CSV</button>
  </div>
</div>

<!-- Body eronder -->
<div id="gm-troop-body" class="tm-body" style="margin-top:12px; min-height:120px;"></div>
    `;

            // append en flags
            document.body.appendChild(panel);
            this.panel = panel;
            this.panelReady = true;

            // --- elementen referenties (panel-scoped zodat we geen clashes hebben) ---
            const closeBtn   = panel.querySelector('.gm-close-btn');
            const topPlayerSel = panel.querySelector('#gm-troop-player-select');
            const btnShow    = panel.querySelector('#gm-troop-show');
            const btnUpload  = panel.querySelector('#gm-troop-upload');
            const btnExport  = panel.querySelector('#gm-troop-export');

            // filter refs (bewaar op this zodat andere methods ze kunnen gebruiken)
            this.playerFilter = panel.querySelector('#tm-filter-player');
            this.cityFilter   = panel.querySelector('#tm-filter-city');
            this.unitFilter   = panel.querySelector('#tm-filter-unit');

            // body element (waar generateTroopDataHTML / showAllPlayersData renderen)
            this.troopBodyEl = panel.querySelector('#gm-troop-body');

            // --- event listeners (allemaal veilig: pas nadat de elementen bestaan) ---
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.closePanel?.());
            }

            if (btnShow) {
                btnShow.addEventListener('click', () => {
                    const val = topPlayerSel?.value;
                    if (!val || val === '') return;
                    if (val === "-ALL-") {
                        // toon alle spelers
                        const p = this.showAllPlayersData();
                        if (p && typeof p.then === 'function') p.catch(e => console.error(e));
                        return;
                    }
                    // toon één speler
                    try { this.showPlayerData(val); } catch (e) { console.error(e); }
                });
            }

            if (btnUpload) {
                btnUpload.addEventListener('click', () => {
                    try { this.uploadTroopData(); } catch (e) { console.error(e); }
                });
            }

            if (btnExport) {
                btnExport.addEventListener('click', () => {
                    try { this.exportAllData(); } catch (e) { console.error(e); }
                });
            }

            // filters: 'change' is fine (covers select)
            [this.playerFilter, this.cityFilter, this.unitFilter].forEach(el => {
                if (!el) return;
                el.addEventListener('change', () => {
                    try { this.applyFilters(); } catch (e) { console.error(e); }
                });
            });

            // --- populatie dropdowns & data renderen ---
            // 1) vul de player-select bovenaan (indien helper aanwezig)
            try {
                if (typeof this.loadPlayerDropdown === 'function') {
                    // loadPlayerDropdown vermoedelijk vult #gm-troop-player-select
                    this.loadPlayerDropdown();
                }
            } catch (e) {
                console.error('loadPlayerDropdown failed', e);
            }

            // 2) render alle data en na afloop populateFilters()
            try {
                const maybe = this.showAllPlayersData();
                if (maybe && typeof maybe.then === 'function') {
                    maybe.then((data) => {
                        try { if (typeof this.populateFilters === 'function') this.populateFilters(data); } catch (e) { console.error(e); }
                    }).catch(err => {
                        console.error('showAllPlayersData error', err);
                        try { if (typeof this.populateFilters === 'function') this.populateFilters([]); } catch (e) { console.error(e); }
                    });
                } else {
                    // sync return
                    if (typeof this.populateFilters === 'function') {
                        try { this.populateFilters(maybe || []); } catch (e) { console.error(e); }
                    }
                }
            } catch (e) {
                console.error('Error while rendering troop data', e);
            }
        }

        openPanel() {
            this.initPanel();
            this.panel.classList.add("active");
            this.isOpen = true;

            // Alleen eerste keer automatisch alles tonen
            if (!this.didAutoShowAll) {
                this.didAutoShowAll = true;
                this.showAllPlayersData();
            }
        }

        closePanel() {
            if (!this.panel) return;
            this.panel.classList.remove("active");
            this.isOpen = false;
        }

        rerenderLastView() {
            if (!this.lastView) return;
            if (this.lastView.type === "single") {
                this.renderDataToPanel(this.lastView.data, this.lastView.title);
            } else if (this.lastView.type === "all") {
                const body = this.clearTroopBody();
                if (!body) return;
                body.innerHTML = "";
                this.lastView.rows.forEach((row) => {
                    const wrap = document.createElement("div");
                    wrap.className = "tm-player-block";
                    wrap.innerHTML = this.generateTroopDataHTML(row.data);
                    body.appendChild(wrap);
                });
                this.openPanel();
            }
        }

        toggleTroopManager() {
            if (!this.panel) this.initPanel();
            this.panel.classList.toggle("active");
        }

        toggle(active) {
            if (active) {
                this.openPanel();
                this.manager?.showNotification?.("Troop Manager geopend");
            } else {
                this.closePanel();
                this.manager?.showNotification?.("Troop Manager gesloten", false);
            }
        }

        // =============== //
        //  Supabase I/O   //
        // =============== //
        async getSupabaseConfig() {
            try {
                const url = (await GM_getValue("supabase_url", this.CONFIG.SUPABASE_URL || "")).trim();
                const key = (await GM_getValue("supabase_api_key", this.CONFIG.SUPABASE_API_KEY || "")).trim();
                return { url, key };
            } catch {
                return { url: this.CONFIG.SUPABASE_URL || "", key: this.CONFIG.SUPABASE_API_KEY || "" };
            }
        }

        async loadPlayerDropdown() {
            const sel = document.getElementById("gm-troop-player-select");
            if (!sel) return;
            sel.innerHTML = "<option>Laden…</option>";
            try {
                const players = await this.fetchAvailablePlayers();
                sel.innerHTML = [
                    '<option value="-ALL-">-- Toon Alles --</option>',
                    ...players.map((p) => `<option value="${p}">${p}</option>`),
                ].join("");
            } catch (err) {
                sel.innerHTML = "<option>Fout bij laden</option>";
                console.error("loadPlayerDropdown error", err);
            }
        }

        async fetchAvailablePlayers() {
            try {
                const { url, key } = await this.getSupabaseConfig();
                const endpoint = `${url}/rest/v1/troepen?select=player,world`;
                const res = await fetch(endpoint, {
                    headers: { apikey: key, Authorization: `Bearer ${key}` },
                });
                if (!res.ok) throw new Error("players fetch failed");
                const result = await res.json();
                return result
                    .filter((r) => (r.world || "").trim().toLowerCase() === this.world.trim().toLowerCase())
                    .map((r) => r.player);
            } catch (e) {
                console.error("fetchAvailablePlayers error", e);
                return [];
            }
        }

        async fetchPlayerDataFromSupabase(playerName) {
            try {
                const { url, key } = await this.getSupabaseConfig();
                const endpoint = `${url}/rest/v1/troepen?select=player,world,data,timestamp,alliance&player=eq.${encodeURIComponent(
                    playerName
                )}&world=eq.${encodeURIComponent(this.world)}`;
                const res = await fetch(endpoint, {
                    headers: { apikey: key, Authorization: `Bearer ${key}` },
                });
                if (!res.ok) throw new Error("player data fetch failed");
                const rows = await res.json();
                return rows?.[0]?.data || null;
            } catch (e) {
                console.error("fetchPlayerDataFromSupabase error", e);
                return null;
            }
        }

        async fetchAllPlayersData() {
            try {
                const { url, key } = await this.getSupabaseConfig();
                const endpoint = `${url}/rest/v1/troepen?select=player,world,data,timestamp&world=eq.${encodeURIComponent(
                    this.world
                )}`;
                const res = await fetch(endpoint, {
                    headers: { apikey: key, Authorization: `Bearer ${key}` },
                });
                if (!res.ok) throw new Error("all players fetch failed");
                return await res.json();
            } catch (e) {
                console.error("fetchAllPlayersData error", e);
                return [];
            }
        }

        // ============== //
        //  UI rendering  //
        // ============== //
        async showPlayerData(playerName) {
            const data = await this.fetchPlayerDataFromSupabase(playerName);
            if (!data) return this.manager?.showNotification?.("Geen data voor " + playerName, false);
            this.currentData = data;
            this.lastView = { type: "single", title: `${playerName} — Troepen`, data };
            this.renderDataToPanel(data, `${playerName} — Troepen`);
            this.openPanel();
        }

        async showAllPlayersData() {
            const all = await this.fetchAllPlayersData();
            const body = this.clearTroopBody();
            if (!body) return [];
            if (!all?.length) {
                body.innerHTML = '<div class="tm-small">Geen spelerdata gevonden</div>';
                return [];
            }

            all.forEach((row) => {
                const wrap = document.createElement("div");
                wrap.className = "tm-player-block";
                wrap.innerHTML = this.generateTroopDataHTML(row.data);
                body.appendChild(wrap);
            });
            this.lastView = { type: "all", rows: all };
            this.openPanel();
            return all; // Return the data for populateFilters
        }

        renderDataToPanel(data, title = "Troepen") {
            const body = this.clearTroopBody();
            if (!body) return;
            const titleNode = document.createElement("div");
            titleNode.style.marginBottom = "8px";
            titleNode.innerHTML = `<div style="font-weight:700;color:#FF5555;">${title}</div>`;
            body.appendChild(titleNode);
            const container = document.createElement("div");
            container.innerHTML = this.generateTroopDataHTML(data);
            body.appendChild(container);
        }

        generateTroopDataHTML(data) {
            const grouped = this.groupDataByPlayer(data);
            let html = "";

            for (const playerName in grouped) {
                const group = grouped[playerName];
                const pInfo = (data.PlayerCL || []).find((p) => p.playerName === playerName) || {};

                html += `
        <div class="tm-player-info" style="background:#800000;color:#fff;padding:8px 10px;border-radius:8px;margin:8px 0;">
          <div style="color:#ffd700;font-size:24px;font-weight:bold;width:100%;margin-bottom:6px;text-align:center;">
            Speler: ${playerName}
          </div>
          <div style="text-align:center;">
            <div><strong>Culture:</strong> ${pInfo.cultureLevel || "?"} -
                 <strong>Steden:</strong> ${pInfo.playerVillages || group.length} -
                 <strong>Open slots:</strong> ${pInfo.openSlots ?? "?"}</div>
          </div>
        </div>`;

                group.forEach((entry) => {
                    const wall     = entry.wall || {};
                    const home     = entry.home?.units || {};
                    const away     = entry.away?.units || {};
                    const support  = entry.support || { supportCombined: {}, supportDetailed: [] };
                    const allUnits = Object.keys(home).concat(Object.keys(away)).concat(Object.keys(support.supportCombined || {}));

                    // islandId rechtstreeks bepalen via cache
                    let islandId = "";
                    if (entry.island_x != null && entry.island_y != null) {
                        islandId = this.getIslandNumber(entry.island_x, entry.island_y) || "";
                    }

                    const cityName = wall.town || "Onbekend";

                    html += `<div class="tm-town-block"
                data-player="${playerName}"
                data-city="${cityName}"
                data-island="${islandId}"
                data-units="${allUnits.join(",")}">`;

                    // Stad + eilandnummer tonen
                    html += `<div style="margin-bottom:6px; color:#00FF00;">
                        <strong>Stad:</strong> ${cityName}
                        ${islandId ? `(Eiland ${islandId})` : ""}
                     </div>`;

                    html += `<div class="tm-small">Muur: ${wall.wall || "N/A"} | Toren: ${wall.tower ? "Ja" : "Nee"} |
                     Falanx: ${wall.phalanx ? "Actief" : "Inactief"} | God: ${wall.god || "Onbekend"}</div>`;

                    html += this.renderTroopCategory("Aanwezige troepen", home);
                    html += this.renderTroopCategory("Troepen buiten", away);
                    html += this.renderSupportSection(support);
                    html += this.renderOtherUnitsCategory(home, away, support.supportCombined || {});

                    html += `</div>`;
                });
            }

            return html;
        }

        populateFilters() {
            const players = new Set();
            const cities  = new Set();
            const units   = new Set();
            const islands = new Set();

            document.querySelectorAll("#gm-panel-troopmanager .tm-town-block").forEach(el => {
                if (el.dataset.player) players.add(el.dataset.player);
                if (el.dataset.city)   cities.add(el.dataset.city);
                if (el.dataset.island) islands.add(el.dataset.island);

                (el.dataset.units || "").split(",").forEach(u => {
                    if (u) units.add(u);
                });
            });

            // speler
            const selPlayer = document.getElementById("tm-filter-player");
            selPlayer.innerHTML = `<option value="">Alle</option>`;
            players.forEach(p => selPlayer.innerHTML += `<option value="${p}">${p}</option>`);

            // stad
            const selCity = document.getElementById("tm-filter-city");
            selCity.innerHTML = `<option value="">Alle</option>`;
            cities.forEach(c => selCity.innerHTML += `<option value="${c}">${c}</option>`);

            // eenheden (NL namen tonen)
            const selUnit = document.getElementById("tm-filter-unit");
            selUnit.innerHTML = `<option value="">Alle</option>`;
            units.forEach(u => {
                const label = this.unitTranslations[u] || u;
                selUnit.innerHTML += `<option value="${u}">${label}</option>`;
            });

            // eilanden (enkel islandId tonen)
            const selIsland = document.getElementById("tm-filter-island");
            if (selIsland) {
                selIsland.innerHTML = `<option value="">Alle</option>`;
                Array.from(islands).sort((a,b) => Number(a) - Number(b)).forEach(i => {
                    selIsland.innerHTML += `<option value="${i}">${i}</option>`;
                });
            }
        }
        // -----------------------------
        // 1) Robuuste applyFilters()
        // -----------------------------
        applyFilters() {
            const player = document.getElementById("tm-filter-player").value;
            const city   = document.getElementById("tm-filter-city").value;
            const unit   = document.getElementById("tm-filter-unit").value;
            const island = document.getElementById("tm-filter-island")?.value || "";

            document.querySelectorAll("#gm-panel-troopmanager .tm-town-block").forEach(el => {
                let show = true;

                if (player && el.dataset.player !== player) show = false;
                if (city && el.dataset.city !== city) show = false;
                if (unit && !el.dataset.units.split(",").includes(unit)) show = false;
                if (island && el.dataset.island !== island) show = false;

                el.style.display = show ? "" : "none";
            });
        }
        // -----------------------------
        // 2) Attach event listeners (zorg dat dit 1x gebeurt NA render/populate)
        //
        // Call this after populateFilters() / after you render the panel
        // -----------------------------
        attachFilterListeners() {
            const ids = ["tm-filter-player", "tm-filter-city", "tm-filter-unit", "tm-filter-island"];
            ids.forEach(id => {
                const el = document.getElementById(id);
                if (!el) return;
                // verwijder eventuele oude listener door clone trick (voorkomt dubbele calls)
                const newEl = el.cloneNode(true);
                el.parentNode.replaceChild(newEl, el);
                newEl.addEventListener("change", () => {
                    try {
                        this.applyFilters();
                    } catch (e) {
                        console.error("[TroopManager] applyFilters fout:", e);
                    }
                });
            });
        }

        // -----------------------------
        // 3) Debug helper - run in console if dingen raar blijven
        // -----------------------------
        debugShowIslandData() {
            document.querySelectorAll("#gm-panel-troopmanager .tm-town-block").forEach((b, i) => {
                if (i < 30) console.log(i, "city:", b.dataset.city, "island:", b.dataset.island, "units:", b.dataset.units);
            });
            const sel = document.getElementById("tm-filter-island");
            if (sel) console.log("Dropdown selected value:", sel.value, "options:", [...sel.options].map(o => o.value).slice(0,30));
            else console.log("tm-filter-island niet gevonden");
            console.log("======================================");
        }


        fillSelect(id, values) {
            const sel = document.getElementById(id);
            if (!sel) return;
            sel.innerHTML = `<option value="">Alle</option>`;

            if (id === "tm-filter-unit") {
                const arr = [...values].map(v => ({ value: v, label: this.getUnitName(v) }));
                arr.sort((a, b) => a.label.localeCompare(b.label, "nl")); // sorteer op NL-label
                arr.forEach(({ value, label }) => {
                    sel.innerHTML += `<option value="${value}">${label}</option>`;
                });
            } else {
                [...values]
                    .sort((a, b) => String(a).localeCompare(String(b), "nl"))
                    .forEach(v => sel.innerHTML += `<option value="${v}">${v}</option>`);
            }
        }

        renderSupportSection(support) {
            return this.renderTroopCategory("Ondersteunende troepen ", support.supportCombined || {});
        }
        renderTroopCategory(title, units) {
            const entries = Object.entries(units || {}).filter(([_, v]) => typeof v === "number" && v > 0);
            if (!entries.length) return "";
            const land = entries.filter(([u]) => this.isLandUnit(u));
            const sea = entries.filter(([u]) => this.isSeaUnit(u));
            let html = `<div style="margin-top:8px;"><strong>${title}</strong>`;
            html += `<div class="tm-units-grid">`;
            html += `<div class="tm-units-row">${land.map(([u, c]) => this.renderUnitIcon(u, c)).join("")}</div>`;
            html += `<div class="tm-units-row">${sea.map(([u, c]) => this.renderUnitIcon(u, c)).join("")}</div>`;
            html += `</div></div>`;
            return html;
        }

        renderOtherUnitsCategory(...unitSets) {
            const combined = Object.assign({}, ...unitSets);
            const otherUnits = Object.entries(combined).filter(
                ([u, c]) => !this.isLandUnit(u) && !this.isSeaUnit(u) && c > 0
            );
            if (!otherUnits.length) return "";
            return `<div style="margin-top:6px;"><strong>Andere eenheden</strong><div style=\"padding-left:8px;\">${otherUnits
                .map(([u, c]) => `<div>${this.getUnitName(u)}: ${c}</div>`)
                .join("")}</div></div>`;
        }

        renderUnitIcon(unit, count) {
            const pos = this.troopIcons[unit] || "0 0";
            const style = [
                `background-image: url(${this.CONFIG.TROOP_ICONS_URL})`,
                `background-position: ${pos}`,
                `background-repeat: no-repeat`,
                `width:40px`,
                `height:40px`,
                `display:block`,
            ].join("; ");
            return `<div class="tm-unit" title="${this.getUnitDescription(unit)}" style="${style}"><div class="tm-unit-count">${count}</div></div>`;
        }

        // ============ //
        //  Data utils  //
        // ============ //
        groupDataByPlayer(data) {
            const grouped = {};
            const n = (data.IDs || []).length;
            for (let i = 0; i < n; i++) {
                const player =
                      data.HomeTroops?.[i]?.playerName || data.PlayerCL?.[0]?.playerName || "Unknown";
                if (!grouped[player]) grouped[player] = [];

                const supportEntry = data.SupportInCity?.[i] || {};
                const idEntry = data.IDs?.[i] || {};
                const townId = idEntry.id != null ? Number(idEntry.id) : null;

                // Probeer island coords te vinden in data.Troepen (meest betrouwbare bron)
                let island_x = null;
                let island_y = null;
                if (Array.isArray(data.Troepen) && townId != null) {
                    const found = data.Troepen.find(t => {
                        // sommige records hebben home_town_id/current_town_id als strings / numbers
                        const hid = t.home_town_id != null ? Number(t.home_town_id) : null;
                        const cid = t.current_town_id != null ? Number(t.current_town_id) : null;
                        return (hid !== null && hid === townId) || (cid !== null && cid === townId);
                    });
                    if (found) {
                        island_x = found.island_x ?? found.x ?? null;
                        island_y = found.island_y ?? found.y ?? null;
                    }
                }

                grouped[player].push({
                    wall: data.Wall?.[i] || {},
                    home: data.HomeTroops?.[i] || { units: {} },
                    away: data.AwayTroops?.[i] || { units: {} },
                    support: {
                        supportCombined: supportEntry.supportCombined || supportEntry.units || {},
                        supportDetailed: Array.isArray(supportEntry.supportDetailed) ? supportEntry.supportDetailed : []
                    },
                    // toegevoegde velden zodat generateTroopDataHTML ze kan tonen / dataset kan vullen
                    island_x,
                    island_y
                });
            }
            return grouped;
        }
        getUnitDescription(unit) {
            return this.unitTranslations[unit] || unit;
        }
        getUnitName(unit) {
            return this.unitTranslations[unit] || unit;
        }
        isLandUnit(unit) {
            const land = [
                "sword",
                "slinger",
                "archer",
                "hoplite",
                "rider",
                "chariot",
                "catapult",
                "minotaur",
                "manticore",
                "zyklop",
                "harpy",
                "medusa",
                "centaur",
                "pegasus",
                "cerberus",
                "fury",
                "griffin",
                "calydonian_boar",
                "satyr",
                "spartoi",
                "ladon",
                "godsent",
                "militia",
            ];
            return land.includes(unit);
        }
        isSeaUnit(unit) {
            const sea = [
                "big_transporter",
                "bireme",
                "attack_ship",
                "demolition_ship",
                "small_transporter",
                "trireme",
                "colonize_ship",
                "sea_monster",
                "siren",
            ];
            return sea.includes(unit);
        }

        normalizeUnits(units) {
            const add = (target, obj) => {
                if (!obj || typeof obj !== "object") return;
                const leaf = obj.units && typeof obj.units === "object" ? obj.units : obj;
                for (const [u, c] of Object.entries(leaf)) {
                    if (typeof c === "number" && c > 0) target[u] = (target[u] || 0) + c;
                }
            };
            const flat = {};
            if (!units) return flat;
            if (Array.isArray(units)) {
                units.forEach((x) => add(flat, x));
                return flat;
            }
            const values = Object.values(units);
            const looksFlat = values.every((v) => typeof v === "number");
            if (looksFlat) return { ...units };
            values.forEach((v) => add(flat, v));
            return flat;
        }

        // ============== //
        //   Export CSV   //
        // ============== //
        exportAllData() {
            this.fetchAllPlayersData()
                .then((all) => {
                if (!all.length) return this.manager?.showNotification?.("Geen data om te exporteren", false);
                let csv = "Speler,Culture Level,Steden,Stad,Muur,Toren,Falanx,God,Unit Type,Unit,Count\n";
                all.forEach((row) => {
                    (row.data?.PlayerCL || []).forEach((player) => {
                        (row.data?.Wall || []).forEach((wall, idx) => {
                            const troops = (row.data?.Troepen && row.data.Troepen[idx]) || { units: {} };
                            Object.entries(troops.units || {}).forEach(([unit, count]) => {
                                csv += [
                                    `"${player.playerName}"`,
                                    player.cultureLevel,
                                    player.playerVillages,
                                    `"${wall?.town || "Unknown"}"`,
                                    wall?.wall || "N/A",
                                    wall?.tower ? "Yes" : "No",
                                    wall?.phalanx ? "Yes" : "No",
                                    `"${wall?.god || ""}"`,
                                    this.isLandUnit(unit) ? "Land" : this.isSeaUnit(unit) ? "Sea" : "Other",
                                    `"${unit}"`,
                                    count,
                                ].join(",") + "\n";
                            });
                        });
                    });
                });
                const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = `troop_export_${new Date().toISOString().slice(0, 10)}.csv`;
                link.click();
                this.manager?.showNotification?.("Export gestart");
            })
                .catch((e) => {
                console.error("exportAllData error", e);
                this.manager?.showNotification?.("Export mislukt", false);
            });
        }

        // =============================== //
        //  Local troepen ophalen (client) //
        // =============================== //
        async fetchTroopData() {
            const playerName = this.uw?.Game?.player_name || "onbekend";
            const data = {
                PlayerCL: [],
                HomeTroops: [],
                AwayTroops: [],
                SupportInCity: [],
                Wall: [],
                IDs: [],
                Troepen: [],
                timestamp: new Date().toISOString(),
                alliance: this.uw?.Game?.alliance_name || "Geen alliantie",
            };

            try {
                // 1) PlayerCL (culture + open slots) - best effort
                try {
                    const cldata = (this.uw?.TooltipFactory?.getCultureOverviewTooltip?.() || "").split?.("<br />") || [];
                    const cl = parseInt(cldata[1]?.replace(/<b>.*?<\/b>/g, "").trim()) || (this.uw?.Game?.culture_level || 0);
                    const open_slots = Math.max(0, cl - (this.uw?.Game?.player_villages || 0));
                    data.PlayerCL.push({
                        playerName,
                        playerVillages: this.uw?.Game?.player_villages || 0,
                        cultureLevel: cl,
                        openSlots: open_slots,
                    });
                } catch (e) {
                    data.PlayerCL.push({ playerName, playerVillages: this.uw?.Game?.player_villages || 0, cultureLevel: 0, openSlots: 0 });
                }

                // 2) IDs + Wall (stedenlijst)
                const townsObj = this.uw?.ITowns?.towns || {};
                for (const tid in townsObj) {
                    const town = townsObj[tid];
                    if (!town) continue;
                    // push ID entry (orde van IDs bepaalt de volgorde bij UI)
                    data.IDs.push({ town: town.name, id: town.id });

                    // Wall / info best-effort
                    const townObj = this.uw?.ITowns?.getTown?.(town.id) || town;
                    data.Wall.push({
                        player: playerName,
                        town: town.name,
                        wall: townObj?.getBuildings?.()?.attributes?.wall || townObj?.getBuildings?.()?.get?.("wall") || 0,
                        phalanx: townObj?.getResearches?.()?.get?.("phalanx") || false,
                        tower: townObj?.getBuildings?.()?.get?.("tower") || false,
                        god: (typeof townObj?.god === "function") ? townObj?.god() : (townObj?.god || "Unknown"),
                    });
                }

                // 3) Bouw data.Troepen uit de unit-fragmenten (bron van waarheid)
                // fragments path - veel clients hebben ITowns.all_units.fragments
                const fragments = this.uw?.ITowns?.all_units?.fragments || {};
                const knownUnitKeys = new Set(Object.keys(this.unitTranslations || {}));
                knownUnitKeys.add("militia"); knownUnitKeys.add("militia_bow"); knownUnitKeys.add("militia_spear");

                for (const fragId in fragments) {
                    try {
                        const fragment = fragments[fragId];
                        if (!fragment || !fragment.models) continue;

                        for (const modelId in fragment.models) {
                            const model = fragment.models[modelId];
                            if (!model) continue;
                            const attrs = model.attributes || {};
                            // units can be either top-level numeric keys or nested in attrs.units
                            const units = {};
                            if (attrs.units && typeof attrs.units === "object") {
                                for (const [k, v] of Object.entries(attrs.units)) {
                                    if (knownUnitKeys.has(k) && typeof v === "number" && v > 0) units[k] = (units[k] || 0) + v;
                                }
                            }
                            // also check top-level numeric unit keys
                            for (const [k, v] of Object.entries(attrs)) {
                                if (k === "units") continue;
                                if (knownUnitKeys.has(k) && typeof v === "number" && v > 0) units[k] = (units[k] || 0) + v;
                            }

                            // metadata extraction (behoedzaam: meerdere veldnamen voorkomen in verschillende versies)
                            const metaHome = attrs.home_town_id ?? attrs.homeTownId ?? attrs.homeId ?? (attrs.units && attrs.units.home_town_id) ?? null;
                            const metaCurrent = attrs.current_town_id ?? attrs.currentTownId ?? attrs.currentId ?? (attrs.units && attrs.units.current_town_id) ?? null;
                            const metaCurrentPlayer = attrs.current_town_player_id ?? attrs.currentTownPlayerId ?? null;
                            const metaId = attrs.id ?? null;
                            const island_x = attrs.island_x ?? null;
                            const island_y = attrs.island_y ?? null;

                            // Only keep fragments that actually contain unit counts or relevant meta
                            if (Object.keys(units).length > 0 || metaHome || metaCurrent) {
                                data.Troepen.push({
                                    player: playerName,
                                    id: metaId,
                                    home_town_id: metaHome,
                                    current_town_id: metaCurrent,
                                    current_town_player_id: metaCurrentPlayer,
                                    island_x,
                                    island_y,
                                    units,
                                });
                            }
                        }
                    } catch (e) {
                        // frag parse failed — negeren en doorgaan
                        console.warn("[TroopManager] fragment parse error", fragId, e);
                    }
                }

                // 4) RECONSTRUCT: gebruik ALLE data.Troepen als bron van waarheid
                const byHome = {};    // grouped by home_town_id => away troops for that home town
                const byCurrent = {}; // grouped by current_town_id => supports present in that town
                const homeInTown = {}; // aggregated troops that are at home (home==current)

                for (const frag of data.Troepen) {
                    if (!frag) continue;
                    const hid = frag.home_town_id != null ? Number(frag.home_town_id) : null;
                    const cid = frag.current_town_id != null ? Number(frag.current_town_id) : null;
                    const units = frag.units || {};

                    if (hid && cid && hid === cid) {
                        // truly at home
                        homeInTown[hid] = homeInTown[hid] || {};
                        for (const [u, c] of Object.entries(units)) {
                            if (!Number(c)) continue;
                            homeInTown[hid][u] = (homeInTown[hid][u] || 0) + Number(c);
                        }
                    } else {
                        // away from home (belongs to a home)
                        if (hid) {
                            byHome[hid] = byHome[hid] || {};
                            for (const [u, c] of Object.entries(units)) {
                                if (!Number(c)) continue;
                                byHome[hid][u] = (byHome[hid][u] || 0) + Number(c);
                            }
                        }
                        // present in a town (support arriving or other players' troops)
                        if (cid) {
                            byCurrent[cid] = byCurrent[cid] || {};
                            for (const [u, c] of Object.entries(units)) {
                                if (!Number(c)) continue;
                                byCurrent[cid][u] = (byCurrent[cid][u] || 0) + Number(c);
                            }
                        }
                    }
                }

                /* Eerst: zorg dat je lookups geladen zijn (aanroep vóór het opbouwen van supportDetailsMap) */
                await this.loadWorldLookupCaches(); // laad towns & players (caching)

                /* Simpele supporttelling: totaal aantal eenheden per stad */
                const supportTotals = {}; // townId -> {unit: count}

                for (const frag of data.Troepen) {
                    if (!frag) continue;
                    const hid = frag.home_town_id != null ? Number(frag.home_town_id) : null;
                    const cid = frag.current_town_id != null ? Number(frag.current_town_id) : null;
                    if (!cid) continue;

                    // alleen supports van andere stad
                    if (hid && hid !== cid) {
                        supportTotals[cid] = supportTotals[cid] || {};
                        for (const [u, c] of Object.entries(frag.units || {})) {
                            if (!Number(c)) continue;
                            supportTotals[cid][u] = (supportTotals[cid][u] || 0) + Number(c);
                        }
                    }
                }

                // 5) Build final arrays (order matches data.IDs)
                for (const idEntry of data.IDs) {
                    const tid = Number(idEntry.id);
                    const townName = idEntry.town;

                    data.HomeTroops.push({
                        playerName,
                        townName,
                        units: homeInTown[tid] || {},
                    });

                    data.AwayTroops.push({
                        playerName,
                        townName,
                        units: byHome[tid] || {},
                    });

                    data.SupportInCity.push({
                        playerName,
                        townName,
                        supportCombined: byCurrent[tid] || {},
                        supportDetailed: supportTotals[tid] || {}, // nu enkel totaal
                    });

                }

                // cache and return
                this.cachedTroepen = data.Troepen || [];
                return data;

            } catch (err) {
                console.error("[TroopManager] fetchTroopData error", err);
                throw err;
            }
        }


        async fetchSupportViaAjax(townId) {
            const $ = this.uw.$;
            const h = this.uw.Game?.csrfToken || this.uw.Game?.csrf_token || "";
            const url = `/game/town_info?town_id=${encodeURIComponent(townId)}&action=support&h=${encodeURIComponent(h)}`;

            return new Promise((resolve) => {
                if (!$) return resolve({ combined: {}, detailed: [] });

                $.get(url, (resp) => {
                    try {
                        const html = resp && resp.html ? resp.html : resp;
                        const doc = new this.uw.DOMParser().parseFromString(html, "text/html");

                        const sumUnitsInto = (target, el) => {
                            el.querySelectorAll('[class*="unit_"]').forEach((uEl) => {
                                const m = uEl.className.match(/unit_([a-z_]+)/);
                                if (!m) return;
                                const type = m[1];
                                const n = parseInt(uEl.textContent.replace(/[^\d]/g, ''), 10) || 0;
                                if (n > 0) target[type] = (target[type] || 0) + n;
                            });
                        };

                        // Totaal: tel alle unit_... in het document op
                        const combined = {};
                        sumUnitsInto(combined, doc);

                        // Detail: probeer per supporter te splitsen
                        const detailed = [];
                        const pushDetail = (container) => {
                            const units = {};
                            sumUnitsInto(units, container);
                            if (!Object.keys(units).length) return;

                            const links = Array.from(container.querySelectorAll('a'));
                            let supporterTown = "";
                            let supporterName = "";

                            if (links.length) {
                                const townLink = links.find(a => /town|info|polis|city/i.test(a.getAttribute('href') || "")) || links[0];
                                supporterTown = (townLink && townLink.textContent.trim()) || "";
                                const playerLink = links.find(a => /player|profile/i.test(a.getAttribute('href') || "")) || links[1];
                                supporterName = (playerLink && playerLink.textContent.trim()) || "";
                            }
                            if (!supporterTown || !supporterName) {
                                const txt = (container.textContent || "").replace(/\s+/g, " ").trim();
                                const m = txt.match(/(.+?)\s*\((.+?)\)/); // "Town (Player)"
                                if (m) {
                                    supporterTown = supporterTown || m[1].trim();
                                    supporterName = supporterName || m[2].trim();
                                }
                            }
                            detailed.push({ supporterName, supporterTown, units });
                        };

                        // Eerst rows in tabellen
                        const rowCandidates = Array.from(doc.querySelectorAll("tr"))
                        .filter(tr => tr.querySelector('[class*="unit_"]'));
                        if (rowCandidates.length) {
                            rowCandidates.forEach(pushDetail);
                        } else {
                            // fallback: lijst/blokken
                            const blocks = Array.from(doc.querySelectorAll(".supporter, .support, .supporter_row, .row, li"))
                            .filter(b => b.querySelector && b.querySelector('[class*="unit_"]'));
                            blocks.forEach(pushDetail);
                        }

                        resolve({ combined, detailed });
                    } catch (e) {
                        resolve({ combined: {}, detailed: [] });
                    }
                }).fail(() => resolve({ combined: {}, detailed: [] }));
            });
        }

        async hydrateSupportForAllTowns(data, playerName) {
            const towns = this.uw.ITowns?.towns || {};
            const result = [];
            const unitKeys = new Set(Object.keys(this.unitTranslations || {}));
            unitKeys.add('militia'); unitKeys.add('militia_bow'); unitKeys.add('militia_spear');

            for (const townId in towns) {
                const town = towns[townId];
                try {
                    let supportCombined = {};
                    let supportDetailed = [];

                    // 1) native API
                    try {
                        const native = typeof town.unitsSupport === "function" ? town.unitsSupport() : (town.unitsSupport || {});
                        if (native && Object.keys(native).length) {
                            for (const k in native) {
                                if (unitKeys.has(k) && typeof native[k] === 'number' && native[k] > 0) {
                                    supportCombined[k] = native[k];
                                }
                            }
                        }
                    } catch (err) { /* negeren */ }

                    // 2) Ajax scrape
                    if (!Object.keys(supportCombined).length) {
                        const viaAjax = await this.fetchSupportViaAjax(townId);
                        supportCombined = {};
                        for (const k in (viaAjax.combined || {})) {
                            if (unitKeys.has(k) && typeof viaAjax.combined[k] === 'number' && viaAjax.combined[k] > 0) {
                                supportCombined[k] = viaAjax.combined[k];
                            }
                        }
                        supportDetailed = viaAjax.detailed || [];
                    }

                    // 3) Fallback uit data.Troepen
                    if (!Object.keys(supportCombined).length && Array.isArray(data?.Troepen)) {
                        const supports = {};
                        const detailedFromTroepen = [];
                        const tid = Number(town.id);

                        for (const t of data.Troepen) {
                            if (!t) continue;
                            if (Number(t.current_town_id) === tid && (t.home_town_id == null || Number(t.home_town_id) !== tid)) {
                                for (const [u, c] of Object.entries(t.units || {})) {
                                    if (!unitKeys.has(u)) continue;
                                    supports[u] = (supports[u] || 0) + (Number(c) || 0);
                                }
                                const homeTownInfo = t.home_town_id ? this.getTownInfoById(t.home_town_id) : { name: "", player_id: null };
                                detailedFromTroepen.push({
                                    supporterTownId: t.home_town_id || null,
                                    supporterTown: homeTownInfo.name || this.uw.ITowns.getTown?.(t.home_town_id)?.name || "",
                                    supporterPlayerId: homeTownInfo.player_id || null,
                                    supporterName: homeTownInfo?.player_id ? this.getPlayerNameById(homeTownInfo.player_id) : "",
                                    units: t.units || {},
                                    id: t.id || null,
                                });
                            }
                        }
                        if (Object.keys(supports).length) {
                            supportCombined = supports;
                            supportDetailed = detailedFromTroepen;
                        }
                    }

                    result.push({ playerName, townName: town.name, supportCombined, supportDetailed });
                    await this.sleep(200);

                } catch (e) {
                    console.error(`[TroopManager] Fout bij support voor stad ${townId}`, e);
                    result.push({ playerName, townName: town?.name || "", supportCombined: {}, supportDetailed: [] });
                }
            }

            data.SupportInCity = result;
            this.cachedTroepen = data.Troepen || [];
            return result;
        }

        // ================= //
        //  Upload/Autosync  //
        // ================= //
        startAutoUploader() {
            if (this.autoUploader) clearInterval(this.autoUploader);
            this.autoUploader = setInterval(() => this.uploadTroopData().catch(() => {}), this.CONFIG.UPLOAD_INTERVAL);
            // initiële upload direct
            this.uploadTroopData().catch(() => {});
        }

        async uploadTroopData() {
            try {
                const data = await this.fetchTroopData();
                const playerName = this.uw.Game?.player_name || "Onbekend";
                await this.uploadDataToSupabase(data, playerName);
                console.log("[TroopManager] Troepen geüpload naar Supabase");
            } catch (e) {
                console.error("[TroopManager] Upload mislukt:", e);
                this.manager?.showNotification?.("Upload mislukt", false);
            }
        }

        async uploadDataToSupabase(data, playerName) {
            try {
                const { url, key } = await this.getSupabaseConfig();
                if (!url || !key) {
                    this.manager?.showNotification?.(
                        "Supabase niet ingesteld. Vul Instellingen → Supabase in.",
                        false
                    );
                    console.warn("[TroopManager] Supabase niet geconfigureerd");
                    return;
                }
                const endpoint = `${url.replace(/\/$/, "")}/rest/v1/troepen?on_conflict=player,world`;
                const headers = {
                    apikey: key,
                    Authorization: `Bearer ${key}`,
                    "Content-Type": "application/json",
                    Prefer: "resolution=merge-duplicates,return=representation",
                };

                // BELANGRIJK: alles in de kolom 'data' stoppen (één JSON‑object) zodat uitlezen consistent is
                const payload = {
                    player: playerName,
                    world: this.world,
                    data: {
                        HomeTroops: data.HomeTroops || [],
                        AwayTroops: data.AwayTroops || [],
                        SupportInCity: data.SupportInCity || [],
                        Wall: data.Wall || [],
                        PlayerCL: data.PlayerCL || [],
                        IDs: data.IDs || [],
                        Troepen: data.Troepen || [],
                        timestamp: data.timestamp || new Date().toISOString(),
                        alliance: data.alliance || (this.uw.Game?.alliance_name || "Geen alliantie"),
                    },
                    timestamp: data.timestamp || new Date().toISOString(), // optioneel, top‑level
                };

                const resp = await fetch(endpoint, { method: "POST", headers, body: JSON.stringify(payload) });
                const text = await resp.text();
                if (!resp.ok) {
                    console.error("[TroopManager] Supabase upload failed", resp.status, text);
                    this.manager?.showNotification?.("Upload mislukt (bekijk console)", false);
                    return;
                }
                this.manager?.showNotification?.("Troepen succesvol geüpload", true);
            } catch (err) {
                console.error("uploadDataToSupabase error", err);
                this.manager?.showNotification?.("Upload naar Supabase mislukt", false);
            }
        }
    }

    // ===================== //
    // Afwezigheidsassistent //
    // ===================== //

    class Afwezigheidsassistent {
        formatDate(dateStr) {
            if (!dateStr) return '';
            const [yyyy, mm, dd] = dateStr.split('-');
            return `${dd}-${mm}-${yyyy}`;
        }
        constructor(main) {
            this.main = main;
            this.container = null;
            this.afwezigheidsInterval = null;
        }

        async renderSettings(container) {
            this.container = container;
            container.innerHTML = ''; // leegmaken

            const wrapper = document.createElement('div');
            wrapper.className = 'afw-wrapper';

            const titel = document.createElement('h2');
            titel.textContent = 'Afwezigheids Manager';
            wrapper.appendChild(titel);

            const ui = document.createElement('div');
            ui.className = 'afw-ui';

            ui.innerHTML = `
    <input id="gm-afw-naam" placeholder="Speler" value="${unsafeWindow.Game?.player_name || ''}"/>
    <input id="gm-afw-van" type="date" />
    <input id="gm-afw-tot" type="date" />
    <label title="Vakantiemodus actief?" style="display:flex;align-items:center;gap:4px;">
      <input type="checkbox" id="gm-afw-vm" /> Vakantie Modus
    </label>
    <input id="gm-afw-reden" placeholder="Opmerking" style="width:160px;" />
    <button id="gm-afw-btn">Voeg toe</button>
  `;
            wrapper.appendChild(ui);

            const table = document.createElement('table');
            table.innerHTML = `
    <thead>
      <tr>
        <th>Speler</th>
        <th>Van</th>
        <th>Tot</th>
        <th>Vakantie Modus</th>
        <th>Reden</th>
      </tr>
    </thead>
    <tbody id="afwezigheids-tabel-rijen"></tbody>
  `;
            wrapper.appendChild(table);

            container.appendChild(wrapper);

            // 🎯 Event
            container.querySelector('#gm-afw-btn').addEventListener('click', async () => {
                const van = container.querySelector('#gm-afw-van').value;
                const tot = container.querySelector('#gm-afw-tot').value;
                if (!van || !tot) return alert('Start- en einddatum zijn verplicht');

                await this.exportToSupabase();
                await this.postToForum();
                this.main.showNotification("Afwezigheid toegevoegd aan forum");

                // Reset
                container.querySelector('#gm-afw-van').value = '';
                container.querySelector('#gm-afw-tot').value = '';
                container.querySelector('#gm-afw-vm').checked = false;
                container.querySelector('#gm-afw-reden').value = '';
            });

            // 🔁 Automatische refresh
            await this.updateAfwezigheidstabel();
            await this.cleanUpExpiredAbsences();

            this.afwezigheidsInterval = setInterval(() => {
                this.updateAfwezigheidstabel();
                this.cleanUpExpiredAbsences();
            }, 5 * 60 * 1000);
        }


        async exportToSupabase() {
            const url = await GM_getValue('supabase_url');
            const key = await GM_getValue('supabase_api_key');
            if (!url || !key) return;

            const payload = {
                speler: document.getElementById('gm-afw-naam')?.value || 'onbekend',
                reden: document.getElementById('gm-afw-reden')?.value || '',
                van: document.getElementById('gm-afw-van')?.value,
                tot: document.getElementById('gm-afw-tot')?.value,
                vakantie: document.getElementById('gm-afw-vm')?.checked || false
            };

            try {
                await fetch(`${url}/rest/v1/afwezigheden`, {
                    method: 'POST',
                    headers: {
                        'apikey': key,
                        'Authorization': `Bearer ${key}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'resolution=merge-duplicates'
                    },
                    body: JSON.stringify(payload)
                });
                this.main.showNotification('✅ Afwezigheid geëxporteerd naar Supabase');
            } catch (e) {
                console.error('❌ Fout bij export naar Supabase:', e);
                this.main.showNotification('❌ Fout bij export naar Supabase');
            }
        }

        async fetchAbsencesFromSupabase() {
            const url = await GM_getValue('supabase_url');
            const key = await GM_getValue('supabase_api_key');
            if (!url || !key) return [];

            try {
                const response = await fetch(`${url}/rest/v1/afwezigheden`, {
                    headers: {
                        'apikey': key,
                        'Authorization': `Bearer ${key}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) throw new Error("Fout bij ophalen");

                return await response.json();
            } catch (err) {
                console.error("Fout bij ophalen afwezigheden uit Supabase:", err);
                return [];
            }
        }

        async updateAfwezigheidstabel() {

            const data = await this.fetchAbsencesFromSupabase();
            const tbody = document.getElementById('afwezigheids-tabel-rijen');
            if (!tbody) return;

            tbody.innerHTML = '';

            for (const entry of data) {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                <td style="padding:3px;border:1px solid #ccc;">${entry.speler}</td>
                <td style="padding:3px;border:1px solid #ccc;">${this.formatDate(entry.van)}</td>
                <td style="padding:3px;border:1px solid #ccc;">${this.formatDate(entry.tot)}</td>
                <td style="padding:3px;border:1px solid #ccc;">${entry.vakantie ? 'Ja' : 'Nee'}</td>
                <td style="padding:3px;border:1px solid #ccc;">${entry.reden || '-'}</td>
            `;
                tbody.appendChild(tr);
            }
        }

        async postToForum() {
            const naam = document.getElementById('gm-afw-naam')?.value || 'onbekend';
            const van = document.getElementById('gm-afw-van')?.value;
            const tot = document.getElementById('gm-afw-tot')?.value;
            const vm = document.getElementById('gm-afw-vm')?.checked;
            const reden = document.getElementById('gm-afw-reden')?.value || '-';

            function formatDate(dateStr) {
                if (!dateStr) return '';
                const [yyyy, mm, dd] = dateStr.split('-');
                return `${dd}-${mm}-${yyyy}`;
            }

            const newRow = `[*][player]${naam}[/player][|]${formatDate(van)}[|]${formatDate(tot)}[|]${vm ? 'Ja' : 'Nee'}[|]${reden}[/*]\n`;

            const forumBtn = document.querySelector('li.allianceforum.main_menu_item span.name_wrapper span');
            if (!forumBtn) return alert('Alliantieforum knop niet gevonden!');
            forumBtn.click();

            await new Promise(res => setTimeout(res, 800));
            const forumLinks = [...document.querySelectorAll('a.submenu_link[data-menu_name] span.forum_menu')];
            const algemeenLink = forumLinks.find(span => span.textContent.trim().toLowerCase() === 'algemeen');
            if (!algemeenLink) return alert('Forum "Algemeen" niet gevonden!');
            algemeenLink.click();

            let afwezigTopic = null;
            let foundTopics = [];
            for (let tries = 0; tries < 10 && !afwezigTopic; tries++) {
                await new Promise(res => setTimeout(res, 600));
                const topicLinks = [...document.querySelectorAll('#threadlist > li > div.title_author_wrapper > div.title > a')];
                foundTopics = topicLinks.map(a => a.textContent.trim());
                afwezigTopic = topicLinks.find(a => a.textContent.toLowerCase().includes('afwezig'));
            }

            if (!afwezigTopic) return alert('Topic "Afwezig" niet gevonden!\nGevonden topics: ' + foundTopics.join(', '));
            afwezigTopic.click();

            await new Promise(res => setTimeout(res, 800));

            const editBtn = [...document.querySelectorAll('a')].find(a =>
                                                                     a.textContent.includes('Bewerken') && a.getAttribute('onclick')?.includes('Forum.postEdit')
                                                                    );
            if (!editBtn) return alert('Geen Bewerken-knop gevonden op deze pagina');
            editBtn.click();

            let textarea = null;
            const start = Date.now();
            while (!textarea && Date.now() - start < 5000) {
                textarea = document.querySelector('#forum_post_textarea:not([style*="display: none"])');
                await new Promise(res => setTimeout(res, 100));
            }

            if (!textarea) return alert('Kon tekstveld niet laden');
            textarea.value = textarea.value.includes('[/table]')
                ? textarea.value.replace('[/table]', `${newRow}[/table]`)
            : textarea.value + `\n${newRow}`;

            const saveBtn = [...document.querySelectorAll('#post_save_form a')].find(a =>
                                                                                     a.textContent.toLowerCase().includes('opslaan')
                                                                                    );
            if (saveBtn) saveBtn.click();
        }

        async cleanUpExpiredAbsences() {
            const url = await GM_getValue('supabase_url');
            const key = await GM_getValue('supabase_api_key');
            if (!url || !key) return;

            try {
                const now = new Date();
                const cutoff = new Date(now.getTime() - (48 * 60 * 60 * 1000)); // 48 uur geleden

                const isoCutoff = cutoff.toISOString().split('T')[0]; // yyyy-mm-dd

                await fetch(`${url}/rest/v1/afwezigheden?tot=lt.${isoCutoff}`, {
                    method: 'DELETE',
                    headers: {
                        'apikey': key,
                        'Authorization': `Bearer ${key}`,
                        'Content-Type': 'application/json'
                    }
                });

                console.log('[Afwezigheidsassistent] Verwijderde verlopen afwezigheden vóór:', isoCutoff);
            } catch (err) {
                console.error('❌ Fout bij opschonen verlopen afwezigheden:', err);
            }
        }

    }

    // ======================== //
    // Transportboot Capaciteit //
    // ======================== //

    const TransporterCapacity = {
        interval: null,

        activate() {
            try {
                // Voeg CSS toe als nog niet aanwezig

                if (!document.getElementById('transporter_capacity_style')) {
                    const style = `
                        #transporter_capacity.cont, #big_transporter.cont {
                            background: url("https://gpnl.innogamescdn.com/images/game/layout/layout_units_nav_border.png");
                            height: 25px;
                            cursor: pointer;
                            margin-bottom: 3px;
                            display: flex;
                            align-items: center;
                            padding: 0 6px;
                        }
                        .trans_ship_icon {
                            background: #ffcc66;
                            border-radius: 4px;
                            padding: 2px;
                            display: inline-flex;
                            align-items: center;
                            margin-right: 3px;
                            position: relative;
                        }
                        #trans_ship, #big_ship {
                            font-weight: bold;
                            text-shadow: 1px 1px 2px #000;
                            color: #FFCC66;
                            font-size: 10px;
                            line-height: 2.1;
                            min-width: 48px;
                            display: inline-block;
                            text-align: left;
                        }
                        .transporter_checkbox {
                            margin-left: 50px;
                            vertical-align: middle;
                            accent-color: #ffcc66;
                            width: 14px;
                            height: 14px;
                            position: absolute;
                            left: 50px;
                            top: 2px;
                        }
                        .transporter_row {
                            display: flex;
                            align-items: center;
                            gap: 3px;
                            height: 22px;
                        }
                    `;
                    $("<style id='transporter_capacity_style'>" + style + "</style>").appendTo('head');
                }

                // HTML
                if ($("#transporter_capacity").length === 0) {
                    $(
                        '<div id="transporter_capacity" class="cont">' +
                        '<div class="transporter_row">' +
                        '<span class="trans_ship_icon" style="position:relative;">' +
                        '<img id="trans_ship_img" class="ico" src="https://imgur.com/f7mTajn.png" style="width:18px;height:18px;">' +
                        '<input type="checkbox" id="trans_recruit" class="transporter_checkbox" checked title="Rekruteringsorders meenemen">' +
                        '</span>' +
                        '<span id="trans_ship" class="bold text_shadow"></span>' +
                        '</div>' +
                        '</div>'
                    ).appendTo(".units_naval .content");
                }
                if ($("#big_transporter").length === 0) {
                    $(
                        '<div id="big_transporter" class="cont">' +
                        '<div class="transporter_row">' +
                        '<span class="trans_ship_icon">' +
                        '<img id="big_ship_img" class="ico" src="https://imgur.com/7SHlyeq.png" style="width:18px;height:18px;">' +
                        '</span>' +
                        '<span id="big_ship" class="bold text_shadow"></span>' +
                        '</div>' +
                        '</div>'
                    ).appendTo(".units_naval .content");
                }

                // Start updater
                if (this.interval) clearInterval(this.interval);
                this.interval = setInterval(() => this.update(), 1000);
                this.update();

                // Checkbox event: update beide bij verandering
                $("#trans_recruit").off("change").on("change", () => this.update());
            } catch (e) {
                console.error("TransporterCapacity.activate():", e);
            }
        },

        update() {
            try {
                const town = ITowns.getTown(Game.townId);
                if (!town) {
                    $("#trans_ship").html("-");
                    $("#big_ship").html("-");
                    return;
                }
                const GD_units = GameData.units;
                const GD_heroes = GameData.heroes;
                const researches = typeof town.researches === 'function' ? town.researches() : null;
                const berth = researches && typeof researches.hasBerth === 'function' && researches.hasBerth()
                ? GameData.research_bonus.berth
                : 0;
                const units = town.units();

                // Snelle transportboten
                const fast_capacity = (units.transporter || 0) * ((GD_units.transporter?.capacity || 0) + berth);
                let fast_required = 0;

                // Grote transportboten
                const big_capacity = (units.big_transporter || 0) * ((GD_units.big_transporter?.capacity || 0) + berth);
                let big_required = 0;

                const isLand = u => GD_units[u] && !GD_units[u].is_naval && !GD_units[u].flying && GD_units[u].capacity === undefined;
                const isTransported = u => isLand(u) && ['function_off','function_def','function_both'].includes(GD_units[u].unit_function);

                for (const u in units) {
                    if (isTransported(u)) {
                        const pop = u === "spartoi" ? units[u] : units[u] * GD_units[u].population;
                        fast_required += pop;
                        big_required += pop;
                    }
                }

                // Rekruteringsorders meenemen?
                if ($("#trans_recruit").is(":checked")) {
                    for (const order of town.getUnitOrdersCollection().models) {
                        const u = order.attributes.unit_type;
                        const amt = order.attributes.units_total;
                        const building = order.attributes.building_type;

                        if ((building === "barracks" || building === "docks") && GD_units[u] && !(u in GD_heroes) && isTransported(u)) {
                            const pop = u === "spartoi" ? amt : amt * GD_units[u].population;
                            fast_required += pop;
                            big_required += pop;
                        }
                    }
                }

                // Update tekst en kleur
                $("#trans_ship").html(
                    `<span style="color:${fast_required > fast_capacity ? "#ffb4b4" : "#6eff5c"}">${fast_required}</span> / <span style="color:#FFCC66">${fast_capacity}</span>`
                );
                $("#big_ship").html(
                    `<span style="color:${big_required > big_capacity ? "#ffb4b4" : "#6eff5c"}">${big_required}</span> / <span style="color:#FFCC66">${big_capacity}</span>`
                );
            } catch (e) {
                console.error("TransporterCapacity.update():", e);
            }
        }
    };

    // Alias voor compatibiliteit met oude scripts
    window.BigTransporterCapacity = TransporterCapacity;

    // ================= //
    // MapOverlay Module //
    // ================= //

    class MapOverlayModule {
        constructor(manager) {
            this.main = manager;
            this.overlaySettings = {};
            this.customTags = {};
            this.audio = new Audio('https://raw.githubusercontent.com/zambia1972/Grepolis-Manager/main/sounds/bicycle-bell_19-80368.mp3');
            this.aanvalTimeout = null;
            this.bdAlarmTimeout = null;
            this.interval = null;
        }

        init() {
            console.log("Overlaymodule gestart");
            this.loadSettings();
            this.loadCSS();
            this.waitForDocumentReady();
            this.getTagsOnMap();
            this.initFarmAlarm();
            this.initAttackIndicator();
            window.debugOverlay = this;
            this.customTags["stad1768"] = { tag: "TEST", kleur: "#f00" };
        }

        loadSettings() {
            const uw = this.main.uw;
            const get = (key, def = null) => GM_getValue(key + uw.Game.world_id, def);
            this.overlaySettings = {
                token: get("setting_token"),
                key: get("setting_key"),
                discordhook: get("setting_discordhook", "[set webhook]"),
                boerendorpalarm: get("boerendorpalarm", true),
                aanvalsindicator: get("aanvalsindicator", true),
                inactive: get("inactive", true),
                inactiveMin: get("inactiveMin", 1),
                inactiveMax: get("inactiveMax", 50),
            };
        }

        updateFarmCounter() {
            console.log("Farm counter updated!");
            // TODO: hier je logica om de teller bij te werken
        }

        waitForDocumentReady() {
            const checkReady = setInterval(() => {
                if (document.readyState === 'complete') {
                    clearInterval(checkReady);
                    console.log("Document klaar, overlay gereed");
                    $(document.body).on('click', '#fto_claim_button', () => {
                        const uw = this.main.uw;
                        let time = parseInt($('#time_options_wrapper .fto_time_checkbox.active').attr('data-option') || 0);
                        const loyalOpt = $('#time_options_wrapper .time_options_loyalty .fto_time_checkbox.active').attr('data-option');
                        if (loyalOpt && parseInt(loyalOpt) > time) {
                            time = parseInt(loyalOpt);
                        }
                        const ts = Date.now() + time * 1000;
                        GM_setValue(uw.Game.world_id + '_grepolis-claim-ready', ts);
                        this.scheduleFarmAlarm(ts);
                        this.updateFarmCounter(); // ← update teller direct na claim
                    });
                }
            }, 100);
        }

        getTagsOnMap() {
            const original = MapTiles.createTownDiv;
            MapTiles.createTownDiv = (...args) => {
                const result = original.apply(MapTiles, args);
                return result;
            };
        }

        loadIdlePlayers() {
            return $.ajax({
                url: "https://www.grcrt.net/json.php",
                method: "get",
                data: {
                    method: "getIdleJSON",
                    world: this.main.uw.Game.world_id
                },
                cache: true
            });
        }

        applyTownTags(result, townData) {
            const elements = Array.isArray(result) ? result : [result];

            for (let element of elements) {
                if (element?.classList?.contains('flag') && element.classList.contains('town')) {
                    const tagData = this.customTags["stad" + townData.id];

                    if (tagData) {
                        const tagHTML = `<span class="customTag" style="background-color: ${tagData.kleur || '#000'}">${tagData.tag}</span>`;
                        const tagDiv = document.createElement('div');
                        tagDiv.className = "customTagWrapper";
                        tagDiv.innerHTML = tagHTML;
                        element.appendChild(tagDiv);
                    }
                }
            }

            return result;
        }

        initFarmAlarm() {
            const hasCaptain = $(".captain_active").length > 0;
            if (!hasCaptain) return;

            const uw = this.main.uw;
            const nextClaimTs = GM_getValue(uw.Game.world_id + '_grepolis-claim-ready');

            const alarmBox = document.createElement('div');
            alarmBox.className = 'toolbar_button farmAlarmButton';

            const icon = document.createElement('div');
            const isActive = nextClaimTs > Date.now();
            icon.className = 'icon farmAlarmIcon ' + (isActive ? 'inactive' : 'active');

            const count = document.createElement('div');
            count.className = 'count js-caption farmAlarmCounter';
            count.innerText = '0';
            count.style.cssText = `
                font-weight: bold;
                text-shadow: 1px 1px 2px #000;
                color: #FFCC66;
                font-size: 11px;
                line-height: 2.1;
                text-align: center;
            `;

            icon.appendChild(count);
            alarmBox.appendChild(icon);
            $(".toolbar_buttons")[0].append(alarmBox);

            $(".farmAlarmButton").click(() => {
                this.audio.pause();
                this.audio.currentTime = 0;
                clearTimeout(this.bdAlarmTimeout);
                Layout.wnd.Create(Layout.wnd.TYPE_FARM_TOWN_OVERVIEWS, "Farming Town Overview");
            });

            if (nextClaimTs) this.scheduleFarmAlarm(nextClaimTs);

            const world = this.main.uw.Game.world_id;
            const ts = GM_getValue(world + '_grepolis-claim-ready');
            this.scheduleFarmAlarm(ts);
            this.startFarmCounter();
            this.farmCounterInterval = null;
        }

        startFarmCounter() {
            if (this.farmCounterInterval) clearInterval(this.farmCounterInterval);

            this.farmCounterInterval = setInterval(() => {
                const counter = document.querySelector(".farmAlarmCounter");
                if (!counter) return;

                const ts = GM_getValue(this.main.uw.Game.world_id + '_grepolis-claim-ready');
                const now = Date.now();
                const remaining = Math.floor((ts - now) / 1000);
                counter.innerText = remaining <= 0 ? "0" : remaining;
            }, 1000);
        }

        scheduleFarmAlarm(timestamp) {
            const remaining = timestamp - Date.now();
            if (remaining <= 0) return;
            this.bdAlarmTimeout = setTimeout(() => {
                $(".farmAlarmIcon").removeClass("inactive").addClass("active");
                if (this.overlaySettings.boerendorpalarm) this.audio.play();
                setTimeout(() => this.audio.pause(), 2000);
            }, remaining);
        }

        initAttackIndicator() {
            this.previousAttackCount = 0;
            this.checkIncomingAttacks();
        }

        checkIncomingAttacks() {
            const indicator = $(".activity.attack_indicator.active");
            const currentCount = parseInt(indicator.text()) || 0;

            if (currentCount > 0 && currentCount > this.previousAttackCount) {
                this.previousAttackCount = currentCount;
                this.startFaviconFlash();
            } else if (currentCount === 0) {
                this.stopFaviconFlash();
                this.previousAttackCount = 0;
            } else {
                this.previousAttackCount = currentCount;
            }

            setTimeout(() => this.checkIncomingAttacks(), 5000);
        }

        startFaviconFlash() {
            const link = $("link[rel~='icon']").first();
            if (!link.length) return;
            const normalHref = "https://gpnl.innogamescdn.com/images/game/start/favicon.ico";
            const alertHref = "https://raw.githubusercontent.com/zambia1972/Grepolis-Manager/main/icons/incoming.ico";
            let showingAlert = false;
            this.aanvalTimeout = setInterval(() => {
                link.attr("href", showingAlert ? normalHref : alertHref);
                showingAlert = !showingAlert;
            }, 300);
        }

        stopFaviconFlash() {
            clearInterval(this.aanvalTimeout);
            this.aanvalTimeout = null;
            $("link[rel~='icon']").first().attr("href", "https://gpnl.innogamescdn.com/images/game/start/favicon.ico");
        }

        markInactivePlayers(idleData) {
            const game = this.main.uw.Game;
            const settings = this.overlaySettings;
            if (!settings.inactive) return;
            const flagElements = document.querySelectorAll(".flag.town");
            flagElements.forEach(flag => {
                try {
                    const townId = parseInt(flag.id.replace("flag_town_", ""));
                    const town = this.main.uw.ITowns.getTown(townId);
                    const playerId = town.player_id;
                    const daysInactive = Math.floor(idleData.JSON[playerId] || 0);
                    if (playerId && daysInactive >= settings.inactiveMin && daysInactive <= settings.inactiveMax) {
                        const tag = document.createElement("div");
                        tag.innerText = daysInactive + "d";
                        tag.classList.add("inactivetag");
                        flag.appendChild(tag);
                    }
                } catch (e) { console.log("Fout bij inactieve speler:", e); }
            });
        }

        renderSettingsUI(container) {
            const wrapper = document.createElement("div");
            wrapper.style.cssText = `
        font-weight: bold;
        text-shadow: 1px 1px 2px #000;
        color: #FFCC66;
        font-size: 10px;
        line-height: 2.1;
        min-width: 48px;
        display: inline-block;
        text-align: left;
    `;

            const farmAlarmCheckbox = document.createElement("input");
            farmAlarmCheckbox.type = "checkbox";
            farmAlarmCheckbox.id = "farmalarm-toggle";
            const createCheckbox = (id, label, defaultVal) => {
                const div = document.createElement("div");
                const input = document.createElement("input");
                input.type = "checkbox";
                input.id = id;
                input.checked = this.overlaySettings[id] ?? defaultVal;
                div.appendChild(input);
                const labelEl = document.createElement("label");
                labelEl.innerText = " " + label;
                labelEl.htmlFor = id;
                div.appendChild(labelEl);
                return div;
            };

            const createTextbox = (id, label, value = "", width = 200) => {
                const div = document.createElement("div");
                const labelEl = document.createElement("label");
                labelEl.innerText = label + ": ";
                labelEl.htmlFor = id;
                const input = document.createElement("input");
                input.type = "text";
                input.id = id;
                input.value = value;
                input.style.width = width + "px";
                div.appendChild(labelEl);
                div.appendChild(input);
                return div;
            };

            container.innerHTML = "<h3>Instellingen (Overlay Module)</h3>";
            container.appendChild(createCheckbox("boerendorpalarm", "Boerendorpenalarm", true));
            container.appendChild(createCheckbox("aanvalsindicator", "Knipperend icoon bij aanvallen", true));
            container.appendChild(createCheckbox("inactive", "Toon inactieve spelers", true));
            container.appendChild(createTextbox("inactiveMin", "Inactief vanaf (dagen)", this.overlaySettings.inactiveMin));
            container.appendChild(createTextbox("inactiveMax", "Tot max (dagen)", this.overlaySettings.inactiveMax));

            const saveBtn = document.createElement("button");
            saveBtn.innerText = "Opslaan & herladen";
            saveBtn.onclick = () => {
                ["boerendorpalarm", "aanvalsindicator", "inactive"].forEach(id => {
                    const val = document.getElementById(id).checked;
                    GM_setValue(id, val);
                });
                GM_setValue("inactiveMin", parseInt(document.getElementById("inactiveMin").value));
                GM_setValue("inactiveMax", parseInt(document.getElementById("inactiveMax").value));
                location.reload();
            };

            container.appendChild(document.createElement("hr"));
            wrapper.appendChild(farmAlarmCheckbox);
            container.appendChild(wrapper);
            container.appendChild(saveBtn);
        }
        loadCSS() {
            const css = `
        .customTagWrapper { position: absolute; top: -2px; left: -1px; z-index: 20; }
        .customTag { font-size: 10px; background: #444; color: #fff; padding: 1px 2px; border-radius: 2px; }
        .inactivetag { position: absolute; bottom: -3px; left: 1px; font-size: 9px; background-color: rgba(0,0,0,0.7); color: white; padding: 1px 2px; border-radius: 2px; z-index: 10; }
    `;
            const style = document.createElement("style");
            style.innerText = css;
            document.head.appendChild(style);
        }

    }

    // Move hasAdminAccess outside the class
    async function hasAdminAccess(main) {
        // fallback player name
        const playerName = (main.modules?.forumManager?.getPlayerName?.() || main.uw?.Game?.player_name || "").toString().trim().toLowerCase();
        const devs = ['boodtrap', 'zambia1972', 'elona', 'joppie86'];

        if (!playerName) return false;
        if (devs.includes(playerName)) return true;

        // handmatig ingestelde admins altijd checken
        const manualAdmins = (await GM_getValue('admin_list', [])) || [];
        if (manualAdmins.map(n => (n||"").toLowerCase()).includes(playerName)) return true;

        // leiders mogen admin zijn (checkbox)
        const allowLeaders = await GM_getValue('leaders_are_admins', true);
        if (allowLeaders) {
            // 1) probeer role (snelle check)
            const role = (main.modules?.forumManager?.getPlayerRole?.() || "").toLowerCase?.() || "";
            if (role === 'leider' || role === 'oprichter') return true;

            // fallback: lees leiders via de centrale methode (storage + DOM)
            try {
                let leaders = [];
                if (main.supabaseSync && typeof main.supabaseSync.getAllianceLeaders === 'function') {
                    leaders = await main.supabaseSync.getAllianceLeaders();
                } else if (main.settingsWindow && typeof main.settingsWindow.getAllianceLeaders === 'function') {
                    // fallback synchronous scrape als supabaseSync nog niet klaar is
                    leaders = main.settingsWindow.getAllianceLeaders() || [];
                } else {
                    leaders = await GM_getValue('leaders_list', []) || [];
                }
                if (leaders.map(n => (n||"").toLowerCase()).includes(playerName)) return true;
            } catch (e) {
                console.warn("[hasAdminAccess] leaders check failed:", e);
            }

        }

        return false;
    }


    // -------------------------
    // --- instellingen --------
    // -------------------------

    class SettingsWindow {
        constructor(main) {
            this.main = main;
            this.uw = main.uw;
        }

        getAllianceLeaders() {
            const leaders = [];
            try {
                const rows = document.querySelectorAll("#ally_members_body tr");
                rows.forEach(row => {
                    const anchor = row.querySelector("td.ally_name .gp_player_link");
                    let name = "";
                    if (anchor) {
                        name = Array.from(anchor.childNodes)
                            .filter(n => n.nodeType === Node.TEXT_NODE)
                            .map(n => n.textContent.trim())
                            .join(" ")
                            .trim();
                        if (!name) name = anchor.textContent.trim();
                    } else {
                        const cell = row.querySelector("td.ally_name");
                        name = cell ? cell.textContent.trim() : "";
                    }
                    if (!name) return;

                    const oprichterImg = row.querySelector("td:nth-child(5) img");
                    const leiderImg    = row.querySelector("td:nth-child(6) img");

                    const imgIsChecked = (img) => {
                        if (!img) return false;
                        const src = (img.getAttribute("src") || "").toLowerCase();
                        const alt = (img.getAttribute("alt") || "").toLowerCase();
                        const cls = (img.className || "").toLowerCase();
                        if (cls.includes("checked")) return true;
                        if (/checkmark/i.test(src)) return true;
                        if (alt.includes("heeft dit recht") && !alt.includes("niet")) return true;
                        return false;
                    };

                    const isOprichter = imgIsChecked(oprichterImg);
                    const isLeider    = imgIsChecked(leiderImg);

                    if (isOprichter || isLeider) {
                        if (!leaders.includes(name)) leaders.push(name);
                    }
                });
            } catch (e) {
                console.warn("[SettingsWindow] kon leiders niet ophalen:", e);
            }
            return leaders;
        }
        async render(container) {
            const isAdmin = await hasAdminAccess(this.main);
            if (!isAdmin) {
                return this.main.showNotification("Geen toegang tot instellingen.", false);
            }

            container.innerHTML = `
            <h2 class="gm-panel-title">Instellingen</h2>
            <div id="gm-tab-buttons" style="display:flex; gap:8px; margin-bottom:10px; flex-wrap:wrap;">
                <button class="gm-button" data-tab="supabase">⚙️ Supabase</button>
                <button class="gm-button" data-tab="wereldinfo">🌍 Wereldinfo</button>
                <button class="gm-button" data-tab="overlay">🗺️ Overlay</button>
                <button class="gm-button" data-tab="ban">🚫 Ban</button>
                <button class="gm-button" data-tab="admin">👑 Admin</button>
            </div>
            <div id="gm-settings-content"></div>
        `;

            // standaard naar supabase
            await this.renderTab("supabase");

            container.querySelectorAll("#gm-tab-buttons .gm-button").forEach(btn => {
                btn.addEventListener("click", () => this.renderTab(btn.dataset.tab));
            });
        }

        async toggle() {
            const isAdmin = await hasAdminAccess(this.main);
            if (!isAdmin) return this.main.showNotification("Geen toegang tot instellingen.", false);
            this.main.openPanel("settings", (c) => this.render(c), "gm-panel-medium");
        }

        async renderTab(tab) {
            const content = document.getElementById("gm-settings-content");
            if (!content) return;
            content.innerHTML = "";

            const isAdmin = await hasAdminAccess(this.main);

            if (tab === "supabase") await this.renderSupabaseTab(content);
            else if (tab === "wereldinfo") {
                if (isAdmin) await this.renderWereldinfoTab(content);
                else content.innerHTML = "<p class='gm-muted'>Geen toegang tot Wereldinfo.</p>";
            }
            else if (tab === "overlay") this.renderOverlayTab(content);
            else if (tab === "ban") {
                if (isAdmin) await this.renderBanTab(content);
                else content.innerHTML = "<p class='gm-muted'>Geen toegang tot Banlijst.</p>";
            }
            else if (tab === "admin") {
                if (isAdmin) await this.renderAdminTab(content);
                else content.innerHTML = "<p class='gm-muted'>Geen toegang tot Adminbeheer.</p>";
            }

            document.querySelectorAll("#gm-tab-buttons .gm-button").forEach(btn => {
                btn.style.opacity = btn.dataset.tab === tab ? "1" : "0.7";
            });
        }


        // ---------------- SUPABASE ----------------
        async renderSupabaseTab(container) {
            const supabaseURL = await GM_getValue("supabase_url", "");
            const supabaseKey = await GM_getValue("supabase_api_key", "");
            const autoUpload = await GM_getValue("auto_upload_enabled", true);

            container.innerHTML = `
            <h3 class="gm-title">Supabase configuratie</h3>
            <label>URL
              <input class="gm-input" type="text" value="${supabaseURL}" disabled />
            </label>
            <label>API Key
              <input class="gm-input" type="password" value="${supabaseKey}" disabled />
            </label>
            <div style="margin:8px 0;">
              <button id="gm-reset-supabase" class="gm-button">🔄 Reset gegevens</button>
              <button id="gm-export" class="gm-button">⬇️ Exporteer settings</button>
              <button id="gm-import" class="gm-button">⬆️ Importeer settings</button>
              <label style="margin-left:10px;">
              <hr>
                <input type="checkbox" id="gm-toggle-upload" ${autoUpload ? "checked" : ""}/> Auto-upload actief
              </label>
            </div>
        `;

            container.querySelector('#gm-reset-supabase').addEventListener('click', async () => {
                await GM_deleteValue("supabase_url");
                await GM_deleteValue("supabase_api_key");
                location.reload();
            });
            container.querySelector('#gm-export').addEventListener('click', async () => {
                const keys = ['supabase_url', 'supabase_api_key', 'auto_upload_enabled'];
                const data = {};
                for (const key of keys) data[key] = await GM_getValue(key);
                GM_setClipboard(JSON.stringify(data, null, 2));
                alert("Instellingen gekopieerd naar klembord.");
            });
            container.querySelector('#gm-import').addEventListener('click', async () => {
                const json = prompt("Plak hier je JSON instellingen:");
                if (!json) return;
                try {
                    const data = JSON.parse(json);
                    for (const key in data) await GM_setValue(key, data[key]);
                    location.reload();
                } catch {
                    alert("Ongeldige JSON.");
                }
            });
            container.querySelector('#gm-toggle-upload').addEventListener('change', async (e) => {
                await GM_setValue("auto_upload_enabled", e.target.checked);
            });
        }

        // ---------------- WERELDINFO ----------------
        async renderWereldinfoTab(container) {
            const url = await GM_getValue("wereldinfo_url", "");
            container.innerHTML = `
            <h3 class="gm-title">Wereldinfo</h3>
            <input type="text" id="gm-wi-url" class="gm-input" placeholder="https://..." style="width:100%; margin-bottom:5px;" value="${url}" />
            <button id="gm-save-wi-url" class="gm-button">💾 Opslaan</button>
        `;
            container.querySelector("#gm-save-wi-url").addEventListener("click", async () => {
                await GM_setValue("wereldinfo_url", container.querySelector("#gm-wi-url").value.trim());
                alert("Wereldinfo-URL opgeslagen.");
            });
        }

        // ---------------- OVERLAY ----------------
        renderOverlayTab(container) {
            if (this.main.modules?.mapOverlay?.renderSettingsUI) {
                const overlayDiv = document.createElement("div");
                overlayDiv.className = "gm-card";
                this.main.modules.mapOverlay.renderSettingsUI(overlayDiv);
                container.appendChild(overlayDiv);
            } else {
                container.innerHTML = "<p class='gm-muted'>Overlay module niet beschikbaar.</p>";
            }
        }

        // ---------------- BAN ----------------
        async renderBanTab(container) {
            const bans = (await GM_getValue("banned_players", [])) || [];
            container.innerHTML = `
        <h3 class="gm-title">Banlijst</h3>
        <div style="display:flex; gap:6px; align-items:center; margin-bottom:6px;">
          <input id="gm-banname" class="gm-input" placeholder="Spelernaam" style="max-width:300px;" />
          <button id="gm-ban-add" class="gm-button">➕ Ban</button>
          <button id="gm-ban-remove" class="gm-button">➖ Unban</button>
        </div>
        <div id="gm-banlist" class="gm-muted" style="font-size:12px;">${bans.length ? bans.join(", ") : "—"}</div>
    `;

            container.querySelector("#gm-ban-add").addEventListener("click", async () => {
                const name = container.querySelector("#gm-banname").value.trim();
                if (!name) return;
                const set = new Set(bans);
                set.add(name);
                await GM_setValue("banned_players", Array.from(set));
                await this.renderBanTab(container);
            });

            container.querySelector("#gm-ban-remove").addEventListener("click", async () => {
                const name = container.querySelector("#gm-banname").value.trim();
                if (!name) return;
                const set = new Set(bans);
                set.delete(name);
                await GM_setValue("banned_players", Array.from(set));
                await this.renderBanTab(container);
            });
        }

        // ---------------- ADMIN ----------------
        async renderAdminTab(container) {
            const manualAdmins = (await GM_getValue("admin_list", [])) || [];
            const leadersAreAdmins = await GM_getValue("leaders_are_admins", true);
            const domLeaders = this.getAllianceLeaders() || [];
            const storedLeaders = (await GM_getValue("leaders_list", [])) || [];

            // merge, uniek, behoud eerste voorkomend casing
            const leaderMap = new Map();
            [...domLeaders, ...storedLeaders].forEach(n => {
                if (!n) return;
                const key = n.toString().trim().toLowerCase();
                if (!key) return;
                if (!leaderMap.has(key)) leaderMap.set(key, n.toString().trim());
            });
            const leaders = Array.from(leaderMap.values());

            // indien we daadwerkelijk iets uit DOM halen -> persist zodat rest van het script het gebruikt
            if (domLeaders.length > 0) {
                await GM_setValue('leaders_list', leaders);
            }

            container.innerHTML = `
      <h3 class="gm-title">Adminbeheer</h3>
      <div style="display:flex; gap:6px; align-items:center; margin-bottom:6px;">
        <input id="gm-adminname" class="gm-input" placeholder="Spelernaam" style="max-width:300px;" />
        <button id="gm-admin-add" class="gm-button">➕ Voeg toe</button>
        <button id="gm-admin-remove" class="gm-button">➖ Verwijder</button>
      </div>
      <label style="display:block; margin-top:8px;">
        <input type="checkbox" id="gm-toggle-leaders" ${leadersAreAdmins ? "checked" : ""}/>
        Leiders/Oprichters hebben automatisch toegang
      </label>
      <div class="gm-muted" style="font-size:12px; margin-top:8px;">
        <b>Leiders:</b> ${leaders.length ? leaders.join(", ") : "—"}
      </div>
      <div class="gm-muted" style="font-size:12px; margin-top:8px;">
        <b>Admins (handmatig toegevoegd):</b> ${manualAdmins.length ? manualAdmins.join(", ") : "—"}
      </div>
    `;

            // Add
            container.querySelector("#gm-admin-add").addEventListener("click", async () => {
                const name = container.querySelector("#gm-adminname").value.trim();
                if (!name) return;
                const current = (await GM_getValue("admin_list", [])) || [];
                if (!current.map(n => n.toLowerCase()).includes(name.toLowerCase())) {
                    current.push(name);
                    await GM_setValue("admin_list", current);
                }
                await this.renderAdminTab(container);
            });

            // Remove
            container.querySelector("#gm-admin-remove").addEventListener("click", async () => {
                const name = container.querySelector("#gm-adminname").value.trim();
                if (!name) return;
                const current = (await GM_getValue("admin_list", [])) || [];
                const filtered = current.filter(a => a.toLowerCase() !== name.toLowerCase());
                await GM_setValue("admin_list", filtered);
                await this.renderAdminTab(container);
            });

            // Toggle leaders checkbox
            container.querySelector("#gm-toggle-leaders").addEventListener("change", async (e) => {
                await GM_setValue("leaders_are_admins", e.target.checked);
                await this.renderAdminTab(container);
            });
        }

    }

    // ============================ //
    // Start Grepolis Manager Init  //
    // ============================ //

    window.addEventListener('load', () => {
        const app = new GrepolisManager();
        // Zet de instantie globaal beschikbaar
        window.GrepoMain = app;
        window.GMApp = app; // extra alias voor testen
        console.log("✅ GrepolisManager gestart:", app);
    });

    // Helper: wacht tot een bepaald pad op window bestaat
    function waitForGlobal(path, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const start = Date.now();

            (function check() {
                const parts = path.split(".");
                let obj = window;

                for (const p of parts) {
                    if (obj && p in obj) {
                        obj = obj[p];
                    } else {
                        obj = null;
                        break;
                    }
                }

                if (obj) {
                    resolve(obj);
                } else if (Date.now() - start < timeout) {
                    setTimeout(check, 200);
                } else {
                    reject(new Error(`Timeout: ${path} niet gevonden binnen ${timeout}ms`));
                }
            })();
        });
    }

})();

