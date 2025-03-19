// ==UserScript==
// @name                Grepolis Auto send grepodata
// @version             1.0.8
// @author              dx droni <mr droonixgmail.com>
// @updater		Nebouh
// @updateURL           https://github.com/Nebouh/Grepolis-AutoSend-Grepodata/raw/main/index.user.js
// @downloadURL         https://github.com/Nebouh/Grepolis-AutoSend-Grepodata/raw/main/index.user.js
// @description         Utility Grepolis script that auto send report grepodata.
// @include             http://*.grepolis.com/game/*
// @include             https://*.grepolis.com/game/*
// @exclude             view-source://*
// @copyright           dx droni, update by Nebouh, 2022+
// @grant               none
// ==/UserScript==

// global variables

(() => {
    jQueryInit();
    reportAutoIndexer();
})();

function jQueryInit() {
    if (window.jQuery) {

    } else {
        var script = document.createElement('script');
        script.src = 'https://code.jquery.com/jquery-2.1.4.min.js';
        script.type = 'text/javascript';
        document.getElementsByTagName('head')[0].appendChild(script);
    }
}

// Automatically index opened reports. Works only if you have GrepoData user script installed
async function reportAutoIndexer() {

    let lastReportElement = null;

    const observer = new MutationObserver((mutations) => {
        const reportWindow = document.getElementById('report_report');
        const mutatedElement = mutations[0].target;

        const forumWindow = document.getElementById('forum');
		if (forumWindow) {
			document.querySelectorAll('[id^="gd_index_f_bb_codes_report_"]').forEach(btn => btn.click())
		}

        // only if report element is not null, ajax loader is hidden (report is loaded) and report element is different than the last one
        if (reportWindow && mutatedElement.style.visibility === 'hidden' && reportWindow !== lastReportElement) {
            lastReportElement = reportWindow;

            const indexElement = document.getElementById('gd_index_rep_txt');

            // if index element is not null and it's not indexed yet (textContent === Index +)
            if (indexElement && indexElement.textContent === 'Index +') {
                indexElement.click();
            }
        }
    });

    await waitUntilElementIsLoaded('ajax_loader', 2000);

    const ajaxLoader = document.getElementById('ajax_loader');

    observer.observe(ajaxLoader, {
        attributes: true,
    });

    function wait(time) {
        return new Promise(resolve => setTimeout(resolve, time));
    }

    async function waitUntilElementIsLoaded(selector, time) {
        if (document.getElementById(selector) === null) {
            await wait(time);
            await waitUntilElementIsLoaded(selector, time);
        }
    }
}
