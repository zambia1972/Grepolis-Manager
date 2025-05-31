// modules/helpers/attackRangeHelper.js
// Toont visueel het aanvalsbereik van steden op basis van puntenklasse

(function () {
    'use strict';

    const uw = unsafeWindow;

    class AttackRangeHelperManager {
        constructor(uwInstance) {
            this.uw = uwInstance;
            this.active = false;
            this.rangeLayer = null;
        }

        async initialize() {
            console.log('[AttackRangeHelper] Initialisatie gestart');
            await this.waitForGameReady();
            this.createLayer();
        }

        waitForGameReady() {
            return new Promise((resolve, reject) => {
                let attempts = 0;
                const check = () => {
                    if (typeof this.uw.Game !== 'undefined' && typeof this.uw.ITowns !== 'undefined') {
                        resolve();
                    } else if (attempts < 20) {
                        attempts++;
                        setTimeout(check, 250);
                    } else {
                        reject(new Error("AttackRangeHelper: Game objecten niet gevonden"));
                    }
                };
                check();
            });
        }

        createLayer() {
            if (typeof this.uw.GrepolisMap === 'undefined' || typeof this.uw.GrepolisMap.map === 'undefined') {
                console.error('[AttackRangeHelper] Map object niet gevonden');
                return;
            }

            this.rangeLayer = new this.uw.GrepolisMap.map.MapPolygonCollection();
            this.uw.GrepolisMap.map.overlay.add(this.rangeLayer);
        }

        toggle(state) {
            if (state === 'on') {
                this.active = true;
                this.townColoring();
            } else {
                this.active = false;
                this.clearOverlay();
            }
        }

        showHelpPopup() {
            alert(
                `AttackRange Helper - Uitleg\n\n` +
                `Deze functie kleurt steden op de kaart volgens hun puntenklasse.\n\n` +
                `🔵 < 3000 punten\n🟢 3000 - 5000 punten\n🟡 5000 - 8000 punten\n🔴 > 8000 punten`
            );
        }

        townColoring() {
            if (!this.active) return;

            const towns = this.uw.ITowns.towns;

            if (!towns || Object.keys(towns).length === 0) {
                console.warn('[AttackRangeHelper] Geen steden gevonden');
                return;
            }

            this.clearOverlay();

            Object.values(towns).forEach(town => {
                const x = town.getX();
                const y = town.getY();
                const points = town.getPoints();
                const color = this.getColorByPoints(points);

                const radius = 5;
                const poly = new this.uw.GrepolisMap.map.Circle(x, y, radius, {
                    stroke: true,
                    stroke_color: '#000',
                    stroke_width: 1,
                    fill: true,
                    fill_color: color,
                    fill_opacity: 0.6,
                });

                this.rangeLayer.addCircle(poly);
            });

            console.log('[AttackRangeHelper] Steden gekleurd');
        }

        getColorByPoints(points) {
            if (points < 3000) return '#3399FF'; // blauw
            if (points < 5000) return '#00CC66'; // groen
            if (points < 8000) return '#FFCC00'; // geel
            return '#FF3333'; // rood
        }

        clearOverlay() {
            if (this.rangeLayer) {
                this.rangeLayer.clear();
            }
        }
    }

    uw.AttackRangeHelperManager = AttackRangeHelperManager;
})();
