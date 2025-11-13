/**
 * Wereldinfo - Handles world information and statistics
 */

export default class WereldInfo {
    constructor(mainManager) {
        this.main = mainManager;
        this.initialized = false;
        this.worldData = {
            players: {},
            alliances: {},
            towns: {},
            islands: {},
            lastUpdated: null
        };
        this.cacheDuration = 30 * 60 * 1000; // 30 minutes cache
    }

    async init() {
        if (this.initialized) return true;
        
        try {
            this.logger.log('Initializing WereldInfo...');
            
            // Load cached data if available and not expired
            await this.loadCachedData();
            
            // Initialize UI if enabled
            if (this.main.getSetting('modules.wereldInfo', true)) {
                this.initUI();
                
                // Schedule periodic updates
                this.scheduleUpdate();
            }
            
            this.initialized = true;
            this.logger.log('WereldInfo initialized');
            return true;
        } catch (error) {
            this.logger.error('Failed to initialize WereldInfo:', error);
            return false;
        }
    }

    async loadCachedData() {
        try {
            const cachedData = this.main.getStorage('gm_world_data', null);
            const lastUpdated = this.main.getStorage('gm_world_data_updated', 0);
            
            if (cachedData && (Date.now() - lastUpdated) < this.cacheDuration) {
                this.worldData = { ...cachedData };
                this.logger.log('Loaded world data from cache');
                return true;
            }
            
            // If cache is expired or doesn't exist, fetch fresh data
            return await this.fetchWorldData();
        } catch (error) {
            this.logger.error('Failed to load cached data:', error);
            return false;
        }
    }

    async fetchWorldData() {
        this.logger.log('Fetching fresh world data...');
        
        try {
            // Get current world ID from URL
            const worldId = this.getCurrentWorldId();
            if (!worldId) {
                throw new Error('Could not determine world ID');
            }
            
            // Fetch data from Grepolis API or data files
            const [players, alliances, towns, islands] = await Promise.all([
                this.fetchDataFile('players'),
                this.fetchDataFile('alliances'),
                this.fetchDataFile('towns'),
                this.fetchDataFile('islands')
            ]);
            
            // Process and store the data
            this.worldData = {
                players: this.processPlayers(players),
                alliances: this.processAlliances(alliances),
                towns: this.processTowns(towns),
                islands: this.processIslands(islands),
                lastUpdated: new Date().toISOString()
            };
            
            // Save to cache
            this.main.setStorage('gm_world_data', this.worldData);
            this.main.setStorage('gm_world_data_updated', Date.now());
            
            this.logger.log('World data updated successfully');
            return true;
        } catch (error) {
            this.logger.error('Failed to fetch world data:', error);
            throw error;
        }
    }

    async fetchDataFile(type) {
        const worldId = this.getCurrentWorldId();
        const url = `https://${worldId}.grepolis.com/data/${type}.txt`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const text = await response.text();
            return this.parseDataFile(text);
        } catch (error) {
            this.logger.error(`Failed to fetch ${type} data:`, error);
            throw error;
        }
    }

    parseDataFile(text) {
        if (!text) return [];
        
        const lines = text.trim().split(/\r?\n/);
        if (lines.length === 0) return [];
        
        // Detect delimiter (tab or comma)
        const firstLine = lines[0];
        const isTabDelimited = firstLine.includes('\t');
        const delimiter = isTabDelimited ? '\t' : ',';
        
        // Parse each line
        return lines.map(line => {
            // Handle quoted fields
            const fields = [];
            let inQuotes = false;
            let field = '';
            
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                
                if (char === '"') {
                    // Handle escaped quotes
                    if (i + 1 < line.length && line[i + 1] === '"') {
                        field += '"';
                        i++; // Skip next quote
                    } else {
                        inQuotes = !inQuotes;
                    }
                } else if (char === delimiter && !inQuotes) {
                    fields.push(field);
                    field = '';
                } else {
                    field += char;
                }
            }
            
            // Add the last field
            fields.push(field);
            
            return fields;
        });
    }

    processPlayers(data) {
        // data: [id, name, alliance_id, points, rank, towns, players]
        const players = {};
        
        data.forEach(row => {
            if (row.length >= 5) {
                const [id, name, allianceId, points, rank, towns = 0] = row;
                players[id] = {
                    id: parseInt(id, 10),
                    name: name.replace(/"/g, ''),
                    allianceId: parseInt(allianceId, 10) || 0,
                    points: parseInt(points, 10) || 0,
                    rank: parseInt(rank, 10) || 0,
                    towns: parseInt(towns, 10) || 0
                };
            }
        });
        
        return players;
    }

    processAlliances(data) {
        // data: [id, name, points, members, towns, rank]
        const alliances = {};
        
        data.forEach(row => {
            if (row.length >= 6) {
                const [id, name, points, members, towns, rank] = row;
                alliances[id] = {
                    id: parseInt(id, 10),
                    name: name.replace(/"/g, ''),
                    points: parseInt(points, 10) || 0,
                    members: parseInt(members, 10) || 0,
                    towns: parseInt(towns, 10) || 0,
                    rank: parseInt(rank, 10) || 0
                };
            }
        });
        
        return alliances;
    }

    processTowns(data) {
        // data: [id, player_id, name, island_x, island_y, number_on_island, points]
        const towns = {};
        
        data.forEach(row => {
            if (row.length >= 7) {
                const [id, playerId, name, x, y, number, points] = row;
                const islandId = `${x}_${y}`;
                
                towns[id] = {
                    id: parseInt(id, 10),
                    playerId: parseInt(playerId, 10) || 0,
                    name: name.replace(/"/g, ''),
                    x: parseInt(x, 10) || 0,
                    y: parseInt(y, 10) || 0,
                    number: parseInt(number, 10) || 0,
                    points: parseInt(points, 10) || 0,
                    islandId: islandId
                };
            }
        });
        
        return towns;
    }

    processIslands(data) {
        // data: [id, x, y, island_type, available_towns, plus, minus, wood, stone, iron]
        const islands = {};
        
        data.forEach(row => {
            if (row.length >= 8) {
                const [id, x, y, type, availableTowns, plus, minus, wood, stone, iron] = row;
                const islandId = `${x}_${y}`;
                
                islands[islandId] = {
                    id: parseInt(id, 10) || 0,
                    x: parseInt(x, 10) || 0,
                    y: parseInt(y, 10) || 0,
                    type: parseInt(type, 10) || 0,
                    availableTowns: parseInt(availableTowns, 10) || 0,
                    plus: parseInt(plus, 10) || 0,
                    minus: parseInt(minus, 10) || 0,
                    resources: {
                        wood: parseInt(wood, 10) || 0,
                        stone: parseInt(stone, 10) || 0,
                        iron: parseInt(iron, 10) || 0
                    }
                };
            }
        });
        
        return islands;
    }

    getCurrentWorldId() {
        // Extract world ID from current URL (e.g., "nl123.grepolis.com" -> "nl123")
        const hostname = window.location.hostname;
        const parts = hostname.split('.');
        return parts.length > 0 ? parts[0] : null;
    }

    scheduleUpdate() {
        // Update every hour
        this.updateInterval = setInterval(() => {
            this.fetchWorldData().then(() => {
                this.updateUI();
            });
        }, 60 * 60 * 1000);
    }

    initUI() {
        // Create UI elements
        this.createToolbarButton();
        this.createMainPanel();
        
        // Add event listeners
        this.setupEventListeners();
    }

    createToolbarButton() {
        // Add button to the main toolbar
        this.toolbarButton = this.main.ui.createButton('Wereldinfo', {
            className: 'gm-wereldinfo-button',
            icon: 'world',
            tooltip: 'Open Wereldinfo',
            onClick: () => this.togglePanel()
        });
        
        // Add button to the main UI container
        const container = document.querySelector('#gm-toolbar') || document.body;
        container.appendChild(this.toolbarButton);
    }

    createMainPanel() {
        // Create main panel
        this.panel = document.createElement('div');
        this.panel.id = 'gm-wereldinfo-panel';
        this.panel.className = 'gm-panel gm-hidden';
        
        // Panel header
        const header = document.createElement('div');
        header.className = 'gm-panel-header';
        header.innerHTML = `
            <h3>Wereldinfo</h3>
            <div class="gm-panel-actions">
                <button class="gm-button gm-small gm-refresh-button" title="Refresh">
                    <span class="gm-icon gm-icon-refresh"></span>
                </button>
                <button class="gm-button gm-small gm-close-button" title="Close">
                    &times;
                </button>
            </div>
        `;
        
        // Panel content
        const content = document.createElement('div');
        content.className = 'gm-panel-content';
        content.innerHTML = `
            <div class="gm-tabs">
                <div class="gm-tab-buttons">
                    <button class="gm-tab-button active" data-tab="overview">Overview</button>
                    <button class="gm-tab-button" data-tab="players">Players</button>
                    <button class="gm-tab-button" data-tab="alliances">Alliances</button>
                    <button class="gm-tab-button" data-tab="islands">Islands</button>
                </div>
                <div class="gm-tab-panels">
                    <div class="gm-tab-panel active" data-tab="overview">
                        <div class="gm-stats-grid">
                            <div class="gm-stat-card">
                                <div class="gm-stat-value" id="gm-total-players">-</div>
                                <div class="gm-stat-label">Players</div>
                            </div>
                            <div class="gm-stat-card">
                                <div class="gm-stat-value" id="gm-total-alliances">-</div>
                                <div class="gm-stat-label">Alliances</div>
                            </div>
                            <div class="gm-stat-card">
                                <div class="gm-stat-value" id="gm-total-towns">-</div>
                                <div class="gm-stat-label">Towns</div>
                            </div>
                            <div class="gm-stat-card">
                                <div class="gm-stat-value" id="gm-avg-points">-</div>
                                <div class="gm-stat-label">Avg. Points</div>
                            </div>
                        </div>
                        <div class="gm-chart-container">
                            <h4>Top Alliances</h4>
                            <div id="gm-top-alliances-chart" class="gm-chart"></div>
                        </div>
                    </div>
                    <div class="gm-tab-panel" data-tab="players">
                        <div class="gm-table-container">
                            <table class="gm-data-table">
                                <thead>
                                    <tr>
                                        <th>Rank</th>
                                        <th>Name</th>
                                        <th>Alliance</th>
                                        <th class="gm-text-right">Points</th>
                                        <th class="gm-text-right">Towns</th>
                                    </tr>
                                </thead>
                                <tbody id="gm-players-table-body">
                                    <tr>
                                        <td colspan="5" class="gm-loading">Loading players...</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="gm-tab-panel" data-tab="alliances">
                        <div class="gm-table-container">
                            <table class="gm-data-table">
                                <thead>
                                    <tr>
                                        <th>Rank</th>
                                        <th>Name</th>
                                        <th class="gm-text-right">Points</th>
                                        <th class="gm-text-right">Members</th>
                                        <th class="gm-text-right">Towns</th>
                                        <th class="gm-text-right">Avg. Points</th>
                                    </tr>
                                </thead>
                                <tbody id="gm-alliances-table-body">
                                    <tr>
                                        <td colspan="6" class="gm-loading">Loading alliances...</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="gm-tab-panel" data-tab="islands">
                        <div class="gm-island-filters">
                            <div class="gm-form-group">
                                <label for="gm-island-x">X:</label>
                                <input type="number" id="gm-island-x" class="gm-form-control" min="0" max="999">
                            </div>
                            <div class="gm-form-group">
                                <label for="gm-island-y">Y:</label>
                                <input type="number" id="gm-island-y" class="gm-form-control" min="0" max="999">
                            </div>
                            <button id="gm-search-island" class="gm-button gm-primary">Search</button>
                        </div>
                        <div id="gm-island-details" class="gm-island-details">
                            <div class="gm-prompt">Enter coordinates to search for an island</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Assemble panel
        this.panel.appendChild(header);
        this.panel.appendChild(content);
        
        // Add to document
        document.body.appendChild(this.panel);
    }

    setupEventListeners() {
        // Close button
        this.panel.querySelector('.gm-close-button').addEventListener('click', () => {
            this.hidePanel();
        });
        
        // Refresh button
        this.panel.querySelector('.gm-refresh-button').addEventListener('click', () => {
            this.refreshData();
        });
        
        // Tab buttons
        this.panel.querySelectorAll('.gm-tab-button').forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.dataset.tab;
                this.switchTab(tabId);
            });
        });
        
        // Island search
        const searchButton = this.panel.querySelector('#gm-search-island');
        const xInput = this.panel.querySelector('#gm-island-x');
        const yInput = this.panel.querySelector('#gm-island-y');
        
        searchButton.addEventListener('click', () => {
            const x = parseInt(xInput.value, 10);
            const y = parseInt(yInput.value, 10);
            
            if (!isNaN(x) && !isNaN(y)) {
                this.showIslandDetails(x, y);
            } else {
                this.main.ui.showNotification('Please enter valid coordinates', 'error');
            }
        });
        
        // Handle Enter key in coordinate inputs
        [xInput, yInput].forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    searchButton.click();
                }
            });
        });
    }

    switchTab(tabId) {
        // Update active tab button
        this.panel.querySelectorAll('.gm-tab-button').forEach(button => {
            if (button.dataset.tab === tabId) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
        
        // Show active panel
        this.panel.querySelectorAll('.gm-tab-panel').forEach(panel => {
            if (panel.dataset.tab === tabId) {
                panel.classList.add('active');
            } else {
                panel.classList.remove('active');
            }
        });
        
        // Load data for the active tab if needed
        if (tabId === 'players') {
            this.renderPlayersTable();
        } else if (tabId === 'alliances') {
            this.renderAlliancesTable();
        } else if (tabId === 'islands') {
            // Reset island search
            this.panel.querySelector('#gm-island-details').innerHTML = 
                '<div class="gm-prompt">Enter coordinates to search for an island</div>';
        }
    }

    togglePanel() {
        if (this.panel.classList.contains('gm-hidden')) {
            this.showPanel();
        } else {
            this.hidePanel();
        }
    }

    showPanel() {
        this.panel.classList.remove('gm-hidden');
        this.updateUI();
    }

    hidePanel() {
        this.panel.classList.add('gm-hidden');
    }

    async refreshData() {
        this.showLoading(true);
        
        try {
            await this.fetchWorldData();
            this.updateUI();
            this.main.ui.showNotification('World data updated', 'success');
        } catch (error) {
            this.main.ui.showNotification('Failed to update data', 'error');
            this.logger.error('Refresh failed:', error);
        } finally {
            this.showLoading(false);
        }
    }

    updateUI() {
        if (!this.panel || this.panel.classList.contains('gm-hidden')) {
            return;
        }
        
        // Update stats
        this.updateStats();
        
        // Update the active tab content
        const activeTab = this.panel.querySelector('.gm-tab-button.active');
        if (activeTab) {
            const tabId = activeTab.dataset.tab;
            
            switch (tabId) {
                case 'players':
                    this.renderPlayersTable();
                    break;
                case 'alliances':
                    this.renderAlliancesTable();
                    break;
                case 'overview':
                    this.renderOverview();
                    break;
                // Other tabs are updated when selected
            }
        }
    }

    updateStats() {
        const { players, alliances, towns } = this.worldData;
        
        // Basic counts
        const totalPlayers = Object.keys(players).length;
        const totalAlliances = Object.keys(alliances).length;
        const totalTowns = Object.keys(towns).length;
        
        // Calculate average points
        const totalPoints = Object.values(players).reduce((sum, player) => sum + (player.points || 0), 0);
        const avgPoints = totalPlayers > 0 ? Math.round(totalPoints / totalPlayers) : 0;
        
        // Update UI
        this.setElementText('gm-total-players', totalPlayers.toLocaleString());
        this.setElementText('gm-total-alliances', totalAlliances.toLocaleString());
        this.setElementText('gm-total-towns', totalTowns.toLocaleString());
        this.setElementText('gm-avg-points', avgPoints.toLocaleString());
    }

    renderOverview() {
        // Render top alliances chart
        this.renderTopAlliancesChart();
    }

    renderTopAlliancesChart() {
        const { alliances } = this.worldData;
        const topAlliances = Object.values(alliances)
            .sort((a, b) => (b.points || 0) - (a.points || 0))
            .slice(0, 10);
        
        // Simple text-based chart for now
        // In a real implementation, you might use a charting library like Chart.js
        const chartContainer = this.panel.querySelector('#gm-top-alliances-chart');
        
        if (!chartContainer) return;
        
        if (topAlliances.length === 0) {
            chartContainer.innerHTML = '<div class="gm-no-data">No alliance data available</div>';
            return;
        }
        
        const maxPoints = topAlliances[0].points || 1;
        
        const chartHTML = `
            <div class="gm-chart-bars">
                ${topAlliances.map(alliance => {
                    const width = ((alliance.points || 0) / maxPoints) * 100;
                    return `
                        <div class="gm-chart-bar-container">
                            <div class="gm-chart-bar-label">${alliance.name}</div>
                            <div class="gm-chart-bar-bg">
                                <div class="gm-chart-bar-fill" style="width: ${width}%">
                                    <span class="gm-chart-bar-value">${(alliance.points || 0).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
        
        chartContainer.innerHTML = chartHTML;
    }

    renderPlayersTable() {
        const { players, alliances } = this.worldData;
        const tbody = this.panel.querySelector('#gm-players-table-body');
        
        if (!tbody) return;
        
        if (Object.keys(players).length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="gm-no-data">No player data available</td></tr>';
            return;
        }
        
        // Sort players by rank
        const sortedPlayers = Object.values(players).sort((a, b) => (a.rank || 0) - (b.rank || 0));
        
        // Render table rows
        tbody.innerHTML = sortedPlayers.slice(0, 100).map(player => {
            const alliance = player.allianceId ? alliances[player.allianceId] : null;
            const allianceName = alliance ? alliance.name : '-';
            
            return `
                <tr>
                    <td>${player.rank || '-'}</td>
                    <td>${this.escapeHtml(player.name)}</td>
                    <td>${this.escapeHtml(allianceName)}</td>
                    <td class="gm-text-right">${(player.points || 0).toLocaleString()}</td>
                    <td class="gm-text-right">${(player.towns || 0).toLocaleString()}</td>
                </tr>
            `;
        }).join('');
        
        // Add "showing X of Y" message if there are more players
        if (sortedPlayers.length > 100) {
            const tr = document.createElement('tr');
            tr.className = 'gm-table-footer';
            tr.innerHTML = `
                <td colspan="5" class="gm-text-center">
                    Showing top 100 of ${sortedPlayers.length.toLocaleString()} players
                </td>
            `;
            tbody.appendChild(tr);
        }
    }

    renderAlliancesTable() {
        const { alliances, players } = this.worldData;
        const tbody = this.panel.querySelector('#gm-alliances-table-body');
        
        if (!tbody) return;
        
        if (Object.keys(alliances).length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="gm-no-data">No alliance data available</td></tr>';
            return;
        }
        
        // Sort alliances by rank
        const sortedAlliances = Object.values(alliances).sort((a, b) => (a.rank || 0) - (b.rank || 0));
        
        // Calculate average points per alliance
        const alliancesWithAvg = sortedAlliances.map(alliance => {
            const alliancePlayers = Object.values(players).filter(p => p.allianceId === alliance.id);
            const totalPoints = alliancePlayers.reduce((sum, p) => sum + (p.points || 0), 0);
            const avgPoints = alliancePlayers.length > 0 ? Math.round(totalPoints / alliancePlayers.length) : 0;
            
            return {
                ...alliance,
                avgPoints
            };
        });
        
        // Render table rows
        tbody.innerHTML = alliancesWithAvg.map(alliance => {
            return `
                <tr>
                    <td>${alliance.rank || '-'}</td>
                    <td>${this.escapeHtml(alliance.name)}</td>
                    <td class="gm-text-right">${(alliance.points || 0).toLocaleString()}</td>
                    <td class="gm-text-right">${(alliance.members || 0).toLocaleString()}</td>
                    <td class="gm-text-right">${(alliance.towns || 0).toLocaleString()}</td>
                    <td class="gm-text-right">${alliance.avgPoints.toLocaleString()}</td>
                </tr>
            `;
        }).join('');
    }

    async showIslandDetails(x, y) {
        const { islands, towns, players, alliances } = this.worldData;
        const islandId = `${x}_${y}`;
        const island = islands[islandId];
        const detailsContainer = this.panel.querySelector('#gm-island-details');
        
        if (!detailsContainer) return;
        
        detailsContainer.innerHTML = '<div class="gm-loading">Loading island data...</div>';
        
        try {
            if (!island) {
                detailsContainer.innerHTML = `
                    <div class="gm-error">
                        <div class="gm-error-icon">!</div>
                        <div class="gm-error-message">No data available for island [${x}:${y}]</div>
                    </div>
                `;
                return;
            }
            
            // Get towns on this island
            const islandTowns = Object.values(towns).filter(town => 
                town.x === island.x && town.y === island.y
            );
            
            // Sort towns by points (descending)
            islandTowns.sort((a, b) => (b.points || 0) - (a.points || 0));
            
            // Render island details
            let html = `
                <div class="gm-island-header">
                    <h4>Island [${island.x}:${island.y}]</h4>
                    <div class="gm-island-type">${this.getIslandTypeName(island.type)}</div>
                </div>
                
                <div class="gm-island-stats">
                    <div class="gm-stat">
                        <div class="gm-stat-value">${island.availableTowns}</div>
                        <div class="gm-stat-label">Available Towns</div>
                    </div>
                    <div class="gm-stat">
                        <div class="gm-stat-value">${islandTowns.length}</div>
                        <div class="gm-stat-label">Occupied Towns</div>
                    </div>
                    <div class="gm-stat">
                        <div class="gm-stat-value">${island.plus > 0 ? '+' + island.plus : '0'}</div>
                        <div class="gm-stat-label">Bonus</div>
                    </div>
                    <div class="gm-stat">
                        <div class="gm-stat-value">${island.resources.wood}/${island.resources.stone}/${island.resources.iron}</div>
                        <div class="gm-stat-label">Resources (W/S/I)</div>
                    </div>
                </div>
            `;
            
            // Add towns table if there are any
            if (islandTowns.length > 0) {
                html += `
                    <div class="gm-island-towns">
                        <h5>Towns on this island</h5>
                        <table class="gm-data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Player</th>
                                    <th>Alliance</th>
                                    <th class="gm-text-right">Points</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${islandTowns.map(town => {
                                    const player = players[town.playerId] || {};
                                    const alliance = player.allianceId ? (alliances[player.allianceId] || {}) : null;
                                    
                                    return `
                                        <tr>
                                            <td>${this.escapeHtml(town.name)}</td>
                                            <td>${player.name ? this.escapeHtml(player.name) : '-'}</td>
                                            <td>${alliance ? this.escapeHtml(alliance.name) : '-'}</td>
                                            <td class="gm-text-right">${(town.points || 0).toLocaleString()}</td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            }
            
            detailsContainer.innerHTML = html;
            
        } catch (error) {
            this.logger.error('Error loading island details:', error);
            detailsContainer.innerHTML = `
                <div class="gm-error">
                    <div class="gm-error-icon">!</div>
                    <div class="gm-error-message">Failed to load island data. Please try again later.</div>
                </div>
            `;
        }
    }

    getIslandTypeName(type) {
        const types = {
            0: 'Normal',
            1: 'Capital',
            2: 'Harbor',
            3: 'Bonus',
            4: 'Starting Zone'
        };
        
        return types[type] || `Type ${type}`;
    }

    showLoading(show) {
        // Show/hide loading indicator in the panel
        const loadingEl = this.panel.querySelector('.gm-loading-overlay');
        
        if (!loadingEl && show) {
            const overlay = document.createElement('div');
            overlay.className = 'gm-loading-overlay';
            overlay.innerHTML = '<div class="gm-spinner"></div>';
            this.panel.appendChild(overlay);
        } else if (loadingEl && !show) {
            loadingEl.remove();
        }
    }

    setElementText(id, text) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = text;
        }
    }

    escapeHtml(unsafe) {
        if (unsafe === null || unsafe === undefined) return '';
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
            log: (...args) => console.log(`[WereldInfo]`, ...args),
            warn: (...args) => console.warn(`[WereldInfo]`, ...args),
            error: (...args) => console.error(`[WereldInfo]`, ...args),
            debug: (...args) => this.main?.debug && console.debug(`[WereldInfo]`, ...args)
        };
    }

    // Cleanup
    destroy() {
        // Clear intervals
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        // Remove UI elements
        if (this.toolbarButton && this.toolbarButton.parentNode) {
            this.toolbarButton.parentNode.removeChild(this.toolbarButton);
        }
        
        if (this.panel && this.panel.parentNode) {
            this.panel.parentNode.removeChild(this.panel);
        }
        
        this.initialized = false;
    }
}

// Add initialization method
WereldInfo.init = async function(mainManager) {
    const instance = new this(mainManager);
    await instance.init();
    return instance;
};
