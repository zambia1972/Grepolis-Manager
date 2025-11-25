// Add styles for the button container and toggle button
if (!document.getElementById('gm-ui-styles')) {
    const style = document.createElement('style');
    style.id = 'gm-ui-styles';
    style.textContent = `
        #gm-button-container {
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 9999;
        }
        #gm-toggle-button {
            width: 40px;
            height: 40px;
            background-color: #4a90e2;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 16px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
        }
        #gm-toggle-button:hover {
            background-color: #357abd;
            transform: scale(1.1);
        }
    `;
    document.head.appendChild(style);
}

window.GM_UI = {
    createButtonContainer() {
        // Don't create if it already exists
        let container = document.getElementById("gm-button-container");
        if (!container) {
            container = document.createElement("div");
            container.id = "gm-button-container";
            document.body.appendChild(container);
        }
        return container;
    },

    createToggleButton(container) {
        // Don't create if it already exists
        let btn = container.querySelector("#gm-toggle-button");
        if (!btn) {
            btn = document.createElement("div");
            btn.id = "gm-toggle-button";
            btn.title = "Grepolis Manager";
            btn.textContent = "GM";
            container.appendChild(btn);
        }
        return btn;
    }
};
