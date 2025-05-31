// modules/forumManager.js
// Beheert alle functionaliteit rond fora, topics, knoppen, helper tools, en leiding tools

(function () {
    'use strict';

    const uw = unsafeWindow;

    class ForumManager {
        constructor() {
            this.popup = null;
            this.playerName = '';
            this.server = '';
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
            this.topicsData = {}; // Wordt later gevuld (zie aparte module of JSON)
            this.militaryManager = null;

            this.init();
        }

        async init() {
            await this.waitForGameReady();

            // Helpers (extern via aparte bestanden geladen via @require)
            this.attackRangeHelper = new uw.AttackRangeHelperManager(uw);
            await this.attackRangeHelper.initialize();

            this.feestenFixed = new uw.FeestenFixedManager();

            // Initialiseer UI
            this.initializeUI();

            // Spelerinformatie ophalen
            this.fetchPlayerInfo();

            // Injecteer automatische assistentie
            this.injectAfwezigheidsassistent();
        }

        waitForGameReady() {
            return new Promise((resolve, reject) => {
                let attempts = 0;
                const check = () => {
                    if (uw.Game && uw.ITowns) {
                        resolve();
                    } else if (attempts < 30) {
                        attempts++;
                        setTimeout(check, 250);
                    } else {
                        reject(new Error('Game objecten niet gevonden.'));
                    }
                };
                check();
            });
        }

        initializeUI() {
            this.addMainButton();
            this.injectStyles();
        }

        addMainButton() {
            const button = document.createElement('div');
            button.id = 'grepolis-manager-main-btn';
            button.style.cssText = `
                position: fixed;
                bottom: 60px;
                left: 30px;
                width: 60px;
                height: 60px;
                background-image: url('https://imgur.com/I62TXeo.png');
                background-size: cover;
                background-repeat: no-repeat;
                background-position: center;
                border-radius: 50%;
                border: 2px solid #caa35d;
                box-shadow: 0 0 15px #caa35d;
                cursor: pointer;
                z-index: 99999;
            `;
            button.title = 'Open Grepolis Manager';

            button.addEventListener('click', () => this.toggleMainWindow());

            document.body.appendChild(button);
        }

        toggleMainWindow() {
            this.createPopup();
        }

        createPopup() {
            if (!this.popup) {
                this.popup = document.createElement('div');
                this.popup.id = 'forum-popup';
                this.popup.style = `
                    display: none;
                    position: fixed;
                    width: 600px;
                    height: 400px;
                    background: #1e1e1e;
                    border: 2px solid #FF0000;
                    border-radius: 10px;
                    color: white;
                    font-family: Arial, sans-serif;
                    z-index: 10000;
                    box-shadow: 0 0 20px #FF0000;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    padding: 20px;
                    overflow: hidden;
                `;
                document.body.appendChild(this.popup);
            }

            const closeButton = document.createElement('button');
            closeButton.textContent = 'X';
            closeButton.style = `
                position: absolute;
                top: 10px;
                right: 10px;
                background: black;
                color: #FF0000;
                font-size: 16px;
                border: none;
                width: 30px;
                height: 30px;
                cursor: pointer;
                border-radius: 50%;
                box-shadow: 0 0 5px #FF0000;
            `;
            closeButton.addEventListener('click', () => {
                this.popup.style.display = 'none';
                console.log("Popup gesloten.");
            });

            const toolbar = document.createElement('div');
            toolbar.style = `
                display: flex;
                justify-content: space-between;
                margin-bottom: 20px;
            `;

            const button1 = this.createToolbarButton('Startscherm', () => this.showStartScreen());
            const button2 = this.createToolbarButton('Helper', () => this.showHelperTools());
            const button3 = this.createToolbarButton('Knop 3', () => alert('Knop 3 wordt later toegevoegd.'));
            const button4 = this.createToolbarButton('Leiding Tools', () => this.showLeadershipTools());
            const button5 = this.createToolbarButton('Fora en Topics', () => this.createAllForaAndTopics());

            toolbar.appendChild(button1);
            toolbar.appendChild(button2);
            toolbar.appendChild(button3);
            toolbar.appendChild(button4);
            toolbar.appendChild(button5);

            const content = document.createElement('div');
            content.id = 'popup-content';
            content.style = `
                flex-grow: 1;
                padding: 20px;
                overflow-y: auto;
                max-height: 300px;
                position: relative;
            `;

            this.popup.innerHTML = '';
            this.popup.appendChild(closeButton);
            this.popup.appendChild(toolbar);
            this.popup.appendChild(content);
            this.popup.style.display = 'block';

            // Toon standaard eerste scherm
            this.showStartScreen();
        }

        createToolbarButton(text, onClick) {
            const button = document.createElement('button');
            button.textContent = text;
            button.style = `
                background: black;
                color: #FF0000;
                border: 1px solid #FF0000;
                padding: 10px 20px;
                cursor: pointer;
                font-size: 14px;
                border-radius: 5px;
                margin: 0 5px;
            `;
            button.addEventListener('click', onClick);
            return button;
        }

        showStartScreen() {
            const content = document.getElementById('popup-content');
            content.innerHTML = `
                <h2>Welkom bij Grepolis Manager</h2>
                <p>Dit script combineert de kracht van populaire Grepolis-tools in één handige oplossing.</p>
                ${this.playerName ? `<p>Welkom, ${this.playerName}!</p>` : '<p>Welkom, gast!</p>'}
            `;
        }

        showHelperTools() {
            const content = document.getElementById('popup-content');
            if (!content) return;

            content.innerHTML = `
                <h2>Helper Tools</h2>
                <div id="helper-buttons" style="display: grid; gap: 10px;"></div>
            `;

            this.addHelperToggle(
                'AttackRange Helper',
                'Toont aanvalsbereik op basis van spelerspunten',
                (state) => this.attackRangeHelper?.toggle(state),
                () => this.attackRangeHelper?.showHelpPopup()
            );

            this.addHelperToggle(
                'FeestenFixed',
                'Toont steden waar je Stadsfeesten en Theaters kan activeren',
                (state) => this.feestenFixed.toggle(state),
                () => this.feestenFixed.showCustomHelp()
            );
        }

        addHelperToggle(label, helpText, onClick, onHelpClick) {
            const container = document.getElementById('helper-buttons');
            if (!container) return;

            const wrapper = document.createElement('div');
            wrapper.style.cssText = `
                display: flex;
                flex-direction: column;
                gap: 5px;
                margin-bottom: 15px;
                align-items: flex-start;
            `;

            const labelElement = document.createElement('span');
            labelElement.textContent = label;
            labelElement.style.cssText = `
                color: #FF0000;
                font-weight: bold;
                font-size: 14px;
                margin-left: 5px;
            `;

            const switchContainer = document.createElement('div');
            switchContainer.style.cssText = `
                display: flex;
                align-items: center;
                gap: 10px;
                width: 100%;
            `;

            const switchInput = document.createElement('input');
            switchInput.type = 'checkbox';
            switchInput.id = `switch-${label.toLowerCase().replace(/\s+/g, '-')}`;
            switchInput.style.display = 'none';

            const switchLabel = document.createElement('label');
            switchLabel.htmlFor = switchInput.id;
            switchLabel.style.cssText = `
                position: relative;
                display: inline-block;
                width: 60px;
                height: 30px;
                background-color: #333;
                border-radius: 15px;
                cursor: pointer;
                transition: all 0.3s;
                border: 1px solid #FF0000;
                order: 1;
            `;

            const switchButton = document.createElement('span');
            switchButton.style.cssText = `
                position: absolute;
                height: 26px;
                width: 26px;
                left: 2px;
                bottom: 2px;
                background-color: white;
                border-radius: 50%;
                transition: all 0.3s;
            `;

            const helpBtn = document.createElement('button');
            helpBtn.innerHTML = '?';
            helpBtn.title = helpText;
            helpBtn.style.cssText = `
                background: #444;
                color: #FFF;
                border-radius: 50%;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                border: none;
                order: 2;
            `;

            switchLabel.appendChild(switchButton);
            switchContainer.appendChild(switchInput);
            switchContainer.appendChild(switchLabel);
            switchContainer.appendChild(helpBtn);

            wrapper.appendChild(labelElement);
            wrapper.appendChild(switchContainer);
            container.appendChild(wrapper);

            switchInput.addEventListener('change', (e) => {
                const state = e.target.checked ? 'on' : 'off';
                if (state === 'on') {
                    switchLabel.style.backgroundColor = '#FF0000';
                    switchButton.style.transform = 'translateX(30px)';
                } else {
                    switchLabel.style.backgroundColor = '#333';
                    switchButton.style.transform = 'translateX(0)';
                }
                onClick(state);
            });

            helpBtn.addEventListener('click', () => onHelpClick());
        }

        fetchPlayerInfo() {
            const maxAttempts = 10;
            let attempts = 0;

            const check = () => {
                const playerId = localStorage.getItem('grepolisPlayerId');
                const playerName = localStorage.getItem('grepolisPlayerName');

                if (playerId && playerName) {
                    this.playerId = playerId;
                    this.playerName = playerName;
                    console.log('[Grepolis Manager] Spelerinformatie gevonden:', this.playerName);
                } else if (attempts < maxAttempts) {
                    attempts++;
                    console.log(`[Grepolis Manager] Poging ${attempts}: spelerinfo niet gevonden.`);
                    setTimeout(check, 1000);
                } else {
                    console.warn('[Grepolis Manager] Geen spelerinformatie gevonden.');
                }
            };

            check();
        }

        injectStyles() {
            const styles = `
                #forum-popup h2 {
                    color: #FF0000;
                    text-align: center;
                }
                #forum-popup p {
                    text-align: center;
                }
            `;
            const styleElement = document.createElement('style');
            styleElement.textContent = styles;
            document.head.appendChild(styleElement);
        }

        injectAfwezigheidsassistent() {
            if (typeof uw.Afwezigheidsassistent === 'function') {
                try {
                    uw.Afwezigheidsassistent(this.playerName);
                } catch (e) {
                    console.warn('[Grepolis Manager] Afwezigheidsassistent injectie faalde:', e);
                }
            }
        }

        showLeadershipTools() {
            const content = document.getElementById('popup-content');
            content.innerHTML = `
                <h2>Leiding Tools</h2>
                <p>Leiding modules worden later toegevoegd.</p>
            `;
        }

        createAllForaAndTopics() {
            const content = document.getElementById('popup-content');
            content.innerHTML = `
                <h2>Fora en Topics</h2>
                <p>Deze functionaliteit wordt nog toegevoegd.</p>
            `;
        }
    }

    uw.ForumManager = ForumManager;
})();
