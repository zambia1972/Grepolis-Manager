/**
 * Troop Manager - Handles troop management functionality
 */

export default class TroopManager {
    constructor(mainManager) {
        this.main = mainManager;
        this.initialized = false;
        this.units = [];
        this.templates = [];
        this.activeTemplate = null;
    }

    async init() {
        if (this.initialized) return true;
        
        try {
            this.logger.log('Initializing Troop Manager...');
            
            // Load saved templates
            this.templates = this.main.getStorage('gm_troop_templates', []);
            
            // Load unit data
            await this.loadUnitData();
            
            // Initialize UI if enabled
            if (this.main.getSetting('modules.troopManager', true)) {
                this.initUI();
            }
            
            this.initialized = true;
            this.logger.log('Troop Manager initialized');
            return true;
        } catch (error) {
            this.logger.error('Failed to initialize Troop Manager:', error);
            return false;
        }
    }

    async loadUnitData() {
        try {
            // Try to load from resource
            try {
                const unitsJson = GM_getResourceText('unitsJson');
                if (unitsJson) {
                    const data = JSON.parse(unitsJson);
                    if (data && data.units) {
                        this.units = data.units;
                        this.main.setStorage('gm_unit_data', data);
                        this.main.setStorage('gm_unit_data_updated', Date.now());
                        this.logger.log('Loaded unit data from resource');
                        return true;
                    }
                }
            } catch (e) {
                this.logger.warn('Failed to load unit data from resource, trying fallback...', e);
            }
            
            // Fallback to storage if available
            const cachedData = this.main.getStorage('gm_unit_data', null);
            if (cachedData && cachedData.units) {
                this.units = cachedData.units;
                this.logger.log('Using cached unit data');
                return true;
            }
            
            // Final fallback to default units
            this.units = this.getDefaultUnits();
            this.logger.warn('Using default unit data');
            return true;
            
        } catch (error) {
            this.logger.error('Failed to load unit data:', error);
            
            // Fallback to default units if available
            if (!this.units.length) {
                this.units = this.getDefaultUnits();
                this.logger.warn('Using default unit data as fallback');
            }
            
            return false;
        }
    }

    getDefaultUnits() {
        return [
            { id: 'sword', name: 'Swordsman', type: 'infantry', attack: 65, defense: 35, defenseCavalry: 50, defenseArcher: 40, speed: 5, capacity: 25 },
            { id: 'slinger', name: 'Slinger', type: 'archer', attack: 40, defense: 15, defenseCavalry: 30, defenseArcher: 10, speed: 6, capacity: 10 },
            { id: 'archer', name: 'Archer', type: 'archer', attack: 60, defense: 30, defenseCavalry: 40, defenseArcher: 30, speed: 6, capacity: 15 },
            { id: 'hoplite', name: 'Hoplite', type: 'infantry', attack: 30, defense: 70, defenseCavalry: 80, defenseArcher: 40, speed: 5, capacity: 20 },
            { id: 'horseman', name: 'Horseman', type: 'cavalry', attack: 40, defense: 30, defenseCavalry: 40, defenseArcher: 30, speed: 13, capacity: 50 },
            { id: 'catapult', name: 'Catapult', type: 'siege', attack: 75, defense: 30, defenseCavalry: 10, defenseArcher: 80, speed: 3, capacity: 0 },
            { id: 'chariot', name: 'Chariot', type: 'cavalry', attack: 60, defense: 50, defenseCavalry: 50, defenseArcher: 50, speed: 9, capacity: 35 },
            { id: 'giant', name: 'Giant', type: 'mythical', attack: 80, defense: 70, defenseCavalry: 60, defenseArcher: 90, speed: 4, capacity: 40 },
            { id: 'manticore', name: 'Manticore', type: 'mythical', attack: 90, defense: 60, defenseCavalry: 70, defenseArcher: 50, speed: 14, capacity: 25 },
            { id: 'minotaur', name: 'Minotaur', type: 'mythical', attack: 100, defense: 90, defenseCavalry: 80, defenseArcher: 70, speed: 7, capacity: 30 }
        ];
    }

    initUI() {
        // Add Troop Manager button to the main UI
        this.troopButton = this.main.ui.createButton('Troop Manager', {
            className: 'gm-troop-button',
            icon: 'troop',
            tooltip: 'Open Troop Manager',
            onClick: () => this.toggleTroopManager()
        });
        
        // Add button to the main UI container
        const container = document.querySelector('#gm-toolbar') || document.body;
        container.appendChild(this.troopButton);
        
        // Create troop manager container
        this.container = document.createElement('div');
        this.container.id = 'gm-troop-manager';
        this.container.className = 'gm-panel gm-hidden';
        this.container.innerHTML = `
            <div class="gm-panel-header">
                <h3>Troop Manager</h3>
                <button class="gm-close-button">&times;</button>
            </div>
            <div class="gm-panel-content">
                <div class="gm-troop-templates">
                    <div class="gm-troop-templates-header">
                        <h4>Templates</h4>
                        <button class="gm-button gm-small gm-new-template">+ New</button>
                    </div>
                    <div class="gm-troop-templates-list"></div>
                </div>
                <div class="gm-troop-editor">
                    <div class="gm-troop-units"></div>
                    <div class="gm-troop-stats"></div>
                    <div class="gm-troop-actions">
                        <button class="gm-button gm-primary gm-save-template">Save Template</button>
                        <button class="gm-button gm-delete-template">Delete</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.container);
        
        // Add event listeners
        this.container.querySelector('.gm-close-button').addEventListener('click', () => {
            this.hideTroopManager();
        });
        
        this.container.querySelector('.gm-new-template').addEventListener('click', () => {
            this.createNewTemplate();
        });
        
        this.container.querySelector('.gm-save-template').addEventListener('click', () => {
            this.saveCurrentTemplate();
        });
        
        this.container.querySelector('.gm-delete-template').addEventListener('click', () => {
            if (this.activeTemplate) {
                this.deleteTemplate(this.activeTemplate.id);
            }
        });
        
        // Render templates
        this.renderTemplates();
        
        // If no templates, create a default one
        if (this.templates.length === 0) {
            this.createNewTemplate();
        } else {
            // Load the first template
            this.loadTemplate(this.templates[0].id);
        }
    }

    createNewTemplate() {
        const newTemplate = {
            id: 'template-' + Date.now(),
            name: 'New Template',
            units: {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Initialize with zero units
        this.units.forEach(unit => {
            newTemplate.units[unit.id] = 0;
        });
        
        this.templates.push(newTemplate);
        this.saveTemplates();
        this.renderTemplates();
        this.loadTemplate(newTemplate.id);
        
        // Focus on the template name for editing
        setTimeout(() => {
            const nameInput = this.container.querySelector('.gm-template-name');
            if (nameInput) nameInput.focus();
        }, 100);
    }

    saveCurrentTemplate() {
        if (!this.activeTemplate) return;
        
        // Update unit counts from inputs
        const unitInputs = this.container.querySelectorAll('.gm-unit-count');
        unitInputs.forEach(input => {
            const unitId = input.dataset.unitId;
            const count = parseInt(input.value, 10) || 0;
            this.activeTemplate.units[unitId] = count;
        });
        
        // Update template name
        const nameInput = this.container.querySelector('.gm-template-name');
        if (nameInput) {
            this.activeTemplate.name = nameInput.value || 'Unnamed Template';
        }
        
        this.activeTemplate.updatedAt = new Date().toISOString();
        this.saveTemplates();
        this.renderTemplates();
        
        this.main.ui.showNotification('Template saved successfully', 'success');
    }

    deleteTemplate(templateId) {
        if (!confirm('Are you sure you want to delete this template?')) {
            return;
        }
        
        const index = this.templates.findIndex(t => t.id === templateId);
        if (index !== -1) {
            this.templates.splice(index, 1);
            this.saveTemplates();
            
            // Load another template if available
            if (this.templates.length > 0) {
                this.loadTemplate(this.templates[0].id);
            } else {
                this.createNewTemplate();
            }
            
            this.renderTemplates();
            this.main.ui.showNotification('Template deleted', 'success');
        }
    }

    loadTemplate(templateId) {
        this.activeTemplate = this.templates.find(t => t.id === templateId);
        if (!this.activeTemplate) return;
        
        // Update UI to show the active template
        this.renderTemplateEditor();
        this.renderTemplateStats();
        
        // Update active state in template list
        const templateElements = this.container.querySelectorAll('.gm-template-item');
        templateElements.forEach(el => {
            if (el.dataset.templateId === templateId) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        });
    }

    saveTemplates() {
        this.main.setStorage('gm_troop_templates', this.templates);
    }

    renderTemplates() {
        const templatesList = this.container.querySelector('.gm-troop-templates-list');
        if (!templatesList) return;
        
        templatesList.innerHTML = '';
        
        this.templates.forEach(template => {
            const templateEl = document.createElement('div');
            templateEl.className = 'gm-template-item';
            if (this.activeTemplate && template.id === this.activeTemplate.id) {
                templateEl.classList.add('active');
            }
            templateEl.dataset.templateId = template.id;
            
            const nameEl = document.createElement('div');
            nameEl.className = 'gm-template-name';
            nameEl.textContent = template.name;
            
            const unitCount = Object.values(template.units).reduce((sum, count) => sum + (parseInt(count, 10) || 0), 0);
            const countEl = document.createElement('div');
            countEl.className = 'gm-template-count';
            countEl.textContent = `${unitCount} units`;
            
            const dateEl = document.createElement('div');
            dateEl.className = 'gm-template-date';
            dateEl.textContent = new Date(template.updatedAt).toLocaleDateString();
            
            templateEl.appendChild(nameEl);
            templateEl.appendChild(countEl);
            templateEl.appendChild(dateEl);
            
            templateEl.addEventListener('click', () => {
                this.loadTemplate(template.id);
            });
            
            templatesList.appendChild(templateEl);
        });
    }

    renderTemplateEditor() {
        if (!this.activeTemplate || !this.container) return;
        
        const unitsContainer = this.container.querySelector('.gm-troop-units');
        if (!unitsContainer) return;
        
        unitsContainer.innerHTML = `
            <div class="gm-troop-template-header">
                <input type="text" class="gm-template-name" value="${this.escapeHtml(this.activeTemplate.name)}" placeholder="Template name">
            </div>
            <div class="gm-troop-units-grid">
                ${this.units.map(unit => {
                    const count = this.activeTemplate.units[unit.id] || 0;
                    return `
                        <div class="gm-unit-row">
                            <div class="gm-unit-name">${unit.name}</div>
                            <div class="gm-unit-controls">
                                <button class="gm-unit-btn gm-unit-decrease" data-unit-id="${unit.id}">-</button>
                                <input type="number" class="gm-unit-count" data-unit-id="${unit.id}" value="${count}" min="0">
                                <button class="gm-unit-btn gm-unit-increase" data-unit-id="${unit.id}">+</button>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
        
        // Add event listeners for unit controls
        unitsContainer.querySelectorAll('.gm-unit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const unitId = btn.dataset.unitId;
                const input = btn.closest('.gm-unit-controls').querySelector('.gm-unit-count');
                let value = parseInt(input.value, 10) || 0;
                
                if (btn.classList.contains('gm-unit-increase')) {
                    value++;
                } else if (btn.classList.contains('gm-unit-decrease')) {
                    value = Math.max(0, value - 1);
                }
                
                input.value = value;
                this.activeTemplate.units[unitId] = value;
                this.renderTemplateStats();
            });
        });
        
        // Add input event for direct number input
        unitsContainer.querySelectorAll('.gm-unit-count').forEach(input => {
            input.addEventListener('input', (e) => {
                const unitId = input.dataset.unitId;
                const value = parseInt(input.value, 10) || 0;
                this.activeTemplate.units[unitId] = value;
                this.renderTemplateStats();
            });
        });
    }

    renderTemplateStats() {
        if (!this.activeTemplate || !this.container) return;
        
        const statsContainer = this.container.querySelector('.gm-troop-stats');
        if (!statsContainer) return;
        
        // Calculate total units and resources
        let totalUnits = 0;
        let totalAttack = 0;
        let totalDefense = 0;
        let totalDefenseCavalry = 0;
        let totalDefenseArcher = 0;
        let totalCapacity = 0;
        let slowestSpeed = 0;
        
        this.units.forEach(unit => {
            const count = this.activeTemplate.units[unit.id] || 0;
            if (count > 0) {
                totalUnits += count;
                totalAttack += unit.attack * count;
                totalDefense += unit.defense * count;
                totalDefenseCavalry += unit.defenseCavalry * count;
                totalDefenseArcher += unit.defenseArcher * count;
                totalCapacity += unit.capacity * count;
                
                if (unit.speed > 0 && (slowestSpeed === 0 || unit.speed < slowestSpeed)) {
                    slowestSpeed = unit.speed;
                }
            }
        });
        
        // Calculate travel time (example calculation)
        const travelTime = slowestSpeed > 0 ? (100 / slowestSpeed).toFixed(1) : 0;
        
        statsContainer.innerHTML = `
            <div class="gm-stats-grid">
                <div class="gm-stat">
                    <div class="gm-stat-value">${totalUnits}</div>
                    <div class="gm-stat-label">Total Units</div>
                </div>
                <div class="gm-stat">
                    <div class="gm-stat-value">${totalAttack}</div>
                    <div class="gm-stat-label">Attack</div>
                </div>
                <div class="gm-stat">
                    <div class="gm-stat-value">${totalDefense}</div>
                    <div class="gm-stat-label">Defense</div>
                </div>
                <div class="gm-stat">
                    <div class="gm-stat-value">${totalDefenseCavalry}</div>
                    <div class="gm-stat-label">vs Cavalry</div>
                </div>
                <div class="gm-stat">
                    <div class="gm-stat-value">${totalDefenseArcher}</div>
                    <div class="gm-stat-label">vs Archers</div>
                </div>
                <div class="gm-stat">
                    <div class="gm-stat-value">${totalCapacity}</div>
                    <div class="gm-stat-label">Capacity</div>
                </div>
                <div class="gm-stat">
                    <div class="gm-stat-value">${slowestSpeed}</div>
                    <div class="gm-stat-label">Speed</div>
                </div>
                <div class="gm-stat">
                    <div class="gm-stat-value">${travelTime}</div>
                    <div class="gm-stat-label">Travel Time (min/100 fields)</div>
                </div>
            </div>
        `;
    }

    toggleTroopManager() {
        if (this.container.classList.contains('gm-hidden')) {
            this.showTroopManager();
        } else {
            this.hideTroopManager();
        }
    }

    showTroopManager() {
        if (!this.container) return;
        this.container.classList.remove('gm-hidden');
        this.renderTemplates();
        this.renderTemplateEditor();
        this.renderTemplateStats();
    }

    hideTroopManager() {
        if (this.container) {
            this.container.classList.add('gm-hidden');
        }
    }

    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Add logger methods
    get logger() {
        return {
            log: (...args) => console.log(`[TroopManager]`, ...args),
            warn: (...args) => console.warn(`[TroopManager]`, ...args),
            error: (...args) => console.error(`[TroopManager]`, ...args),
            debug: (...args) => this.main?.debug && console.debug(`[TroopManager]`, ...args)
        };
    }
}

// Add initialization method
TroopManager.init = async function(mainManager) {
    const instance = new this(mainManager);
    await instance.init();
    return instance;
};
