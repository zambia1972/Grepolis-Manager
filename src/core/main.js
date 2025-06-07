
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
  window.addEventListener('load', () => {
    initUI();  // of een andere startfunctie
  });
})();
