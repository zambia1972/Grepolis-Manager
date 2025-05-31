// modules/helpers/Afwezigheidsassistent.js
// Injecteert een formulier in het Afwezig-topic voor snelle invoer

(function () {
    'use strict';

    const uw = unsafeWindow;

    function Afwezigheidsassistent(playerName = '') {
        let isUIInjected = false;

        const waitForElement = (selector, timeout = 3000) => {
            return new Promise((resolve, reject) => {
                const start = Date.now();
                const check = () => {
                    const el = document.querySelector(selector);
                    if (el) {
                        resolve(el);
                    } else if (Date.now() - start > timeout) {
                        reject(new Error(`Timeout wachten op ${selector}`));
                    } else {
                        setTimeout(check, 100);
                    }
                };
                check();
            });
        };

        const injectUI = () => {
            try {
                const forumTitel = document.querySelector('.forum_menu');
                if (!forumTitel?.textContent.toLowerCase().includes('algemeen')) return;

                const topicTitel = document.querySelector("#forum_thread_name_span_text_admin > span");
                if (!topicTitel?.textContent.toLowerCase().includes('afwezig')) return;

                const tekstveld = document.querySelector("#postlist");
                const uiExists = document.getElementById('afwezigheid-ui');
                if (!tekstveld || uiExists) return;

                const uiContainer = document.createElement('div');
                uiContainer.id = 'afwezigheid-ui';
                uiContainer.style.cssText = `
                    margin: 300px 0;
                    display: grid;
                    grid-template-columns: repeat(5, 1fr);
                    gap: 5px;
                    position: relative;
                    z-index: 9999;
                    background: #f5f5f5;
                    padding: 10px;
                    border-radius: 5px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                `;

                tekstveld.parentNode.insertBefore(uiContainer, tekstveld.nextSibling);

                const naamVeld = document.createElement('input');
                naamVeld.id = 'afw-speler';
                naamVeld.value = playerName;
                naamVeld.style.gridColumn = 'span 2';
                uiContainer.appendChild(naamVeld);

                const startDatum = document.createElement('input');
                startDatum.type = 'date';
                startDatum.required = true;

                const eindDatum = document.createElement('input');
                eindDatum.type = 'date';
                eindDatum.required = true;

                const vmCheck = document.createElement('input');
                vmCheck.type = 'checkbox';
                vmCheck.style.margin = 'auto';

                const opmerkingen = document.createElement('input');
                opmerkingen.type = 'text';
                opmerkingen.placeholder = 'Opmerkingen (optioneel)';

                const voegToeKnop = document.createElement('button');
                voegToeKnop.textContent = 'Voeg toe';
                voegToeKnop.style.backgroundColor = '#5a5a5a';
                voegToeKnop.style.color = 'white';

                uiContainer.append(startDatum, eindDatum, vmCheck, opmerkingen, voegToeKnop);

                voegToeKnop.addEventListener('click', async () => {
                    if (!startDatum.value || !eindDatum.value) {
                        alert('Vul start- en einddatum in!');
                        return;
                    }

                    const bewerkKnop = Array.from(document.querySelectorAll('a[onclick*="Forum.postEdit"]')).find(a =>
                        a.textContent.toLowerCase().includes('bewerken'));

                    if (bewerkKnop) bewerkKnop.click();

                    const tekstveld = await waitForElement("#forum_post_textarea:not([style*='display: none'])", 5000);

                    if (tekstveld) {
                        const rij = `[*][player]${naamVeld.value}[/player][|]${startDatum.value}[|]${eindDatum.value}[|]${vmCheck.checked ? 'Ja' : 'Nee'}[|]${opmerkingen.value || '-'}[/*]\n`;

                        const nieuweTekst = tekstveld.value.replace(
                            /(\[\/\*\*\]\s*\n)(.*?)(\n\[\*\]\[\|)/s,
                            `$1$2\n${rij}$3`
                        );

                        if (nieuweTekst !== tekstveld.value) {
                            tekstveld.value = nieuweTekst;
                            tekstveld.dispatchEvent(new Event('input', { bubbles: true }));

                            const opslaanKnop = document.querySelector("#post_save_form a.button_new.btn_ok");
                            if (opslaanKnop) opslaanKnop.click();
                        }
                    }

                    startDatum.value = '';
                    eindDatum.value = '';
                    vmCheck.checked = false;
                    opmerkingen.value = '';
                    isUIInjected = false;
                });

                isUIInjected = true;
            } catch (error) {
                console.error('[Afwezigheidsassistent] Injectie mislukt:', error);
            }
        };

        const init = () => {
            injectUI();

            new MutationObserver((mutations) => {
                const relevant = mutations.some(m =>
                    m.addedNodes.length > 0 &&
                    document.querySelector('.forum_menu')
                );
                if (relevant && !isUIInjected) injectUI();
            }).observe(document.body, {
                childList: true,
                subtree: true
            });
        };

        if (document.readyState === 'complete') {
            init();
        } else {
            window.addEventListener('load', init);
        }
    }

    uw.Afwezigheidsassistent = Afwezigheidsassistent;
})();
