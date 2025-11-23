window.GM_UI = {

    createButtonContainer() {
        const container = document.createElement("div");
        container.id = "gm-button-container";
        document.body.appendChild(container);
        return container;
    },

    createToggleButton(container) {
        const btn = document.createElement("div");
        btn.id = "gm-toggle-button";
        container.appendChild(btn);
        return btn;
    }
};
