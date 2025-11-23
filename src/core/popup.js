window.GM_Popup = {
    open() {
        const wnd = Layout.wnd.CreateLayoutWindow({
            title: "Grepolis Manager",
            content: `
                <div style="padding:12px;color:#fff;">
                    Grepolis Manager is geladen!
                </div>`
        });
    }
};

