// ==UserScript==
// @name         Grepolis Report Auto Indexer
// @version      1.0
// @description  Automatisch indexeren van rapporten in Grepolis en tonen in een verplaatsbaar venster
// @include      http://*.grepolis.com/game/*
// @include      https://*.grepolis.com/game/*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    console.log("Grepolis Report Auto Indexer geladen");

    // Maak een verplaatsbaar venster aan
    function createReportWindow() {
        const reportWindow = document.createElement('div');
        reportWindow.id = 'reportWindow';
        reportWindow.style.position = 'fixed';
        reportWindow.style.top = '100px';
        reportWindow.style.right = '20px';
        reportWindow.style.width = '300px';
        reportWindow.style.height = '400px';
        reportWindow.style.backgroundColor = 'white';
        reportWindow.style.border = '1px solid black';
        reportWindow.style.padding = '10px';
        reportWindow.style.overflowY = 'auto';
        reportWindow.style.zIndex = '10000';
        reportWindow.style.display = 'none';

        const header = document.createElement('div');
        header.textContent = 'Geïndexeerde Rapporten';
        header.style.fontWeight = 'bold';
        reportWindow.appendChild(header);

        const closeButton = document.createElement('button');
        closeButton.textContent = 'Sluiten';
        closeButton.onclick = () => reportWindow.style.display = 'none';
        reportWindow.appendChild(closeButton);

        const reportList = document.createElement('div');
        reportList.id = 'reportList';
        reportWindow.appendChild(reportList);

        document.body.appendChild(reportWindow);

        const openButton = document.createElement('button');
        openButton.textContent = 'Toon Rapporten';
        openButton.style.position = 'fixed';
        openButton.style.top = '60px';
        openButton.style.right = '20px';
        openButton.style.zIndex = '10000';
        openButton.onclick = () => {
            reportWindow.style.display = 'block';
            fetchIndexedReports();
        };
        document.body.appendChild(openButton);
    }

    // Ophalen van rapporten via API
    function fetchIndexedReports() {
        const apiUrl = 'https://api.grepodata.com/script/indexer.js?v=483276';
        console.log(`Probeer rapporten op te halen van: ${apiUrl}`);

        GM_xmlhttpRequest({
            method: 'GET',
            url: apiUrl,
            onload: function(response) {
                if (response.status !== 200) {
                    console.error("API gaf een foutstatus terug:", response.status);
                    return;
                }

                console.log("API respons ontvangen:", response.responseText);

                const match = response.responseText.match(/var reports = (\[.*?\]);/s);
                if (!match) {
                    console.error("Geen rapportgegevens gevonden in API-respons.");
                    return;
                }

                let reports;
                try {
                    reports = JSON.parse(match[1]);
                } catch (jsonError) {
                    console.error("Fout bij JSON-parsing:", jsonError);
                    return;
                }

                const reportList = document.getElementById('reportList');
                reportList.innerHTML = '';
                reports.forEach(report => {
                    const reportItem = document.createElement('div');
                    reportItem.textContent = report.title || 'Onbekend rapport';
                    reportItem.style.borderBottom = '1px solid #ccc';
                    reportItem.style.padding = '5px';
                    reportList.appendChild(reportItem);
                });
            },
            onerror: function(error) {
                console.error("Fout bij ophalen van API:", error);
            }
        });
    }

    // Start het script
    createReportWindow();
})();
