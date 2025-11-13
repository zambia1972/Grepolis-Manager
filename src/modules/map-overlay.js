/**
 * Map Overlay - Handles map-related functionality and overlays
 */

export default class MapOverlay {
    constructor(mainManager) {
        this.main = mainManager;
        this.initialized = false;
        this.mapData = {
            currentView: null,
            markers: {},
            overlays: {},
            lastUpdated: null
        };
        this.updateInterval = 30 * 1000; // 30 seconds
        this.mapContainer = null;
        this.isMapActive = false;
    }

    async init() {
        if (this.initialized) return true;
        
        try {
            this.logger.log('Initializing Map Overlay...');
            
            // Load cached data
            await this.loadCachedData();
            
            // Initialize UI if enabled
            if (this.main.getSetting('modules.mapOverlay', true)) {
                this.initUI();
                
                // Check if we're on the map page
                this.checkMapPage();
            }
            
            this.initialized = true;
            this.logger.log('Map Overlay initialized');
            return true;
        } catch (error) {
            this.logger.error('Failed to initialize Map Overlay:', error);
            return false;
        }
    }

    async loadCachedData() {
        try {
            const cachedData = this.main.getStorage('gm_map_data', null);
            if (cachedData) {
                this.mapData = { ...this.mapData, ...cachedData };
                this.logger.log('Loaded map data from cache');
            }
            return true;
        } catch (error) {
            this.logger.error('Failed to load cached map data:', error);
            return false;
        }
    }

    saveData() {
        try {
            this.main.setStorage('gm_map_data', this.mapData);
            return true;
        } catch (error) {
            this.logger.error('Failed to save map data:', error);
            return false;
        }
    }

    checkMapPage() {
        // Check if we're on the map page
        if (window.location.href.includes('/game/')) {
            this.setupMapObserver();
            
            // Also check immediately in case the map is already loaded
            this.initializeMapIfNeeded();
        }
    }

    setupMapObserver() {
        // Use MutationObserver to detect when the map is loaded or updated
        this.observer = new MutationObserver((mutations) => {
            this.initializeMapIfNeeded();
        });

        // Start observing the document with the configured parameters
        this.observer.observe(document.body, { 
            childList: true, 
            subtree: true,
            attributes: true,
            attributeFilter: ['class']
        });
    }

    initializeMapIfNeeded() {
        // Check if map container exists and we haven't initialized yet
        const mapContainer = document.querySelector('.map_container, #map_container');
        
        if (mapContainer && !this.isMapActive) {
            this.logger.log('Map container found, initializing map overlay...');
            this.mapContainer = mapContainer;
            this.isMapActive = true;
            
            // Initialize map overlay
            this.initializeMapOverlay();
            
            // Start periodic updates
            this.startMapUpdates();
            
            // Add event listeners
            this.addMapEventListeners();
        } else if (!mapContainer && this.isMapActive) {
            // Map was unloaded
            this.cleanupMap();
        }
    }

    initializeMapOverlay() {
        // Create overlay container
        this.overlayContainer = document.createElement('div');
        this.overlayContainer.id = 'gm-map-overlay';
        this.overlayContainer.style.position = 'absolute';
        this.overlayContainer.style.top = '0';
        this.overlayContainer.style.left = '0';
        this.overlayContainer.style.width = '100%';
        this.overlayContainer.style.height = '100%';
        this.overlayContainer.style.pointerEvents = 'none';
        this.overlayContainer.style.zIndex = '1000';
        this.overlayContainer.style.overflow = 'hidden';
        
        // Add overlay to map container
        this.mapContainer.style.position = 'relative';
        this.mapContainer.appendChild(this.overlayContainer);
        
        // Add map controls
        this.addMapControls();
        
        // Load initial map data
        this.updateMapData();
    }

    addMapControls() {
        // Create controls container
        this.controlsContainer = document.createElement('div');
        this.controlsContainer.className = 'gm-map-controls';
        this.controlsContainer.style.position = 'absolute';
        this.controlsContainer.style.top = '10px';
        this.controlsContainer.style.right = '10px';
        this.controlsContainer.style.zIndex = '1001';
        this.controlsContainer.style.pointerEvents = 'auto';
        
        // Add toggle buttons
        const controlsHTML = `
            <div class="gm-control-group">
                <button id="gm-toggle-grid" class="gm-button gm-small" title="Toggle Grid">
                    <span class="gm-icon">#</span>
                </button>
                <button id="gm-toggle-markers" class="gm-button gm-small" title="Toggle Markers">
                    <span class="gm-icon">📍</span>
                </button>
                <button id="gm-toggle-overlays" class="gm-button gm-small" title="Toggle Overlays">
                    <span class="gm-icon">◧</span>
                </button>
            </div>
            <div class="gm-control-group">
                <button id="gm-zoom-in" class="gm-button gm-small" title="Zoom In">
                    <span class="gm-icon">+</span>
                </button>
                <button id="gm-zoom-out" class="gm-button gm-small" title="Zoom Out">
                    <span class="gm-icon">−</span>
                </button>
            </div>
            <div class="gm-control-group">
                <button id="gm-center-on-me" class="gm-button gm-small" title="Center on Me">
                    <span class="gm-icon">⌖</span>
                </button>
                <button id="gm-settings" class="gm-button gm-small" title="Settings">
                    <span class="gm-icon">⚙</span>
                </button>
            </div>
        `;
        
        this.controlsContainer.innerHTML = controlsHTML;
        this.overlayContainer.appendChild(this.controlsContainer);
        
        // Add styles
        this.addMapStyles();
        
        // Add event listeners for controls
        this.setupControlEventListeners();
    }

    addMapStyles() {
        const styleId = 'gm-map-overlay-styles';
        
        // Don't inject if already exists
        if (document.getElementById(styleId)) return;
        
        const css = `
            /* Map overlay styles */
            .gm-map-controls {
                display: flex;
                flex-direction: column;
                gap: 5px;
                background: rgba(255, 255, 255, 0.9);
                padding: 8px;
                border-radius: 4px;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
            }
            
            .gm-control-group {
                display: flex;
                gap: 3px;
            }
            
            .gm-button {
                background: #f8f9fa;
                border: 1px solid #dadce0;
                border-radius: 4px;
                color: #3c4043;
                cursor: pointer;
                font-size: 14px;
                height: 28px;
                width: 28px;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 0;
                transition: all 0.2s;
            }
            
            .gm-button:hover {
                background: #f1f3f4;
                border-color: #d2e3fc;
            }
            
            .gm-button.active {
                background: #e8f0fe;
                border-color: #d2e3fc;
                color: #1967d2;
            }
            
            .gm-icon {
                font-size: 16px;
                line-height: 1;
            }
            
            /* Grid styles */
            .gm-grid-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                opacity: 0.3;
            }
            
            .gm-grid-line {
                position: absolute;
                background: #999;
            }
            
            .gm-grid-line.horizontal {
                width: 100%;
                height: 1px;
                left: 0;
            }
            
            .gm-grid-line.vertical {
                width: 1px;
                height: 100%;
                top: 0;
            }
            
            /* Marker styles */
            .gm-marker {
                position: absolute;
                width: 16px;
                height: 16px;
                background: #f44336;
                border: 2px solid #fff;
                border-radius: 50%;
                transform: translate(-50%, -50%);
                pointer-events: auto;
                cursor: pointer;
                z-index: 10;
            }
            
            .gm-marker::after {
                content: '';
                position: absolute;
                width: 8px;
                height: 8px;
                background: #fff;
                border-radius: 50%;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
            }
            
            .gm-marker.alliance {
                background: #4caf50;
            }
            
            .gm-marker.enemy {
                background: #f44336;
            }
            
            .gm-marker.neutral {
                background: #ff9800;
            }
            
            .gm-marker.important {
                width: 20px;
                height: 20px;
                border-width: 3px;
                z-index: 11;
            }
            
            /* Tooltip */
            .gm-tooltip {
                position: absolute;
                background: rgba(0, 0, 0, 0.8);
                color: #fff;
                padding: 5px 10px;
                border-radius: 4px;
                font-size: 12px;
                white-space: nowrap;
                pointer-events: none;
                z-index: 1000;
                transform: translateY(-100%) translateY(-10px);
                max-width: 200px;
                text-overflow: ellipsis;
                overflow: hidden;
            }
            
            .gm-tooltip::after {
                content: '';
                position: absolute;
                bottom: -5px;
                left: 50%;
                transform: translateX(-50%);
                border-width: 5px 5px 0;
                border-style: solid;
                border-color: rgba(0, 0, 0, 0.8) transparent transparent;
            }
            
            /* Minimap */
            .gm-minimap {
                position: absolute;
                bottom: 10px;
                right: 10px;
                width: 150px;
                height: 150px;
                background: rgba(255, 255, 255, 0.9);
                border: 1px solid #ddd;
                border-radius: 4px;
                z-index: 1000;
                overflow: hidden;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
            }
            
            .gm-viewport-rect {
                position: absolute;
                border: 2px solid #4285f4;
                background: rgba(66, 133, 244, 0.2);
                pointer-events: none;
            }
        `;
        
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = css;
        document.head.appendChild(style);
    }

    setupControlEventListeners() {
        // Toggle grid
        const toggleGridBtn = this.controlsContainer.querySelector('#gm-toggle-grid');
        if (toggleGridBtn) {
            toggleGridBtn.addEventListener('click', () => this.toggleGrid());
        }
        
        // Toggle markers
        const toggleMarkersBtn = this.controlsContainer.querySelector('#gm-toggle-markers');
        if (toggleMarkersBtn) {
            toggleMarkersBtn.addEventListener('click', () => this.toggleMarkers());
        }
        
        // Toggle overlays
        const toggleOverlaysBtn = this.controlsContainer.querySelector('#gm-toggle-overlays');
        if (toggleOverlaysBtn) {
            toggleOverlaysBtn.addEventListener('click', () => this.toggleOverlays());
        }
        
        // Zoom controls
        const zoomInBtn = this.controlsContainer.querySelector('#gm-zoom-in');
        const zoomOutBtn = this.controlsContainer.querySelector('#gm-zoom-out');
        
        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', () => this.zoomIn());
        }
        
        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', () => this.zoomOut());
        }
        
        // Center on me
        const centerOnMeBtn = this.controlsContainer.querySelector('#gm-center-on-me');
        if (centerOnMeBtn) {
            centerOnMeBtn.addEventListener('click', () => this.centerOnPlayer());
        }
        
        // Settings
        const settingsBtn = this.controlsContainer.querySelector('#gm-settings');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.showSettings());
        }
    }

    toggleGrid() {
        if (!this.gridOverlay) {
            this.createGridOverlay();
        } else {
            this.gridOverlay.style.display = 
                this.gridOverlay.style.display === 'none' ? 'block' : 'none';
        }
    }

    createGridOverlay() {
        this.gridOverlay = document.createElement('div');
        this.gridOverlay.className = 'gm-grid-overlay';
        
        // Add grid lines (simplified - in a real implementation, you'd adjust based on zoom level)
        for (let i = 0; i < 10; i++) {
            // Horizontal lines
            const hLine = document.createElement('div');
            hLine.className = 'gm-grid-line horizontal';
            hLine.style.top = `${(i + 1) * 10}%`;
            this.gridOverlay.appendChild(hLine);
            
            // Vertical lines
            const vLine = document.createElement('div');
            vLine.className = 'gm-grid-line vertical';
            vLine.style.left = `${(i + 1) * 10}%`;
            this.gridOverlay.appendChild(vLine);
        }
        
        this.overlayContainer.appendChild(this.gridOverlay);
    }

    toggleMarkers() {
        // Toggle visibility of markers
        const markers = this.overlayContainer.querySelectorAll('.gm-marker');
        const isVisible = markers.length > 0 && markers[0].style.display !== 'none';
        
        markers.forEach(marker => {
            marker.style.display = isVisible ? 'none' : 'block';
        });
    }

    toggleOverlays() {
        // Toggle visibility of other overlays
        const overlays = this.overlayContainer.querySelectorAll('.gm-overlay');
        const isVisible = overlays.length > 0 && overlays[0].style.display !== 'none';
        
        overlays.forEach(overlay => {
            overlay.style.display = isVisible ? 'none' : 'block';
        });
    }

    zoomIn() {
        // Simulate zoom in
        this.logger.log('Zoom in');
        // In a real implementation, this would interact with the game's map API
        
        // Update grid if visible
        if (this.gridOverlay && this.gridOverlay.style.display !== 'none') {
            this.updateGrid();
        }
    }

    zoomOut() {
        // Simulate zoom out
        this.logger.log('Zoom out');
        // In a real implementation, this would interact with the game's map API
        
        // Update grid if visible
        if (this.gridOverlay && this.gridOverlay.style.display !== 'none') {
            this.updateGrid();
        }
    }

    updateGrid() {
        // Update grid based on current zoom level
        if (!this.gridOverlay) return;
        
        // In a real implementation, you would adjust the grid based on zoom level
        // This is a simplified example
        const gridSize = 10; // This would be calculated based on zoom level
        
        // Clear existing grid
        this.gridOverlay.innerHTML = '';
        
        // Add new grid lines
        for (let i = 0; i < 100 / gridSize; i++) {
            // Horizontal lines
            const hLine = document.createElement('div');
            hLine.className = 'gm-grid-line horizontal';
            hLine.style.top = `${i * gridSize}%`;
            this.gridOverlay.appendChild(hLine);
            
            // Vertical lines
            const vLine = document.createElement('div');
            vLine.className = 'gm-grid-line vertical';
            vLine.style.left = `${i * gridSize}%`;
            this.gridOverlay.appendChild(vLine);
        }
    }

    centerOnPlayer() {
        // Center map on player's town
        this.logger.log('Centering on player');
        // In a real implementation, this would use the game's API to center the map
    }

    showSettings() {
        // Show settings dialog
        this.logger.log('Showing settings');
        // In a real implementation, this would show a settings dialog
    }

    startMapUpdates() {
        // Start periodic updates
        this.updateIntervalId = setInterval(() => {
            this.updateMapData();
        }, this.updateInterval);
        
        // Initial update
        this.updateMapData();
    }

    async updateMapData() {
        try {
            this.logger.log('Updating map data...');
            
            // In a real implementation, this would fetch data from the game's API
            // For now, we'll simulate some data
            
            // Update markers
            this.updateMarkers();
            
            // Update minimap
            this.updateMinimap();
            
            // Update last updated time
            this.mapData.lastUpdated = new Date().toISOString();
            
            this.logger.log('Map data updated');
        } catch (error) {
            this.logger.error('Failed to update map data:', error);
        }
    }

    updateMarkers() {
        // Clear existing markers
        const existingMarkers = this.overlayContainer.querySelectorAll('.gm-marker');
        existingMarkers.forEach(marker => marker.remove());
        
        // In a real implementation, you would add markers based on game data
        // This is a simplified example with dummy data
        const dummyMarkers = [
            { x: 30, y: 40, type: 'alliance', title: 'Alliance Member' },
            { x: 60, y: 30, type: 'enemy', title: 'Enemy Player', important: true },
            { x: 45, y: 55, type: 'neutral', title: 'Neutral Town' }
        ];
        
        dummyMarkers.forEach(markerData => {
            this.addMarker(markerData);
        });
    }

    addMarker({ x, y, type = 'default', title = '', important = false }) {
        const marker = document.createElement('div');
        marker.className = `gm-marker ${type} ${important ? 'important' : ''}`;
        marker.style.left = `${x}%`;
        marker.style.top = `${y}%`;
        marker.title = title;
        
        // Add tooltip on hover
        marker.addEventListener('mouseenter', (e) => {
            this.showTooltip(title, e.target);
        });
        
        marker.addEventListener('mouseleave', () => {
            this.hideTooltip();
        });
        
        // Add click handler
        marker.addEventListener('click', (e) => {
            e.stopPropagation();
            this.onMarkerClick({ x, y, type, title });
        });
        
        this.overlayContainer.appendChild(marker);
        return marker;
    }

    showTooltip(text, element) {
        if (this.tooltip) {
            this.hideTooltip();
        }
        
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'gm-tooltip';
        this.tooltip.textContent = text;
        
        // Position tooltip above the element
        const rect = element.getBoundingClientRect();
        const mapRect = this.mapContainer.getBoundingClientRect();
        
        this.tooltip.style.left = `${rect.left - mapRect.left + (rect.width / 2)}px`;
        this.tooltip.style.top = `${rect.top - mapRect.top - 5}px`;
        
        this.overlayContainer.appendChild(this.tooltip);
    }

    hideTooltip() {
        if (this.tooltip && this.tooltip.parentNode) {
            this.tooltip.parentNode.removeChild(this.tooltip);
            this.tooltip = null;
        }
    }

    onMarkerClick(markerData) {
        this.logger.log('Marker clicked:', markerData);
        // In a real implementation, this would handle marker clicks
    }

    updateMinimap() {
        // In a real implementation, this would update a minimap overlay
        // showing the current viewport position
    }

    cleanupMap() {
        this.logger.log('Cleaning up map overlay');
        
        // Clear intervals
        if (this.updateIntervalId) {
            clearInterval(this.updateIntervalId);
            this.updateIntervalId = null;
        }
        
        // Remove overlay container
        if (this.overlayContainer && this.overlayContainer.parentNode) {
            this.overlayContainer.parentNode.removeChild(this.overlayContainer);
            this.overlayContainer = null;
        }
        
        // Reset state
        this.isMapActive = false;
        this.mapContainer = null;
        this.gridOverlay = null;
        this.tooltip = null;
    }

    // Add logger methods
    get logger() {
        return {
            log: (...args) => console.log(`[MapOverlay]`, ...args),
            warn: (...args) => console.warn(`[MapOverlay]`, ...args),
            error: (...args) => console.error(`[MapOverlay]`, ...args),
            debug: (...args) => this.main?.debug && console.debug(`[MapOverlay]`, ...args)
        };
    }

    // Cleanup
    destroy() {
        this.logger.log('Destroying Map Overlay');
        
        // Clean up map if active
        if (this.isMapActive) {
            this.cleanupMap();
        }
        
        // Remove observer if it exists
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        
        // Remove any injected styles
        const style = document.getElementById('gm-map-overlay-styles');
        if (style && style.parentNode) {
            style.parentNode.removeChild(style);
        }
        
        this.initialized = false;
    }
}

// Add initialization method
MapOverlay.init = async function(mainManager) {
    const instance = new this(mainManager);
    await instance.init();
    return instance;
};
