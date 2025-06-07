function FeestenFixedManager() {
class FeestenFixedManager {
    constructor() {
        this.container = null;
        this.box = null;
        this.triggerBtn = null;
        this.initialized = false;
        this.interval = null;
        this.helpPopup = null;
        this.isActive = false;
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
        styleElement.textContent = `/* jouw CSS hier, ingekort voor overzicht */`;
        document.head.appendChild(styleElement);
    }

    createUIElements() {
        this.container = document.createElement('div');
        this.container.id = 'feestenFixedContainer';
        document.body.appendChild(this.container);

        this.box = document.createElement('div');
        this.box.className = 'feestenFixedBox';
        this.container.appendChild(this.box);

        this.triggerBtn = document.createElement('button');
        this.triggerBtn.id = 'feestenFixedTrigger';
        this.triggerBtn.textContent = 'Toon SFs';
        this.container.appendChild(this.triggerBtn);

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
                    c.attributes?.town_id === townId && c.attributes?.celebration_type === 'party');

                const hasTheater = celebrations.some(c =>
                    c.attributes?.town_id === townId && c.attributes?.celebration_type === 'theater');

                let message = '';
                if (theaterLevel === 1 && !hasTheater) message += 'Activeer theater ';
                if (academyLevel >= 30 && !hasParty) message += 'Activeer SF ';

                if (message) {
                    hasContent = true;
                    const townLink = this.generateTownLink(townId, townName);
                    const msgElement = document.createElement('div');
                    msgElement.innerHTML = `${townLink}: ${message}`;
                    this.box.appendChild(msgElement);
                }
            }

            if (!hasContent) {
                const msg = document.createElement('div');
                msg.textContent = 'Alle SFs en theaters in gebruik';
                this.box.appendChild(msg);
            }
        } catch (error) {
            const msg = document.createElement('div');
            msg.textContent = 'Fout bij ophalen data';
            msg.style.color = '#FF4444';
            this.box.appendChild(msg);
            console.error('FeestenFixed error:', error);
        }
    }

    generateTownLink(townId, townName) {
        const encodedData = btoa(JSON.stringify({
            id: townId, ix: 436, iy: 445, tp: 'town', name: townName
        }));
        return `<a href="#${encodedData}" class="gp_town_link">${townName}</a>`;
    }

    showCustomHelp() {
        const existing = document.getElementById('feestenfixed-help-popup');
        if (existing) existing.remove();

        const popup = document.createElement('div');
        popup.id = 'feestenfixed-help-popup';
        popup.innerHTML = `<!-- jouw help-popup HTML hier -->`;

        document.body.appendChild(popup);
        document.getElementById('close-feestenfixed-help').addEventListener('click', () => popup.remove());
    }
}

