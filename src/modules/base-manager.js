/**
 * Base Manager - Core functionality for all Grepolis Manager modules
 */

export default class BaseManager {
    constructor(mainManager) {
        this.main = mainManager;
        this.uw = mainManager?.uw || window; // Use window instead of unsafeWindow
        this._events = new Map();
        this._intervals = new Set();
        this._timeouts = new Set();
        this.initialized = false;
        this.logger = this._createLogger();
        this.accessToken = (typeof GM_getValue === 'function') ? GM_getValue('grepodata_token', null) : null;
    }

    // Logger utilities
    _createLogger() {
        return {
            log: (...args) => console.log(`[${this.constructor.name}]`, ...args),
            warn: (...args) => console.warn(`[${this.constructor.name}]`, ...args),
            error: (...args) => console.error(`[${this.constructor.name}]`, ...args),
            debug: (...args) => this.main?.debug && console.debug(`[${this.constructor.name}]`, ...args)
        };
    }

    // Event handling
    on(event, handler) {
        if (!this._events.has(event)) {
            this._events.set(event, new Set());
        }
        this._events.get(event).add(handler);
        return () => this.off(event, handler);
    }

    off(event, handler) {
        if (this._events.has(event)) {
            this._events.get(event).delete(handler);
        }
    }

    emit(event, ...args) {
        if (this._events.has(event)) {
            for (const handler of this._events.get(event)) {
                try {
                    handler(...args);
                } catch (e) {
                    console.error(`Error in event handler for '${event}':`, e);
                }
            }
        }
    }

    // Timing utilities
    setInterval(fn, delay, ...args) {
        const id = setInterval(fn, delay, ...args);
        this._intervals.add(id);
        return id;
    }

    clearInterval(id) {
        clearInterval(id);
        this._intervals.delete(id);
    }

    setTimeout(fn, delay, ...args) {
        const id = setTimeout(() => {
            this._timeouts.delete(id);
            fn(...args);
        }, delay);
        this._timeouts.add(id);
        return id;
    }

    clearTimeout(id) {
        clearTimeout(id);
        this._timeouts.delete(id);
    }

    // DOM utilities
    $(selector, context = document) {
        return context.querySelector(selector);
    }

    $$(selector, context = document) {
        return Array.from(context.querySelectorAll(selector));
    }

    createElement(tag, attributes = {}, children = []) {
        const el = document.createElement(tag);
        
        // Set attributes
        for (const [key, value] of Object.entries(attributes)) {
            if (key === 'class') {
                el.className = value;
            } else if (key === 'text') {
                el.textContent = value;
            } else if (key === 'html') {
                el.innerHTML = value;
            } else if (key.startsWith('on') && typeof value === 'function') {
                el[key] = value;
            } else if (value !== null && value !== undefined) {
                el.setAttribute(key, value);
            }
        }
        
        // Append children
        if (Array.isArray(children)) {
            children.forEach(child => {
                if (child instanceof Node) {
                    el.appendChild(child);
                } else if (typeof child === 'string' || typeof child === 'number') {
                    el.appendChild(document.createTextNode(child));
                }
            });
        } else if (children instanceof Node) {
            el.appendChild(children);
        } else if (typeof children === 'string' || typeof children === 'number') {
            el.appendChild(document.createTextNode(children));
        }
        
        return el;
    }

    // Storage utilities
    getStorage(key, defaultValue = null) {
        try {
            const value = GM_getValue(key, null);
            return value !== null ? JSON.parse(value) : defaultValue;
        } catch (e) {
            this.logger.error('Error reading from storage:', e);
            return defaultValue;
        }
    }

    setStorage(key, value) {
        try {
            GM_setValue(key, JSON.stringify(value));
            return true;
        } catch (e) {
            this.logger.error('Error writing to storage:', e);
            return false;
        }
    }

    removeStorage(key) {
        try {
            GM_deleteValue(key);
            return true;
        } catch (e) {
            this.logger.error('Error removing from storage:', e);
            return false;
        }
    }

    // Network utilities
    async fetchWithRetry(url, options = {}, retries = 3, delay = 1000) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.fetchWithRetry(url, options, retries - 1, delay * 2);
            }
            throw error;
        }
    }

    // Initialization
    async init() {
        if (this.initialized) return true;
        
        try {
            this.logger.log('Initializing...');
            await this.setup();
            this.initialized = true;
            this.logger.log('Initialized successfully');
            return true;
        } catch (error) {
            this.logger.error('Initialization failed:', error);
            return false;
        }
    }

    // Override this in child classes
    async setup() {
        // Initialize module here
    }

    // Cleanup
    destroy() {
        // Clear all intervals
        this._intervals.forEach(clearInterval);
        this._intervals.clear();
        
        // Clear all timeouts
        this._timeouts.forEach(clearTimeout);
        this._timeouts.clear();
        
        // Remove all event listeners
        this._events.clear();
        
        this.initialized = false;
        this.logger.log('Destroyed');
    }
}

// Add static initialization method
BaseManager.init = async function(mainManager) {
    const instance = new this(mainManager);
    await instance.init();
    return instance;
};
