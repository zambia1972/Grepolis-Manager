/**
 * UI Helpers - Common UI components and utilities
 */

export default class UIHelpers {
    constructor(mainManager) {
        this.main = mainManager;
        this.notificationContainer = null;
        this.tooltip = null;
        this.loadingOverlay = null;
        this.initElements();
    }

    // Initialize UI elements
    initElements() {
        // Create notification container if it doesn't exist
        if (!document.getElementById('gm-notifications')) {
            this.notificationContainer = document.createElement('div');
            this.notificationContainer.id = 'gm-notifications';
            this.notificationContainer.className = 'gm-notifications';
            document.body.appendChild(this.notificationContainer);
        }

        // Create tooltip element if it doesn't exist
        if (!document.getElementById('gm-tooltip')) {
            this.tooltip = document.createElement('div');
            this.tooltip.id = 'gm-tooltip';
            this.tooltip.className = 'gm-tooltip';
            document.body.appendChild(this.tooltip);
        }

        // Create loading overlay if it doesn't exist
        if (!document.getElementById('gm-loading-overlay')) {
            this.loadingOverlay = document.createElement('div');
            this.loadingOverlay.id = 'gm-loading-overlay';
            this.loadingOverlay.className = 'gm-loading-overlay';
            this.loadingOverlay.innerHTML = `
                <div class="gm-spinner"></div>
                <div class="gm-loading-text">Loading...</div>
            `;
            document.body.appendChild(this.loadingOverlay);
        }
    }

    // Show a notification
    showNotification(message, type = 'info', duration = 5000) {
        if (!this.main.getSetting('notifications.enabled', true)) return;

        const notification = document.createElement('div');
        notification.className = `gm-notification gm-notification-${type}`;
        notification.textContent = message;
        
        if (this.main.getSetting('notifications.sound', true) && type !== 'info') {
            this.playSound(type === 'error' ? 'error' : 'notification');
        }

        if (this.main.getSetting('notifications.desktop', false) && window.Notification) {
            this.showDesktopNotification(message, type);
        }

        this.notificationContainer.appendChild(notification);
        
        // Auto-remove notification after duration
        setTimeout(() => {
            notification.classList.add('gm-notification-hide');
            setTimeout(() => {
                if (notification.parentNode === this.notificationContainer) {
                    this.notificationContainer.removeChild(notification);
                }
            }, 300);
        }, duration);
        
        return notification;
    }

    // Show desktop notification
    showDesktopNotification(message, type = 'info') {
        if (window.Notification && Notification.permission === 'granted') {
            new Notification(`Grepolis Manager - ${type.charAt(0).toUpperCase() + type.slice(1)}`, {
                body: message,
                icon: GM_getResourceURL('iconGM')
            });
        } else if (window.Notification && Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    this.showDesktopNotification(message, type);
                }
            });
        }
    }

    // Show a tooltip
    showTooltip(element, content, position = 'top') {
        if (!this.tooltip) return;
        
        this.tooltip.innerHTML = content;
        this.tooltip.className = `gm-tooltip gm-tooltip-${position}`;
        
        const rect = element.getBoundingClientRect();
        let left, top;
        
        switch (position) {
            case 'top':
                left = rect.left + (rect.width / 2);
                top = rect.top - 10;
                this.tooltip.style.transform = 'translate(-50%, -100%)';
                break;
            case 'bottom':
                left = rect.left + (rect.width / 2);
                top = rect.bottom + 10;
                this.tooltip.style.transform = 'translate(-50%, 0)';
                break;
            case 'left':
                left = rect.left - 10;
                top = rect.top + (rect.height / 2);
                this.tooltip.style.transform = 'translate(-100%, -50%)';
                break;
            case 'right':
                left = rect.right + 10;
                top = rect.top + (rect.height / 2);
                this.tooltip.style.transform = 'translate(0, -50%)';
                break;
        }
        
        this.tooltip.style.left = `${left}px`;
        this.tooltip.style.top = `${top}px`;
        this.tooltip.classList.add('gm-tooltip-visible');
        
        return () => this.hideTooltip();
    }

    // Hide tooltip
    hideTooltip() {
        if (this.tooltip) {
            this.tooltip.classList.remove('gm-tooltip-visible');
        }
    }

    // Show loading overlay
    showLoading(message = 'Loading...') {
        if (this.loadingOverlay) {
            const textEl = this.loadingOverlay.querySelector('.gm-loading-text');
            if (textEl) textEl.textContent = message;
            this.loadingOverlay.classList.add('gm-loading-visible');
            document.body.style.overflow = 'hidden';
        }
    }

    // Hide loading overlay
    hideLoading() {
        if (this.loadingOverlay) {
            this.loadingOverlay.classList.remove('gm-loading-visible');
            document.body.style.overflow = '';
        }
    }

    // Create a button
    createButton(text, options = {}) {
        const button = document.createElement('button');
        button.className = 'gm-button';
        button.textContent = text;
        
        if (options.className) {
            button.classList.add(...options.className.split(' '));
        }
        
        if (options.icon) {
            const icon = document.createElement('span');
            icon.className = `gm-icon gm-icon-${options.icon}`;
            button.prepend(icon);
            button.classList.add('gm-button-with-icon');
        }
        
        if (options.tooltip) {
            button.addEventListener('mouseenter', (e) => {
                this.showTooltip(button, options.tooltip, options.tooltipPosition || 'top');
            });
            button.addEventListener('mouseleave', () => this.hideTooltip());
        }
        
        if (options.onClick) {
            button.addEventListener('click', options.onClick);
        }
        
        if (options.disabled) {
            button.disabled = true;
        }
        
        return button;
    }

    // Create a modal dialog
    createModal(options = {}) {
        const modal = document.createElement('div');
        modal.className = 'gm-modal';
        
        const dialog = document.createElement('div');
        dialog.className = 'gm-modal-dialog';
        
        if (options.title) {
            const header = document.createElement('div');
            header.className = 'gm-modal-header';
            header.innerHTML = `
                <h3 class="gm-modal-title">${options.title}</h3>
                <button class="gm-modal-close">&times;</button>
            `;
            dialog.appendChild(header);
            
            // Close button
            header.querySelector('.gm-modal-close').addEventListener('click', () => {
                this.closeModal(modal);
            });
        }
        
        const body = document.createElement('div');
        body.className = 'gm-modal-body';
        
        if (typeof options.content === 'string') {
            body.innerHTML = options.content;
        } else if (options.content instanceof Node) {
            body.appendChild(options.content);
        }
        
        dialog.appendChild(body);
        
        if (options.buttons && options.buttons.length > 0) {
            const footer = document.createElement('div');
            footer.className = 'gm-modal-footer';
            
            options.buttons.forEach(btn => {
                const button = this.createButton(btn.text, {
                    className: btn.className || '',
                    onClick: (e) => {
                        if (btn.handler) btn.handler(e);
                        if (btn.closeOnClick !== false) this.closeModal(modal);
                    }
                });
                footer.appendChild(button);
            });
            
            dialog.appendChild(footer);
        }
        
        modal.appendChild(dialog);
        
        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal && options.closeOnBackdrop !== false) {
                this.closeModal(modal);
            }
        });
        
        // Close on Escape key
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && options.closeOnEscape !== false) {
                this.closeModal(modal);
            }
        };
        
        document.addEventListener('keydown', handleKeyDown);
        
        // Store handler for cleanup
        modal._keyDownHandler = handleKeyDown;
        
        return modal;
    }

    // Show modal
    showModal(modal) {
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        // Trigger reflow to enable CSS transition
        void modal.offsetWidth;
        
        modal.classList.add('gm-modal-visible');
        
        // Focus first focusable element
        const focusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable) focusable.focus();
        
        return modal;
    }

    // Close modal
    closeModal(modal) {
        if (!modal || !modal.parentNode) return;
        
        modal.classList.remove('gm-modal-visible');
        
        // Remove event listener
        if (modal._keyDownHandler) {
            document.removeEventListener('keydown', modal._keyDownHandler);
            delete modal._keyDownHandler;
        }
        
        // Remove from DOM after transition
        setTimeout(() => {
            if (modal.parentNode) {
                document.body.removeChild(modal);
            }
            
            // Restore body overflow if no other modals are open
            if (!document.querySelector('.gm-modal-visible')) {
                document.body.style.overflow = '';
            }
        }, 300);
    }

    // Play a sound
    playSound(type = 'notification') {
        const sounds = {
            notification: 'https://assets.mixkit.co/active_modules/audio-preview-3/1093.mp3',
            success: 'https://assets.mixkit.co/active_modules/audio-preview-3/1093.mp3',
            error: 'https://assets.mixkit.co/active_modules/audio-preview-3/1093.mp3',
            alert: 'https://assets.mixkit.co/active_modules/audio-preview-3/1093.mp3'
        };
        
        if (sounds[type]) {
            const audio = new Audio(sounds[type]);
            audio.volume = 0.5;
            audio.play().catch(e => console.error('Error playing sound:', e));
        }
    }

    // Format a number with thousands separator
    formatNumber(num, decimals = 0) {
        return new Intl.NumberFormat(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(num);
    }

    // Format a duration in seconds to HH:MM:SS
    formatDuration(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        
        return [
            h.toString().padStart(2, '0'),
            m.toString().padStart(2, '0'),
            s.toString().padStart(2, '0')
        ].join(':');
    }

    // Format a date
    formatDate(date, format = 'short') {
        if (!(date instanceof Date)) {
            date = new Date(date);
        }
        
        return new Intl.DateTimeFormat(undefined, {
            dateStyle: format === 'short' ? 'short' : 'full',
            timeStyle: 'short'
        }).format(date);
    }

    // Create a tabbed interface
    createTabs(tabs, activeIndex = 0) {
        const container = document.createElement('div');
        container.className = 'gm-tabs';
        
        const tabBar = document.createElement('div');
        tabBar.className = 'gm-tab-bar';
        
        const content = document.createElement('div');
        content.className = 'gm-tab-content';
        
        let activeTab = null;
        
        tabs.forEach((tab, index) => {
            const tabButton = document.createElement('button');
            tabButton.className = 'gm-tab';
            tabButton.textContent = tab.label;
            tabButton.dataset.tabIndex = index;
            
            if (index === activeIndex) {
                tabButton.classList.add('gm-tab-active');
                activeTab = tab;
            }
            
            tabButton.addEventListener('click', () => {
                // Update active tab button
                tabBar.querySelectorAll('.gm-tab').forEach(btn => {
                    btn.classList.remove('gm-tab-active');
                });
                tabButton.classList.add('gm-tab-active');
                
                // Update content
                activeTab = tab;
                this._updateTabContent(content, tab);
            });
            
            tabBar.appendChild(tabButton);
        });
        
        // Set initial content
        this._updateTabContent(content, activeTab);
        
        container.appendChild(tabBar);
        container.appendChild(content);
        
        return container;
    }
    
    // Update tab content
    _updateTabContent(container, tab) {
        container.innerHTML = '';
        
        if (typeof tab.content === 'string') {
            container.innerHTML = tab.content;
        } else if (tab.content instanceof Node) {
            container.appendChild(tab.content);
        } else if (typeof tab.content === 'function') {
            const content = tab.content();
            if (content instanceof Promise) {
                container.textContent = 'Loading...';
                content.then(result => {
                    container.innerHTML = '';
                    if (typeof result === 'string') {
                        container.innerHTML = result;
                    } else if (result instanceof Node) {
                        container.appendChild(result);
                    }
                });
            } else if (content instanceof Node) {
                container.appendChild(content);
            } else if (typeof content === 'string') {
                container.innerHTML = content;
            }
        }
    }
}

// Add initialization method
UIHelpers.init = async function(mainManager) {
    const instance = new this(mainManager);
    await instance.init();
    return instance;
};
