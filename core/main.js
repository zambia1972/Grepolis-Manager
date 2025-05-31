(function () {
    'use strict';

    class Main {
        constructor() {
            this.isUIInjected = false;
            this.uw = unsafeWindow;
            
            // Initialiseer globals
            this.playerName = '';
            this.server = '';
            this.forumManager = null;
            
            // Initialiseer modules
            this.modules = {
                attackRangeHelper: null,
                feestenFixed: null,
                militaryManager: null
            };

            this.init();
        }

        async init() {
            try {
                // Injecteer basisstijlen
                this.injectStyles();
                
                // Voeg hoofdknop toe
                this.addMainButton();
                
                // Initialiseer dependencies
                await this.initializeDependencies();
                
                // Initialiseer ForumManager met dependencies
                this.forumManager = new ForumManager(
                    this.modules.attackRangeHelper,
                    this.modules.feestenFixed,
                    this.modules.militaryManager
                );
                
                // Voer forummanager initialisatie uit
                this.forumManager.initializeScript();
                this.forumManager.fetchPlayerInfo();
                this.forumManager.injectAfwezigheidsassistent();
                
                console.log("Grepolis Manager succesvol geïnitialiseerd");
            } catch (error) {
                console.error("Initialisatiefout:", error);
            }
        }

        async initializeDependencies() {
            try {
                // Wacht tot game objecten beschikbaar zijn
                await this.waitForGameReady();
                
                // Initialiseer AttackRangeHelper
                this.modules.attackRangeHelper = new AttackRangeHelperManager(this.uw);
                await this.modules.attackRangeHelper.initialize();
                
                // Initialiseer FeestenFixed
                this.modules.feestenFixed = new FeestenFixedManager();
                
                // Initialiseer MilitaryManager
                this.modules.militaryManager = new MilitaryManager();
                
                console.log("Dependencies geïnitialiseerd");
            } catch (e) {
                console.error("Fout bij initialiseren dependencies:", e);
                // Fallback voor helpers
                this.modules.attackRangeHelper = this.createFallbackHelper();
            }
        }

        waitForGameReady() {
            return new Promise((resolve, reject) => {
                let attempts = 0;
                const check = () => {
                    if (typeof this.uw.Game !== 'undefined' &&
                        typeof this.uw.ITowns !== 'undefined') {
                        resolve();
                    } else if (attempts < 30) {
                        attempts++;
                        setTimeout(check, 250);
                    } else {
                        reject(new Error("Game objecten niet gevonden"));
                    }
                };
                check();
            });
        }

        createFallbackHelper() {
            return {
                toggle: () => console.error('Helper niet beschikbaar'),
                showHelpPopup: () => console.error('Help niet beschikbaar'),
                townColoring: () => {}
            };
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
            button.addEventListener('click', () => {
                if (this.forumManager) {
                    this.forumManager.toggleMainWindow();
                }
            });
            document.body.appendChild(button);
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
                #create-all {
                    background: black;
                    color: #FF0000;
                    border: 1px solid #FF0000;
                    padding: 10px 20px;
                    cursor: pointer;
                    font-size: 16px;
                    border-radius: 5px;
                    display: block;
                    margin: 20px auto;
                }
                #status-messages {
                    margin-top: 20px;
                    color: white;
                }
                #grepolis-manager-main-btn {
                    transition: transform 0.2s;
                }
                #grepolis-manager-main-btn:hover {
                    transform: scale(1.1);
                }
            `;
            const styleElement = document.createElement('style');
            styleElement.textContent = styles;
            document.head.appendChild(styleElement);
        }
    }

    // Initialiseer wanneer de DOM klaar is
    if (document.readyState === 'complete') {
        new Main();
    } else {
        window.addEventListener('load', () => {
            new Main();
        });
    }
})();
