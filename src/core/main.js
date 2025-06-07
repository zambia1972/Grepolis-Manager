(function () {
    const tryInit = () => {
        if (
            typeof injectGlobalStyles === 'function' &&
            typeof initializeButtons === 'function' &&
            typeof startAttackRangeHelper === 'function' &&
            typeof startFeestenManager === 'function' &&
            typeof startTroopManager === 'function' &&
            typeof startForumManager === 'function'
        ) {
            injectGlobalStyles();

            initializeButtons([
                () => console.log("Startscherm volgt"),
                (on) => startAttackRangeHelper(on),
                (on) => startFeestenManager(on),
                () => console.log("Chat volgt later"),
                (on) => startTroopManager(on),
                () => console.log("Kaart volgt later"),
                (on) => startForumManager(on)
            ]);
        } else {
            setTimeout(tryInit, 100);
        }
    };

    tryInit();
})();
