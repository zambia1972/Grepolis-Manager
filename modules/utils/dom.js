// modules/utils/dom.js
// Algemene DOM-hulpfuncties: wachten, escapen, BBCode invoegen

(function () {
    'use strict';

    const uw = unsafeWindow;

    const DOMUtils = {
        /**
         * Wacht tot een DOM-element beschikbaar is.
         * @param {string} selector - CSS-selector voor het element.
         * @param {number} timeout - Maximale wachttijd in ms (default: 5000).
         * @returns {Promise<HTMLElement>}
         */
        waitFor(selector, timeout = 5000) {
            return new Promise((resolve, reject) => {
                const start = Date.now();

                const check = () => {
                    const el = document.querySelector(selector);
                    if (el) {
                        resolve(el);
                    } else if (Date.now() - start >= timeout) {
                        reject(new Error(`[waitFor] Timeout: ${selector}`));
                    } else {
                        setTimeout(check, 100);
                    }
                };

                check();
            });
        },

        /**
         * Escape HTML-tekens om XSS of layoutbreuken te voorkomen.
         * @param {string} unsafe - Ruwe tekst.
         * @returns {string}
         */
        escapeHtml(unsafe) {
            return unsafe
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        },

        /**
         * Voeg BBCode in op de huidige cursorpositie binnen een textarea.
         * @param {HTMLTextAreaElement} textarea
         * @param {string} tag - De BBCode tag (zonder haakjes)
         * @param {string} content - De inhoud tussen de tags
         */
        insertBBCode(textarea, tag, content) {
            if (!textarea) return;

            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const before = textarea.value.substring(0, start);
            const after = textarea.value.substring(end);

            const bbcode = `[${tag}]${content}[/${tag}]`;

            textarea.value = before + bbcode + after;

            // Zet cursor achter de geplakte content
            textarea.selectionStart = textarea.selectionEnd = before.length + bbcode.length;

            // Trigger input event
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
    };

    uw.DOMUtils = DOMUtils;
})();
