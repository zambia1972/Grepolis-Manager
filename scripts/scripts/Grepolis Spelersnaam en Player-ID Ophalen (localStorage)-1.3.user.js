// ==UserScript==
// @name         Grepolis Spelersnaam en Player-ID Ophalen (localStorage)
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Haal de spelersnaam en player-id op uit window.Game in Grepolis en sla ze op in localStorage
// @author       Jouw Naam
// @match        https://*.grepolis.com/game/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Wacht tot de pagina volledig is geladen
    window.addEventListener('load', function() {
        // Controleer of window.Game bestaat
        if (window.Game && window.Game.player_id && window.Game.player_name) {
            const playerId = window.Game.player_id; // Haal de player-id op
            const playerName = window.Game.player_name; // Haal de spelersnaam op

            // Sla de gegevens op in localStorage
            localStorage.setItem('grepolisPlayerId', playerId);
            localStorage.setItem('grepolisPlayerName', playerName);

            // Toon de gegevens in de console
            console.log('Player-ID:', playerId);
            console.log('Spelersnaam:', playerName);
        } else {
            console.log('Geen spelersgegevens gevonden in window.Game.');
        }
    });
})();