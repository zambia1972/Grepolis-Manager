// modules/helpers/feestenFixedHelper.js
// Toont welke steden klaar zijn voor stadsfeest of theaterfeest

(function () {
    'use strict';

    const uw = unsafeWindow;

    class FeestenFixedManager {
        constructor() {
            this.isActive = false;
            this.container = null;
            this.box = null;
            this.triggerBtn = null;
            this.initialized = false;
            this.interval = null;
            this.helpPopup = null;

            this.init();
        }

        init() {
            if (this.initialized) return;

            this.addStyles();
            this.createUIElements();
            this.initialized = true;
        }

        toggle(state) {
            if (state === 'on') {
                this.show();
            } else {
                this.hide();
            }
        }

        show() {
            this.isActive = true;
            if (!this.box) return;
            this.box.style.display = 'block';
            this.refreshFeesten();
            this.interval = setInterval(() => this.refreshFeesten(), 60000); // elke minuut updaten
        }

        hide() {
            this.isActive = false;
            if (this.box) this.box.style.display = 'none';
            if (this.interval) {
                clearInterval(this.interval);
                this.interval = null;
            }
        }

        showCustomHelp() {
            alert(
                `FeestenFixed – Uitleg\n\n` +
                `Deze tool toont een lijst van je steden waar je direct een Stadsfeest of Theaterfeest kan starten.\n\n` +
                `✅ Voldoende grondstoffen\n✅ Niet in productie\n\n` +
                `De lijst wordt elke minuut automatisch vernieuwd.`
            );
        }

        addStyles() {
            const style = document.createElement('style');
            style.textContent = `
                #feesten-box {
                    position: fixed;
                    bottom: 130px;
                    left: 30px;
                    width: 300px;
                    max-height: 300px;
                    overflow-y: auto;
                    background: #1e1e1e;
                    color: white;
                    border: 2px solid #FF0000;
                    border-radius: 10px;
                    padding: 10px;
                    font-family: Arial, sans-serif;
                    z-index: 99998;
                    box-shadow: 0 0 10px #FF0000;
                }
                #feesten-box h3 {
                    margin-top: 0;
                    color: #FF0000;
                    text-align: center;
                    font-size: 16px;
                }
                #feesten-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                    font-size: 12px;
                }
                #feesten-list li {
                    padding: 5px 0;
                    border-bottom: 1px solid #444;
                }
            `;
            document.head.appendChild(style);
        }

        createUIElements() {
            this.box = document.createElement('div');
            this.box.id = 'feesten-box';
            this.box.style.display = 'none';

            const header = document.createElement('h3');
            header.textContent = 'Feestklare steden';

            this.container = document.createElement('ul');
            this.container.id = 'feesten-list';

            this.box.appendChild(header);
            this.box.appendChild(this.container);
            document.body.appendChild(this.box);
        }

        refreshFeesten() {
            if (!this.container) return;

            const towns = uw.ITowns.getAllTowns();
            const feastableTowns = [];

            for (const id in towns) {
                const town = towns[id];
                const data = town.buildings();

                const hasTheater = data.hasOwnProperty('theater');
                const hasCulturalBuilding = data.hasOwnProperty('cultural_site');
                const isFestivalRunning = town.getCelebrationEndTimestamp() > Timestamp.now();
                const canAffordFestival = this.canAffordFeast(town);

                if (!isFestivalRunning && canAffordFestival && (hasTheater || hasCulturalBuilding)) {
                    feastableTowns.push(town.name);
                }
            }

            // Update lijst
            this.container.innerHTML = '';
            if (feastableTowns.length === 0) {
                const empty = document.createElement('li');
                empty.textContent = 'Geen steden klaar voor feest';
                this.container.appendChild(empty);
            } else {
                feastableTowns.forEach(name => {
                    const li = document.createElement('li');
                    li.textContent = name;
                    this.container.appendChild(li);
                });
            }
        }

        canAffordFeast(town) {
            const res = town.resources();
            const wood = res.wood;
            const stone = res.stone;
            const iron = res.iron;

            // Normale stadsfeest kost (kan per wereld afwijken, dus schatting)
            return wood >= 15000 && stone >= 18000 && iron >= 15000;
        }
    }

    uw.FeestenFixedManager = FeestenFixedManager;
})();
