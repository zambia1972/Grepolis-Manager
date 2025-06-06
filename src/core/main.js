// main.js - Hoofdbestand voor Grepolis Manager
import { initializeButtons } from './ui.js';
import { injectGlobalStyles } from './styles.js';

import { showStartscreenPopup } from './popup.js';
import { startAttackRangeHelper } from '../modules/attackRangeHelper.js';
import { startFeestenManager } from '../modules/feestenManager.js';
import { startTroopManager } from '../modules/troopManager.js';
import { startForumManager } from '../modules/forumManager.js';

(function () {
  'use strict';
  injectGlobalStyles();
  initializeButtons([
    () => showStartscreenPopup(),         // Button 1: Startscherm
    (on) => startAttackRangeHelper(on),   // Button 2: AttackRange
    (on) => startFeestenManager(on),      // Button 3: Feesten
    () => console.log("Chat volgt later"),// Button 4
    (on) => startTroopManager(on),        // Button 5: TroopManager
    () => console.log("Kaart volgt later"),// Button 6
    () => startForumManager()         // Button 7: ForumManager
  ]);
})();
