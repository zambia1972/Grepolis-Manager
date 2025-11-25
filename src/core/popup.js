(function(){
    // Voeg Grepolis-stijl toe (één keer)
    if (typeof GM_addStyle === "function" && !document.getElementById("gm-styles-grepolis")) {
        GM_addStyle(`
/* --- Grepolis-like window (Grepolis Manager) --- */
#gm-gpwindow-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.45);
    z-index: 99999;
    display: flex;\
    align-items: flex-start;\
    justify-content: center;\
    padding-top: 64px;\
    -webkit-font-smoothing: antialiased;\
}\
\
.gm-gpwindow {\
    position: absolute;\
    width: 780px;\
    height: 570px;\
    font: 13px Verdana, Arial, Helvetica, sans-serif;\
    text-align: center;\
    z-index: 100000;\
    left: calc(50% - 390px);\
    top: 120px;\
    overflow: visible;\
    background: transparent;\
}\
\
/* core panels - left and right vertical tiles */\
.gm-gpwindow .gpwindow-vert-left,\
.gm-gpwindow .gpwindow-vert-right {\
    position: absolute;\
    top: 44px;\
    bottom: 17px;\
    width: 16px;\
    background-image: url(https://gpnl.innogamescdn.com/images/game/layout/vertical_tile.png);\
    background-repeat: repeat-y;\
    overflow: hidden;\
    display: block;\
}\
.gpwindow-vert-left { left: -16px; background-position: -10px 0; }\
.gpwindow-vert-right { right: -16px; background-position: -26px 0; }\
\
/* corner strips */\
.gm-gpwindow .gpwindow-corner-left,\
.gm-gpwindow .gpwindow-corner-right {\
    position: absolute;\
    top: 0;\
    bottom: 0;\
    width: 16px;\
    display:block;\
    background-image: url(https://gpnl.innogamescdn.com/images/game/layout/gpwindow_corners.png);\
    background-repeat: no-repeat;\
    overflow: hidden;\
}\
.gpwindow-corner-left { left: -16px; background-position: left 0; height: 17px; }\
.gpwindow-corner-right{ right: -16px; background-position: right -17px; height: 17px; }\
\
/* top bar / header */\
.gm-gpwindow .gpwindow-top {\
    position: absolute;\
    left: 0;\
    right: 0;\
    top: 0;\
    height: 44px;\
    background: url(https://gpnl.innogamescdn.com/images/game/layout/gpwindow_horizontal.png) 0 -17px repeat-x;\
    display:flex;\
    align-items:center;\
    justify-content:space-between;\
    padding: 0 12px;\
    box-sizing:border-box;\
}\
.gm-gpwindow .gpwindow-title {\
    font-weight: 700;\
    color: #fff;\
    text-shadow: 0 1px 0 rgba(0,0,0,0.6);\
    font-size: 13px;\
}\
.gm-gpwindow .gpwindow-controls {\
    display:flex;\
    gap:6px;\
    align-items:center;\
}\
.gm-gpwindow .gpwindow-close {\
    cursor:pointer;\
    width: 28px;\
    height: 28px;\
    border-radius: 3px;\
    border: none;\
    background: transparent;\
    color: #fff;\
    font-size: 16px;\
    line-height: 1;\
}\
\
/* corner tall strips (for decorative top-left/right larger slices) */\
.gm-gpwindow .gpwindow-corner-top-left,\
.gm-gpwindow .gpwindow-corner-top-right {\
    position: absolute;\
    top: 0;\
    bottom: 0;\
    width: 16px;\
    display:block;\
    background-image: url(https://gpnl.innogamescdn.com/images/game/layout/gpwindow_corners.png);\
    background-repeat: no-repeat;\
    height: 44px;\
}\
.gpwindow-corner-top-left { left: -16px; background-position: left -34px; }\
.gpwindow-corner-top-right{ right: -16px; background-position: right -78px; }\
\
/* content area */\
.gm-gpwindow .gpwindow-body {\
    position: absolute;\
    top: 44px;\
    bottom: 17px;\
    left: 0;\
    right: 0;\
    overflow: auto;\
    padding: 12px;\
    box-sizing: border-box;\
    color: #fff;\
    background: linear-gradient(180deg, rgba(0,0,0,0.0), rgba(0,0,0,0.0));\
}\
\
/* optional footer bottom (for aesthetic) */\
.gm-gpwindow .gpwindow-bottom-space {\
    position: absolute;\
    left: 0;\
    right: 0;\
    bottom: 0;\
    height: 17px;\
    background: transparent;\
}\
\
/* small responsive adjustments */\
@media (max-width: 820px) {\
    .gm-gpwindow { width: calc(100% - 40px); left: 20px; right: 20px; }\
}
        `, "gm-styles-grepolis");
        // Add dummy element flag
        const el = document.createElement('meta');
        el.id = "gm-styles-grepolis";
        document.head.appendChild(el);
    }

    window.GM_Popup = window.GM_Popup || {};

    window.GM_Popup.open = function(payload) {
        payload = payload || {};
        const title = payload.title || "Grepolis Manager";
        const contentHtml = payload.contentHtml || `<div style="min-height:200px;">Grepolis Manager content</div>`;

        // If native API available and functional, try it first
        try {
            const L = (typeof unsafeWindow !== "undefined" ? unsafeWindow.Layout : window.Layout);
            if (L && L.wnd && typeof L.wnd.CreateLayoutWindow === "function") {
                // call native and return
                L.wnd.CreateLayoutWindow({
                    title: title,
                    content: contentHtml
                });
                return;
            }
        } catch (e) {
            console.debug("GM_Popup: native Layout failed, using fallback styled modal.", e);
        }

        // If modal already open - update contents
        const existing = document.getElementById("gm-gpwindow-backdrop");
        if (existing) {
            const body = existing.querySelector(".gpwindow-body");
            const t = existing.querySelector(".gpwindow-title");
            if (body) body.innerHTML = contentHtml;
            if (t) t.textContent = title;
            return;
        }

        // Create backdrop
        const backdrop = document.createElement("div");
        backdrop.id = "gm-gpwindow-backdrop";

        // outer window wrapper
        const win = document.createElement("div");
        win.className = "gm-gpwindow";

        // decorative verticals / corners (left/right)
        const vertLeft = document.createElement("div"); vertLeft.className = "gpwindow-vert-left";
        const vertRight = document.createElement("div"); vertRight.className = "gpwindow-vert-right";
        const cornerLeft = document.createElement("div"); cornerLeft.className = "gpwindow-corner-left";
        const cornerRight = document.createElement("div"); cornerRight.className = "gpwindow-corner-right";
        const cornerTopLeft = document.createElement("div"); cornerTopLeft.className = "gpwindow-corner-top-left";
        const cornerTopRight = document.createElement("div"); cornerTopRight.className = "gpwindow-corner-top-right";

        // top bar
        const top = document.createElement("div"); top.className = "gpwindow-top";
        const ttl = document.createElement("div"); ttl.className = "gpwindow-title"; ttl.textContent = title;
        const controls = document.createElement("div"); controls.className = "gpwindow-controls";
        const closeBtn = document.createElement("button"); closeBtn.className = "gpwindow-close"; closeBtn.innerHTML = "✕";
        closeBtn.addEventListener("click", closeModal);
        controls.appendChild(closeBtn);
        top.appendChild(ttl);
        top.appendChild(controls);

        // body
        const body = document.createElement("div"); body.className = "gpwindow-body"; body.innerHTML = contentHtml;

        // bottom spacer
        const bottom = document.createElement("div"); bottom.className = "gpwindow-bottom-space";

        // assemble
        win.appendChild(vertLeft);
        win.appendChild(vertRight);
        win.appendChild(cornerLeft);
        win.appendChild(cornerRight);
        win.appendChild(cornerTopLeft);
        win.appendChild(cornerTopRight);
        win.appendChild(top);
        win.appendChild(body);
        win.appendChild(bottom);

        backdrop.appendChild(win);
        document.body.appendChild(backdrop);

        // close when clicking outside
        backdrop.addEventListener("click", (ev) => {
            if (ev.target === backdrop) closeModal();
        });

        function closeModal() {
            const el = document.getElementById("gm-gpwindow-backdrop");
            if (el) el.remove();
        }
    };
})();

