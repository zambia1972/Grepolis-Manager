export function openGrepolisManagerPopup() {
    const wnd = Layout.wnd.CreateLayoutWindow({
        title: "Grepolis Manager",
        content: `
            <div style="padding: 12px; color: #fff;">
                Grepolis Manager popup geladen!
            </div>
        `,
    });

    return wnd;
}
