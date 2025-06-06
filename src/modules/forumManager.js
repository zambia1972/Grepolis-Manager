export function startForumManager() {
    const manager = new ForumManager();
    manager.show();

    class ForumManager {
        constructor() {
            this.popup = null;
            this.playerName = '';
            this.server = '';
            this.troopManager = new TroopManager(this);
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
                        "                    Vul de tabelregel in met de gegevens van jouw ROOD melding en plaats deze bovenaan in je topic.\n" +
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
        }
        async createAllForaAndTopics() {
            const content = document.getElementById('popup-content');
            content.innerHTML = `
                <h2>Fora en Topics Aanmaken</h2>
                <p>Klik op de knop hieronder om alle fora en topics in één keer aan te maken.</p>
                <button id="start-creation" style="background: black; color: #FF0000; border: 1px solid #FF0000; padding: 10px 20px; cursor: pointer; font-size: 14px; border-radius: 5px;">Start Aanmaken</button>
                <div id="status-messages" style="margin-top: 20px;"></div>
            `;

            const startButton = content.querySelector('#start-creation');
            startButton.addEventListener('click', async () => {
                const statusDiv = document.getElementById('status-messages');
                statusDiv.innerHTML = '';

                try {
                    // Navigeer naar het alliantieforum
                    await this.navigateToAllianceForum();

                    // Open het forumbeheer (alleen voor het eerste forum)
                    let isForumAdminOpen = false;

                    // Maak alle fora aan
                    for (let i = 0; i < this.fora.length; i++) {
                        const forum = this.fora[i];
                        if (await this.forumExists(forum.name)) {
                            statusDiv.innerHTML += `<p>Forum "${forum.name}" bestaat al.</p>`;
                        } else {
                            if (!isForumAdminOpen) {
                                await this.openForumAdmin();
                                isForumAdminOpen = true;
                            }
                            await this.createForum(forum);

                            // Sluit het dialoogvenster alleen na het laatste forum
                            if (i === this.fora.length - 1) {
                                await this.closeDialog();
                            }

                            statusDiv.innerHTML += `<p>Forum "${forum.name}" succesvol aangemaakt.</p>`;
                        }
                    }

                    // Terugkeren naar het alliantieforum
                    await this.navigateToAllianceForum();

                    // Maak alle topics aan
                    for (const forumName in this.topicsData) {
                        const topics = this.topicsData[forumName];

                        // Navigeer naar het juiste forum
                        await this.navigateToForum(forumName);

                        for (const topic of topics) {
                            if (await this.topicExists(forumName, topic.title)) {
                                statusDiv.innerHTML += `<p>Topic "${topic.title}" in forum "${forumName}" bestaat al.</p>`;
                            } else {
                                await this.createTopic(topic);
                                statusDiv.innerHTML += `<p>Topic "${topic.title}" in forum "${forumName}" succesvol aangemaakt.</p>`;

                                // Keer terug naar het forum na het aanmaken van het topic
                                await this.navigateToForum(forumName);
                            }
                        }
                    }

                    // Sluit het dialoogvenster na het aanmaken van alle topics
                    await this.closeDialog();

                    statusDiv.innerHTML += `<p><strong>Alle fora en topics zijn verwerkt!</strong></p>`;
                } catch (error) {
                    statusDiv.innerHTML += `<p style="color: red;">Fout: ${error.message}</p>`;
                    console.error(error);
                }
            });
        }

        async navigateToAllianceForum() {
            console.log("Navigeer naar alliantieforum...");
            const forumButton = await this.waitForElement('#ui_box > div.nui_main_menu > div.middle > div.content > ul > li.allianceforum.main_menu_item > span > span.name_wrapper > span', 15000);
            if (forumButton) {
                forumButton.click();
                await this.waitForElement('.forum_menu', 15000);
            } else {
                throw new Error('Kon het alliantieforum niet vinden.');
            }
        }

        async navigateToForum(forumName) {
            console.log(`Navigeer naar forum: ${forumName}`);

            try {
                // Zoek het forum op basis van de naam
                const forumLinks = document.querySelectorAll('a.submenu_link[data-menu_name]');
                let foundForum = null;

                // Loop door alle forum links
                for (const link of forumLinks) {
                    const forumSpan = link.querySelector('span.forum_menu');
                    if (forumSpan) {
                        const linkText = forumSpan.textContent.trim();
                        if (linkText.toLowerCase() === forumName.toLowerCase()) {
                            foundForum = link;
                            break;
                        }
                    }
                }

                if (!foundForum) {
                    // Toon beschikbare forums voor debuggen
                    const availableForums = Array.from(forumLinks).map(link => {
                        return link.querySelector('span.forum_menu')?.textContent.trim() || 'Onbekend forum';
                    });

                    console.error('Beschikbare forums:', availableForums);
                    throw new Error(`Forum "${forumName}" niet gevonden in de lijst.`);
                }

                // Klik op het forum
                console.log(`Klik op forum: ${forumName}`);
                foundForum.click();

                // Wacht 3 seconden om de pagina te laten laden
                await new Promise(resolve => setTimeout(resolve, 3000));

                // Controleer of het forum leeg is
                const threadList = document.querySelector('.forum_thread_list');
                if (!threadList) {
                    console.log(`Forum "${forumName}" is leeg of het element .forum_thread_list bestaat niet.`);
                    return; // Stop verdere acties voor dit forum
                }

                console.log(`Forum "${forumName}" succesvol geladen.`);

            } catch (error) {
                console.error(`Fout bij navigeren naar forum "${forumName}":`, error);
                throw error; // Gooi de fout opnieuw voor hogere afhandeling
            }
        }

        async forumExists(forumName) {
            const forumLinks = document.querySelectorAll('a.submenu_link[data-menu_name]');
            for (const link of forumLinks) {
                const forumSpan = link.querySelector('span.forum_menu');
                if (forumSpan && forumSpan.textContent.trim().toLowerCase() === forumName.toLowerCase()) {
                    return true;
                }
            }
            return false;
        }

        async topicExists(forumName, topicTitle) {
            const topicTitles = document.querySelectorAll('.forum_thread_title');
            if (topicTitles.length === 0) {
                console.log(`Geen topics gevonden in forum "${forumName}".`);
                return false; // No topics exist in this forum
            }
            for (const title of topicTitles) {
                if (title.textContent.trim().toLowerCase() === topicTitle.toLowerCase()) {
                    return true;
                }
            }
            return false;
        }

        async createForum(forum) {
            console.log(`Maak forum aan: ${forum.name}`);

            // Klik op de knop om een nieuw forum aan te maken
            await this.clickButton("#forum_admin > div.game_list_footer > a > span.left > span > span", 15000);

            // Vul de forumnaam en beschrijving in
            await this.fillField("#forum_forum_name", forum.name, 15000);
            await this.fillField("#forum_forum_content", forum.description, 15000);

            // Klik op de bevestigingsknop
            await this.clickButton("#create_forum_confirm > span.left > span > span", 15000);

            // Wacht tot het forum is aangemaakt
            await new Promise(resolve => setTimeout(resolve, 3000));
        }

        async createTopic(topic) {
            console.log(`Maak topic aan: ${topic.title}`);

            // Klik op de knop om een nieuw topic aan te maken
            await this.clickButton("#forum_buttons > a:nth-child(1) > span.left > span > span", 15000);

            // Vul de titel in
            await this.fillField("#forum_thread_name", topic.title, 15000);

            // Vul de inhoud in
            await this.fillField("#forum_post_textarea", topic.content, 15000);

            // Klik op de bevestigingsknop
            await this.clickButton("#forum > div.game_footer > a > span.left > span > span", 15000);

            // Wacht tot het topic is aangemaakt
            await new Promise(resolve => setTimeout(resolve, 3000));
        }

        async closeDialog() {
            console.log("Sluit dialoogvenster...");
            const closeButton = await this.waitForElement(
                'body > div.ui-dialog.ui-corner-all.ui-widget.ui-widget-content.ui-front.ui-draggable.js-window-main-container > div.ui-dialog-titlebar.ui-corner-all.ui-widget-header.ui-helper-clearfix.ui-draggable-handle > button',
                15000
            );
            if (closeButton) {
                closeButton.click();
                console.log("Dialoogvenster gesloten.");
            } else {
                throw new Error('Kon de sluitknop van het dialoogvenster niet vinden.');
            }
        }

        async openForumAdmin() {
            console.log("Open forumbeheer...");
            const forumAdminButton = await this.waitForElement('#forum > div.game_list_footer > div.forum_footer > a', 15000);
            if (forumAdminButton) {
                forumAdminButton.click();
                await this.waitForElement('#forum_admin', 15000);
            } else {
                throw new Error('Kon de forumbeheerknop niet vinden. Controleer of de gebruiker de juiste rechten heeft.');
            }
        }

        async clickButton(selector, timeout = 15000) {
            console.log(`Zoek knop: ${selector}`);
            const button = await this.waitForElement(selector, timeout);
            if (!button) throw new Error(`Knop niet gevonden: ${selector}`);
            button.click();
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        async fillField(selector, value, timeout = 15000) {
            console.log(`Vul veld in: ${selector}`);
            const field = await this.waitForElement(selector, timeout);
            if (!field) throw new Error(`Veld niet gevonden: ${selector}`);
            field.value = value;
            field.dispatchEvent(new Event('change', { bubbles: true }));
        }

        async waitForElement(selector, timeout = 20000, retries = 3) {
            return new Promise((resolve, reject) => {
                const startTime = Date.now();
                let attempts = 0;

                const check = () => {
                    const element = document.querySelector(selector);
                    if (element) {
                        console.log(`Element gevonden: ${selector}`);
                        resolve(element);
                    } else if (Date.now() - startTime > timeout) {
                        if (attempts < retries) {
                            attempts++;
                            console.log(`Timeout: ${selector} niet gevonden. Poging ${attempts} van ${retries}.`);
                            setTimeout(check, 1000); // Retry after 1 second
                        } else {
                            reject(new Error(`Timeout: ${selector} niet gevonden na ${retries} pogingen.`));
                        }
                    } else {
                        setTimeout(check, 100);
                    }
                };
                check();
            });
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
        #create-all {
            background: black;
            color: #FF0000;
            border: 1px solid #FF0000;
            padding: 10px 20px;
            cursor: pointer;
            font-size: 16px;
            border-radius: 5px;
            display: block;
            margin: 20px auto;
        }
        #status-messages {
            margin-top: 20px;
            color: white;
        }
    `;
            const styleElement = document.createElement('style');
            styleElement.textContent = styles;
            document.head.appendChild(styleElement);
        }
    }
}
