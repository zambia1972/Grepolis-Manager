// modules/forumManager.js

(function () {
  'use strict';

  class ForumManager {
    constructor() {
      this.fora = [
        { name: 'Algemeen', description: 'Algemene discussies' },
        { name: 'ROOD', description: 'Noodmeldingen en verdediging' },
        { name: 'Deff', description: 'Verdedigingsstrategieën' },
        { name: 'Offens', description: 'Offensieve strategieën' },
        { name: 'Massa_Aanval', description: 'Massa-aanvallen' },
        { name: 'Interne_Overnames', description: 'Interne overnames' },
        { name: 'Cluster', description: 'Clusterbeheer' },
        { name: 'Kroeg', description: 'Informele discussies' },
        { name: 'Leiding', description: 'Leidinggevenden' },
      ];
    }

    showForaList(containerId = 'popup-content') {
      const container = document.getElementById(containerId);
      if (!container) return;

      container.innerHTML = '<h2>Forumcategorieën</h2>';
      const list = document.createElement('ul');
      list.style.listStyle = 'none';
      list.style.padding = '0';

      for (const forum of this.fora) {
        const li = document.createElement('li');
        li.textContent = `${forum.name} – ${forum.description}`;
        li.style.padding = '4px 0';
        list.appendChild(li);
      }

      container.appendChild(list);
    }
  }

  window.ForumManager = ForumManager;
})();

