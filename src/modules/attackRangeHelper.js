class AttackRangeHelperManager {
        constructor(uw) {
            this.uw = uw;
            this.townInterval = null;
            this.rankingInterval = null;
            this.isActive = false;
            this.playerList = [];
            this.townsList = [];
            this.pPoints = 0;
        }

        async initialize() {
            try {
                this.setupRankingObserver();
                this.injectStyles();
                this.pPoints = this.fetchPlayerPoints();
                this.playerList = this.loadPlayerData();
                this.townsList = this.loadTownData();
            } catch (error) {
                console.error("Fout bij initialiseren AttackRangeHelper:", error);
            }
        }

        start() {
            if (this.isActive) return;
            this.isActive = true;
            this.townInterval = setInterval(() => this.townColoring(), 1500);
            this.rankingInterval = setInterval(() => this.colorRanking(), 1000);
        }

        stop() {
            if (!this.isActive) return;
            this.isActive = false;

            if (this.townInterval) {
                clearInterval(this.townInterval);
                this.townInterval = null;
            }

            if (this.rankingInterval) {
                clearInterval(this.rankingInterval);
                this.rankingInterval = null;
            }

            this.cleanupBlessings();
        }

        setupRankingObserver() {
            const observer = new MutationObserver(() => {
                const rankingButtons = document.querySelectorAll('.ranking main_menu_item');
                if (rankingButtons.length > 0) {
                    rankingButtons[0].addEventListener('click', () => {
                        this.startRankingColoring();
                    });
                    observer.disconnect();
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }

        fetchPlayerPoints() {
            const MAX_ATTEMPTS = 5;
            let attempts = 0;

            const tryFetch = () => {
                attempts++;

                // Methode 1: Direct uit Game object
                if (this.uw?.Game?.player_points) {
                    return this.uw.Game.player_points;
                }

                // Methode 2: Uit player_data
                if (this.uw?.Game?.player_data?.points) {
                    return this.uw.Game.player_data.points;
                }

                // Methode 3: Uit grepolis object
                if (this.uw?.grepolis?.player?.points) {
                    return this.uw.grepolis.player.points;
                }

                // Methode 4: DOM-scan (fallback)
                const points = this.getPlayerPoints();
                if (points > 0) return points;

                // Probeer opnieuw als nog niet gelukt
                if (attempts < MAX_ATTEMPTS) {
                    setTimeout(tryFetch, 1000);
                    return 0;
                }

                console.warn("Kon spelerspunten niet vaststellen");
                return 0;
            };

            return tryFetch();
        }

        loadPlayerData() {
            try {
                return this.uw.$.ajax({
                    type: "GET",
                    url: "/data/players.txt",
                    async: false
                }).responseText.split(/\r\n|\n/);
            } catch (error) {
                console.error("Fout bij laden spelersdata:", error);
                return [];
            }
        }

        loadTownData() {
            try {
                return this.uw.$.ajax({
                    type: "GET",
                    url: "/data/towns.txt",
                    async: false
                }).responseText.split(/\r\n|\n/);
            } catch (error) {
                console.error("Fout bij laden stedendata:", error);
                return [];
            }
        }

        injectStyles() {
            const css = `
            .r_city_shield_blessing {
                background: url(https://i.ibb.co/W05MsxT/dr-city-shield-blessing-a1471e5.png) no-repeat 0 0 !important;
                width: 120px !important;
                height: 72px !important;
                pointer-events: none !important;
            }
            .o_city_shield_blessing {
                background: url(https://i.ibb.co/X8cn1fK/r-city-shield-blessing-a1471e5.png) no-repeat 0 0 !important;
                width: 120px !important;
                height: 72px !important;
                pointer-events: none !important;
            }
            .b_city_shield_blessing {
                background: url(https://i.ibb.co/9crM5x6/b-city-shield-blessing-a1471e5.png) no-repeat 0 0 !important;
                width: 120px !important;
                height: 72px !important;
                pointer-events: none !important;
            }
            .g_city_shield_blessing {
                background: url(https://i.ibb.co/6YmdJVk/g-city-shield-blessing-a1471e5.png) no-repeat 0 0 !important;
                width: 120px !important;
                height: 72px !important;
                pointer-events: none !important;
            }
            .ranking-points-red { color: red !important; }
            .ranking-points-orange { color: orange !important; }
            .ranking-points-green { color: green !important; }
            .ranking-points-blue { color: blue !important; }
        `;
            GM_addStyle(css);
        }

        toggle(state) {
            this.isActive = state === 'on';
            if (this.isActive) {
                this.start();
            } else {
                this.stop();
            }
        }

        // Alternative method to get player points
        getPlayerPoints() {
            const pointsElement = document.querySelector('.player_points') ||
                  document.querySelector('[id*="points"]');

            if (pointsElement) {
                const pointsText = pointsElement.textContent.trim();
                return parseInt(pointsText.replace(/\D/g, ''), 10) || 0;
            }
            return 0;
        }

        townColoring() {
            const towns = document.querySelectorAll('.flag.town');
            if (!towns.length) return;

            for (const town of towns) {
                try {
                    // Verbeterde elementselectie met null checks
                    const nextelement = town.nextElementSibling;
                    if (!nextelement || !nextelement.getAttribute) continue;

                    const content = nextelement.getAttribute("href");
                    if (!content) continue;

                    const base64 = window.atob(content.substring(1));

                    // Verbeterde substring logica met foutafhandeling
                    const getValue = (key) => {
                        const start = base64.indexOf(`"${key}":`) + key.length + 3;
                        const end = base64.indexOf(',', start);
                        return base64.substring(start, end > -1 ? end : undefined);
                    };

                    const ix = getValue("ix") || '';
                    const iy = getValue("iy") || '';
                    const islandId = getValue("island") || '';
                    const search = `${ix},${iy},${islandId}`;

                    // Zoek stad in townsList met veilige checks
                    const townData = this.townsList.find(t => t && t.includes(search));
                    if (!townData) continue;

                    const townArr = townData.split(',');
                    if (townArr.length < 2) continue;

                    const playerId = townArr[1];
                    const playerData = this.playerList.find(p => p && p.includes(playerId));
                    if (!playerData) continue;

                    const playerArr = playerData.split(',');
                    if (playerArr.length < 4) continue;

                    const playerPoints = parseInt(playerArr[3], 10) || 0;
                    const shieldElement = town.nextElementSibling?.nextElementSibling;

                    if (!shieldElement) continue;

                    // Verwijder bestaande klassen
                    shieldElement.classList.remove(
                        "city_shield_blessing",
                        "o_city_shield_blessing",
                        "r_city_shield_blessing",
                        "g_city_shield_blessing",
                        "b_city_shield_blessing"
                    );

                    // Bepaal nieuwe klasse
                    const isGhostTown = town.children[0]?.classList?.contains("ghost");
                    const inRange = playerPoints >= (this.pPoints * 0.83333333333) &&
                          playerPoints <= (this.pPoints * 1.2);

                    let newClass = "city_shield_blessing"; // Default

                    if (!inRange) {
                        newClass = isGhostTown ? "o_city_shield_blessing" : "r_city_shield_blessing";
                    } else {
                        newClass = isGhostTown ? "g_city_shield_blessing" : "b_city_shield_blessing";
                    }

                    shieldElement.classList.add(newClass);
                } catch (error) {
                    console.error("Fout bij kleuren stad:", error);
                }
            }
        }

        cleanupBlessings() {
            document.querySelectorAll('.r_city_shield_blessing, .o_city_shield_blessing, ' +
                                      '.b_city_shield_blessing, .g_city_shield_blessing').forEach(el => {
                el.remove();
            });
        }

        startRankingColoring() {
            this.rankingInterval = setInterval(() => this.colorRanking(), 1000);
        }

        stopRankingColoring() {
            if (this.rankingInterval) {
                clearInterval(this.rankingInterval);
                this.rankingInterval = null;
            }
        }

        colorRanking() {
            try {
                if (document.querySelector('#ranking-index.submenu_link.active')) {
                    const points = document.querySelectorAll('.r_points');
                    for (const point of points) {
                        if (point.innerHTML > 0) {
                            const pointValue = parseInt(point.innerHTML.replace(/\D/g, ''), 10);

                            if (pointValue < (this.pPoints * 0.66666666666)) {
                                point.style.color = 'red';     // Rood: < 66.6%
                            } else if (pointValue < (this.pPoints * 0.83333333333)) {
                                point.style.color = 'orange';  // Oranje: 66.6% - 83.3%
                            } else if (pointValue <= (this.pPoints * 1.2)) {
                                point.style.color = 'green';   // Groen: 83.3% - 120%
                            } else {
                                point.style.color = 'blue';    // Blauw: > 120%
                            }
                        }
                    }
                }

                if (document.querySelector('#ranking-sea_player.submenu_link.active')) {
                    const names = document.querySelectorAll('.r_name');
                    const points = document.querySelectorAll('.r_points');

                    for (let i = 0; i < names.length; i++) {
                        const point = points[i];
                        if (point.innerHTML > 0) {
                            const pointValue = parseInt(point.innerHTML.replace(/\D/g, ''), 10);

                            if (pointValue < (this.pPoints * 0.66666666666)) {
                                point.style.color = 'red';
                            } else if (pointValue < (this.pPoints * 0.83333333333)) {
                                point.style.color = 'orange';
                            } else if (pointValue <= (this.pPoints * 1.2)) {
                                point.style.color = 'green';
                            } else {
                                point.style.color = 'blue';
                            }
                        }
                    }
                }
            } catch (err) {
                console.error('Fout bij kleuren ranglijst:', err);
            }
        }
    }
