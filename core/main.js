// core/main.js
// Initieert de hoofdmodules van Grepolis Manager

(function () {
    'use strict';

    const uw = unsafeWindow;

    // Globale instantie van de hoofdmodule
    const GrepolisManagerMain = {
        init() {
            console.log('[Grepolis Manager] Initialisatie gestart...');

            if (typeof uw.ForumManager === 'undefined') {
                console.error('[Grepolis Manager] ForumManager niet beschikbaar.');
                return;
            }

            // Start de hoofdmodule
            try {
                uw.forumManager = new uw.ForumManager();
                console.log('[Grepolis Manager] ForumManager succesvol geïnitialiseerd.');
            } catch (err) {
                console.error('[Grepolis Manager] Fout bij initialisatie van ForumManager:', err);
            }
        }
    };

    // Exporteer voor gebruik vanuit index.user.js
    uw.GrepolisManagerMain = GrepolisManagerMain;
})();
