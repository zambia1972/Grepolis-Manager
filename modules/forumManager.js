// modules/forumManager.js
// Beheert alle functionaliteit rond fora, topics, knoppen, helper tools, en leiding tools

(function () {
    'use strict';

    const uw = unsafeWindow;

    class ForumManager {
        constructor() {
            this.popup = null;
            this.playerName = ''; // Spelersnaam opslaan
            this.server = ''; // Server opslaan
            this.fora = [
                { name: "Algemeen", description: "Algemene discussies" },
                { name: "ROOD", description: "Noodmeldingen en verdediging" },
                { name: "Deff", description: "Verdedigingsstrategieën" },
                { name: "Offens", description: "Offensieve strategieën" },
                { name: "Massa_Aanval", description: "Massa-aanvallen" },
                { name: "Interne_Overnames", description: "Interne overnames" },
                { name: "Cluster", description: "Clusterbeheer" },
                { name: "Kroeg", description: "Informele discussies" },
                { name: "Leiding", description: "Leidinggevenden" },
            ];
            this.topicsData = {
                Algemeen: [
                    {
                        title: "Welkom bij de alliantie", content: "Hallo strijders van de oude wereld!\n" +
                        "\n" +
                        "We zijn ontzettend blij dat jullie hier zijn, op ons forum waar de goden en godinnen van de strategie samenkomen! Of je nu een doorgewinterde held bent of net je eerste stad hebt veroverd, hier is de plek waar we elkaar kunnen ontmoeten, tips kunnen uitwisselen en natuurlijk kunnen lachen om onze meest epische blunders (ja, we hebben allemaal wel eens een stad verloren aan een stelletje boze kippen).\n" +
                        "\n" +
                        "Voordat je je zwaarden en schilden opbergt, willen we je vragen om jezelf even kort voor te stellen. Vertel ons wie je bent, waar je vandaan komt en wat je favoriete strategie is. En als je een hilarisch verhaal hebt over een mislukte aanval of een onverwachte alliantie, deel dat vooral! We zijn hier om elkaar te steunen, maar ook om samen te lachen.\n" +
                        "\n" +
                        "Dus, trek je toga aan, neem een slok van je ambrosia en laat ons weten wie je bent! We kunnen niet wachten om je te leren kennen en samen de wereld van Grepolis te veroveren!\n" +
                        "\n" +
                        "Met strijdlustige groet,\n" +
                        "\n" +
                        "Het Grepolis Forum Team 🏛️✨"
                    },
                    {
                        title: "Te volgen regels", content: "🏛️ Alliantie Reglement – Samen Sterk, Samen Onverslaanbaar! 🏛️\n" +
                        "Welkom bij de alliantie! 🎉 We zijn hier niet alleen om een beetje rond te dobberen, maar om samen de vijand tot stof te reduceren. Dit reglement is geen bureaucratische onzin, maar een handleiding voor totale dominantie. Volg het, en we overleven. Negeer het, en de vijand lacht ons uit – en laten we eerlijk zijn, dat is gewoon gênant.\n" +
                        "\n" +
                        "1️⃣ Afwezigheid – Niet Stiekem Verdwijnen!\n" +
                        "Ga je langer dan 18 uur weg? Meld het op het forum. Laat ons ook weten of je de vakantiemodus aanzet.\n" +
                        "Geen melding = automatisch IO voor clustersteden, en geloof ons, dat wil je niet.\n" +
                        "\n" +
                        "👀 “Ik was even mijn kat zoeken” is geen excuus. We willen duidelijke communicatie.\n" +
                        "\n" +
                        "2️⃣ Opstand ([color=#FF0000]Rood[/color]) – Alarmfase Rood!\n" +
                        "Als je stad in opstand staat, panikeer niet (of doe dat stilletjes), maar maak een Rood-topic met de juiste informatie.\n" +
                        "\n" +
                        "📢 Verlies je een stad zonder iets te zeggen? Dan zetten we je op de lijst voor een gratis IO-abonnement, geen terugbetaling mogelijk.\n" +
                        "\n" +
                        "Extra tip: Geef updates over muurstand, inkomende aanvallen en spreuken. We zijn goed, maar we kunnen helaas nog geen gedachten lezen.\n" +
                        "\n" +
                        "3️⃣ Trips – Een Kleine Stap voor Jou, Een Grote Stap voor de Alliantie\n" +
                        "Plaats altijd trips bij je eilandgenoten. Een trip is 3 def lt per stad.\n" +
                        "\n" +
                        "💡 Denk eraan: geen trips plaatsen is als je huis openlaten voor inbrekers en zeggen: “Kom maar binnen, koffie staat klaar!”\n" +
                        "\n" +
                        "Vernieuw gesneuvelde trips en plaats een rapport in het trips-topic op het def-forum.\n" +
                        "\n" +
                        "4️⃣ Hulp Vragen & Elkaar Steunen – We Doen Dit Samen\n" +
                        "Vraag op tijd om hulp. Het is geen schande om hulp te vragen, het is een schande om stil te zijn en dan keihard onderuit te gaan. Gebruik forum, Discord of PM.\n" +
                        "\n" +
                        "Help! Mijn stad brandt! is trouwens een prima bericht. Sneller reageren we niet, maar het is wel dramatisch.\n" +
                        "\n" +
                        "5️⃣ Reservaties – Geen Vage Claims, Gewoon Doen\n" +
                        "Claim pas als je een kolo en een slotje hebt. Een claim is binnen 2 dagen overnemen, geen eindeloze bezetting van de stoel zoals een kleuter die niet van de schommel wil.\n" +
                        "\n" +
                        "🔴 PRIO-steden? Dan tellen claims niet. Pak het, of de vijand doet het. Simpel.\n" +
                        "\n" +
                        "6️⃣ Overzicht & Communicatie – Niet Raden, Gewoon Weten\n" +
                        "Gebruik BB-codes of zorg dat iemand het voor je doet. Anders proberen we je bericht zu ontcijferen alsof het een oude schatkaart is.\n" +
                        "\n" +
                        "🔍 Eilandcodes uit het Cluster Plan-topic gebruiken = dikke pluspunten.\n" +
                        "\n" +
                        "7️⃣ Offensief – Oorlog met Stijl\n" +
                        "🚫 Geen transportboten als aanval – tenzij je de vijand wilt laten lachen.\n" +
                        "🎯 VS voor je LT-aanval timen = slim.\n" +
                        "💥 Geen def lt of bir gebruiken bij aanvallen. Anders krijg je een cursus “Hoe val ik wél aan” gratis op het forum.\n" +
                        "\n" +
                        "🌙 Nachtbonus? Alleen aanvallen op inactieve spelers, lege steden of als je écht durft.\n" +
                        "\n" +
                        "8️⃣ TTA’s & Berichten – Reacties Zijn Belangrijker dan Je Ex\n" +
                        "Antwoord op TTA’s, berichten en Discord @’s. Geen reactie? Dan nemen we aan dat je ondergedoken bent en nemen we je clustersteden voor je eigen veiligheid over.\n" +
                        "\n" +
                        "Dus tenzij je graag een stadsloze kluizenaar wordt: reageren aub!\n" +
                        "\n" +
                        "9️⃣ Steden & Collectieve Verplichtingen – Iedereen Doet Mee\n" +
                        "Elke speler heeft minimaal 1 def lt-stad en 1 bir-stad.\n" +
                        "📌 Cluster Plan volgen = essentieel. Overnemen pas na 1 stad per cluster eiland (inclusief rotsen, ja, ook die lelijke).\n" +
                        "\n" +
                        "🔟 Rotsen & Gunstfarmen – Klein Maar Fijn\n" +
                        "Heb je een rotsstad? Zorg dat je actief bent en alarm aanzet. Anders is die rots sneller weg dan een gratis biertje op een festival.\n" +
                        "\n" +
                        "Gunst is belangrijk. Zonder gunst geen razende aanvallen. Zonder razende aanvallen? Nou ja, dan win je niet.\n" +
                        "\n" +
                        "Waarom deze regels?\n" +
                        "We zijn niet de alliantie van de vrije interpretatie. We zijn een goed geoliede machine die vijanden verslindt.\n" +
                        "🚀 Duidelijke afspraken = een sterke alliantie = Winst.\n" +
                        "\n" +
                        "Hou je eraan, dan maken we gehakt van de tegenstanders. Negeer ze? Dan krijg je een persoonlijke uitnodiging voor de IO van de Maand-competitie.\n" +
                        "\n" +
                        "💪 SAMEN DOMINEREN WE!\n" +
                        "\n" +
                        "Met strijdlustige groeten,\n" +
                        "🔥 De Leiding 🔥"
                    },
                    {
                        title: "Afwezig", content: "Laat hier weten als je er even tussenuit bent.\n" +
                        "\n" +
                        "[table]\n" +
                        "[**]Speler[||]Afwezig van[||]tem[||]VM[||]Opmerkingen[/**]\n" +
                        "[*][|][|][|][|][/*]\n" +
                        "[*][|][|][|][|][/*]\n" +
                        "[*][|][|][|][|][/*]\n" +
                        "[/table]\n"
                    },
                    {title: "Bondgenoten & NAP's", content: "Bondgenoten en NAP's worden hier besproken."},
                    {
                        title: "Spreuken en grondstoffen",
                        content: "Hier kunnen spelers om spreuken en grondstoffen vragen."
                    },
                    {
                        title: "Discord en scripts", content: "[b][u]Kom langs op onze discord server.[/u][/b]\n" +
                        "\n" +
                        "[url]https://discord.gg/v53K97dD8a[/url]\n" +
                        "\n" +
                        "[b][u]grepodata city-indexer[/u][/b]\n" +
                        "\n" +
                        "[url]https://grepodata.com/invite/rhzuhr2n4yqwd7dhcc[/url]\n" +
                        "\n" +
                        "[b][u]Forum ROOD template generator[/u][/b]\n" +
                        "\n" +
                        "[url]https://greasyfork.org/nl/scripts/512594-grepolis-notepad-forum-template-3[/url]"
                    }
                ],
                ROOD: [
                    {
                        title: "Rood tabel", content: "Bij meer dan 5 aanvallen wordt de tabel actief.\n" +
                        "[b][color=#FF0000]Bij een opstand éérst een eigen topic aanmaken in de juiste opmaak, [u]incl. tabelregel![/u][/color][/b]\n" +
                        "Tabelregel:\n" +
                        "[b][*]nr[|]OC[|]start F2[|]BB-code stad[|]muur[|]god[|]aanvaller(s)[|]BIR/LT[|]Aanwezige OS[|]Notes[/*][/b]\n" +
                        "Vul de tabelregel in met de gegevens van jouw ROOD melding en plaats deze bovenaan in je topic.\n" +
                        "                    muur -16 ➡️ alleen BIR sturen\n" +
                        "                    muur +16 ➡️ alleen LT (landtroepen) sturen\n" +
                        "                    Als de muur opgebouwd is én er geen reden op afbraak is, dan mag BIR omgezet worden naar LT.\n" +
                        "                    ⚠️ Zet géén sterretje in de titel van je topic! Forum mods zetten een * in de titel als indicatie dat de melding is opgenomen in de ROOD tabel. Doe je dit zelf, komt je stad NIET in de tabel terecht.\n" +
                        "                    [b]Mod van Dienst[/b]: [img]https://cdn.grcrt.net/emots2/girl_comp.gif[/img]\n" +
                        "                    [player]joppie86[/player]\n" +
                        "                    [table]\n" +
                        "                    [**]Nr[||]OC[||]Start F2[||]BB-code stad[||]Muur[||]God[||]aanvaller(s)[||]BIR/LT[||]Aanwezig[||]Notes[/**]\n" +
                        "                    [*][|][|][|][|][|][|][|][|][|][/*]\n" +
                        "                    [/table]\n" +
                        "                    [b][color=#FF2D2D][size=12]Dringend verzoek[/size]: Als je stad [b][u][size=12]safe[/size][/u][/b] is dit [u][size=12]melden[/size][/u] en de [u][size=12]OS terug sturen[/size][/u]! [/color][/b]"
                    },
                    {
                        title: "Kolo snipe", content: "Beste strijders,\n" +
                        "                    Aan alle [u]Kolo-spotters[/u]," +
                        "					 plaats in deze topic ASAP een bericht als je kolo hebt gespot.\n" +
                        "                    meld je stadsnaam in BB en exacte tijd van aankomst kolo + tijd laatste aanval voor kolo.\n" +
                        "                    Vb.:\n" +
                        "                    [town]1[/town]\n" +
                        "                    Kolo: 22:15:42\n" +
                        "                    laatste voor kolo: 22:15:32\n" +
                        "                    aan alle [u]Kolo-snipers[/u],\n" +
                        "                    hou deze topic goed in de gaten voor kolo-spotters, zodat je vlug kan handelen indien er kolo is gespot.\n" +
                        "                    [b]hoe timen:[/b]\n" +
                        "                    zorg in je snipe steden voor:\n" +
                        "                    * uiteraard BIR\n" +
                        "                    * transportboot\n" +
                        "                    * sirene\n" +
                        "                    gebruik bij voorkeur je aanvalsplanner om je ondersteuning te timen:\n" +
                        "                    poging 1: 1 tb + bir (min 50) check aankomsttijd en eventueel opnieuw proberen\n" +
                        "                    poging 2: 60 BIR meerdere pogingen versturen kort na elkaar van 10 sec voor tot 10 sec na opstandtijd\n" +
                        "                    poging 3: 1 sirene + Bir check aankomsttijd en eventueel opnieuw proberen\n" +
                        "                    succes\n"
                    },
                    {
                        title: "Rood Template",
                        content: "[*]nr[|]OC[|]start F2[|]aangevallen stad[|]muur[|]god[|]aanvallende speler[|]gewenste OS[|]aanwezig[|]Notes[/*]\n" +
                        "                    Aangevallen stad: \n" +
                        "                    God: \n" +
                        "                    Muur: \n" +
                        "                    Toren: \n" +
                        "                    Held: \n" +
                        "                    Ontwikkelingen: \n" +
                        "                    OS aanwezig: \n" +
                        "                    OS nodig: \n" +
                        "                    Stadsbescherming: \n" +
                        "                    Fase 2 begint om: \n" +
                        "                    Fase 2 eindigt om: \n" +
                        "                    [spoiler=Rapporten] \n" +
                        "                    *Opstandsrapport(ten)!!!*\n" +
                        "                    [/spoiler]\n"
                    }
                ],
                Deff: [
                    {
                        title: "Pre-deff", content: "Vraag hier je pre-deff aan voor belangrijke steden.\n" +
                        "\n" +
                        "                    Pre-deff kan je krijgen op voorwaarde dat je muur 25 is en Toren.\n" +
                        "\n" +
                        "                    hoe aanvragen:\n" +
                        "                    stadsnaam: in BB\n" +
                        "                    Muur Lv:\n" +
                        "                    Toren:\n" +
                        "                    aanwezige Lt:\n"
                    },
                ],
                Offens: [
                    {
                        title: "OFF. | Template", content: "Titel\n" +
                        "                    VB: Oceaan | Te veroveren stadsnaam | Status\n" +
                        "                    VB: 55 | 55-01 | Opstand/ VS clear nodig\n" +
                        "\n" +
                        "                    -------------------------------------------------------\n" +
                        "\n" +
                        "                    Alliantie:\n" +
                        "                    Speler:\n" +
                        "                    Stad:\n" +
                        "\n" +
                        "                    Gevraagde hulp: Spionage/ VS clear/ Zee clear\n" +
                        "\n" +
                        "                    [spoiler=Recentste spionage][/spoiler]\n" +
                        "\n" +
                        "                    [spoiler=Opstand aanval][/spoiler]\n"
                    },
                    {
                        title: "Opstand breken met Helena", content: "[b]Aan wie Helena bezit:[/b]\n" +
                        "                Zorg dat Helena op Lv 20 is.\n" +
                        "                meld hier in welke stad Helena zit.\n" +
                        "                controleer hier regelmatig naar opstanden.\n" +
                        "\n" +
                        "                [b]Aan wie opstand heeft:[/b]\n" +
                        "\n" +
                        "                Laat hier onmiddellijk weten waar er opstand in een stad word gezet (zelfs indien je zeker bent van een opstand, nog voor die er is).\n" +
                        "\n" +
                        "                stad: in BB\n" +
                        "                F2 tijd:\n" +
                        "\n" +
                        "                [table]\n" +
                        "                [**]naam[||]lv[||]stad[||][/**]\n" +
                        "                [*][|][|][|][/*]\n" +
                        "                [/table]\n"
                    },
                    {
                        title: "Spionage rapporten", content: "Hier kan je alle recente spionage rapporten bekijken."
                    },
                ],
                Massa_Aanval: [
                    {title: "Massa-aanvallen", content: "Inhoud van Massa-aanvallen..."},
                ],
                Interne_Overnames: [
                    {title: "Interne overnames", content: "Inhoud van Interne overnames..."},
                ],
                Cluster: [
                    {title: "Clusterbeheer", content: "Inhoud van Clusterbeheer..."},
                ],
                Kroeg: [
                    {title: "Kroegpraat", content: "Inhoud van Kroegpraat..."},
                ],
                Leiding: [
                    {title: "Leidinggevenden", content: "Inhoud van Leidinggevenden..."},
                ],
            };

            this.popup = null;
            this.playerName = '';
            this.server = '';
            this.fora = [/* ... blijft hetzelfde ... */];
            this.topicsData = {/* ... blijft hetzelfde ... */};
            this.militaryManager = new MilitaryManager();
            this.initHelpers();

            this.initializeDependencies().then(() => {
                this.initializeScript(); // Hier worden de knoppen gemaakt
                this.fetchPlayerInfo();
                this.injectAfwezigheidsassistent();
            }).catch(error => {
                console.error("Initialisatie mislukt:", error);
            });
        }


        async init() {
            await this.waitForGameReady();

            // Helpers (extern via aparte bestanden geladen via @require)
            this.attackRangeHelper = new uw.AttackRangeHelperManager(uw);
            await this.attackRangeHelper.initialize();

            this.feestenFixed = new uw.FeestenFixedManager();

            // Initialiseer UI
            this.initializeUI();

            // Spelerinformatie ophalen
            this.fetchPlayerInfo();

            // Injecteer automatische assistentie
            this.injectAfwezigheidsassistent();
        }

        waitForGameReady() {
            return new Promise((resolve, reject) => {
                let attempts = 0;
                const check = () => {
                    if (uw.Game && uw.ITowns) {
                        resolve();
                    } else if (attempts < 30) {
                        attempts++;
                        setTimeout(check, 250);
                    } else {
                        reject(new Error('Game objecten niet gevonden.'));
                    }
                };
                check();
            });
        }

        initializeUI() {
            this.addMainButton();
            this.injectStyles();
        }

        addMainButton() {
            const button = document.createElement('div');
            button.id = 'grepolis-manager-main-btn';
            button.style.cssText = `
                position: fixed;
                bottom: 60px;
                left: 30px;
                width: 60px;
                height: 60px;
                background-image: url('https://imgur.com/I62TXeo.png');
                background-size: cover;
                background-repeat: no-repeat;
                background-position: center;
                border-radius: 50%;
                border: 2px solid #caa35d;
                box-shadow: 0 0 15px #caa35d;
                cursor: pointer;
                z-index: 99999;
            `;
            button.title = 'Open Grepolis Manager';

            button.addEventListener('click', () => this.toggleMainWindow());

            document.body.appendChild(button);
        }

        toggleMainWindow() {
            this.createPopup();
        }

        createPopup() {
            if (!this.popup) {
                this.popup = document.createElement('div');
                this.popup.id = 'forum-popup';
                this.popup.style = `
                    display: none;
                    position: fixed;
                    width: 600px;
                    height: 400px;
                    background: #1e1e1e;
                    border: 2px solid #FF0000;
                    border-radius: 10px;
                    color: white;
                    font-family: Arial, sans-serif;
                    z-index: 10000;
                    box-shadow: 0 0 20px #FF0000;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    padding: 20px;
                    overflow: hidden;
                `;
                document.body.appendChild(this.popup);
            }

            const closeButton = document.createElement('button');
            closeButton.textContent = 'X';
            closeButton.style = `
                position: absolute;
                top: 10px;
                right: 10px;
                background: black;
                color: #FF0000;
                font-size: 16px;
                border: none;
                width: 30px;
                height: 30px;
                cursor: pointer;
                border-radius: 50%;
                box-shadow: 0 0 5px #FF0000;
            `;
            closeButton.addEventListener('click', () => {
                this.popup.style.display = 'none';
                console.log("Popup gesloten.");
            });

            const toolbar = document.createElement('div');
            toolbar.style = `
                display: flex;
                justify-content: space-between;
                margin-bottom: 20px;
            `;

            const button1 = this.createToolbarButton('Startscherm', () => this.showStartScreen());
            const button2 = this.createToolbarButton('Helper', () => this.showHelperTools());
            const button3 = this.createToolbarButton('Knop 3', () => alert('Knop 3 wordt later toegevoegd.'));
            const button4 = this.createToolbarButton('Leiding Tools', () => this.showLeadershipTools());
            const button5 = this.createToolbarButton('Fora en Topics', () => this.createAllForaAndTopics());

            toolbar.appendChild(button1);
            toolbar.appendChild(button2);
            toolbar.appendChild(button3);
            toolbar.appendChild(button4);
            toolbar.appendChild(button5);

            const content = document.createElement('div');
            content.id = 'popup-content';
            content.style = `
                flex-grow: 1;
                padding: 20px;
                overflow-y: auto;
                max-height: 300px;
                position: relative;
            `;

            this.popup.innerHTML = '';
            this.popup.appendChild(closeButton);
            this.popup.appendChild(toolbar);
            this.popup.appendChild(content);
            this.popup.style.display = 'block';

            // Toon standaard eerste scherm
            this.showStartScreen();
        }

        createToolbarButton(text, onClick) {
            const button = document.createElement('button');
            button.textContent = text;
            button.style = `
                background: black;
                color: #FF0000;
                border: 1px solid #FF0000;
                padding: 10px 20px;
                cursor: pointer;
                font-size: 14px;
                border-radius: 5px;
                margin: 0 5px;
            `;
            button.addEventListener('click', onClick);
            return button;
        }

        showStartScreen() {
            const content = document.getElementById('popup-content');
            content.innerHTML = `
                <h2>Welkom bij Grepolis Manager</h2>
                <p>Dit script combineert de kracht van populaire Grepolis-tools in één handige oplossing.</p>
                ${this.playerName ? `<p>Welkom, ${this.playerName}!</p>` : '<p>Welkom, gast!</p>'}
            `;
        }

        showHelperTools() {
            const content = document.getElementById('popup-content');
            if (!content) return;

            content.innerHTML = `
                <h2>Helper Tools</h2>
                <div id="helper-buttons" style="display: grid; gap: 10px;"></div>
            `;

            this.addHelperToggle(
                'AttackRange Helper',
                'Toont aanvalsbereik op basis van spelerspunten',
                (state) => this.attackRangeHelper?.toggle(state),
                () => this.attackRangeHelper?.showHelpPopup()
            );

            this.addHelperToggle(
                'FeestenFixed',
                'Toont steden waar je Stadsfeesten en Theaters kan activeren',
                (state) => this.feestenFixed.toggle(state),
                () => this.feestenFixed.showCustomHelp()
            );
        }

        addHelperToggle(label, helpText, onClick, onHelpClick) {
            const container = document.getElementById('helper-buttons');
            if (!container) return;

            const wrapper = document.createElement('div');
            wrapper.style.cssText = `
                display: flex;
                flex-direction: column;
                gap: 5px;
                margin-bottom: 15px;
                align-items: flex-start;
            `;

            const labelElement = document.createElement('span');
            labelElement.textContent = label;
            labelElement.style.cssText = `
                color: #FF0000;
                font-weight: bold;
                font-size: 14px;
                margin-left: 5px;
            `;

            const switchContainer = document.createElement('div');
            switchContainer.style.cssText = `
                display: flex;
                align-items: center;
                gap: 10px;
                width: 100%;
            `;

            const switchInput = document.createElement('input');
            switchInput.type = 'checkbox';
            switchInput.id = `switch-${label.toLowerCase().replace(/\s+/g, '-')}`;
            switchInput.style.display = 'none';

            const switchLabel = document.createElement('label');
            switchLabel.htmlFor = switchInput.id;
            switchLabel.style.cssText = `
                position: relative;
                display: inline-block;
                width: 60px;
                height: 30px;
                background-color: #333;
                border-radius: 15px;
                cursor: pointer;
                transition: all 0.3s;
                border: 1px solid #FF0000;
                order: 1;
            `;

            const switchButton = document.createElement('span');
            switchButton.style.cssText = `
                position: absolute;
                height: 26px;
                width: 26px;
                left: 2px;
                bottom: 2px;
                background-color: white;
                border-radius: 50%;
                transition: all 0.3s;
            `;

            const helpBtn = document.createElement('button');
            helpBtn.innerHTML = '?';
            helpBtn.title = helpText;
            helpBtn.style.cssText = `
                background: #444;
                color: #FFF;
                border-radius: 50%;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                border: none;
                order: 2;
            `;

            switchLabel.appendChild(switchButton);
            switchContainer.appendChild(switchInput);
            switchContainer.appendChild(switchLabel);
            switchContainer.appendChild(helpBtn);

            wrapper.appendChild(labelElement);
            wrapper.appendChild(switchContainer);
            container.appendChild(wrapper);

            switchInput.addEventListener('change', (e) => {
                const state = e.target.checked ? 'on' : 'off';
                if (state === 'on') {
                    switchLabel.style.backgroundColor = '#FF0000';
                    switchButton.style.transform = 'translateX(30px)';
                } else {
                    switchLabel.style.backgroundColor = '#333';
                    switchButton.style.transform = 'translateX(0)';
                }
                onClick(state);
            });

            helpBtn.addEventListener('click', () => onHelpClick());
        }

        fetchPlayerInfo() {
            const maxAttempts = 10;
            let attempts = 0;

            const check = () => {
                const playerId = localStorage.getItem('grepolisPlayerId');
                const playerName = localStorage.getItem('grepolisPlayerName');

                if (playerId && playerName) {
                    this.playerId = playerId;
                    this.playerName = playerName;
                    console.log('[Grepolis Manager] Spelerinformatie gevonden:', this.playerName);
                } else if (attempts < maxAttempts) {
                    attempts++;
                    console.log(`[Grepolis Manager] Poging ${attempts}: spelerinfo niet gevonden.`);
                    setTimeout(check, 1000);
                } else {
                    console.warn('[Grepolis Manager] Geen spelerinformatie gevonden.');
                }
            };

            check();
        }

        injectStyles() {
            const styles = `
                #forum-popup h2 {
                    color: #FF0000;
                    text-align: center;
                }
                #forum-popup p {
                    text-align: center;
                }
            `;
            const styleElement = document.createElement('style');
            styleElement.textContent = styles;
            document.head.appendChild(styleElement);
        }

        injectAfwezigheidsassistent() {
            if (typeof uw.Afwezigheidsassistent === 'function') {
                try {
                    uw.Afwezigheidsassistent(this.playerName);
                } catch (e) {
                    console.warn('[Grepolis Manager] Afwezigheidsassistent injectie faalde:', e);
                }
            }
        }

        showLeadershipTools() {
            const content = document.getElementById('popup-content');
            content.innerHTML = `
                <h2>Leiding Tools</h2>
                <p>Leiding modules worden later toegevoegd.</p>
            `;
        }

        createAllForaAndTopics() {
            const content = document.getElementById('popup-content');
            content.innerHTML = `
                <h2>Fora en Topics</h2>
                <p>Deze functionaliteit wordt nog toegevoegd.</p>
            `;
        }
    }

    uw.ForumManager = ForumManager;
})();
