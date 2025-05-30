// core/main.js

(function () {
  'use strict';

  console.log('[Grepolis Manager] gestart.');

  // Voorbeeld initialisatie van modules (moet aangepast naarmate modules klaar zijn)
  if (typeof ForumManager !== 'undefined') {
    const forumManager = new ForumManager();
    console.log('[GM] ForumManager actief.');
  }

  if (typeof attackRangeHelperInit === 'function') {
    attackRangeHelperInit();
    console.log('[GM] AttackRange Helper geladen.');
  }

  if (typeof feestenFixedInit === 'function') {
    feestenFixedInit();
    console.log('[GM] FeestenFixed geladen.');
  }

  if (typeof setupGrepoChatInterface === 'function') {
    setupGrepoChatInterface();
    console.log('[GM] GrepoChat interface geactiveerd.');
  }
})();
