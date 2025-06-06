export function startFeestenManager() {
    const manager = new FeestenManager();
    manager.show(); // of een init functie
}

    class FeestenFixedManager {
        constructor() {
            this.container = null;
            this.box = null;
            this.triggerBtn = null;
            this.initialized = false;
            this.interval = null;
            this.helpPopup = null;
            this.isActive = false; // Start inactive until toggled

            this.init();
        }

        init() {
            if (this.initialized) return;

            this.addStyles();
            this.createUIElements();
            this.initialized = true;
        }

        toggle(state) {
            this.isActive = state === 'on';
            if (this.isActive && this.container) {
                this.container.style.display = 'block';
                this.refreshContent();
                this.interval = setInterval(() => this.refreshContent(), 10000);
            } else if (this.container) {
                this.container.style.display = 'none';
                clearInterval(this.interval);
            }
        }

        show() {
            if (!this.container) return;
            this.container.style.display = 'block';
            this.isActive = true;
            this.refreshContent();
            this.interval = setInterval(() => this.refreshContent(), 10000);
        }

        hide() {
            if (!this.container) return;
            this.container.style.display = 'none';
            this.box.style.display = 'none';
            this.isActive = false;
            if (this.triggerBtn) this.triggerBtn.classList.remove('active');
            if (this.interval) {
                clearInterval(this.interval);
                this.interval = null;
            }
        }

        addStyles() {
            const styleElement = document.createElement('style');
            styleElement.textContent = `
            #feestenFixedContainer {
                position: fixed;
                top: 8px;
                left: 380px;  /* 350px from left */
                z-index: 9999;  /* Higher z-index */
            }

            #feestenFixedTrigger {
            width: 60px;  /* 100px width */
            height: 18px;  /* 20px height */
            background-color: #1e1e1e;
            color: #FF0000;
            border: 1px solid #FF0000;
            padding: 0;  /* Remove padding */
            font-size: 12px;  /* Smaller font */
            cursor: pointer;
            z-index: 10000;  /* Higher z-index */
            border-radius: 3px;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        #feestenFixedTrigger:hover {
            background-color: #FF0000 !important;
            color: white !important;
        }

        #feestenFixedTrigger.active {
            background-color: #f44336 !important;
            color: white !important;
        }

        .feestenFixedBox {
            position: absolute;
            top: 55px;  /* Position below button */
            left: 0;
            background-color: rgba(30, 30, 30, 0.9);
            border: 1px solid #FF0000;
            padding: 10px;
            width: 300px;
            max-height: 400px;
            overflow: auto;
            border-radius: 10px;
            display: none;
            color: white;
            font-family: Arial, sans-serif;
            z-index: 9998;
        }
            .feestenFixedBox div {
                margin: 5px 0;
                padding: 5px;
                background-color: rgba(255, 255, 255, 0.1);
                border-radius: 3px;
            }

            .feestenFixedBox a {
                color: #FF4444;
                text-decoration: none;
            }

            .feestenFixedBox a:hover {
                text-decoration: underline;
            }
        `;
            document.head.appendChild(styleElement);
        }

        createUIElements() {
            // Main container
            this.container = document.createElement('div');
            this.container.id = 'feestenFixedContainer';
            document.body.appendChild(this.container);

            // Content box
            this.box = document.createElement('div');
            this.box.className = 'feestenFixedBox';
            this.container.appendChild(this.box);

            // Trigger button
            this.triggerBtn = document.createElement('button');
            this.triggerBtn.id = 'feestenFixedTrigger';
            this.triggerBtn.textContent = 'Toon SFs';
            this.container.appendChild(this.triggerBtn);

            // Event listeners
            this.triggerBtn.addEventListener('click', () => this.toggleBox());
        }

        toggleBox() {
            if (!this.box) return;
            if (this.box.style.display === 'block') {
                this.box.style.display = 'none';
                this.triggerBtn.classList.remove('active');
            } else {
                this.box.style.display = 'block';
                this.triggerBtn.classList.add('active');
                this.refreshContent();
            }
        }

        refreshContent() {
            if (!this.box || !this.isActive) return;

            this.box.innerHTML = '';

            try {
                const celebrations = Object.values(unsafeWindow.MM.getModels().Celebration || {});
                const towns = Object.values(unsafeWindow.ITowns.getTowns() || {});
                let hasContent = false;

                for (const town of towns) {
                    const townId = town.getId();
                    const townName = town.getName();
                    const theaterLevel = town.buildings()?.attributes?.theater || 0;
                    const academyLevel = town.buildings()?.attributes?.academy || 0;

                    const hasParty = celebrations.some(c =>
                                                       c.attributes?.town_id === townId &&
                                                       c.attributes?.celebration_type === 'party'
                                                      );

                    const hasTheater = celebrations.some(c =>
                                                         c.attributes?.town_id === townId &&
                                                         c.attributes?.celebration_type === 'theater'
                                                        );

                    let message = '';
                    if (theaterLevel === 1 && !hasTheater) {
                        message += 'Activeer theater ';
                    }
                    if (academyLevel >= 30 && !hasParty) {
                        message += 'Activeer SF ';
                    }

                    if (message) {
                        hasContent = true;
                        const townLink = this.generateTownLink(townId, townName);
                        const msgElement = document.createElement('div');
                        msgElement.innerHTML = `${townLink}: ${message}`;
                        this.box.appendChild(msgElement);
                    }
                }

                if (!hasContent) {
                    const defaultMsg = document.createElement('div');
                    defaultMsg.textContent = 'Alle SFs en theaters in gebruik';
                    this.box.appendChild(defaultMsg);
                }
            } catch (error) {
                const errorMsg = document.createElement('div');
                errorMsg.textContent = 'Fout bij ophalen data';
                errorMsg.style.color = '#FF4444';
                this.box.appendChild(errorMsg);
                console.error('FeestenFixed error:', error);
            }
        }

        generateTownLink(townId, townName) {
            const encodedData = btoa(JSON.stringify({
                id: townId,
                ix: 436,
                iy: 445,
                tp: 'town',
                name: townName
            }));
            return `<a href="#${encodedData}" class="gp_town_link">${townName}</a>`;
        }

        showCustomHelp() {
            const existing = document.getElementById('feestenfixed-help-popup');
            if (existing) existing.remove();

            const popup = document.createElement('div');
            popup.id = 'feestenfixed-help-popup';
            popup.style.cssText = `
        position: fixed;
        top: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: #1e1e1e;
        color: white;
        border: 2px solid #FF0000;
        padding: 20px;
        border-radius: 10px;
        z-index: 75;
        max-width: 500px;
        box-shadow: 0 0 15px #FF0000;
        font-family: Arial, sans-serif;
    `;
            popup.innerHTML = `
            <div style="border-bottom: 1px solid #444; margin-bottom: 15px;">
                <h2 style="color: #FF0000; margin: 0 0 10px 0;">FeestenFixed Help</h2>
            </div>

            <div style="margin-bottom: 15px;">
                <h3 style="color: #FF8888; margin: 0 0 8px 0;">Functionaliteit</h3>
                <p>Dit hulpmiddel identificeert steden waar:</p>
                <ul style="margin: 8px 0 0 20px; padding: 0;">
                    <li>Stadsfeesten (SF) geactiveerd kunnen worden</li>
                    <li>Theatervoorstellingen gestart kunnen worden</li>
                </ul>
            </div>

            <div style="margin-bottom: 15px;">
                <h3 style="color: #FF8888; margin: 0 0 8px 0;">Vereisten</h3>
                <ul style="margin: 8px 0 0 20px; padding: 0;">
                    <li><strong>Stadsfeest:</strong> Academie niveau 30+</li>
                    <li><strong>Theater:</strong> Theater gebouw niveau 1</li>
                </ul>
            </div>

            <div style="margin-bottom: 20px;">
                <h3 style="color: #FF8888; margin: 0 0 8px 0;">Gebruiksaanwijzing</h3>
                <ol style="margin: 8px 0 0 20px; padding: 0;">
                    <li>Activeer FeestenFixed via de toggle switch</li>
                    <li>Klik op "Show SFs" knop rechtsonder</li>
                    <li>Klik op stadnamen om direct te navigeren</li>
                    <li>Automatische refresh elke 10 seconden</li>
                </ol>
            </div>

            <div style="text-align: center;">
                <button id="close-feestenfixed-help" style="
            display:block; margin:20px auto 0;
            background:black; color:white;
            padding:5px 15px; border:1px solid #FF0000;
            border-radius:5px; cursor:pointer;">Sluiten</button>
    `;

            document.body.appendChild(popup);

            document.getElementById('close-feestenfixed-help').addEventListener('click', () => popup.remove());
        }
    }
}
