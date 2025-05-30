// modules/chat/parser.js

(function() {
  'use strict';

  // - BBCode parsing

    const parseBBCode = (text) => {
        if (!text) return "";

        const escapeHtml = (str) =>
        str.replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

        let out = text; // begin met de ruwe tekst

        // Stap 1: [table] parsing eerst, met recursie
        // 1) Zorg dat deze regel als allereerste in je parseBBCode komt:
        out = out.replace(/\[table\]([\s\S]*?)\[\/table\]/gi, (_, raw) => {
            let content = raw;

            // Verwijder alle sluit‑row‑tags "[/*]" voordat we verder gaan
            content = content.replace(/\[\/\*\]/g, '');

            let html = '<table style="border-collapse: collapse; border: 1px solid #666; width:100%;">';

            // Header verwerken
            const headerMatch = content.match(/\[\*\*\]([\s\S]*?)\[\/\*\*\]/i);
            if (headerMatch) {
                html += '<thead><tr>';
                headerMatch[1].split(/\[\|\|\]/g).forEach(h => {
                    html += `<th style="border:1px solid #666; padding:4px; background:#444; color:#fff;">${h.trim()}</th>`;
                });
                html += '</tr></thead>';
                content = content.replace(headerMatch[0], '');
            }

            // Body verwerken
            html += '<tbody>';
            content
                .split(/\[\*\]/g)          // splits op elke "[*]"
                .map(r => r.trim())       // trim whitespace
                .filter(r => r)           // verwijder lege stukken
                .forEach(row => {
                html += '<tr>';
                row.split(/\[\|\]/g)     // splits op elke "[|]"
                    .forEach(cell => {
                    html += `<td style="border:1px solid #666; padding:4px;">${cell.trim()}</td>`;
                });
                html += '</tr>';
            });
            html += '</tbody></table>';
            return html;
        });

        // Stap 2: standaard BBCode
        const rules = [

            { regex: /\[b\](.*?)\[\/b\]/gis, replacement: "<strong>$1</strong>" },
            { regex: /\[i\](.*?)\[\/i\]/gis, replacement: "<em>$1</em>" },
            { regex: /\[u\](.*?)\[\/u\]/gis, replacement: "<u>$1</u>" },
            { regex: /\[s\](.*?)\[\/s\]/gis, replacement: "<s>$1</s>" },
            { regex: /\[url=(.*?)\](.*?)\[\/url\]/gis, replacement: '<a href="$1" target="_blank" rel="noopener noreferrer">$2</a>' },
            { regex: /\[img\](.*?)\[\/img\]/gis, replacement: '<img src="$1" style="max-width:100%; height:auto;">' },
            { regex: /\[color=([^\]]+)\](.*?)\[\/color\]/gis, replacement: '<span style="color:$1;">$2</span>' },
            { regex: /\[font=([^\]]+)\](.*?)\[\/font\]/gis, replacement: '<span style="font-family:$1;">$2</span>' },
            { regex: /\[size=(\d+)\](.*?)\[\/size\]/gis, replacement: '<span style="font-size:$1px;">$2</span>' },
            { regex: /\[center\](.*?)\[\/center\]/gis, replacement: '<div style="text-align:center;">$1</div>' },
            { regex: /\[quote(?:=[^\]]+)?\](.*?)\[\/quote\]/gis, replacement: '<blockquote style="border-left: 3px solid #888; padding-left: 8px; margin: 6px 0;">$1</blockquote>' },


        ];
        for (const rule of rules) {
            out = out.replace(rule.regex, rule.replacement);
        }

        // Stap 3: vervang [player] los, met escape én zonder innerlijke escape van de stijl
        out = out.replace(/\[player\](.*?)\[\/player\]/gi, (_, name) => {
            const safeName = escapeHtml(name.trim());
            const escapedForJS = name.trim().replace(/'/g, "\\'");
            const style = getPlayerStyle().replace(/\n/g, "").trim(); // geen line breaks

            return `<a href="#" class="bb-player" data-player="${safeName}" onclick="event.preventDefault();window.openPlayerProfile('${escapedForJS}')" style="${style}">${safeName}</a>`;
        });

        // Ally tag (met icoon)
        out = out.replace(/\[ally\](.*?)\[\/ally\]/gi, (_, allyName) => {
            const safeName = escapeHtml(allyName.trim());
            const style = getAllyStyle().replace(/\n/g, "").trim();

            return `<span class="bb-ally" style="${style}">${safeName}</span>`;
        });

        out = out.replace(/\[town\](.*?)\[\/town\]/gi, (_, townId) => {
            const town = (townsCache || []).find(t => t && String(t.id) === townId);
            if (!town) return `<span class="bb-town unknown">[onbekend]</span>`;
            const style = getTownStyle().replace(/\n/g, "").trim();
            return `<span class="bb-town" style="${style}">${escapeHtml(town.name)}</span>`;
        });

        // Island tag (met icoon)
        out = out.replace(/\[island\](.*?)\[\/island\]/gi, (_, islandName) => {
            const safeName = escapeHtml(islandName.trim());
            const style = getIslandStyle().replace(/\n/g, "").trim();

            return `<span class="bb-island" style="${style}">${safeName}</span>`;
        });


        // Stap 4: vervang linebreaks
        out = out.replace(/\n/g, "<br>");
        return out;
    };

  window.parseBBCode = parseBBCode;
})();

