// modules/militaryManager.js
// Module voor militaire functies zoals troepenbeheer, aanvallen en verdediging

(function () {
    'use strict';

    const uw = unsafeWindow;

    class MilitaryManager {
        constructor() {
            this.initialized = false;
            this.init();
        }

        init() {
            if (this.initialized) return;
            this.initialized = true;

            console.log('[MilitaryManager] Initialisatie voltooid');
            this.createUI();
        }

        createUI() {
            const container = document.createElement('div');
            container.id = 'military-manager-ui';
            container.style.cssText = `
                position: fixed;
                top: 100px;
                right: 30px;
                background: #1e1e1e;
                color: white;
                border: 2px solid #FF0000;
                border-radius: 10px;
                padding: 10px;
                z-index: 99999;
                display: none;
                width: 300px;
            `;

            const title = document.createElement('h3');
            title.textContent = 'Militaire Manager';
            title.style.cssText = 'color: #FF0000; margin-top: 0; text-align: center;';

            const msg = document.createElement('p');
            msg.textContent = 'Deze module wordt later uitgebreid met militaire functies.';

            container.appendChild(title);
            container.appendChild(msg);
            document.body.appendChild(container);

            this.uiElement = container;
        }

        show() {
            if (this.uiElement) {
                this.uiElement.style.display = 'block';
            }
        }

        hide() {
            if (this.uiElement) {
                this.uiElement.style.display = 'none';
            }
        }

        toggle() {
            if (!this.uiElement) return;
            const visible = this.uiElement.style.display === 'block';
            this.uiElement.style.display = visible ? 'none' : 'block';
        }

        showHelp() {
            alert(
                `Militaire Manager – In ontwikkeling\n\n` +
                `Deze module zal in toekomstige versies functies bevatten zoals:\n` +
                `• Aanvalsplanning\n` +
                `• Troepenoverzicht\n` +
                `• Defensieve berekeningen\n\n` +
                `Blijf op de hoogte!`
            );
        }
    }

    uw.MilitaryManager = MilitaryManager;
})();
