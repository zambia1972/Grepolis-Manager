// popup.js - popup voor startscherm (button 1)

export function showStartscreenPopup() {
  let popup = document.getElementById('gm-popup');
  if (!popup) {
    popup = document.createElement('div');
    popup.id = 'gm-popup';
    popup.innerHTML = `
      <h2>Welkom ${name} bij Grepolis Manager</h2>
            <p>Dit script combineert de kracht van populaire Grepolis-tools in één handige oplossing en nog veel meer.</p>

            <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 20px;">
                ${[
                {
                    name: "Grepotools",
                    img: "https://www.grepotools.nl/wp-content/uploads/2022/08/logo_425x425.png",
                    description: "Script, tools en informatie voor Grepolis.",
                    url: "https://www.grepotools.nl/script/stable/grepotools.user.js"
                },
                {
                    name: "DIO-Tools",
                    img: "https://dio-david1327.github.io/img/site/btn-dio-settings.png",
                    description: "Extra opties voor een verbeterde gameplay.",
                    url: "https://dio-david1327.github.io/DIO-TOOLS-David1327/code.user.js"
                },
                {
                    name: "GRCRTools",
                    img: "https://cdn.grcrt.net/img/octopus.png",
                    description: "Krachtige tools voor rapporten en gameplay.",
                    url: "https://www.grcrt.net/scripts/GrepolisReportConverterV2.user.js"
                },
                {
                    name: "Map Enhancer",
                    img: "https://gme.cyllos.dev/res/icoon.png",
                    description: "Verbeter de kaartweergave met extra functies.",
                    url: "https://gme.cyllos.dev/GrepolisMapEnhancer.user.js"
                },
                {
                    name: "GrepoData",
                    img: "https://grepodata.com/favicon.ico",
                    description: "Geavanceerde tools en statistieken voor Grepolis.",
                    url: "https://api.grepodata.com/script/indexer.user.js"
                },
                {
                    name: "Forum Template",
                    img: "https://i.postimg.cc/7Pzd6360/def-button-2.png",
                    description: "Genereert een forumsjabloon met eenheden, gebouwen en stadsgod.",
                    url: "https://update.greasyfork.org/scripts/512594/Grepolis%20Notepad%20Forum%20Template%203.user.js"
                }
            ].map(tool => `
                    <div style="flex: 1; min-width: 150px; text-align: center;">
                        <img src="${tool.img}" alt="${tool.name}" style="width: 50px; height: 50px;">
                        <p style="font-size: 12px; font-weight: bold;">${tool.name}</p>
                        <p style="font-size: 12px;">${tool.description}</p>
                        <a href="${tool.url}" target="_blank" style="
                            display: inline-block;
                            background-color: #FF0000;
                            color: white;
                            padding: 5px 10px;
                            font-size: 11px;
                            border-radius: 4px;
                            text-decoration: none;
                            margin-top: 5px;
                        ">Download script</a>
                    </div>
                `).join('')}
            </div>

            <div style="margin-top: 20px; text-align: center;">
                <p style="font-size: 12px; font-style: italic;">Het Grepolis Manager Team</p>
                <div style="display: flex; justify-content: center; gap: 20px; margin-top: 10px;">
                    <div>
                        <p style="font-size: 12px; font-weight: bold;">Elona</p>
                        <img src="https://imgur.com/QxTgAHJ.png" alt="Elona Handtekening" style="width: 100px; height: auto; transform: rotate(${Math.floor(Math.random() * 30 - 15)}deg);">
                    </div>
                    <div>
                        <p style="font-size: 12px; font-weight: bold;">Zambia1972</p>
                        <img src="https://imgur.com/uHRXM9u.png" alt="Zambia1972 Handtekening" style="width: 200px; height: auto; transform: rotate(${Math.floor(Math.random() * 30 - 15)}deg);">
                    </div>
                </div>
            </div>
        `;
    document.body.appendChild(popup);
  }
  popup.style.display = 'block';
}
