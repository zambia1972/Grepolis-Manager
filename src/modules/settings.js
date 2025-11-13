/**
 * Settings Manager - Handles user preferences and configuration
 */

export default class SettingsManager {
    constructor(mainManager) {
        this.main = mainManager;
        this.settings = {
            debug: false,
            autoUpdate: true,
            updateInterval: 300,
            notifications: {
                enabled: true,
                sound: true,
                desktop: false
            },
            modules: {
                troopManager: true,
                forumManager: true,
                mapOverlay: true,
                wereldInfo: true,
                supabaseSync: false
            },
            // Add more settings as needed
        };
        
        // Load saved settings
        this.load();
    }

    // Load settings from storage
    load() {
        try {
            const savedSettings = this.main.getStorage('gm_settings', {});
            this.settings = this._deepMerge(this.settings, savedSettings);
            this.main.debug = this.settings.debug;
            return true;
        } catch (e) {
            console.error('Failed to load settings:', e);
            return false;
        }
    }

    // Save settings to storage
    save() {
        try {
            this.main.setStorage('gm_settings', this.settings);
            this.main.debug = this.settings.debug;
            return true;
        } catch (e) {
            console.error('Failed to save settings:', e);
            return false;
        }
    }

    // Get a setting value by dot notation path
    get(path, defaultValue = null) {
        return path.split('.').reduce((obj, key) => {
            return (obj && obj[key] !== undefined) ? obj[key] : defaultValue;
        }, this.settings);
    }

    // Set a setting value by dot notation path
    set(path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((obj, key) => {
            if (!obj[key]) obj[key] = {};
            return obj[key];
        }, this.settings);
        
        target[lastKey] = value;
        this.save();
        this.main.emit('settingsChanged', { path, value });
        return true;
    }

    // Toggle a boolean setting
    toggle(path) {
        const current = this.get(path);
        if (typeof current === 'boolean') {
            this.set(path, !current);
            return !current;
        }
        return current;
    }

    // Reset all settings to defaults
    reset() {
        const currentModules = { ...this.settings.modules };
        this.settings = {
            debug: false,
            autoUpdate: true,
            updateInterval: 300,
            notifications: {
                enabled: true,
                sound: true,
                desktop: false
            },
            modules: currentModules
        };
        this.save();
        return true;
    }

    // Deep merge helper function
    _deepMerge(target, source) {
        const output = { ...target };
        
        if (this._isObject(target) && this._isObject(source)) {
            Object.keys(source).forEach(key => {
                if (this._isObject(source[key])) {
                    if (!(key in target)) {
                        Object.assign(output, { [key]: source[key] });
                    } else {
                        output[key] = this._deepMerge(target[key], source[key]);
                    }
                } else {
                    Object.assign(output, { [key]: source[key] });
                }
            });
        }
        
        return output;
    }

    // Check if value is an object
    _isObject(item) {
        return item && typeof item === 'object' && !Array.isArray(item);
    }

    // Render settings UI
    render(container) {
        if (!container) return;
        
        container.innerHTML = '';
        
        // General settings
        const generalSection = this._createSection('General Settings');
        generalSection.appendChild(this._createToggle('debug', 'Debug Mode', 'Enable debug logging'));
        generalSection.appendChild(this._createToggle('autoUpdate', 'Auto Update', 'Automatically update data'));
        generalSection.appendChild(this._createNumberInput('updateInterval', 'Update Interval (seconds)', 60, 3600, 60, 'Time between automatic updates'));
        
        // Notifications
        const notifSection = this._createSection('Notifications');
        notifSection.appendChild(this._createToggle('notifications.enabled', 'Enable Notifications', 'Show in-game notifications'));
        notifSection.appendChild(this._createToggle('notifications.sound', 'Enable Sounds', 'Play sounds for notifications', this.settings.notifications.enabled));
        notifSection.appendChild(this._createToggle('notifications.desktop', 'Desktop Notifications', 'Show desktop notifications', this.settings.notifications.enabled));
        
        // Modules
        const modulesSection = this._createSection('Modules');
        Object.entries(this.settings.modules).forEach(([key, value]) => {
            modulesSection.appendChild(this._createToggle(`modules.${key}`, this._formatKey(key), `Enable ${key} module`));
        });
        
        // Buttons
        const buttonSection = document.createElement('div');
        buttonSection.className = 'gm-settings-buttons';
        
        const saveBtn = document.createElement('button');
        saveBtn.className = 'gm-button primary';
        saveBtn.textContent = 'Save Settings';
        saveBtn.onclick = () => this.save();
        
        const resetBtn = document.createElement('button');
        resetBtn.className = 'gm-button';
        resetBtn.textContent = 'Reset to Defaults';
        resetBtn.onclick = () => {
            if (confirm('Are you sure you want to reset all settings to default?')) {
                this.reset();
                this.render(container);
            }
        };
        
        buttonSection.appendChild(saveBtn);
        buttonSection.appendChild(resetBtn);
        
        // Append all sections
        container.appendChild(generalSection);
        container.appendChild(notifSection);
        container.appendChild(modulesSection);
        container.appendChild(buttonSection);
    }
    
    // Helper to create a section header
    _createSection(title) {
        const section = document.createElement('div');
        section.className = 'gm-settings-section';
        
        const header = document.createElement('h3');
        header.textContent = title;
        header.className = 'gm-settings-header';
        
        const content = document.createElement('div');
        content.className = 'gm-settings-content';
        
        section.appendChild(header);
        section.appendChild(content);
        return content.parentNode;
    }
    
    // Helper to create a toggle switch
    _createToggle(path, label, description, enabled = true) {
        const container = document.createElement('div');
        container.className = 'gm-setting';
        if (!enabled) container.classList.add('disabled');
        
        const labelEl = document.createElement('label');
        labelEl.className = 'gm-toggle';
        
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = this.get(path, false);
        input.onchange = (e) => this.set(path, e.target.checked);
        if (!enabled) input.disabled = true;
        
        const slider = document.createElement('span');
        slider.className = 'gm-slider';
        
        const text = document.createElement('span');
        text.className = 'gm-setting-text';
        
        const title = document.createElement('div');
        title.className = 'gm-setting-title';
        title.textContent = label;
        
        const desc = document.createElement('div');
        desc.className = 'gm-setting-desc';
        desc.textContent = description;
        
        text.appendChild(title);
        text.appendChild(desc);
        
        labelEl.appendChild(input);
        labelEl.appendChild(slider);
        
        container.appendChild(labelEl);
        container.appendChild(text);
        
        return container;
    }
    
    // Helper to create a number input
    _createNumberInput(path, label, min, max, step, description) {
        const container = document.createElement('div');
        container.className = 'gm-setting';
        
        const labelEl = document.createElement('label');
        labelEl.className = 'gm-number-input';
        
        const text = document.createElement('span');
        text.className = 'gm-setting-text';
        
        const title = document.createElement('div');
        title.className = 'gm-setting-title';
        title.textContent = label;
        
        const desc = document.createElement('div');
        desc.className = 'gm-setting-desc';
        desc.textContent = description;
        
        const inputContainer = document.createElement('div');
        inputContainer.className = 'gm-input-container';
        
        const input = document.createElement('input');
        input.type = 'number';
        input.min = min;
        input.max = max;
        input.step = step;
        input.value = this.get(path, min);
        input.onchange = (e) => {
            let value = parseInt(e.target.value, 10);
            if (value < min) value = min;
            if (value > max) value = max;
            this.set(path, value);
            e.target.value = value;
        };
        
        text.appendChild(title);
        text.appendChild(desc);
        
        inputContainer.appendChild(input);
        
        labelEl.appendChild(text);
        labelEl.appendChild(inputContainer);
        
        container.appendChild(labelEl);
        
        return container;
    }
    
    // Format module key to display name
    _formatKey(key) {
        return key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }
}

// Add initialization method
SettingsManager.init = async function(mainManager) {
    const instance = new this(mainManager);
    await instance.init();
    return instance;
};
