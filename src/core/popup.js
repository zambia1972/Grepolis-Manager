(function(){
    // Styles voor fallback modal (wordt toegevoegd één keer)
    if (typeof GM_addStyle === "function") {
        GM_addStyle(`
        /* Grepolis Manager fallback modal */
        #gm-modal-backdrop {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.6);
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        #gm-modal {
            width: 680px;
            max-width: calc(100% - 40px);
            background: linear-gradient(180deg,#1e1e1e,#171717);
            border-radius: 8px;
            box-shadow: 0 8px 30px rgba(0,0,0,0.6);
            color: #fff;
            font: 13px Verdana, Arial, Helvetica, sans-serif;
            overflow: hidden;
        }
        #gm-modal .gm-modal-header {
            display:flex;
            align-items:center;
            justify-content:space-between;
            padding: 10px 14px;
            border-bottom: 1px solid rgba(255,255,255,0.03);
            background: linear-gradient(180deg, rgba(255,0,0,0.06), transparent);
        }
        #gm-modal .gm-modal-title { font-weight:700; }
        #gm-modal .gm-modal-close {
            cursor:pointer;
            border:none;
            background:transparent;
            color:#fff;
            font-size:16px;
            padding:4px 8px;
        }
        #gm-modal .gm-modal-body {
            padding: 14px;
            max-height: 60vh;
            overflow:auto;
        }
        `);
    }

    window.GM_Popup = window.GM_Popup || {};

    window.GM_Popup.open = function(payload) {
        // payload optional: { title, contentHtml }
        payload = payload || {};
        const title = payload.title || "Grepolis Manager";
        const contentHtml = payload.contentHtml ||
            `<div>Grepolis Manager is geladen!<br><small>Vervang dit met je UI.</small></div>`;

        // 1) Probeer Grepolis native popup API (veilig binnen try/catch)
        try {
            // meerdere Grepolis versies kunnen Layout op unsafeWindow hebben
            const L = (typeof unsafeWindow !== "undefined" && unsafeWindow.Layout) ? unsafeWindow.Layout : window.Layout;
            if (L && L.wnd && typeof L.wnd.CreateLayoutWindow === "function") {
                // gebruik Grepolis popup API
                L.wnd.CreateLayoutWindow({
                    title: title,
                    content: contentHtml
                });
                return; // klaar
            }

            // Mogelijk oude/andere API: controleer OpenWindow of UI lib
            if (L && typeof L.Create === "function") {
                // experimenteel fallback (niet vaak gebruikt)
                L.Create({
                    title, content: contentHtml
                });
                return;
            }
        } catch (e) {
            // swallow — we zullen fallback gebruiken
            console.debug("GM_Popup: Grepolis popup API niet beschikbaar of gaf fout:", e);
        }

        // 2) Fallback: eigen modal maken (simpel, veilig, altijd werkt)
        if (document.getElementById("gm-modal-backdrop")) {
            // modal al open, update inhoud indien nodig
            const body = document.querySelector("#gm-modal .gm-modal-body");
            if (body) body.innerHTML = contentHtml;
            const t = document.querySelector("#gm-modal .gm-modal-title");
            if (t) t.textContent = title;
            return;
        }

        // backdrop
        const backdrop = document.createElement("div");
        backdrop.id = "gm-modal-backdrop";
        backdrop.addEventListener("click", (ev) => {
            if (ev.target === backdrop) closeModal(); // klik buiten sluit
        });

        // modal
        const modal = document.createElement("div");
        modal.id = "gm-modal";

        // header
        const header = document.createElement("div");
        header.className = "gm-modal-header";
        const htitle = document.createElement("div");
        htitle.className = "gm-modal-title";
        htitle.textContent = title;
        const closeBtn = document.createElement("button");
        closeBtn.className = "gm-modal-close";
        closeBtn.innerHTML = "✕";
        closeBtn.addEventListener("click", closeModal);

        header.appendChild(htitle);
        header.appendChild(closeBtn);

        // body
        const body = document.createElement("div");
        body.className = "gm-modal-body";
        body.innerHTML = contentHtml;

        modal.appendChild(header);
        modal.appendChild(body);
        backdrop.appendChild(modal);
        document.body.appendChild(backdrop);

        function closeModal() {
            const el = document.getElementById("gm-modal-backdrop");
            if (el) el.remove();
        }
    };
})();


