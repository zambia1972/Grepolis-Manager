// ==UserScript==
// @name		GrepoTools
// @namespace	https://www.grepotools.nl/
// @version		1.9.7
// @author		Marcel_Z
// @description Grepotools.nl | Script for InnoGames Grepolis
// @match       http://*.grepolis.com/game/*
// @match       https://*.grepolis.com/game/*
// @exclude     view-source://*
// @exclude     https://classic.grepolis.com/game/*
// @homepage    https://www.grepotools.nl/
// @updateURL   https://www.grepotools.nl/grepotools/script/stable/grepotools.user.js
// @downloadURL	https://www.grepotools.nl/grepotools/script/stable/grepotools.user.js
// @icon        https://www.grepotools.nl/grepotools/icon/logo_32x32.png
// @iconURL     https://www.grepotools.nl/grepotools/icon/logo_32x32.png
// @require		https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js
// @copyright	2022 Marcel_Z
// @license     GPL-3.0-or-later; https://www.gnu.org/licenses/gpl-3.0.txt
// @grant		GM_info
// @grant		GM_setValue
// @grant		GM_getValue
// @grant		GM_deleteValue
// @grant		GM_xmlhttpRequest
// @grant       unsafeWindow
// ==/UserScript==


// Module: attackNotification
// Discrption: This module handles the attack notification and changes the favicon based on the attack indicator.
// Last Updated: 2024/12/22

let attackNotification = {
  module: "attackNotification",
  settingVisibleattackNotification: true,
  defaultIcon: "https://gpnl.innogamescdn.com/images/game/start/favicon.ico",
  attackIcon: "https://www.grepotools.nl/grepotools/images/faviconAttack.ico",
  settingsKeys: [{ key: "attackNotification", value: null, default: true }],

  init() {
    if (grepolisLoaded) {
      this.loadSettings();
    }
  },

  loadSettings() {
    this.settingsKeys.forEach((setting) => {
      const { key, default: defaultValue } = setting;
      const value = settings.loadSetting(
        `${Game.world_id}|${this.module}.${key}`,
        defaultValue
      );
      setting.value = value;
    });
  },

  getSettingValue(settingKey) {
    const setting = this.settingsKeys.find(({ key }) => key === settingKey);
    return setting ? setting.value : null;
  },

  setSettingValue(settingKey, value) {
    const setting = attackNotification.settingsKeys.find(
      ({ key }) => key === settingKey
    );
    setting.value = value;

    settings.safeSetting(
      `${Game.world_id}|attackNotification.${settingKey}`,
      value
    );
  },

  setVisibilityAttackNotification(value) {
    attackNotification.setSettingValue("attackNotification", value);
  },

  animate: function () {
    if (!attackNotification.getSettingValue("attackNotification")) {
      return;
    }

    const isAttackIndicatorActive = $(
      ".activity.attack_indicator.active"
    ).hasClass("active");
    const faviconElement = $('link[rel="shortcut icon"]');
    const standardIcon = this.defaultIcon;
    const attackIcon = this.attackIcon;

    const updateFavicon = (icon) => {
      faviconElement.attr("href", icon);
    };

    if (isAttackIndicatorActive) {
      const currentIcon = faviconElement.attr("href");
      const newIcon = currentIcon === standardIcon ? attackIcon : standardIcon;
      updateFavicon(newIcon);
    } else {
      updateFavicon(standardIcon);
    }
  },
};


// Module: bbcodeCopyAlliance
// Discrption: This module will add a button to the alliance page to copy the alliance bbcode.
// Last Updated: 2024/11/30

let bbcodeCopyAlliance = {
  module: "bbcodeCopyAlliance",
  rendered: false,
  styleDiv: `GrepoTools_bbcodeCopyAlliance`,
  buttonAction: true,
  data: new Map(),

  init() {
    if (grepolisLoaded) {
      this.createStyle();
    }
  },

  createStyle() {
    if (!this.rendered) {
      $("head").append(
        $(`<style id="${this.styleDiv}">`).append(`
          .button_logo {
            margin-right:10px;
          }
          .button_tekst {
            height:23px;
            float:right;
          }
          .bbcodeAllianceButton {
            float:right;
            padding-top:3px;
          }
          #ally_towns .game_header {
            height: 27px;
          }
        `)
      );
      this.rendered = true;
    }
  },

  animate() {
    if (
      !this.rendered ||
      !$("#ally_towns").length ||
      $(".bbcodeAllianceButton").length
    ) {
      return;
    }

    otherScripts.checkActiveScripts();
    this.hideDiotoolsBbcodeButton();
    this.hideGrcrtBbcodeButton();
    this.hideMoleholeBbcodeButton();

    this.addBbcodeButton();
  },

  addBbcodeButton() {
    $("#ally_towns > div > div.game_header.bold").append(
      $("<div/>", {
        id: "bbcodeAllianceButton",
        class: "button_new bbcodeAllianceButton",
      }).button({
        caption: `
          <img class="buttonLogo" src="https://www.grepotools.nl/grepotools/images/logoStable.png">
          <span class="buttonText">BBCode</span>`,
      })
    );

    $(".bbcodeAllianceButton").tooltip(
      `${language[language.settingActiveLanguage].bbcodeAlliance}`
    );

    $(".bbcodeAllianceButton").click(() => {
      if (this.buttonAction) {
        this.buttonAction = false;
        this.data.clear();

        const members = this.getMembers();
        const allianceInfo = this.getAllianceInfo(members);

        this.data.set(0, allianceInfo);

        members.forEach((member, index) => {
          this.data.set(index + 1, {
            playerRank: index + 1,
            playerName: member.name,
            playerId: parseInt(member.id),
            playerPoints: parseInt(member.points),
            playerCities: parseInt(member.cities),
          });
        });

        setTimeout(() => {
          if (this.data.size > 0) {
            HumanMessage.success(
              `${
                language[language.settingActiveLanguage]
                  .bbcodeAllianceCopySucces
              }`
            );
          }
          this.buttonAction = true;
        }, 500);
      }
    });
  },

  getMembers() {
    const liItems = $("#ally_towns .members_list li.even:not([class*=' '])");
    const members = [];

    liItems.each(function () {
      const hrefWithoutHash = $(this)
        .find(".gp_player_link")
        .attr("href")
        .slice(1);
      const memberData = JSON.parse(atob(hrefWithoutHash));

      members.push({
        id: memberData.id,
        name: memberData.name,
        points: bbcodeCopyAlliance.extractPoints(
          $(this).find("div.small-descr").text(),
          0
        ),
        cities: bbcodeCopyAlliance.extractPoints(
          $(this).find("div.small-descr").text(),
          1
        ),
      });
    });

    return members;
  },

  getAllianceInfo(members) {
    const allianceName = $("#bbcodeAllianceButton")
      .closest(".ui-dialog")
      .find(".ui-dialog-title")
      .text();

    const alliancePoints = members.reduce(
      (sum, member) => sum + parseInt(member.points, 10),
      0
    );
    const allianceRank = this.extractNumber(
      "#ally_rank_text > div.rank_number"
    );
    const [currentMembers, maxMembers] = this.extractMembers(
      "#ally_towns .members_list li.header:not([class*=' ']) .small-descr"
    );

    return {
      allianceName,
      allianceCurrentMembers: parseInt(currentMembers),
      allianceMaxMembers: parseInt(maxMembers),
      alliancePoints: parseInt(alliancePoints),
      allianceRank: parseInt(allianceRank),
    };
  },

  extractPoints(text, index) {
    return text.split(",")[index].replace(/\D/g, "");
  },

  extractText(selector) {
    return $(selector)
      .contents()
      .filter(function () {
        return this.nodeType === 3;
      })
      .text()
      .trim();
  },

  extractNumber(selector) {
    return $(selector).text().replace(/\D/g, "");
  },

  extractMembers(selector) {
    const membersText = $(selector).text().trim();
    return membersText.split("/").map((item) => item.replace(/\D/g, ""));
  },

  hideDiotoolsBbcodeButton() {
    if (
      otherScripts.diotoolsActive &&
      otherScripts.getSettingValue("diotoolsBbcodeButton")
    ) {
      $("#dio_alliance_player").hide();
    }
  },

  hideGrcrtBbcodeButton() {
    if (
      otherScripts.grcrtActive &&
      otherScripts.getSettingValue("grcrtBbcodeButton")
    ) {
      $("div[name='BBCode']").hide();
    }
  },

  hideMoleholeBbcodeButton() {
    if (
      otherScripts.grcrtActive &&
      otherScripts.getSettingValue("moleholeBbcodeButton")
    ) {
      $("#ally_towns > div > a.button").hide();
    }
  },
};


// Module: bbcodeCopyAlliance
// Discrption: This module will add a button to the island page to copy the island bbcode.
// Last Updated: 2024/12/15

let bbcodeCopyIsland = {
  module: "bbcodeCopyIsland",
  rendered: false,
  styleDiv: `GrepoTools_bbcodeCopyIsland`,
  buttonAction: true,
  data: new Map(),

  init() {
    if (grepolisLoaded) {
      this.createStyle();
    }
  },

  createStyle() {
    if (!this.rendered) {
      $("head").append(
        $(`<style id="${this.styleDiv}">`).append(`
          .buttonLogo {
            margin-right:10px;
          }
          .buttonText {
            height:23px;
            float:right;
          }
          .bbcodeIslandButton {
            float:right;
            padding-top:3px;
          }
        `)
      );
      this.rendered = true;
    }
  },

  animate() {
    if (!this.rendered == true) {
      return;
    }

    Layout.wnd.getAllOpen().forEach((elem) => {
      if (elem.getController() === "island_info") {
        if (!$(`#bbcodeIslandButton${elem.getElement().id}`).length) {
          otherScripts.checkActiveScripts();
          this.hideDiotoolsBbcodeButton();
          this.hideGrcrtBbcodeButton();
          this.addButton(elem.getElement().id);
        }
      }
    });
  },

  addButton(id) {
    $(`#${id} .island_info_left .game_header`).append(
      $("<div/>", {
        id: `bbcodeIslandButton${id}`,
        class: `button_new bbcodeIslandButton ${id}`,
      }).button({
        caption: `
          <img class="buttonLogo" src="https://www.grepotools.nl/grepotools/images/logoStable.png">
          <span class="buttonText">BBCode</span>`,
      })
    );
    $(`#${id} .island_info_left .game_header`).css("height", "27px");

    $(`#bbcodeIslandButton${id}`).tooltip(
      `${language[language.settingActiveLanguage].bbcodeIsland}`
    );

    $(`#bbcodeIslandButton${id}`).click(function (e) {
      if (bbcodeCopyIsland.buttonAction) {
        bbcodeCopyIsland.buttonAction = false;
        bbcodeCopyIsland.data.clear();

        const islandInfo = bbcodeCopyIsland.getIslandInfo(e, $(this));
        bbcodeCopyIsland.data.set(0, islandInfo);

        const selectedOption = $(this)
          .closest(".game_border")
          .find("#island_towns_sort")
          .val();

        const selectedOptionMap = {
          name: "#island_info_towns_left_sorted_by_name",
          score: "#island_info_towns_left_sorted_by_score",
          player: "#island_info_towns_left_sorted_by_player",
        };

        const ulElement = $(this)
          .closest(".game_border")
          .find(selectedOptionMap[selectedOption]);

        let i = 0;

        ulElement.find("li").each(function () {
          const aTag = $(this).find("a");
          if (aTag.length > 0 && aTag.attr("href")) {
            i++;
            const bbcodeTownData = JSON.parse(
              atob($(this).find("a").attr("href").split("#")[1])
            );

            let alliance;
            if (
              externalData.townData.get(bbcodeTownData.id.toString())
                .allianceName == null
            ) {
              alliance = "";
            } else {
              alliance = decodeURI(
                externalData.townData
                  .get(bbcodeTownData.id.toString())
                  .allianceName.split("+")
                  .join(" ")
              );
            }

            let playerName;

            // Code playerName modified so it also works if GRCRT is active
            const playerNameElement = $(this).find("span.player_name");

            if (playerNameElement.find("a").length > 0) {
              playerName = playerNameElement.find("a").text();
            } else {
              playerName = playerNameElement.text();
            }

            townInfo = {
              townId: parseInt(bbcodeTownData.id),
              townName: externalData.townData.name,
              townPoints: parseInt(
                $(this).find("span.small").first().text().match(/\d+/)[0]
              ),
              player: playerName,
              alliance,
            };

            bbcodeCopyIsland.data.set(i, townInfo);
          } else {
            HumanMessage.error(
              `${language[language.settingActiveLanguage].bbcodeIslandCopyFail}`
            );
            bbcodeCopyIsland.data.clear();
          }
        });

        setTimeout(() => {
          if (bbcodeCopyIsland.data.size > 0) {
            $(".bbcodeIslandButton").removeClass("disabled");
            $("#ajax_loader").css("visibility", "hidden");
            HumanMessage.success(
              `${
                language[language.settingActiveLanguage].bbcodeIslandCopySucces
              }`
            );
          }
          bbcodeCopyIsland.buttonAction = true;
        }, 500);
      }
    });
  },

  getIslandInfo(event, target) {
    const windowClass = event.currentTarget.classList[2];

    const islandNumber = parseInt(
      target.closest(`#${windowClass}`).find("h4").text().match(/\d+/g)
    );

    const islandInfo = target
      .closest(`#${windowClass}`)
      .find(".islandinfo_coords")
      .text()
      .trim();

    const regex = /(\w+):\s*(\d+)\s*\((\d+)\/(\d+)\)/;
    const match = islandInfo.match(regex);
    let ocean, islandX, islandY;

    if (match) {
      ocean = parseInt(match[2]);
      islandX = parseInt(match[3]);
      islandY = parseInt(match[4]);
    }

    const islandFreeSpace = parseInt(
      target
        .closest(`#${windowClass}`)
        .find(".islandinfo_free")
        .text()
        .match(/\d+/g)
    );

    // Search islandData for islandNumber
    let islandTag, islandRes;

    for (let [key, value] of externalData.islandData.entries()) {
      const islandObject = value.find(
        (item) => parseInt(item.id) === islandNumber
      );
      if (islandObject) {
        islandTag = islandObject.tagData;
        islandRes = islandObject.res;
        break;
      }
    }

    return {
      islandNumber: parseInt(islandNumber),
      islandTag,
      islandRes,
      islandFreeSpace: parseInt(islandFreeSpace),
      ocean: parseInt(ocean),
      islandX: parseInt(islandX),
      islandY: parseInt(islandY),
    };
  },

  hideDiotoolsBbcodeButton() {
    if (
      otherScripts.diotoolsActive &&
      otherScripts.getSettingValue("diotoolsBbcodeButton")
    ) {
      $("#dio_island_info").hide();
    }
  },

  hideGrcrtBbcodeButton() {
    if (
      otherScripts.grcrtActive &&
      otherScripts.getSettingValue("grcrtBbcodeButton")
    ) {
      $("div[name='BBCode']").hide();
    }
  },
};


// Module: bbcodeCopyPlayer
// Discrption: This module will add a button to the player profile page to copy the BBCode of the player.
// Last Updated: 2024/12/09

let bbcodeCopyPlayer = {
  module: "bbcodeCopyPlayer",
  rendered: false,
  styleDiv: `GrepoTools_bbcodeCopyPlayer`,
  buttonAction: true,
  innoPlayerData: new Map(),
  data: new Map(),
  playerId: "",
  allianceId: "",

  init() {
    if (grepolisLoaded) {
      this.createStyle();
    }
  },

  createStyle() {
    if (!this.rendered) {
      $("head").append(
        $(`<style id="${this.styleDiv}">`).append(`
          .button_logo {
            margin-right:10px;
          }
          .button_tekst {
            height:23px;
            float:right;
          }
          .bbcodePlayerButton {
            float:right;
            padding-top:3px;
          }
          #player_towns .game_header {
            height: 27px;
          }
        `)
      );
      this.rendered = true;
    }
  },

  animate() {
    if (
      !this.rendered ||
      !$("#player_towns").length ||
      $(".bbcodePlayerButton").length
    ) {
      return;
    }

    otherScripts.checkActiveScripts();
    this.hideDiotoolsBbcodeButton();
    this.hideGrcrtBbcodeButton();

    this.addBbcodeButton();
  },

  addBbcodeButton() {
    $("#player_towns > div > div.game_header.bold").append(
      $("<div/>", {
        id: "bbcodePlayerButton",
        class: "button_new bbcodePlayerButton",
      }).button({
        caption: `
          <img class="buttonLogo" src="https://www.grepotools.nl/grepotools/images/logoStable.png">
          <span class="buttonText">BBCode</span>`,
      })
    );

    $(".bbcodePlayerButton").tooltip(
      `${language[language.settingActiveLanguage].bbcodePlayer}`
    );

    $(".bbcodePlayerButton").click(() => {
      if (this.buttonAction) {
        $(".bbcodePlayerButton").addClass("disabled");
        $("#ajax_loader").css("visibility", "visible");
        let townList = "";
        bbcodeCopyPlayer.buttonAction = false;
        bbcodeCopyPlayer.innoPlayerData.clear();
        steden = [];
        bbcodeCopyPlayer.data.clear();

        const closestGameList = $("#player_towns").find("ul.game_list");
        townList = closestGameList.find("li").toArray();

        townList.forEach((item) => {
          const link = item.querySelector("a.gp_town_link");
          if (link) {
            const href = link.getAttribute("href");
            let stad = JSON.parse(atob(href.substring(1, href.length)));
            steden.push(stad.id);
          }
        });

        if (steden.length > 0) {
          $.ajax({
            type: "post",
            async: false,
            url: "https://www.grepotools.nl/grepotools/php/bbcodeCopyPlayer.php",
            data: {
              towns: JSON.stringify(steden),
              server: uw.Game.world_id,
            },
            success: function (returnData) {
              if (returnData != "data niet beschikbaar") {
                bbcodeCopyPlayer.innoPlayerData.clear();
                JSON.parse(returnData).forEach(function (value) {
                  bbcodeCopyPlayer.innoPlayerData.set(value.townId, value);
                });
              }
            },
            error: function (error) {
              console.error("AJAX request failed:", error);
            },
          });
        }
        bbcodeCopyPlayer.data.clear();

        let i = 0;
        bbcodeCopyPlayer.innoPlayerData.forEach((value, key) => {
          if (externalData.townData.has(key.toString())) {
            i++;
            townInfo = "";
            townOcean = externalData.townData.get(key.toString()).ocean;
            townName = decodeURI(
              externalData.townData
                .get(key.toString())
                .townName.split("+")
                .join(" ")
            );
            townPoints = externalData.townData.get(key.toString()).points;

            if (i === 1) {
              bbcodeCopyPlayer.playerId = parseInt(
                externalData.townData.get(key.toString()).playerId
              );
              bbcodeCopyPlayer.allianceId = parseInt(
                externalData.townData.get(key.toString()).allianceId
              );
              bbcodeCopyPlayer.data.set(0, bbcodeCopyPlayer.getPlayerInfo());
            }

            townInfo = {
              townId: parseInt(value.townId),
              townName,
              townPoints: parseInt(townPoints),
              Ocean: parseInt(townOcean),
              islandNumber: parseInt(value.islandId),
              islandTag: value.tagData,
            };
            bbcodeCopyPlayer.data.set(i, townInfo);
          }
        });

        setTimeout(() => {
          if (bbcodeCopyPlayer.data.size > 0) {
            $(".bbcodePlayerButton").removeClass("disabled");
            $("#ajax_loader").css("visibility", "hidden");
            HumanMessage.success(
              `${
                language[language.settingActiveLanguage].bbcodePlayerCopySucces
              }`
            );
            bbcodePastePlayer.tablePage = 1;
          } else {
            console.log("ERROR: Player data not found in InnoGames");
          }
          this.buttonAction = true;
        }, 500);
      }
    });
  },

  getPlayerInfo(members) {
    const playerName = $("#player_info").find("h3").text().trim();
    let allianceName = "";
    if ($("#player_info .gp_alliance_link").length > 0) {
      allianceName = $("#player_info .gp_alliance_link")
        .attr("onclick")
        .match(/'([^']+)'/)[1];
    }
    const playerRank = $("#player_info").find(".rank").text().trim();
    const playerBattlePoints = $("#player_info")
      .find(".battle_points")
      .text()
      .trim();
    const playerGrepolisScore = $("#player_info")
      .find(".grepolis_score_box .grepolis_score")
      .text()
      .trim();

    return {
      playerId: parseInt(this.playerId),
      allianceName,
      allianceId: parseInt(this.allianceId),
      playerName,
      playerRank: parseInt(playerRank),
      playerBattlePoints: parseInt(playerBattlePoints),
      playerGrepolisScore: parseInt(playerGrepolisScore),
    };
  },

  hideDiotoolsBbcodeButton() {
    if (
      otherScripts.diotoolsActive &&
      otherScripts.getSettingValue("diotoolsBbcodeButton")
    ) {
      $("#dio_player_towns").hide();
      $("#dio_BBplayer1").hide();
      $("#dio_BBalliance1").hide();
    }
  },

  hideGrcrtBbcodeButton() {
    if (
      otherScripts.grcrtActive &&
      otherScripts.getSettingValue("grcrtBbcodeButton")
    ) {
      $("div[name='BBCode']").hide();
    }
  },
};


// Module: bbcodePaste
// Description: This is the main module for the bbcode paste
// Last Updated: 2024/12/22

const bbcodePaste = {
  module: "bbcodePaste",
  rendered: false,
  styleDiv: `GrepoTools_bbcodePaste`,
  buttonAction: true,

  init() {
    if (grepolisLoaded) {
      this.createStyle();
    }
  },

  createStyle() {
    if (!this.rendered) {
      $("head").append(
        $(`<style id="${this.styleDiv}">`).append(`
          .buttonLogo {
            margin-right:10px;
            width:20px;
            height:20px;
          }
          .buttonText {
            height:23px;
            float:right
          }
        `)
      );
      this.rendered = true;
    }
  },

  addBBCodeButton(containerSelector, buttonClass, wrapperSelector) {
    if ($(containerSelector).get(0) && !$(buttonClass).get(0)) {
      $(wrapperSelector).append(
        $("<div/>", {
          id: `${containerSelector}`,
          class: `button_new GrepoToolsButtonPaste ${buttonClass.substring(1)}`,
        }).button({
          caption: `
          <img class="buttonLogo" src="https://www.grepotools.nl/grepotools/images/logoStable.png">
          <span class="buttonText">BBCode</span>`,
        })
      );
    }
  },

  render() {
    if (bbcodePaste.rendered) {
      // Forum new topic / post reply
      bbcodePaste.addBBCodeButton(
        "#bbcodes",
        ".gtForum",
        "#bbcodes .bb_button_wrapper"
      );
      bbcodePaste.addBBCodeButton(
        "#post_save_form",
        ".gtForum",
        "#post_save_form .bb_button_wrapper"
      );

      // Message / message reply
      bbcodePaste.addBBCodeButton(
        "#message_new_message",
        ".gtMesage",
        "#message_bbcodes .bb_button_wrapper"
      );
      bbcodePaste.addBBCodeButton(
        ".bb_button_wrapper",
        ".gtMesage",
        "#message_bbcodes .bb_button_wrapper"
      );

      // Note
      this.addBBCodeButton(
        ".notes_container",
        ".gtNotes",
        ".notes_container .bb_button_wrapper"
      );

      $(".GrepoToolsButtonPaste").click((e) => {
        if (this.buttonAction) {
          this.buttonAction = false;

          const classMapping = {
            "button_new GrepoToolsButtonPaste gtForum": {
              location: "forum",
              elementId: "forum_post_textarea",
            },
            "button_new GrepoToolsButtonPaste gtMesage": {
              location: "message",
              elementIds: ["message_new_message", "message_reply_message"],
            },
            "button_new GrepoToolsButtonPaste gtNotes": {
              location: "notes",
              elementQuery: "#txta_notes > div.middle > textarea",
            },
          };

          const mapping =
            classMapping[
              $(e.target).closest("div.GrepoToolsButtonPaste").attr("class")
            ];

          if (mapping) {
            this.location = mapping.location;
            this.messageElement = this.getmessageElement(mapping);
            this.start = this.messageElement.selectionStart;
            this.end = this.messageElement.selectionEnd;
            this.textBefore = this.messageElement.value.substring(
              0,
              this.start
            );
            this.textAfter = this.messageElement.value.substring(this.end);

            bbcodeWindow.init();
            WF.open("bbcodeWindow");

            this.setActivePage();

            setTimeout(() => {
              this.buttonAction = true;
            }, 500);
          }
        }
      });

      this.setupPasteButton(
        "#GrepoToolsPasteIslandButton",
        bbcodePasteIsland.createOutput.bind(bbcodePasteIsland)
      );
      this.setupPasteButton(
        "#GrepoToolsPastePlayerButton",
        bbcodePastePlayer.createOutput.bind(bbcodePastePlayer)
      );
      this.setupPasteButton(
        "#GrepoToolsPasteAllianceButton",
        bbcodePasteAlliance.createOutput.bind(bbcodePasteAlliance)
      );
    }
  },

  getmessageElement(mapping) {
    if (mapping.elementId) {
      return document.getElementById(mapping.elementId);
    } else if (mapping.elementIds) {
      for (const id of mapping.elementIds) {
        if ($(`#${id}`).length) {
          return document.getElementById(id);
        }
      }
    } else if (mapping.elementQuery) {
      return document.querySelector(mapping.elementQuery);
    }
  },

  setActivePage() {
    if (bbcodeCopyAlliance.data.size) {
      bbcodeWindow.windowId.setActivePageNr(2);
    } else if (bbcodeCopyIsland.data.size) {
      bbcodeWindow.windowId.setActivePageNr(1);
    } else if (bbcodeCopyPlayer.data.size) {
      bbcodeWindow.windowId.setActivePageNr(0);
    } else {
      bbcodeWindow.windowId.setActivePageNr(0);
    }
  },

  setupPasteButton(selector, createOutput) {
    $(selector).click(() => {
      if (this.buttonAction) {
        this.buttonAction = false;
        const data = createOutput();

        switch (this.location) {
          case "message":
          case "forum":
            if (this.messageElement) {
              this.messageElement.value = `${this.textBefore}${data}${this.textAfter}`;
              this.messageElement.focus();
            } else {
              bbcodeWindow.windowId.close();
            }
            break;
          case "notes":
            const textarea = $("#txta_notes > div.middle > textarea");
            if (textarea.length) {
              textarea
                .val(`${this.textBefore}${data}${this.textAfter}`)
                .keyup();
              this.messageElement.focus();
            } else {
              bbcodeWindow.windowId.close();
            }
            break;
        }
        bbcodeWindow.windowId.close();
        setTimeout(() => {
          this.buttonAction = true;
        }, 500);
      }
    });
  },
};


// Module: bbcodePasteAlliance
// Discrption: This module will paste the copied BBCode of the alliance in a massage, forum or note.
// Last Updated: 2024/12/09

// TODO: Add pagination for ally's bigger than 25 members -> Next version

let bbcodePasteAlliance = {
  module: "bbcodePasteAlliance",
  output: "",
  tablePage: 1,
  tableMaxRows: 25,

  settingsKeys: [
    { key: "showAllianceName", value: null, default: true },
    { key: "showAllianceNumberPlayers", value: null, default: true },
    { key: "showAlliancePoints", value: null, default: true },
    { key: "showAllianceRank", value: null, default: true },
    { key: "showNumber", value: null, default: true },
    { key: "showPlayerTowns", value: null, default: true },
    { key: "showPlayerPoints", value: null, default: true },
    { key: "showEmptyColumn", value: null, default: true },
  ],

  init() {
    if (grepolisLoaded) {
      this.loadSettings();
    }
  },

  loadSettings() {
    this.settingsKeys.forEach((setting) => {
      const { key, default: defaultValue } = setting;
      let value = settings.loadSetting(
        `${Game.world_id}|${this.module}.${key}`,
        defaultValue
      );
      setting.value = value;
    });
  },

  getSettingValue(settingKey) {
    const setting = this.settingsKeys.find(({ key }) => key === settingKey);
    return setting ? setting.value : null;
  },

  setSettingValue(settingKey, value) {
    const setting = bbcodePasteAlliance.settingsKeys.find(
      ({ key }) => key === settingKey
    );
    setting.value = value;

    settings.safeSetting(
      `${Game.world_id}|bbcodePasteAlliance.${settingKey}`,
      value
    );
  },

  setShowAllianceName(value) {
    bbcodePasteAlliance.setSettingValue("showAllianceName", value);
  },

  setShowAllianceNumberPlayers(value) {
    bbcodePasteAlliance.setSettingValue("showAllianceNumberPlayers", value);
  },

  setShowAlliancePoints(value) {
    bbcodePasteAlliance.setSettingValue("showAlliancePoints", value);
  },

  setShowAllianceRank(value) {
    bbcodePasteAlliance.setSettingValue("showAllianceRank", value);
  },

  setShowNumber(value) {
    bbcodePasteAlliance.setSettingValue("showNumber", value);
  },

  setShowPlayerTowns(value) {
    bbcodePasteAlliance.setSettingValue("showPlayerTowns", value);
  },

  setShowPlayerPoints(value) {
    bbcodePasteAlliance.setSettingValue("showPlayerPoints", value);
  },

  setShowEmptyColumn(value) {
    bbcodePasteAlliance.setSettingValue("showEmptyColumn", value);
  },

  createOutput() {
    bbcodePasteAlliance.output = "";

    // general information
    bbcodePasteAlliance.output = "[quote]\n";
    if (bbcodePasteAlliance.getSettingValue("showAllianceName")) {
      bbcodePasteAlliance.output += `[ally]${
        bbcodeCopyAlliance.data.get(0).allianceName
      }[/ally]\n`;
    }
    if (bbcodePasteAlliance.getSettingValue("showAllianceNumberPlayers")) {
      bbcodePasteAlliance.output += `${
        language[language.settingActiveLanguage].members
      }: ${bbcodeCopyAlliance.data.get(0).allianceCurrentMembers}\n${
        language[language.settingActiveLanguage].maxMembers
      }: ${bbcodeCopyAlliance.data.get(0).allianceMaxMembers}\n`;
    }

    if (bbcodePasteAlliance.getSettingValue("showAlliancePoints")) {
      bbcodePasteAlliance.output += `${
        language[language.settingActiveLanguage].alliance
      } ${language[language.settingActiveLanguage].points.toLowerCase()}: ${
        bbcodeCopyAlliance.data.get(0).alliancePoints
      }\n`;
    }

    if (bbcodePasteAlliance.getSettingValue("showAllianceRank")) {
      bbcodePasteAlliance.output += `${
        language[language.settingActiveLanguage].alliance
      } ${language[language.settingActiveLanguage].rank.toLowerCase()}: ${
        bbcodeCopyAlliance.data.get(0).allianceRank
      }\n`;
    }

    // create table header
    bbcodePasteAlliance.output += "\n[table]\n";
    bbcodePasteAlliance.output += "[**] ";

    bbcodePasteAlliance.getSettingValue("showNumber")
      ? (bbcodePasteAlliance.output += `${
          language[language.settingActiveLanguage].numberShort
        } [||] ${language[language.settingActiveLanguage].player} `)
      : (bbcodePasteAlliance.output += `${
          language[language.settingActiveLanguage].player
        }`);

    bbcodePasteAlliance.getSettingValue("showPlayerTowns")
      ? (bbcodePasteAlliance.output += ` [||] ${
          language[language.settingActiveLanguage].towns
        } `)
      : "";

    bbcodePasteAlliance.getSettingValue("showPlayerPoints")
      ? (bbcodePasteAlliance.output += ` [||] ${
          language[language.settingActiveLanguage].points
        } `)
      : "";

    bbcodePasteAlliance.getSettingValue("showEmptyColumn")
      ? (bbcodePasteAlliance.output += " [||] ")
      : "";
    bbcodePasteAlliance.output += " [/**]\n";

    // create table content
    for (let i = 1; i < bbcodeCopyAlliance.data.size; ++i) {
      bbcodePasteAlliance.output += "[*] ";
      bbcodePasteAlliance.getSettingValue("showNumber")
        ? (bbcodePasteAlliance.output +=
            bbcodeCopyAlliance.data.get(i).playerRank + ". [|] ")
        : "";

      bbcodePasteAlliance.output += `[player]${
        bbcodeCopyAlliance.data.get(i).playerName
      }[/player]`;

      if (bbcodePasteAlliance.getSettingValue("showPlayerTowns")) {
        bbcodePasteAlliance.output +=
          ` [|]  ${bbcodeCopyAlliance.data.get(i).playerCities} ` +
          (bbcodeCopyAlliance.data.get(i).playerCities > 1
            ? language[language.settingActiveLanguage].towns
            : language[language.settingActiveLanguage].town);
      }

      bbcodePasteAlliance.getSettingValue("showPlayerPoints")
        ? (bbcodePasteAlliance.output += ` [|] ${
            bbcodeCopyAlliance.data.get(i).playerPoints
          } ${language[language.settingActiveLanguage].points}`)
        : "";

      bbcodePasteAlliance.getSettingValue("showEmptyColumn")
        ? (bbcodePasteAlliance.output += " [||] ")
        : "";

      bbcodePasteAlliance.output += " [/*]\n";
    }
    bbcodePasteAlliance.output += "[/table]\n[/quote]\n";

    return bbcodePasteAlliance.output;
  },
};


// Module: bbcodePasteIsland
// Discrption: This module will paste the copied BBCode of the island in a massage, forum or note.
// Last Updated: 2024/12/15

let bbcodePasteIsland = {
  module: "bbcodePasteIsland",
  output: "",

  settingsKeys: [
    { key: "showIslandNumber", value: null, default: true },
    { key: "showIslandTag", value: null, default: true },
    { key: "showIslandResources", value: null, default: true },
    { key: "showIslandCoordinates", value: null, default: true },
    { key: "showIslandOcean", value: null, default: true },
    { key: "showIslandOccupation", value: null, default: true },
    { key: "showNumber", value: null, default: true },
    { key: "showTown", value: null, default: true },
    { key: "showPoints", value: null, default: true },
    { key: "showPlayer", value: null, default: true },
    { key: "showAlliance", value: null, default: true },
    { key: "showEmptyColumn", value: null, default: true },
  ],

  init() {
    if (grepolisLoaded) {
      this.loadSettings();
    }
  },

  loadSettings() {
    this.settingsKeys.forEach((setting) => {
      const { key, default: defaultValue } = setting;
      let value = settings.loadSetting(
        `${Game.world_id}|${this.module}.${key}`,
        defaultValue
      );
      setting.value = value;
    });
  },

  getSettingValue(settingKey) {
    const setting = this.settingsKeys.find(({ key }) => key === settingKey);
    return setting ? setting.value : null;
  },

  setSettingValue(settingKey, value) {
    const setting = bbcodePasteIsland.settingsKeys.find(
      ({ key }) => key === settingKey
    );
    setting.value = value;

    settings.safeSetting(
      `${Game.world_id}|bbcodePasteIsland.${settingKey}`,
      value
    );
  },

  setShowIslandNumber(value) {
    bbcodePasteIsland.setSettingValue("showIslandNumber", value);
  },

  setShowIslandTag(value) {
    bbcodePasteIsland.setSettingValue("showIslandTag", value);
  },

  setShowIslandResources(value) {
    bbcodePasteIsland.setSettingValue("showIslandResources", value);
  },

  setShowIslandCoordinates(value) {
    bbcodePasteIsland.setSettingValue("showIslandCoordinates", value);
  },

  setShowIslandOcean(value) {
    bbcodePasteIsland.setSettingValue("showIslandOcean", value);
  },

  setShowIslandOccupation(value) {
    bbcodePasteIsland.setSettingValue("showIslandOccupation", value);
  },

  setShowNumber(value) {
    bbcodePasteIsland.setSettingValue("showNumber", value);
  },

  setShowPoints(value) {
    bbcodePasteIsland.setSettingValue("showPoints", value);
  },

  setShowPlayer(value) {
    bbcodePasteIsland.setSettingValue("showPlayer", value);
  },

  setShowAlliance(value) {
    bbcodePasteIsland.setSettingValue("showAlliance", value);
  },

  setShowEmptyColumn(value) {
    bbcodePasteIsland.setSettingValue("showEmptyColumn", value);
  },

  createOutput() {
    bbcodePasteIsland.output = "";

    // general information
    bbcodePasteIsland.output = "[quote]\n";
    if (bbcodePasteIsland.getSettingValue("showIslandNumber")) {
      bbcodePasteIsland.output += `${
        language[language.settingActiveLanguage].islandNumber
      }: [island]${bbcodeCopyIsland.data.get(0).islandNumber}[/island]\n`;
    }
    if (bbcodePasteIsland.getSettingValue("showIslandTag")) {
      bbcodePasteIsland.output += `${
        language[language.settingActiveLanguage].islandTag
      }: ${bbcodeCopyIsland.data.get(0).islandTag}\n`;
    }

    if (bbcodePasteIsland.getSettingValue("showIslandOccupation")) {
      bbcodePasteIsland.output += `${
        language[language.settingActiveLanguage].towns
      }: ${bbcodeCopyIsland.data.size - 1} ${
        language[language.settingActiveLanguage].occupied
      } / ${bbcodeCopyIsland.data.get(0).islandFreeSpace} ${
        language[language.settingActiveLanguage].free
      }\n`;
    }

    if (bbcodePasteIsland.getSettingValue("showIslandResources")) {
      bbcodePasteIsland.output += `${
        language[language.settingActiveLanguage].resources
      }: `;

      for (let i = 1; i >= 0; --i) {
        const resource = bbcodeCopyIsland.data.get(0).islandRes.charAt(i);
        bbcodePasteIsland.output += i === 0 ? " / +" : "-";

        const resourceMap = {
          w: language[language.settingActiveLanguage].wood,
          s: language[language.settingActiveLanguage].stone,
          i: language[language.settingActiveLanguage].silver,
        };

        bbcodePasteIsland.output += `${resourceMap[resource.toLowerCase()]}`;
      }
      bbcodePasteIsland.output += "\n";
    }

    if (bbcodePasteIsland.getSettingValue("showIslandOcean")) {
      bbcodePasteIsland.output += `${
        language[language.settingActiveLanguage].ocean
      }: ${bbcodeCopyIsland.data.get(0).ocean}\n`;
    }

    if (bbcodePasteIsland.getSettingValue("showIslandCoordinates")) {
      bbcodePasteIsland.output += `${
        language[language.settingActiveLanguage].coordinates
      }: ${bbcodeCopyIsland.data.get(0).islandX} / ${
        bbcodeCopyIsland.data.get(0).islandY
      }\n`;
    }

    // create table header
    bbcodePasteIsland.output += "\n[table]\n";
    bbcodePasteIsland.output += "[**] ";

    bbcodePasteIsland.getSettingValue("showNumber")
      ? (bbcodePasteIsland.output += `${
          language[language.settingActiveLanguage].numberShort
        } [||] ${language[language.settingActiveLanguage].town}`)
      : (bbcodePasteIsland.output +=
          language[language.settingActiveLanguage].town);

    bbcodePasteIsland.getSettingValue("showPoints")
      ? (bbcodePasteIsland.output += ` [||] ${
          language[language.settingActiveLanguage].points
        }`)
      : "";

    bbcodePasteIsland.getSettingValue("showPlayer")
      ? (bbcodePasteIsland.output += ` [||] ${
          language[language.settingActiveLanguage].player
        }`)
      : "";

    bbcodePasteIsland.getSettingValue("showAlliance")
      ? (bbcodePasteIsland.output += ` [||] ${
          language[language.settingActiveLanguage].alliance
        }`)
      : "";

    bbcodePasteIsland.getSettingValue("showEmptyColumn")
      ? (bbcodePasteIsland.output += " [||] ")
      : "";
    bbcodePasteIsland.output += " [/**]\n";

    // create table content
    for (let i = 1; i < bbcodeCopyIsland.data.size; ++i) {
      bbcodePasteIsland.output += "[*]";
      bbcodePasteIsland.getSettingValue("showNumber")
        ? (bbcodePasteIsland.output += ` ${i}. [|] [town]${
            bbcodeCopyIsland.data.get(i).townId
          }[/town]`)
        : (bbcodePasteIsland.output += ` [town]${
            bbcodeCopyIsland.data.get(i).townId
          }[/town]`);

      bbcodePasteIsland.getSettingValue("showPoints")
        ? (bbcodePasteIsland.output += ` [|] ${
            bbcodeCopyIsland.data.get(i).townPoints
          } ${language[language.settingActiveLanguage].points}`)
        : "";

      if (bbcodeCopyIsland.data.get(i).player != "") {
        bbcodePasteIsland.getSettingValue("showPlayer")
          ? (bbcodePasteIsland.output += ` [|] ${
              bbcodeCopyIsland.data.get(i).player
            }`)
          : "";

        bbcodePasteIsland.getSettingValue("showAlliance") &&
        bbcodeCopyIsland.data.get(i).alliance !== ""
          ? (bbcodePasteIsland.output += ` [|] [ally]${
              bbcodeCopyIsland.data.get(i).alliance
            }[/ally]`)
          : "";
      } else {
        bbcodePasteIsland.output += ` [|] ${
          language[language.settingActiveLanguage].ghostTown
        } [|] `;
      }

      bbcodePasteIsland.getSettingValue("showEmptyColumn")
        ? (bbcodePasteIsland.output += " [|] ")
        : "";
      bbcodePasteIsland.output += " [/*]\n";
    }

    bbcodePasteIsland.output += "[/table]\n[/quote]\n";
    return bbcodePasteIsland.output;
  },
};


// Module: bbcodePastePlayer
// Discrption: This module will paste the copied BBCode of the player in a massage, forum or note.
// Last Updated: 2024/12/15

let bbcodePastePlayer = {
  module: "bbcodePastePlayer",
  output: "",
  tableMaxRows: 25,
  tablePage: 1,

  settingsKeys: [
    { key: "showPlayerName", value: null, default: true },
    { key: "showAllianceName", value: null, default: true },
    { key: "showGrepolisRank", value: null, default: true },
    { key: "showPlayerBattlePoints", value: null, default: true },
    { key: "showPlayerGrepolisScore", value: null, default: true },
    { key: "showNumber", value: null, default: true },
    { key: "showPoints", value: null, default: true },
    { key: "showOcean", value: null, default: true },
    { key: "showIslandNumber", value: null, default: true },
    { key: "showIslandTag", value: null, default: true },
    { key: "showEmptyColumn", value: null, default: true },
  ],

  init() {
    if (grepolisLoaded) {
      this.loadSettings();
    }
  },

  loadSettings() {
    this.settingsKeys.forEach((setting) => {
      const { key, default: defaultValue } = setting;
      let value = settings.loadSetting(
        `${Game.world_id}|${this.module}.${key}`,
        defaultValue
      );
      setting.value = value;
    });
  },

  getSettingValue(settingKey) {
    const setting = this.settingsKeys.find(({ key }) => key === settingKey);
    return setting ? setting.value : null;
  },

  setSettingValue(settingKey, value) {
    const setting = bbcodePastePlayer.settingsKeys.find(
      ({ key }) => key === settingKey
    );
    setting.value = value;

    settings.safeSetting(
      `${Game.world_id}|bbcodePastePlayer.${settingKey}`,
      value
    );
  },

  setShowPlayerName(value) {
    bbcodePastePlayer.setSettingValue("showPlayerName", value);
  },

  setShowAllianceName(value) {
    bbcodePastePlayer.setSettingValue("showAllianceName", value);
  },

  setShowgrepolisRank(value) {
    bbcodePastePlayer.setSettingValue("showGrepolisRank", value);
  },

  setShowPlayerBattlePoints(value) {
    bbcodePastePlayer.setSettingValue("showPlayerBattlePoints", value);
  },

  setShowPlayerGrepolisScore(value) {
    bbcodePastePlayer.setSettingValue("showPlayerGrepolisScore", value);
  },

  setShowNumber(value) {
    bbcodePastePlayer.setSettingValue("showNumber", value);
  },

  setShowPoints(value) {
    bbcodePastePlayer.setSettingValue("showPoints", value);
  },

  setShowOcean(value) {
    bbcodePastePlayer.setSettingValue("showOcean", value);
  },

  setShowIslandNumber(value) {
    bbcodePastePlayer.setSettingValue("showIslandNumber", value);
  },

  setShowIslandTag(value) {
    bbcodePastePlayer.setSettingValue("showIslandTag", value);
  },

  setShowEmptyColumn(value) {
    bbcodePastePlayer.setSettingValue("showEmptyColumn", value);
  },

  setTablePage(value) {
    bbcodePastePlayer.tablePage = value;
  },

  createOutput() {
    bbcodePastePlayer.output = "";

    // general information
    bbcodePastePlayer.output = "[quote]\n";
    if (bbcodePastePlayer.getSettingValue("showPlayerName")) {
      bbcodePastePlayer.output +=
        "[player]" + bbcodeCopyPlayer.data.get(0).playerName + "[/player]\n";
    }
    if (bbcodePastePlayer.getSettingValue("showAllianceName")) {
      bbcodePastePlayer.output +=
        "[ally]" + bbcodeCopyPlayer.data.get(0).allianceName + "[/ally]\n\n";
    }
    if (bbcodePastePlayer.getSettingValue("showGrepolisRank")) {
      bbcodePastePlayer.output += `${
        language[language.settingActiveLanguage].grepolisRank
      }: ${bbcodeCopyPlayer.data.get(0).playerRank} \n`;
    }
    if (bbcodePastePlayer.getSettingValue("showPlayerGrepolisScore")) {
      bbcodePastePlayer.output += `${
        language[language.settingActiveLanguage].grepolisScore
      }: ${bbcodeCopyPlayer.data.get(0).playerGrepolisScore} \n`;
    }
    if (bbcodePastePlayer.getSettingValue("showPlayerBattlePoints")) {
      bbcodePastePlayer.output += `${
        language[language.settingActiveLanguage].battlePoints
      }: ${bbcodeCopyPlayer.data.get(0).playerBattlePoints} \n`;
    }

    // create table header
    bbcodePastePlayer.output += "\n[table]\n";
    bbcodePastePlayer.output += "[**]";

    bbcodePastePlayer.getSettingValue("showNumber")
      ? (bbcodePastePlayer.output += ` ${
          language[language.settingActiveLanguage].numberShort
        } [||] ${language[language.settingActiveLanguage].town} `)
      : (bbcodePastePlayer.output += ` ${
          language[language.settingActiveLanguage].town
        }`);
    bbcodePastePlayer.getSettingValue("showPoints")
      ? (bbcodePastePlayer.output += ` [||] ${
          language[language.settingActiveLanguage].points
        } `)
      : "";
    bbcodePastePlayer.getSettingValue("showOcean")
      ? (bbcodePastePlayer.output += ` [||] ${
          language[language.settingActiveLanguage].ocean
        }`)
      : "";
    bbcodePastePlayer.getSettingValue("showIslandNumber")
      ? (bbcodePastePlayer.output += ` [||] ${
          language[language.settingActiveLanguage].islandNumber
        }`)
      : "";
    bbcodePastePlayer.getSettingValue("showIslandTag")
      ? (bbcodePastePlayer.output += ` [||] ${
          language[language.settingActiveLanguage].islandTag
        }`)
      : "";
    bbcodePastePlayer.getSettingValue("showEmptyColumn")
      ? (bbcodePastePlayer.output += " [||] ")
      : "";
    bbcodePastePlayer.output += " [/**]\n";

    // create table content
    let startRow =
      bbcodePastePlayer.tablePage * bbcodePastePlayer.tableMaxRows -
      bbcodePastePlayer.tableMaxRows +
      1;
    let endRow = startRow + bbcodePastePlayer.tableMaxRows;
    if (endRow > bbcodeCopyPlayer.data.size) {
      endRow = bbcodeCopyPlayer.data.size;
    }
    for (let i = startRow; i < endRow; ++i) {
      bbcodePastePlayer.output += "[*]";
      bbcodePastePlayer.getSettingValue("showNumber")
        ? (bbcodePastePlayer.output += ` ${i}. [|] [town]${
            bbcodeCopyPlayer.data.get(i).townId
          }[/town]`)
        : (bbcodePastePlayer.output += ` [town]${
            bbcodeCopyPlayer.data.get(i).townId
          }[/town]`);

      bbcodePastePlayer.getSettingValue("showPoints")
        ? (bbcodePastePlayer.output += ` [|] ${
            bbcodeCopyPlayer.data.get(i).townPoints
          } ${language[language.settingActiveLanguage].points}`)
        : "";

      bbcodePastePlayer.getSettingValue("showOcean")
        ? (bbcodePastePlayer.output += ` [|] ${
            language[language.settingActiveLanguage].ocean
          } ${bbcodeCopyPlayer.data.get(i).Ocean}`)
        : "";

      bbcodePastePlayer.getSettingValue("showIslandNumber")
        ? (bbcodePastePlayer.output += ` [|] [island]${
            bbcodeCopyPlayer.data.get(i).islandNumber
          }[/island]`)
        : "";

      bbcodePastePlayer.getSettingValue("showIslandTag")
        ? (bbcodePastePlayer.output += ` [|] ${
            bbcodeCopyPlayer.data.get(i).islandTag
          }`)
        : "";

      bbcodePastePlayer.getSettingValue("showEmptyColumn")
        ? (bbcodePastePlayer.output += " [|] ")
        : "";
      bbcodePastePlayer.output += " [/*]\n";
    }
    bbcodePastePlayer.output += "[/table]\n[/quote]\n";
    return bbcodePastePlayer.output;
  },
};


// Module: bbcodeWindow
// Description: This is the window module for the bbcode paste settings
// Last Updated: 2024/12/21

let bbcodeWindow = {
  windowId: "",
  styleDiv: "GrepoTools_bbcode",
  rendered: false,
  listAction: true,
  subMenuItems: [],

  init() {
    if (grepolisLoaded) {
      bbcodeWindow.window("bbcodeWindow");
      bbcodeWindow.createStyle();
    }
  },

  createStyle() {
    if (!this.rendered) {
      $("head").append(
        $(`<style id="${this.styleDiv}">`).append(`
          #bbcodeContent { 
            height:500px;
            background-color:"#FFE3A1";
            margin:-5px
          }
          #bbcodeContent .infoTextSmall{
            margin-bottom:10px;
            margin-top:10px;
          }
          #bbcodeContent .checkbox_new{
            display:block;
            margin-bottom:3px;
          )
           #bbcodeContent label + .dropdown{
            margin-left:10px;
            margin-bottom: 5px;
          }
           #bbcodeContent .caption{
            padding-left: 5px !important;
            padding-right: 20px !important;
          }
        `)
      );
      this.rendered = true;
    }
  },

  createInfoText(infoText) {
    return $("<div/>", { class: "infoText" }).append(infoText);
  },

  createInfoTextSmall(infoText) {
    return $("<div/>", { class: "infoTextSmall" }).append(infoText);
  },

  createCheckbox(id, caption, setting = false) {
    const checkbox = $("<div/>", { id, class: "checkbox_new large" })
      .append($("<div/>", { class: "cbx_icon" }))
      .append($("<div/>", { class: "cbx_caption" }).text(caption));

    if (setting) {
      checkbox.addClass("checked");
    }

    return checkbox;
  },

  toggleCheckbox(checkbox) {
    const setting = checkbox.hasClass("checked");
    checkbox.toggleClass("checked", !setting);
    return !setting;
  },

  createButton(id, caption, disabled = false, functionToCall) {
    const button = $("<div/>", {
      id,
      class: "button_new",
      style: "margin-top:10px",
    })
      .append($("<div/>", { class: "left" }))
      .append($("<div/>", { class: "right" }))
      .append(
        $("<div/>", { class: "caption js-caption" })
          .append($("<span/>").text(caption))
          .append($("<div/>", { class: "effect js-effect" }))
      );

    if (disabled) {
      button.addClass("disabled");
    }

    button.on("click", function () {
      if (
        !button.hasClass("disabled") &&
        typeof functionToCall === "function"
      ) {
        functionToCall();
      }
    });

    return button;
  },

  createDropdown(id, label, value, options = "") {
    return $("<div/>")
      .append($("<label/>", { for: id }).text(label))
      .append(
        $("<div/>", { id: id, class: "dropdown default" }).dropdown({
          list_pos: "left",
          value: value,
          options: options,
        })
      );
  },

  tab(tab) {
    switch (tab) {
      case 0:
        if (bbcodeCopyPlayer.data.size) {
          bbcodeWindow.createContent(0);
          bbcodeWindow.controlActionsPlayer();
        } else {
          $("#bbcodeContent").append(
            `<p><b style="margin-left:15px">${
              language[language.settingActiveLanguage].noDataAvailable
            }</b></p>`
          );
        }
        break;
      case 1:
        if (bbcodeCopyIsland.data.size) {
          bbcodeWindow.createContent(1);
        } else {
          $("#bbcodeContent").append(
            `<p><b style="margin-left:15px">${
              language[language.settingActiveLanguage].noDataAvailable
            }</b></p>`
          );
        }
        break;
      case 2:
        if (bbcodeCopyAlliance.data.size) {
          bbcodeWindow.createContent(2);
        } else {
          $("#bbcodeContent").append(
            `<p><b style="margin-left:15px">${
              language[language.settingActiveLanguage].noDataAvailable
            }</b></p>`
          );
        }
        break;
    }
  },

  createContent(tabNo) {
    bbcodeWindow.subMenuItems = [];
    switch (tabNo) {
      case 0:
        bbcodeWindow.subMenuItems = [
          {
            sectionId: "bbcodePastePlayerSettings",
            gameHeaderText: `${
              language[language.settingActiveLanguage].playerDataAvailable
            } ${bbcodeCopyPlayer.data.get(0).playerName} | ${
              bbcodeCopyPlayer.data.size - 1
            } ${
              bbcodeCopyPlayer.data.size - 1 > 1
                ? language[language.settingActiveLanguage].towns
                : language[language.settingActiveLanguage].town
            }`,
            display: "block",
            options: [
              {
                type: "infoText",
                caption: `${
                  language[language.settingActiveLanguage].showInfoAboveTable
                }`,
              },
              {
                type: "checkBox",
                caption: `${language[language.settingActiveLanguage].player}`,
                id: "bbcodePlayerShowPlayerName",
                setting: bbcodePastePlayer.getSettingValue("showPlayerName"),
                functionToCall: bbcodePastePlayer.setShowPlayerName,
              },
              {
                type: "checkBox",
                caption: `${language[language.settingActiveLanguage].alliance}`,
                id: "bbcodePlayerShowAllianceName",
                setting: bbcodePastePlayer.getSettingValue("showAllianceName"),
                functionToCall: bbcodePastePlayer.setShowAllianceName,
              },
              {
                type: "checkBox",
                caption: `${
                  language[language.settingActiveLanguage].grepolisRank
                }`,
                id: "bbcodePlayerShowGrepolisRank",
                setting: bbcodePastePlayer.getSettingValue("showGrepolisRank"),
                functionToCall: bbcodePastePlayer.setShowgrepolisRank,
              },
              {
                type: "checkBox",
                caption: `${
                  language[language.settingActiveLanguage].grepolisScore
                }`,
                id: "bbcodePlayerShowPlayerGrepolisScore",
                setting: bbcodePastePlayer.getSettingValue(
                  "showPlayerGrepolisScore"
                ),
                functionToCall: bbcodePastePlayer.setShowPlayerGrepolisScore,
              },
              {
                type: "checkBox",
                caption: `${
                  language[language.settingActiveLanguage].battlePoints
                }`,
                id: "bbcodePlayerShowPlayerBattlePoints",
                setting: bbcodePastePlayer.getSettingValue(
                  "showPlayerBattlePoints"
                ),
                functionToCall: bbcodePastePlayer.setShowPlayerBattlePoints,
              },
              {
                type: "infoText",
                caption: `${
                  language[language.settingActiveLanguage].showInfoInTable
                }`,
              },
              {
                type: "infoTextSmall",
                caption: `${
                  language[language.settingActiveLanguage].cityRequired
                }`,
              },
              {
                type: "dropDown",
                caption: `${
                  language[language.settingActiveLanguage].selectPage
                } `,
                id: "bbcodePlayerPage",
                setting: bbcodePastePlayer.tablePage,
                options: bbcodeWindow.selectPageOptions(),
                display:
                  bbcodeCopyPlayer.data.size - 1 >
                  bbcodePastePlayer.tableMaxRows
                    ? true
                    : false,
              },
              {
                type: "checkBox",
                caption: `${language[language.settingActiveLanguage].number}`,
                id: "bbcodePlayerShowNumber",
                setting: bbcodePastePlayer.getSettingValue("showNumber"),
                functionToCall: bbcodePastePlayer.setShowNumber,
              },
              {
                type: "checkBox",
                caption: `${language[language.settingActiveLanguage].points}`,
                id: "bbcodePlayerShowPoints",
                setting: bbcodePastePlayer.getSettingValue("showPoints"),
                functionToCall: bbcodePastePlayer.setShowPoints,
              },
              {
                type: "checkBox",
                caption: `${language[language.settingActiveLanguage].ocean}`,
                id: "bbcodePlayerShowOcean",
                setting: bbcodePastePlayer.getSettingValue("showOcean"),
                functionToCall: bbcodePastePlayer.setShowOcean,
              },
              {
                type: "checkBox",
                caption: `${
                  language[language.settingActiveLanguage].islandNumber
                }`,
                id: "bbcodePlayerShowIslandNumber",
                setting: bbcodePastePlayer.getSettingValue("showIslandNumber"),
                functionToCall: bbcodePastePlayer.setShowIslandNumber,
              },
              {
                type: "checkBox",
                caption: `${
                  language[language.settingActiveLanguage].islandTag
                }`,
                id: "bbcodePlayerShowIslandTag",
                setting: bbcodePastePlayer.getSettingValue("showIslandTag"),
                functionToCall: bbcodePastePlayer.setShowIslandTag,
              },
              {
                type: "checkBox",
                caption: `${
                  language[language.settingActiveLanguage].emptyColumn
                }`,
                id: "bbcodePlayershowEmptyColumn",
                setting: bbcodePastePlayer.getSettingValue("showEmptyColumn"),
                functionToCall: bbcodePastePlayer.setShowEmptyColumn,
              },
              {
                type: "button",
                id: "GrepoToolsPastePlayerButton",
                caption: language[language.settingActiveLanguage].pasteData,
                disabled: false,
                functionToCall: bbcodePastePlayer.createOutput,
              },
            ],
          },
        ];
        break;
      case 1:
        bbcodeWindow.subMenuItems = [
          {
            sectionId: "bbcodePasteIslandSettings",
            gameHeaderText: `${
              language[language.settingActiveLanguage].islandDataAvailable
            } ${bbcodeCopyIsland.data.get(0).islandNumber} | ${
              bbcodeCopyIsland.data.size - 1
            } ${
              bbcodeCopyIsland.data.size - 1 > 1
                ? language[language.settingActiveLanguage].towns
                : language[language.settingActiveLanguage].town
            }`,
            display: "block",
            options: [
              {
                type: "infoText",
                caption: `${
                  language[language.settingActiveLanguage].showInfoAboveTable
                }`,
              },
              {
                type: "checkBox",
                caption: `${
                  language[language.settingActiveLanguage].islandNumber
                }`,
                id: "bbcodeIslandShowIslandNumber",
                setting: bbcodePasteIsland.getSettingValue("showIslandNumber"),
                functionToCall: bbcodePasteIsland.setShowIslandNumber,
              },
              {
                type: "checkBox",
                caption: `${
                  language[language.settingActiveLanguage].islandTag
                }`,
                id: "bbcodeIslandShowIslandTag",
                setting: bbcodePasteIsland.getSettingValue("showIslandTag"),
                functionToCall: bbcodePasteIsland.setShowIslandTag,
              },
              {
                type: "checkBox",
                caption: `${
                  language[language.settingActiveLanguage].islandOccupation
                }`,
                id: "bbcodeIslandShowIslandOccupation",
                setting: bbcodePasteIsland.getSettingValue(
                  "showIslandOccupation"
                ),
                functionToCall: bbcodePasteIsland.setShowIslandOccupation,
              },
              {
                type: "checkBox",
                caption: `${
                  language[language.settingActiveLanguage].resources
                }`,
                id: "bbcodeIslandShowIslandResources",
                setting: bbcodePasteIsland.getSettingValue(
                  "showIslandResources"
                ),
                functionToCall: bbcodePasteIsland.setShowIslandResources,
              },
              {
                type: "checkBox",
                caption: `${language[language.settingActiveLanguage].ocean}`,
                id: "bbcodeIslandShowIslandOcean",
                setting: bbcodePasteIsland.getSettingValue("showIslandOcean"),
                functionToCall: bbcodePasteIsland.setShowIslandOcean,
              },
              {
                type: "checkBox",
                caption: `${
                  language[language.settingActiveLanguage].coordinates
                }`,
                id: "bbcodeIslandShowIslandCoordinates",
                setting: bbcodePasteIsland.getSettingValue(
                  "showIslandCoordinates"
                ),
                functionToCall: bbcodePasteIsland.setShowIslandCoordinates,
              },
              {
                type: "infoText",
                caption: `${
                  language[language.settingActiveLanguage].showInfoInTable
                }`,
              },
              {
                type: "infoTextSmall",
                caption: `${
                  language[language.settingActiveLanguage].cityRequired
                }`,
              },
              {
                type: "checkBox",
                caption: `${language[language.settingActiveLanguage].number}`,
                id: "bbcodeIslandShowNumber",
                setting: bbcodePasteIsland.getSettingValue("showNumber"),
                functionToCall: bbcodePasteIsland.setShowNumber,
              },
              {
                type: "checkBox",
                caption: `${language[language.settingActiveLanguage].points}`,
                id: "bbcodeIslandShowPoints",
                setting: bbcodePasteIsland.getSettingValue("showPoints"),
                functionToCall: bbcodePasteIsland.setShowPoints,
              },
              {
                type: "checkBox",
                caption: `${language[language.settingActiveLanguage].player}`,
                id: "bbcodeIslandShowPlayer",
                setting: bbcodePasteIsland.getSettingValue("showPlayer"),
                functionToCall: bbcodePasteIsland.setShowPlayer,
              },
              {
                type: "checkBox",
                caption: `${language[language.settingActiveLanguage].alliance}`,
                id: "bbcodeIslandShowAlliance",
                setting: bbcodePasteIsland.getSettingValue("showAlliance"),
                functionToCall: bbcodePasteIsland.setShowAlliance,
              },
              {
                type: "checkBox",
                caption: `${
                  language[language.settingActiveLanguage].emptyColumn
                }`,
                id: "bbcodeIslandshowEmptyColumn",
                setting: bbcodePasteIsland.getSettingValue("showEmptyColumn"),
                functionToCall: bbcodePasteIsland.setShowEmptyColumn,
              },
              {
                type: "button",
                id: "GrepoToolsPasteIslandButton",
                caption: language[language.settingActiveLanguage].pasteData,
                disabled: false,
                functionToCall: bbcodePasteIsland.createOutput,
              },
            ],
          },
        ];
        break;
      case 2:
        bbcodeWindow.subMenuItems = [
          {
            sectionId: "bbcodePasteAllianceSettings",
            gameHeaderText: `${
              language[language.settingActiveLanguage].allianceDataAvailable
            } ${bbcodeCopyAlliance.data.get(0).allianceName} | ${
              bbcodeCopyAlliance.data.size - 1
            } ${
              bbcodeCopyAlliance.data.size - 1 > 1
                ? language[language.settingActiveLanguage].members
                : language[language.settingActiveLanguage].member
            }`,
            display: "block",
            options: [
              {
                type: "infoText",
                caption: `${
                  language[language.settingActiveLanguage].showInfoAboveTable
                }`,
              },
              {
                type: "checkBox",
                caption: `${language[language.settingActiveLanguage].alliance}`,
                id: "bbcodeAllianceShowAllianceName",
                setting:
                  bbcodePasteAlliance.getSettingValue("showAllianceName"),
                functionToCall: bbcodePasteAlliance.setShowAllianceName,
              },
              {
                type: "checkBox",
                caption: `${
                  language[language.settingActiveLanguage].allianceNumberPlayers
                }`,
                id: "bbcodeAllianceShowAllianceNumberPlayers",
                setting: bbcodePasteAlliance.getSettingValue(
                  "showAllianceNumberPlayers"
                ),
                functionToCall:
                  bbcodePasteAlliance.setShowAllianceNumberPlayers,
              },
              {
                type: "checkBox",
                caption: `${
                  language[language.settingActiveLanguage].alliancePoints
                }`,
                id: "bbcodeAllianceShowAlliancePoints",
                setting:
                  bbcodePasteAlliance.getSettingValue("showAlliancePoints"),
                functionToCall: bbcodePasteAlliance.setShowAlliancePoints,
              },
              {
                type: "checkBox",
                caption: `${
                  language[language.settingActiveLanguage].allianceRank
                }`,
                id: "bbcodeAllianceShowAllianceRank",
                setting:
                  bbcodePasteAlliance.getSettingValue("showAllianceRank"),
                functionToCall: bbcodePasteAlliance.setShowAllianceRank,
              },
              {
                type: "infoText",
                caption: `${
                  language[language.settingActiveLanguage].showInfoInTable
                }`,
              },
              {
                type: "infoTextSmall",
                caption: `${
                  language[language.settingActiveLanguage].playerRequired
                }`,
              },
              {
                type: "checkBox",
                caption: `${language[language.settingActiveLanguage].number}`,
                id: "bbcodeAllianceshowNumber",
                setting: bbcodePasteAlliance.getSettingValue("showNumber"),
                functionToCall: bbcodePasteAlliance.setShowNumber,
              },
              {
                type: "checkBox",
                caption: `${language[language.settingActiveLanguage].points}`,
                id: "bbcodeAllianceshowPoints",
                setting:
                  bbcodePasteAlliance.getSettingValue("showPlayerPoints"),
                functionToCall: bbcodePasteAlliance.setShowPlayerPoints,
              },
              {
                type: "checkBox",
                caption: `${language[language.settingActiveLanguage].towns}`,
                id: "bbcodeAllianceshowTowns",
                setting: bbcodePasteAlliance.getSettingValue("showPlayerTowns"),
                functionToCall: bbcodePasteAlliance.setShowPlayerTowns,
              },
              {
                type: "checkBox",
                caption: `${
                  language[language.settingActiveLanguage].emptyColumn
                }`,
                id: "bbcodeAllianceshowEmptyColumn",
                setting: bbcodePasteAlliance.getSettingValue("showEmptyColumn"),
                functionToCall: bbcodePasteAlliance.setShowEmptyColumn,
              },
              {
                type: "button",
                id: "GrepoToolsPasteAllianceButton",
                caption: language[language.settingActiveLanguage].pasteData,
                disabled: false,
                functionToCall: bbcodePasteAlliance.createOutput,
              },
            ],
          },
        ];
        break;
    }

    const container = document.getElementById("bbcodeContent");
    bbcodeWindow.subMenuItems.forEach((section) => {
      const sectionDiv = document.createElement("div");
      sectionDiv.className = "section";
      sectionDiv.id = section.sectionId;
      sectionDiv.style.display = section.display;

      const headerDiv = document.createElement("div");
      headerDiv.className = "game_header bold";
      headerDiv.textContent = section.gameHeaderText;
      sectionDiv.appendChild(headerDiv);

      const groupDiv = document.createElement("div");
      groupDiv.className = "group";

      section.options.forEach((option) => {
        switch (option.type) {
          case "infoText":
            optionDiv = this.createInfoText(option.caption);
            break;
          case "infoTextSmall":
            optionDiv = this.createInfoTextSmall(option.caption);
            break;
          case "checkBox":
            optionDiv = this.createCheckbox(
              option.id,
              option.caption,
              option.setting
            );
            optionDiv.click(function () {
              option.setting = bbcodeWindow.toggleCheckbox($(this));
              option.functionToCall(option.setting);
            });
            break;
          case "dropDown":
            if (option.display != false) {
              optionDiv = bbcodeWindow.createDropdown(
                option.id,
                option.caption,
                option.setting,
                option.options
              );
            }
            break;
          case "button":
            optionDiv = this.createButton(
              option.id,
              option.caption,
              option.disabled,
              option.functionToCall
            );
            break;
        }

        groupDiv.append(optionDiv.get(0));
      });
      sectionDiv.appendChild(groupDiv);
      container.appendChild(sectionDiv);
    });
  },

  controlActionsPlayer() {
    $("#bbcodePlayerPage_list").click(function () {
      if (!bbcodeWindow.listAction) return;

      $(".selected", this).each(function () {
        const name = $(this).attr("name");
        bbcodePastePlayer.setTablePage(name);
      });

      setTimeout(() => {
        bbcodeWindow.listAction = true;
      }, 500);
    });
  },

  selectPageOptions() {
    let dropdownOptions = [];
    const maxPage = Math.ceil(
      (bbcodeCopyPlayer.data.size - 1) / bbcodePastePlayer.tableMaxRows
    );
    for (let i = 1; i <= maxPage; i++) {
      dropdownOptions.push({
        value: i,
        name: ` ${
          language[language.settingActiveLanguage].page
        } ${i} ${language[
          language.settingActiveLanguage
        ].of.toLowerCase()} ${maxPage} `,
      });
    }

    return dropdownOptions;
  },

  window(id) {
    ("use strict");

    var _IdS = id;
    var _windows = require("game/windows/ids");
    (_windows[_IdS.toUpperCase()] = _IdS),
      (function () {
        var a = uw.GameControllers.TabController,
          b = uw.GameModels.Progressable,
          _content = $("<div/>", { id: "#bbcodePasteSettings" }),
          c = a.extend({
            initialize: function (b) {
              a.prototype.initialize.apply(this, arguments);
              var _wnd = this.getWindowModel(),
                _$el = this.$el;
              bbcodeWindow.windowId = _wnd;
              this.$el.html(_content);
              _wnd.hideLoading();
              if (!_wnd.getJQElement) {
                _wnd.getJQElement = function () {
                  return _content;
                };
              }
              if (!_wnd.appendContent) {
                _wnd.appendContent = function (a) {
                  return _content.append(a);
                };
              }
              if (!_wnd.setContent2) {
                _wnd.setContent2 = function (a) {
                  return _content.html(a);
                };
              }
              this.bindEventListeners();
            },
            render: function () {
              this.reRender();
            },
            reRender: function () {
              var _wnd = this.getWindowModel(),
                _$el = this.$el;

              this.getWindowModel().setTitle(
                `<img src="https://www.grepotools.nl/grepotools/images/logoStable.png" width="15" height="15"> 
                ${language[language.settingActiveLanguage].bbcodeWindowTitle}`
              ),
                this.getWindowModel().showLoading();
              setTimeout(function () {
                _wnd.setContent2('<div id="bbcodeContent"></div>'),
                  bbcodeWindow.tab(_wnd.getActivePageNr());

                _wnd.hideLoading();

                _$el.find(".js-scrollbar-viewport").skinableScrollbar({
                  orientation: "vertical",
                  template: "tpl_skinable_scrollbar",
                  skin: "narrow",
                  disabled: !1,
                  elements_to_scroll: _$el.find(".js-scrollbar-content"),
                  element_viewport: _$el.find(".js-scrollbar-viewport"),
                  scroll_position: 0,
                  min_slider_size: 16,
                });
              }, 100);
            },
            bindEventListeners: function () {
              this.$el
                .parents("." + _IdS)
                .on(
                  "click",
                  ".js-wnd-buttons .help",
                  this._handleHelpButtonClickEvent.bind(this)
                );
            },
            _handleHelpButtonClickEvent: function () {
              var a = this.getWindowModel().getHelpButtonSettings();
            },
          });
        uw.GameViews["grepotools_" + _IdS] = c;
      })(),
      (function () {
        "use strict";
        var a = uw.GameViews,
          b = uw.GameCollections,
          c = uw.GameModels,
          d = uw.WindowFactorySettings,
          e = require("game/windows/ids"),
          f = require("game/windows/tabs"),
          g = e[_IdS.toUpperCase()];
        d[g] = function (b) {
          b = b || {};
          return us.extend(
            {
              window_type: g,
              minheight: 520,
              maxheight: 530,
              width: 622,
              tabs: [
                {
                  type: id,
                  title: `${language[language.settingActiveLanguage].player}`,
                  content_view_constructor: a["grepotools_" + _IdS],
                  hidden: 0,
                  disabled: 0,
                },
                {
                  type: id,
                  title: `${language[language.settingActiveLanguage].island}`,
                  content_view_constructor: a["grepotools_" + _IdS],
                  hidden: 0,
                  disabled: 0,
                },
                {
                  type: id,
                  title: `${language[language.settingActiveLanguage].alliance}`,
                  content_view_constructor: a["grepotools_" + _IdS],
                  hidden: 0,
                  disabled: 0,
                },
              ],
              max_instances: 1,
              activepagenr: 0,
            },
            b
          );
        };
      })();
  },
};


// Module: coordinates
// Discrption: This module will display the coordinates numbers (x/y) on the island view.
// Last Updated: 2024/12/22

let coordinates = {
  module: "coordinates",
  rendered: false,
  styleDiv: `GrepoTools_coordinates`,
  activeStyle: "",
  islandViewDivX: `GrepoTools_coordinates_X_island_view`,
  islandViewDivY: `GrepoTools_coordinates_Y_island_view`,
  settingsKeys: [
    { key: "visibleIslandView", value: null, default: true },
    { key: "updateScrolling", value: null, default: true },
  ],

  init() {
    if (grepolisLoaded) {
      this.loadSettings();
      this.createDiv();
      this.createStyle();
      this.contolModule();
    }
  },

  createDiv() {
    if (!this.rendered) {
      if (!$(`#${this.islandViewDivX}`).length) {
        $(`<div id='${this.islandViewDivX}'></div>`).insertAfter(
          "#map_movements"
        );
      }
      if (!$(`#${this.islandViewDivY}`).length) {
        $(`<div id='${this.islandViewDivY}'></div>`).insertAfter(
          "#map_movements"
        );
      }
      coordinates.setVisibilityIslandView(
        coordinates.getSettingValue("visibleIslandView")
      );
    }
  },

  contolModule() {
    // update only when mouse button is released
    $("#ui_box").mouseup(function () {
      if (!coordinates.getSettingValue("updateScrolling")) {
        if (Game.layout_mode === "island_view") {
          coordinates.draw();
        }
      }
    });

    // update when scrolling
    $("#ui_box").on("mousemove", function () {
      if (coordinates.getSettingValue("updateScrolling")) {
        if (Game.layout_mode === "island_view") {
          coordinates.draw();
        }
      }
    });
  },

  createStyle() {
    if (!this.rendered) {
      const commonStyles = `
          span.IslandViewTextblockY,
          span.IslandViewTextblockX {
            text-align: center;
            font-weight: normal;
            font-size: 14px;
            color: #ccc;
            background-color: rgba(25, 25, 25, 0.3);
            border: 1px solid rgba(25, 25, 25, 0.5);
            border-radius: 3px;
            padding: 3px;
          }
          div.IslandViewTextblockY {
            height: 128px;
            width: 60px;
            color: #FFF;
            float: left;
            display: block;
          }
          div.IslandViewTextblockX {
            height: 24px;
            width: 128px;
            color: #FFF;
            float: left;
            display: block;
          }
        `;

      const enlargedUiStyles = `
          #${this.islandViewDivY} {
            height: 100vh;
            width: 60px;
            right: 120px;
            top: 0;
            position: absolute;
            z-index: 2;
          }
          #${this.islandViewDivX} {
            height: 24px;
            width: 100vw;
            left: 0;
            bottom: 80px;
            position: absolute;
            z-index: 2;
          }
        `;

      const defaultUiStyles = `
          #${this.islandViewDivY} {
            height: 100vh;
            width: 60px;
            right: 150px;
            top: 0;
            position: absolute;
            z-index: 2;
          }
          #${this.islandViewDivX} {
            height: 24px;
            width: 100vw;
            left: 0;
            bottom: 40px;
            position: absolute;
            z-index: 2;
          }
        `;

      const styles = Game.ui_scale.enlarged_ui_size
        ? enlargedUiStyles
        : defaultUiStyles;

      $("head").append(
        $(`<style id="${this.styleDiv}">`).append(commonStyles + styles)
      );

      this.rendered = true;
    }
  },

  loadSettings() {
    this.settingsKeys.forEach((setting) => {
      const { key, default: defaultValue } = setting;
      const value = settings.loadSetting(
        `${Game.world_id}|${this.module}.${key}`,
        defaultValue
      );
      setting.value = value;
    });
  },

  getSettingValue(settingKey) {
    const setting = this.settingsKeys.find(({ key }) => key === settingKey);
    return setting ? setting.value : null;
  },

  setSettingValue(settingKey, value) {
    const setting = coordinates.settingsKeys.find(
      ({ key }) => key === settingKey
    );
    setting.value = value;

    settings.safeSetting(`${Game.world_id}|coordinates.${settingKey}`, value);
  },

  animate() {
    //This module does not work with the global timer interval that Animate calls. This module is controlled by the mouse within the controlModule function
  },

  setVisibilityIslandView(value) {
    coordinates.setSettingValue("visibleIslandView", value);
    const displayValue = value ? "block" : "none";
    $("#" + coordinates.islandViewDivX).css("display", displayValue);
    $("#" + coordinates.islandViewDivY).css("display", displayValue);
  },

  setUpdateScrolling(value) {
    coordinates.settingUpdateScrolling = value;
    coordinates.setSettingValue("updateScrolling", value);
  },

  draw() {
    const blockSize = 128;
    let htmlX = "";
    let htmlY = "";

    const mapContainer = $("#map_move_container");
    const windowX = -parseInt(mapContainer.css("left").replace("px", ""));
    const windowY = -parseInt(mapContainer.css("top").replace("px", ""));

    const startX = Math.max(0, Math.ceil(windowX / blockSize));
    const startY = Math.max(0, Math.floor(windowY / blockSize));

    const windowWidth = Math.floor($(window).width() / blockSize) - 2;
    const windowHeight = Math.floor($(window).height() / blockSize);

    for (let x = 0; x <= windowWidth; x++) {
      htmlX += `<div class='IslandViewTextblockX'><span class='IslandViewTextblockX'>X: ${
        startX + x
      }</span></div>`;
    }

    for (let y = 0; y <= windowHeight; y++) {
      htmlY += `<div class='IslandViewTextblockY'><span class='IslandViewTextblockY'>Y: ${
        startY + y
      }</span></div>`;
    }

    const islandViewDivX = $("#" + this.islandViewDivX);
    const islandViewDivY = $("#" + this.islandViewDivY);

    islandViewDivX.html(htmlX);
    islandViewDivY.html(htmlY);

    const offsetX = windowX < 0 ? -windowX - 64 : -(windowX % blockSize) + 64;
    const offsetY = windowY < 0 ? -windowY - 9 : -(windowY % blockSize) - 9;

    islandViewDivX.css("left", `${offsetX}px`);
    islandViewDivY.css("top", `${offsetY}px`);
  },
};


// Module: coordinatesGrid
// Discrption: This module will display the coordinates grid on the strategic map and island view.
// Last Updated: 2024/11/30

let coordinatesGrid = {
  module: "coordinatesGrid",
  rendered: false,
  styleDiv: `GrepoTools_coordinatesGrid`,
  activeStyle: "",
  strategicMapDiv: `GrepoTools_coordinatesGrid_strategic_map`,
  islandViewDiv: `GrepoTools_coordinatesGrid_island_view`,
  activeDiv: "",
  gridVisibleIslandView: [],
  gridVisibleStrategicMap: [],
  gridToDraw: [],
  oceanSize: "",
  gridsPerOcean: 100,
  settingsKeys: [
    { key: "visibleStrategicMap", value: null, default: true },
    { key: "visibleIslandView", value: null, default: true },
    { key: "gridColor", value: null, default: "grey" },
  ],

  init() {
    if (grepolisLoaded) {
      this.loadSettings();
      this.createDiv();
      this.createStyle();
    }
  },

  createDiv() {
    if (!this.rendered) {
      if (!$(`#${this.strategicMapDiv}`).length) {
        $(`<div id='${this.strategicMapDiv}'></div>`).insertAfter(
          "#minimap_islands_layer"
        );
      }

      coordinatesGrid.setVisibilityStrategicMap(
        coordinatesGrid.getSettingValue("visibleStrategicMap")
      );

      if (!$(`#${this.islandViewDiv}`).length) {
        $(`<div id='${this.islandViewDiv}'></div>`).insertAfter("#map_islands");
      }
      coordinatesGrid.setVisibilityIslandView(
        coordinatesGrid.getSettingValue("visibleIslandView")
      );
    }
  },

  createStyle() {
    if (!this.rendered) {
      $("head").append(
        $(`<style id="${this.styleDiv}">`).append(`
          .coordinatesBorderRight {
            border-right-width: 1px;
            border-right-style: dotted;
            position: absolute;
            z-index: 2;
            opacity: .5;
          }
          .coordinatesBorderBottom {
            border-bottom-width: 1px;
            border-bottom-style: dotted;
            position: absolute;
            z-index: 2;
            opacity: .5;
          }
          .coordinatesBorder {
            border-width: 3px;
            border-style: solid;
            position: absolute;
            z-index: 2;
            opacity: .5;
          }
        `)
      );
      this.rendered = true;
    }
  },

  loadSettings() {
    this.settingsKeys.forEach((setting) => {
      const { key, default: defaultValue } = setting;
      const value = settings.loadSetting(
        `${Game.world_id}|${this.module}.${key}`,
        defaultValue
      );
      setting.value = value;
    });
  },

  getSettingValue(settingKey) {
    const setting = this.settingsKeys.find(({ key }) => key === settingKey);
    return setting ? setting.value : null;
  },

  setSettingValue(settingKey, value) {
    const setting = coordinatesGrid.settingsKeys.find(
      ({ key }) => key === settingKey
    );
    setting.value = value;

    settings.safeSetting(
      `${Game.world_id}|coordinatesGrid.${settingKey}`,
      value
    );
  },

  animate() {
    if (!this.rendered) {
      this.gridVisibleIslandView = [];
      this.gridVisibleStrategicMap = [];
      return;
    }
    this.gridToDraw = [];

    switch (Game.layout_mode) {
      case "strategic_map":
        this.oceanSize = 2560;
        this.activeDiv = this.strategicMapDiv;

        this.gridToDraw = ocean.visibleOceans.filter(
          (value) => !this.gridVisibleStrategicMap.includes(value)
        );
        this.gridToDraw.forEach((ocean) => {
          if (ocean >= 0 && ocean <= 99) {
            this.draw(ocean);
            this.gridVisibleStrategicMap.push(ocean);
          }
        });
        break;
      case "island_view":
        this.oceanSize = 12800;
        this.activeDiv = this.islandViewDiv;

        this.gridToDraw = ocean.visibleOceans.filter(
          (value) => !this.gridVisibleIslandView.includes(value)
        );
        this.gridToDraw.forEach((ocean) => {
          if (ocean >= 0 && ocean <= 99) {
            this.draw(ocean);
            this.gridVisibleIslandView.push(ocean);
          }
        });
        break;
    }
  },

  setVisibilityStrategicMap(value) {
    coordinatesGrid.setSettingValue("visibleStrategicMap", value);
    const displayValue = value ? "block" : "none";
    $("#" + coordinatesGrid.strategicMapDiv).css("display", displayValue);
  },

  setVisibilityIslandView(value) {
    coordinatesGrid.setSettingValue("visibleIslandView", value);
    const displayValue = value ? "block" : "none";
    $("#" + coordinatesGrid.islandViewDiv).css("display", displayValue);
  },

  gridColor(color) {
    if (color && color != coordinatesGrid.getSettingValue("gridColor")) {
      coordinatesGrid.setSettingValue("gridColor", color.split(" ").join(""));
    }
    $(
      ".coordinatesBorderBottom, .coordinatesBorderRight, .coordinatesBorder"
    ).css(
      "border-color",
      settings.colors[coordinatesGrid.getSettingValue("gridColor")]
    );
  },

  draw(ocean) {
    const OceanX = Math.floor(ocean / 10) * this.oceanSize;
    const OceanY = (ocean % 10) * this.oceanSize;
    const gridStep = this.oceanSize / this.gridsPerOcean;
    const fragment = document.createDocumentFragment();

    for (let x = 0; x < this.gridsPerOcean - 1; x++) {
      const left = OceanX + x * gridStep;
      const top = OceanY;

      const div = document.createElement("div");
      div.className = "coordinatesBorderRight";
      div.style.width = `${gridStep}px`;
      div.style.height = `${this.oceanSize}px`;
      div.style.left = `${left}px`;
      div.style.top = `${top}px`;
      fragment.appendChild(div);
    }

    for (let y = 0; y < this.gridsPerOcean - 1; y++) {
      const left = OceanX;
      const top = OceanY + y * gridStep;

      const div = document.createElement("div");
      div.className = "coordinatesBorderBottom";
      div.style.width = `${this.oceanSize}px`;
      div.style.height = `${gridStep}px`;
      div.style.left = `${left}px`;
      div.style.top = `${top}px`;
      fragment.appendChild(div);
    }

    const borderDiv = document.createElement("div");
    borderDiv.className = "coordinatesBorder";
    borderDiv.style.width = `${this.oceanSize - 3}px`;
    borderDiv.style.height = `${this.oceanSize - 3}px`;
    borderDiv.style.left = `${OceanX}px`;
    borderDiv.style.top = `${OceanY}px`;
    fragment.appendChild(borderDiv);

    const container = document.createElement("div");
    container.className = `${this.module}_${ocean}`;
    container.appendChild(fragment);

    document.getElementById(this.activeDiv).appendChild(container);

    this.gridColor();
  },
};


// Module: islandNumbers
// Discrption: This module will show the island numbers on the strategic map and island view.
// Last Updated: 2025/12/12

let islandNumbers = {
  module: "islandNumbers",
  rendered: false,
  databaseServerCheck: false,
  data: {},
  styleDiv: `GrepoTools_islandNumbers`,
  strategicFarmingMapDiv: `GrepoTools_islandNumbers_farming_strategic_map`,
  islandViewFarmingDiv: `GrepoTools_islandNumbers_farming_island_view`,
  strategicRockMapDiv: `GrepoTools_islandNumbers_rock_strategic_map`,
  islandViewRockDiv: `GrepoTools_islandNumbers_rock_island_view`,
  settingsKeys: [
    { key: "visibleFarmingStrategicMap", value: null, default: true },
    { key: "visibleFarmingTagsStrategicMap", value: null, default: false },
    { key: "visibleRockStrategicMap", value: null, default: false },
    { key: "visibleFarmingIslandView", value: null, default: true },
    { key: "visibleRockIslandView", value: null, default: true },
    { key: "visibleFarmingTagsIslandView", value: null, default: true },
    { key: "link", value: null, default: true },
    { key: "farmingTextColor", value: null, default: "yellow" },
    { key: "rockTextColor", value: null, default: "grey" },
  ],

  islandData: [
    ["1", "farming", 90, 50, 585, 315],
    ["2", "farming", 80, 45, 425, 250],
    ["3", "farming", 80, 60, 495, 315],
    ["4", "farming", 85, 30, 405, 275],
    ["5", "farming", 80, 30, 425, 315],
    ["6", "farming", 70, 50, 705, 375],
    ["7", "farming", 40, 60, 235, 285],
    ["8", "farming", 65, 60, 515, 365],
    ["9", "farming", 80, 45, 370, 220],
    ["10", "farming", 80, 55, 470, 150],
    ["11", "rock", 30, 15, 195, 195],
    ["12", "rock", 25, 25, 230, 125],
    ["13", "rock", 50, 30, 310, 155],
    ["14", "rock", 20, 25, 185, 125],
    ["15", "rock", 40, 35, 170, 195],
    ["16", "rock", 55, 40, 250, 200],
    ["37", "farming", 90, 80, 425, 315],
    ["38", "farming", 70, 40, 360, 220],
    ["39", "farming", 55, 40, 525, 310],
    ["40", "farming", 75, 55, 545, 285],
    ["41", "farming", 70, 70, 310, 215],
    ["42", "farming", 70, 35, 435, 250],
    ["43", "farming", 70, 25, 365, 155],
    ["44", "farming", 85, 40, 420, 150],
    ["45", "farming", 75, 45, 370, 345],
    ["46", "farming", 65, 50, 365, 285],
    ["47", "rock", 45, 40, 265, 195],
    ["48", "rock", 40, 20, 245, 125],
    ["49", "rock", 60, 30, 370, 150],
    ["50", "rock", 45, 50, 245, 220],
    ["51", "rock", 45, 35, 310, 155],
    ["52", "rock", 65, 25, 375, 150],
    ["53", "rock", 45, 25, 310, 135],
    ["54", "rock", 35, 35, 300, 250],
    ["55", "rock", 45, 25, 270, 120],
    ["56", "rock", 55, 45, 310, 250],
    ["57", "rock", 35, 35, 320, 200],
    ["58", "rock", 50, 35, 310, 250],
    ["59", "rock", 40, 40, 310, 225],
    ["60", "rock", 55, 30, 305, 165],
  ],

  init() {
    if (grepolisLoaded) {
      this.loadSettings();
      this.createDiv();
      this.createStyle();
      this.databaseCheck();
      this.initializeIslandNumbersOffset();
      islandNumbers.loadDataInterval = setInterval(
        islandNumbers.databaseCheck,
        5000
      );
    }
  },

  initializeIslandNumbersOffset() {
    this.islandNumbersOffset = new Map(
      this.islandData.map(
        ([id, type, offsetXSK, offsetYSK, offsetXEO, offsetYEO]) => [
          id,
          this.createIslandData(
            type,
            offsetXSK,
            offsetYSK,
            offsetXEO,
            offsetYEO
          ),
        ]
      )
    );
  },

  createIslandData(type, offsetXSK, offsetYSK, offsetXEO, offsetYEO) {
    return {
      type: type,
      offsetXSK: offsetXSK,
      offsetYSK: offsetYSK,
      offsetXEO: offsetXEO,
      offsetYEO: offsetYEO,
    };
  },

  createDiv() {
    if (!this.rendered) {
      if (!$(`#${this.strategicFarmingMapDiv}`).length) {
        $(`<div id='${this.strategicFarmingMapDiv}'></div>`).insertAfter(
          "#minimap_islands_layer"
        );
      }
      this.setVisibilityFarmingStrategicMap(
        this.getSettingValue("visibleFarmingStrategicMap")
      );

      if (!$(`#${this.islandViewFarmingDiv}`).length) {
        $(`<div id='${this.islandViewFarmingDiv}'></div>`).insertAfter(
          "#map_islands"
        );
      }
      this.setVisibilityFarmingIslandView(
        this.getSettingValue("visibleFarmingIslandView")
      );

      if (!$(`#${this.strategicRockMapDiv}`).length) {
        $(`<div id='${this.strategicRockMapDiv}'></div>`).insertAfter(
          "#minimap_islands_layer"
        );
      }
      this.setVisibilityRockStrategicMap(
        this.getSettingValue("visibleRockStrategicMap")
      );

      if (!$(`#${this.islandViewRockDiv}`).length) {
        $(`<div id='${this.islandViewRockDiv}'></div>`).insertAfter(
          "#map_islands"
        );
      }
      this.setVisibilityRockIslandView(
        this.getSettingValue("visibleRockIslandView")
      );
    }
  },

  createStyle() {
    if (!this.rendered) {
      $("head").append(
        $(`<style id="${this.styleDiv}">`).append(`
  .islandNumbersFarmingTextStrategicMap, .islandNumbersRockTextStrategicMap,
    .islandNumbersFarmingTextIslandView, .islandNumbersRockTextIslandView {
      position: absolute;
      z-index: 100;
      text-align: center;
      margin: auto;
      font-weight: normal;
      white-space: nowrap;
    }
    .islandNumbersFarmingTextStrategicMap, .islandNumbersRockTextStrategicMap {
      font-size: 12px;
    }
    .islandNumbersFarmingTextIslandView, .islandNumbersRockTextIslandView {
      font-size: 20px;
    }
    a:link.islandNumbersFarmingTextStrategicMap, a:link.islandNumbersRockTextStrategicMap,
    a:link.islandNumbersFarmingTextIslandView, a:link.islandNumbersRockTextIslandView {
      padding: 3px;
      background-color: rgba(25, 25, 25, 0.5);
      border: 1px solid rgba(25, 25, 25, 0.7);
      border-radius: 3px;
    }
    a:visited.islandNumbersFarmingTextStrategicMap, a:visited.islandNumbersRockTextStrategicMap,
    a:visited.islandNumbersFarmingTextIslandView, a:visited.islandNumbersRockTextIslandView {
      border: 1px solid rgba(25, 25, 25, 0.7);
      border-radius: 3px;
    }
    a:hover.islandNumbersFarmingTextStrategicMap, a:hover.islandNumbersRockTextStrategicMap,
    a:hover.islandNumbersFarmingTextIslandView, a:hover.islandNumbersRockTextIslandView {
      text-decoration: underline;
    }
    .noLink {
      text-align: center;
      margin: auto;
      padding: 3px;
      background-color: rgba(25, 25, 25, 0.5);
      border: 1px solid rgba(25, 25, 25, 0.7);
      border-radius: 3px;
    }
         `)
      );
      this.rendered = true;
    }
  },

  loadSettings() {
    this.settingsKeys.forEach((setting) => {
      const { key, default: defaultValue } = setting;
      const value = settings.loadSetting(
        `${Game.world_id}|${this.module}.${key}`,
        defaultValue
      );
      setting.value = value;
    });
  },

  getSettingValue(settingKey) {
    const setting = this.settingsKeys.find(({ key }) => key === settingKey);
    return setting ? setting.value : null;
  },

  setSettingValue(settingKey, value) {
    const setting = islandNumbers.settingsKeys.find(
      ({ key }) => key === settingKey
    );
    setting.value = value;

    settings.safeSetting(`${Game.world_id}|islandNumbers.${settingKey}`, value);
  },

  databaseCheck: async function () {
    try {
      const response = await fetch(
        "https://www.grepotools.nl/grepotools/php/islandNumbers.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            server: Game.world_id,
            action: "CheckDB",
            version: GM_info.script.version,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }

      const returnData = await response.text();

      if (returnData == "DB-OK") {
        islandNumbers.databaseServerCheck = true;
        clearInterval(islandNumbers.loadDataInterval);
        setTimeout(function () {
          islandNumbers.animate();
        }, 250);
      } else {
        console.log("Database server check failed:", returnData);
        islandNumbers.databaseServerCheck = false;
      }
    } catch (error) {
      console.error("Error:", error);
      islandNumbers.databaseServerCheck = false;
    }
  },

  localDatabaseCheck: function (ocean) {
    //check local database for the island numbers
    if (externalData.islandData.has(Game.world_id + "|" + ocean)) {
      return true;
    } else {
      return false;
    }
  },

  getCoordinatesFromID(id, map) {
    const patterns = [/mini_i(\d+)_(\d+)/, /islandtile_(\d+)_(\d+)/];
    let matches = null;

    for (const pattern of patterns) {
      matches = id.match(pattern);
      if (matches) break;
    }

    if (matches) {
      const x = parseInt(matches[1]);
      const y = parseInt(matches[2]);

      for (let [key, value] of map.entries()) {
        for (let item of value) {
          if (item.x === x && item.y === y) {
            return item;
          }
        }
      }
    }
    return null;
  },

  animate() {
    if (!this.rendered || !this.databaseServerCheck) {
      return;
    }

    ocean.visibleOceans.forEach((ocean) => {
      if (!this.localDatabaseCheck(ocean)) {
        externalData.loadIslandData(ocean);
      }
    });

    let islandsVisible = "";
    let htmlFarming = "";
    let htmlRock = "";
    let text = "";

    switch (Game.layout_mode) {
      case "strategic_map":
        islandsVisible = $("[id^=mini_i]")
          .toArray()
          .map((element) => element.id);
        htmlFarming = "";
        htmlRock = "";
        text = "";

        for (let i = 0; i < islandsVisible.length; i++) {
          data = this.getCoordinatesFromID(
            islandsVisible[i],
            externalData.islandData
          );
          if (data) {
            soort = this.islandNumbersOffset.get(data.type.toString()).type;
            switch (soort) {
              case "farming":
                this.islandTypeToDraw = "farming";
                text = this.draw(data);
                htmlFarming += text ?? "";
                break;
              case "rock":
                this.islandTypeToDraw = "rock";
                text = this.draw(data);
                htmlRock += text ?? "";
                break;
            }
          }
        }

        $(`#${this.strategicFarmingMapDiv}`).html(htmlFarming);
        $(".islandNumbersFarmingTextStrategicMap").css(
          "color",
          settings.colors[islandNumbers.getSettingValue("farmingTextColor")]
        );

        $(`#${this.strategicRockMapDiv}`).html(htmlRock);
        $(".islandNumbersRockTextStrategicMap").css(
          "color",
          settings.colors[islandNumbers.getSettingValue("rockTextColor")]
        );
        break;
      case "island_view":
        islandsVisible = $("[id^=islandtile]")
          .toArray()
          .map((element) => element.id);

        htmlFarming = "";
        htmlRock = "";
        text = "";

        for (let i = 0; i < islandsVisible.length; i++) {
          data = this.getCoordinatesFromID(
            islandsVisible[i],
            externalData.islandData
          );
          if (data) {
            soort = this.islandNumbersOffset.get(data.type.toString()).type;
            switch (soort) {
              case "farming":
                this.islandTypeToDraw = "farming";
                text = this.draw(data);
                htmlFarming += text ?? "";
                break;
              case "rock":
                this.islandTypeToDraw = "rock";
                text = this.draw(data);
                htmlRock += text ?? "";
                break;
            }
          }
        }

        $(`#${this.islandViewFarmingDiv}`).html(htmlFarming);
        $(".islandNumbersFarmingTextIslandView").css(
          "color",
          settings.colors[islandNumbers.getSettingValue("farmingTextColor")]
        );

        $(`#${this.islandViewRockDiv}`).html(htmlRock);
        $(".islandNumbersRockTextIslandView").css(
          "color",
          settings.colors[islandNumbers.getSettingValue("rockTextColor")]
        );
        break;
    }
  },

  draw(data) {
    let valueX,
      valueY,
      className,
      linkTag,
      text = "";

    switch (Game.layout_mode) {
      case "strategic_map":
        valueX =
          data.x * 25.6 +
          this.islandNumbersOffset.get(data.type.toString()).offsetXSK;
        valueY =
          data.y * 25.6 +
          this.islandNumbersOffset.get(data.type.toString()).offsetYSK;
        if (data.x % 2 !== 0) valueY += 12.8;

        if (this.islandTypeToDraw === "farming") {
          if (this.getSettingValue("visibleFarmingStrategicMap")) {
            text = this.getSettingValue("visibleFarmingTagsStrategicMap")
              ? `${data.id}<br>${data.tagData}`
              : `${data.id}`;
          } else if (this.getSettingValue("visibleFarmingTagsStrategicMap")) {
            text = `${data.tagData}`;
          }

          className = this.getSettingValue("link")
            ? "islandNumbersFarmingTextStrategicMap"
            : "islandNumbersFarmingTextStrategicMap noLink";
          linkTag = this.getSettingValue("link")
            ? `<a href="#${data.link}" class="${className}">${text}</a>`
            : text;
        }
        if (this.islandTypeToDraw === "rock") {
          className = this.getSettingValue("link")
            ? "islandNumbersRockTextStrategicMap"
            : "islandNumbersRockTextStrategicMap noLink";
          linkTag = this.getSettingValue("link")
            ? `<a href="#${data.link}" class="${className}">${data.id}</a>`
            : data.id;
        }
        return `<div class="${className}" style="left:${valueX}px;top:${valueY}px">${linkTag}</div>`;
        break;
      case "island_view":
        valueX =
          data.x * 128 +
          this.islandNumbersOffset.get(data.type.toString()).offsetXEO;
        valueY =
          data.y * 128 +
          this.islandNumbersOffset.get(data.type.toString()).offsetYEO;
        data.x % 2 != 0 ? (valueY += 64) : "";

        if (this.islandTypeToDraw === "farming") {
          if (this.getSettingValue("visibleFarmingIslandView")) {
            text = this.getSettingValue("visibleFarmingTagsIslandView")
              ? `${data.id}<br>${data.tagData}`
              : `${data.id}`;
          } else if (this.getSettingValue("visibleFarmingTagsIslandView")) {
            text = `${data.tagData}`;
          }

          className = this.getSettingValue("link")
            ? "islandNumbersFarmingTextIslandView"
            : "islandNumbersFarmingTextIslandView noLink";
          linkTag = this.getSettingValue("link")
            ? `<a href="#${data.link}" class="${className}">${text}</a>`
            : text;
        }

        if (this.islandTypeToDraw === "rock") {
          className = this.getSettingValue("link")
            ? "islandNumbersRockTextIslandView"
            : "islandNumbersRockTextIslandView noLink";
          linkTag = this.getSettingValue("link")
            ? `<a href="#${data.link}" class="${className}">${data.id}</a>`
            : data.id;
        }
        return `<div class="${className}" style="left:${valueX}px;top:${valueY}px">${linkTag}</div>`;
        break;
    }
  },

  setVisibilityFarmingStrategicMap(value) {
    islandNumbers.setSettingValue("visibleFarmingStrategicMap", value);
    const displayValue =
      !islandNumbers.getSettingValue("visibleFarmingStrategicMap") &&
      !islandNumbers.getSettingValue("visibleFarmingTagsStrategicMap")
        ? "none"
        : "block";
    $("#" + islandNumbers.strategicFarmingMapDiv).css("display", displayValue);

    if (displayValue === "block") {
      islandNumbers.animate();
    }
  },

  setVisibilityFarmingTagsStrategicMap(value) {
    islandNumbers.setSettingValue("visibleFarmingTagsStrategicMap", value);
    const displayValue =
      !islandNumbers.getSettingValue("visibleFarmingStrategicMap") &&
      !islandNumbers.getSettingValue("visibleFarmingTagsStrategicMap")
        ? "none"
        : "block";
    $("#" + islandNumbers.strategicFarmingMapDiv).css("display", displayValue);

    if (displayValue === "block") {
      islandNumbers.animate();
    }
  },

  setVisibilityRockStrategicMap(value) {
    islandNumbers.setSettingValue("visibleRockStrategicMap", value);
    const displayValue = value ? "block" : "none";
    $("#" + islandNumbers.strategicRockMapDiv).css("display", displayValue);
  },

  setVisibilityFarmingIslandView(value) {
    islandNumbers.setSettingValue("visibleFarmingIslandView", value);
    const displayValue =
      !islandNumbers.getSettingValue("visibleFarmingIslandView") &&
      !islandNumbers.getSettingValue("visibleFarmingTagsIslandView")
        ? "none"
        : "block";
    $("#" + islandNumbers.islandViewFarmingDiv).css("display", displayValue);

    if (displayValue === "block") {
      islandNumbers.animate();
    }
  },

  setVisibilityFarmingTagsIslandView(value) {
    islandNumbers.setSettingValue("visibleFarmingTagsIslandView", value);
    const displayValue =
      !islandNumbers.getSettingValue("visibleFarmingIslandView") &&
      !islandNumbers.getSettingValue("visibleFarmingTagsIslandView")
        ? "none"
        : "block";
    $("#" + islandNumbers.islandViewFarmingDiv).css("display", displayValue);

    if (displayValue === "block") {
      islandNumbers.animate();
    }
  },

  setVisibilityRockIslandView(value) {
    islandNumbers.setSettingValue("visibleRockIslandView", value);
    const displayValue = value ? "block" : "none";
    $("#" + islandNumbers.islandViewRockDiv).css("display", displayValue);

    if (displayValue === "block") {
      islandNumbers.animate();
    }
  },

  setLink(value) {
    islandNumbers.setSettingValue("link", value);
    islandNumbers.animate();
  },

  setFarmingTextColor(color) {
    if (color && color != islandNumbers.getSettingValue("farmingTextColor")) {
      islandNumbers.setSettingValue(
        "farmingTextColor",
        color.split(" ").join("")
      );
    }
    $(
      ".islandNumbersFarmingTextStrategicMap, .islandNumbersFarmingTextIslandView"
    ).css(
      "color",
      settings.colors[islandNumbers.getSettingValue("farmingTextColor")]
    );
  },

  setRockTextColor(color) {
    if (color && color != islandNumbers.getSettingValue("rockTextColor")) {
      islandNumbers.setSettingValue("rockTextColor", color.split(" ").join(""));
    }
    $(
      ".islandNumbersRockTextStrategicMap, .islandNumbersRockTextIslandView"
    ).css(
      "color",
      settings.colors[islandNumbers.getSettingValue("rockTextColor")]
    );
  },
};


// Module: mapTags
// Discrption: This module will render and display maptags on the map.
// Last Updated: 2025/01/05

let mapTags = {
  module: "mapTags",
  rendered: false,
  styleDiv: `GrepoTools_mapTags`,
  mapTagsReset: false,
  towns: [],
  settingsKeys: [
    { key: "settingAllianceName", value: null, default: true },
    { key: "settingPlayerName", value: null, default: true },
    { key: "settingTownName", value: null, default: false },
    { key: "settingTownPoints", value: null, default: false },
    { key: "settingInactiveTimePlayer", value: null, default: true },
    { key: "settingNoWrap", value: null, default: true },
  ],

  init() {
    if (grepolisLoaded) {
      this.loadSettings();
      this.createStyle();
    }
  },

  createStyle() {
    if (!this.rendered) {
      $("head").append(
        $(`<style id="${this.styleDiv}">`).append(`
          .tags {
              background-color: inherit;
              pointer-events: none;
              opacity: 0.8;
              position: absolute;
              text-align: center;
              color: white;
              display: block;
              font-size: 9px;
              padding: 2px;
              border-radius: 3px;
              text-shadow: 1px 1px rgba(0, 0, 0, 0.7);
          }

          .tags.sw.one { top: -15px; left: -45px; }
          .tags.ne.one { top: -20px; left: 0px; }
          .tags.se.one { top: -7px; left: -25px; }
          .tags.nw.one { top: -5px; left: -35px; }

          .tags.sw.two { top: -27px; left: -45px; }
          .tags.ne.two { top: -32px; left: 0px; }
          .tags.se.two { top: -19px; left: -25px; }
          .tags.nw.two { top: -17px; left: -35px; }

          .tags.sw.three { top: -39px; left: -45px; }
          .tags.ne.three { top: -44px; left: 0px; }
          .tags.se.three { top: -31px; left: -25px; }
          .tags.nw.three { top: -29px; left: -35px; }

          .tags.sw.four { top: -51px; left: -45px; }
          .tags.ne.four { top: -56px; left: 0px; }
          .tags.se.four { top: -43px; left: -25px; }
          .tags.nw.four { top: -41px; left: -35px; }

          .nowrap {
              white-space: nowrap;
          }

          .inactive_sw, .inactive_ne, .inactive_se, .inactive_nw {
              font-size: 9px;
              background-color: rgba(0, 0, 0, 0.3);
              color: white;
              padding: 2px 3px;
              display: block;
              position: absolute;
          }

          .inactive_sw { top: 35px; left: -45px; }
          .inactive_ne { top: 25px; left: 5px; }
          .inactive_se { top: 45px; left: -15px; }
          .inactive_nw { top: 35px; left: -35px; }

          .green, .yellow, .red {
              border-radius: 3px;
          }

          .green { border: 1px solid green; }
          .yellow { border: 1px solid yellow; }
          .red { border: 1px solid red; }
         `)
      );
      this.rendered = true;
    }
  },

  loadSettings() {
    this.settingsKeys.forEach((setting) => {
      const { key, default: defaultValue } = setting;
      const value = settings.loadSetting(
        `${Game.world_id}|${this.module}.${key}`,
        defaultValue
      );
      setting.value = value;
    });
  },

  getSettingValue(settingKey) {
    const setting = this.settingsKeys.find(({ key }) => key === settingKey);
    return setting ? setting.value : null;
  },

  setSettingValue(settingKey, value) {
    const setting = mapTags.settingsKeys.find(({ key }) => key === settingKey);
    setting.value = value;

    settings.safeSetting(`${Game.world_id}|mapTags.${settingKey}`, value);
  },

  animate() {
    let start;
    // NOTE this is a workarround if DioTools is active
    if ($("#town_icon > div.town_icon_bg").get(0)) {
      start = 1;
    } else {
      start = 0;
    }

    // reset nessasary when a setting has changd or the data has reloaded from the server
    if (mapTags.mapTagsReset) {
      for (let i = start; i < mapTags.towns.length; i++) {
        let townID = JSON.parse(atob(mapTags.towns[i].hash.substr(1))).id;
        $("#town_flag_" + townID).empty();
      }
      mapTags.mapTagsReset = false;
    }

    mapTags.towns = $("[id^=town]")
      .not("[id*=flag]")
      .not("[id*=info-]")
      .not("[id*=bbcode]")
      .toArray();

    if (externalData.townDataLoaded) {
      for (let i = start; i < mapTags.towns.length; i++) {
        if (mapTags.towns[i].className != "flag town") {
          try {
            let townID = JSON.parse(atob(mapTags.towns[i].hash.substr(1))).id;

            if (externalData.townData.has(townID.toString())) {
              let playerName = "";
              let tag_speler_id = "";
              let allianceName;

              externalData.townData.get(townID.toString()).playerName != null
                ? (playerName = decodeURIComponent(
                    externalData.townData
                      .get(townID.toString())
                      .playerName.split("+")
                      .join(" ")
                  ))
                : (playerName = "");

              externalData.townData.get(townID.toString()).playerId != null
                ? (tag_speler_id = externalData.townData.get(
                    townID.toString()
                  ).playerId)
                : (tag_speler_id = "");

              let townName = decodeURIComponent(
                externalData.townData
                  .get(townID.toString())
                  .townName.split("+")
                  .join(" ")
              );

              externalData.townData.get(townID.toString()).allianceName != null
                ? (allianceName = decodeURIComponent(
                    externalData.townData
                      .get(townID.toString())
                      .allianceName.split("+")
                      .join(" ")
                  ))
                : (allianceName = "");

              let townPoints = externalData.townData.get(
                townID.toString()
              ).points;
              let windDirection = mapTags.getTownWindDirection(
                mapTags.towns[i].className
              );
              let idle = 0;

              if (externalData.idleDataLoaded) {
                if (externalData.idleData.has(tag_speler_id.toString())) {
                  idle = externalData.idleData.get(
                    tag_speler_id.toString()
                  ).idle;
                }
              }

              if (!document.getElementById("gt_" + townID.toString())) {
                this.draw(
                  townID,
                  playerName,
                  townName,
                  townPoints,
                  allianceName,
                  windDirection,
                  idle
                );
              }
            }
          } catch (error) {
            return;
          }
        }
      }
    }
  },

  getTownWindDirection(className) {
    if (className.includes("sw")) return "sw";
    if (className.includes("se")) return "se";
    if (className.includes("nw")) return "nw";
    if (className.includes("ne")) return "ne";
  },

  draw(
    townID,
    playerName,
    townName,
    townPoints,
    allianceName,
    windDirection,
    idle
  ) {
    let tagText = "";
    let lines = 0;
    let linesCss = "";

    if (this.getSettingValue("settingPlayerName") && playerName) lines++;
    if (this.getSettingValue("settingAllianceName") && playerName) lines++;
    if (this.getSettingValue("settingTownName")) lines++;
    if (this.getSettingValue("settingTownPoints")) lines++;

    const regelClasses = ["", "one", "two", "three", "four"];
    linesCss = regelClasses[lines] || "";

    if (this.getSettingValue("settingAllianceName") && playerName) {
      tagText = allianceName || "";
    }

    if (this.getSettingValue("settingPlayerName") && playerName) {
      tagText = tagText ? `${tagText}<br>${playerName}` : playerName;
    }

    if (this.getSettingValue("settingTownName")) {
      tagText = tagText ? `${tagText}<br>${townName}` : townName;
    }

    if (this.getSettingValue("settingTownPoints")) {
      const puntenTekst = `${townPoints} ${
        language[language.settingActiveLanguage].points
      }`;
      tagText = tagText ? `${tagText}<br>${puntenTekst}` : puntenTekst;
    }

    // Update de HTML van de stadsvlag
    if (lines) {
      const townFlag = $(`#town_flag_${townID}`);
      townFlag.empty();
      townFlag.append(
        `<div id="gt_${townID}" class="tags ${windDirection} ${linesCss}">${tagText}</div>`
      );
      if (this.getSettingValue("settingNoWrap")) {
        $(`#gt_${townID}`).addClass("nowrap");
      }
    }

    // Toon inactiviteit indien ingesteld
    if (this.getSettingValue("settingInactiveTimePlayer")) {
      mapTags.displayIdle(idle, windDirection, townID);
    }
  },

  displayIdle(idleTime, windDirection, townID) {
    $("#town_flag_" + townID).css("width", "0");

    if (idleTime > 0) {
      const idleText = mapTags.calculateIdle(idleTime);
      let idleClass = "";

      if (idleTime <= 12) {
        idleClass = "green";
      } else if (idleTime <= 24) {
        idleClass = "yellow";
      } else {
        idleClass = "red";
      }

      $("#town_flag_" + townID).append(
        `<div class="inactive_${windDirection} nowrap ${idleClass}">${idleText}</div>`
      );
    }
  },

  calculateIdle(idleTime) {
    const { day, days, hour } = language[language.settingActiveLanguage];
    const idleDays = Math.floor(idleTime / 24);
    const idleHours = idleTime % 24;

    if (idleDays === 1) {
      return `${idleDays} ${day} ${idleHours} ${hour}`;
    } else if (idleDays > 1) {
      return `${idleDays} ${days} ${idleHours} ${hour}`;
    } else {
      return `${idleHours} ${hour}`;
    }
  },

  setAllianceName(value) {
    mapTags.setSettingValue("settingAllianceName", value);
    mapTags.mapTagsReset = true;
    mapTags.animate();
  },

  setPlayerName(value) {
    mapTags.setSettingValue("settingPlayerName", value);
    mapTags.mapTagsReset = true;
    mapTags.animate();
  },

  setTownName(value) {
    mapTags.setSettingValue("settingTownName", value);
    mapTags.mapTagsReset = true;
    mapTags.animate();
  },

  setTownPoints(value) {
    mapTags.setSettingValue("settingTownPoints", value);
    mapTags.mapTagsReset = true;
    mapTags.animate();
  },

  setInactiveTimePlayer(value) {
    mapTags.setSettingValue("settingInactiveTimePlayer", value);
    mapTags.mapTagsReset = true;
    mapTags.animate();
  },

  setNoWrap(value) {
    mapTags.setSettingValue("settingNoWrap", value);
    mapTags.mapTagsReset = true;
    mapTags.animate();
  },
};


// Module:messageAlliance
// Discrption: This module will add a button to the alliance page to send a message to all alliance members.
// Last Updated: 2024/11/30

let messageAlliance = {
  module: "messageAlliance",
  rendered: false,
  styleDiv: `GrepoTools_messageAlliance`,
  buttonAction: true,

  init() {
    if (grepolisLoaded) {
      this.createStyle();
    }
  },

  createStyle() {
    if (!this.rendered) {
      $("head").append(
        $(`<style id="${this.styleDiv}">`).append(`
          .buttonLogo {
            margin-right:10px;
            width:20px;
            height:20px;
          }
          .buttonText {
            height:23px;
            float:right
          }
          .messageAllianceButton {
            float:right;
            padding-top:3px;
            margin-right:10px
          }
          #ally_towns .game_header{
            height: 27px
          }
        `)
      );
      this.rendered = true;
    }
  },

  animate() {
    if (
      !this.rendered ||
      !$("#ally_towns").length ||
      $(".messageAllianceButton").length
    ) {
      return;
    }

    otherScripts.checkActiveScripts();
    this.hideDiotoolsMessageButton();
    this.hideGrcrtMessageButton();
    this.hideMoleholeMessageButton();

    $("#ally_towns > div > div.game_header.bold").append(
      $("<div/>", {
        id: "messageAllianceButton",
        class: "button_new messageAllianceButton",
      }).button({
        caption: `
          <img class="buttonLogo" src="https://www.grepotools.nl/grepotools/images/logoStable.png">
          <span class="buttonText">${
            language[language.settingActiveLanguage].message
          }</span>`,
      })
    );

    $(".messageAllianceButton").tooltip(
      `${language[language.settingActiveLanguage].sendMessageAlliance}`
    );

    $(".messageAllianceButton").click(() => {
      if (messageIsland.buttonAction) {
        messageIsland.buttonAction = false;

        const allianceMembers = $(".members_list li:eq(1) ul li.even");
        const messageTo = allianceMembers
          .map((index, element) => {
            const playerName = $(element)
              .find("a.gp_player_link")
              .attr("title");
            return playerName !== uw.Game.player_name ? playerName : null;
          })
          .get()
          .filter(Boolean)
          .join(";");

        uw.Layout.newMessage.open({ recipients: messageTo });

        setTimeout(() => {
          messageIsland.buttonAction = true;
        }, 500);
      }
    });
  },

  hideDiotoolsMessageButton() {
    if (
      otherScripts.diotoolsActive &&
      otherScripts.getSettingValue("diotoolsMessageButton")
    ) {
      $("#dio_ally_mass_mail").hide();
    }
  },

  hideGrcrtMessageButton() {
    if (
      otherScripts.grcrtActive &&
      otherScripts.getSettingValue("grcrtMessageButton")
    ) {
      $("#grcrt_ally_mass_mail").hide();
    }
  },

  hideMoleholeMessageButton() {
    if (
      otherScripts.moleholeActive &&
      otherScripts.getSettingValue("diotoolsMessageButton")
    ) {
      document.querySelectorAll(".write_message").forEach((element) => {
        element.style.display = "none";
      });
    }
  },
};


// Module:messageAlliance
// Discrption: This module will add a button to the island page to send a message to all alliance members.
// Last Updated: 2025/01/01

let messageIsland = {
  module: "messageIsland",
  rendered: false,
  styleDiv: `GrepoTools_messageIsland`,
  buttonAction: true,

  init() {
    if (grepolisLoaded) {
      this.createStyle();
    }
  },

  createStyle() {
    if (!this.rendered) {
      $("head").append(
        $(`<style id="${this.styleDiv}">`).append(`
          .buttonLogo {
            margin-right:10px;
            width:20px;
            height:20px;
          }
          .buttonText {
            height:23px;
            float:right
          }
          [id^="messageIslandButton"] {
            float:right;
            padding-top:3px;
            margin-right:10px
          }
        `)
      );
      this.rendered = true;
    }
  },

  animate() {
    if (!this.rendered == true) {
      return;
    }

    Layout.wnd.getAllOpen().forEach((elem) => {
      if (elem.getController() === "island_info") {
        if (!$(`#messageIslandButton_${elem.getElement().id}`).length) {
          otherScripts.checkActiveScripts();
          this.hideDiotoolsMessageButton();
          this.hideMoleholeMessageButton();
          this.addButton(elem.getElement().id);
        }
      }
    });
  },

  addButton(id) {
    $(`#${id} .island_info_left .game_header`).append(
      $("<div/>", {
        id: `messageIslandButton_${id}`,
        class: "button_new",
      }).button({
        caption: `
            <img class="buttonLogo" src="https://www.grepotools.nl/grepotools/images/logoStable.png">
            <span class="buttonText">${
              language[language.settingActiveLanguage].message
            }</span>`,
      })
    );

    $(`#messageIslandButton_${id}`).tooltip(
      `${language[language.settingActiveLanguage].sendMessageIsland}`
    );

    $(`#messageIslandButton_${id}`).click(function () {
      if (messageIsland.buttonAction) {
        messageIsland.buttonAction = false;
        messageTo = [];
        islandCityData = [];
        playerData = "";

        const liItems = $(this)
          .closest(".gpwindow_content")
          .find(
            "#island_info_towns_left_sorted_by_name li.odd, #island_info_towns_left_sorted_by_name li.even"
          );

        liItems.each(function () {
          if ($(this).find(".gp_town_link").length == 0) {
            HumanMessage.error(
              language[language.settingActiveLanguage].islandEmptyNoMessage
            );
          } else {
            const hrefData = $(this).find(".gp_town_link").attr("href");
            const townId = JSON.parse(
              atob(hrefData.slice(hrefData.lastIndexOf("#") + 1))
            ).id;

            if (townId != undefined) {
              islandCityData.push(townId);
            }
          }
        });

        if (islandCityData.length) {
          for (let i = 0; i < islandCityData.length; i++) {
            if (externalData.townData.has(islandCityData[i].toString())) {
              data = externalData.townData.get(islandCityData[i].toString());
              playerName = decodeURI(data.playerName.split("+").join(" "));

              if (
                data.allianceId == uw.Game.alliance_id &&
                playerName != uw.Game.player_name &&
                !messageTo.includes(playerName)
              ) {
                messageTo.push(playerName);
              }
            }
          }
          if (!messageTo.length) {
            HumanMessage.error(
              language[language.settingActiveLanguage].islandNoAllianceNoMessage
            );
          } else {
            uw.Layout.newMessage.open({
              recipients: [...new Set(messageTo)].join(";"),
            });
          }
        }

        setTimeout(() => {
          messageIsland.buttonAction = true;
        }, 500);
      }
    });
  },

  hideDiotoolsMessageButton() {
    if (
      otherScripts.diotoolsActive &&
      otherScripts.getSettingValue("diotoolsMessageButton")
    ) {
      // island window
      document.querySelectorAll("#dio_message_island").forEach((element) => {
        element.style.display = "none";
      });
    }
  },

  hideMoleholeMessageButton() {
    if (
      otherScripts.moleholeActive &&
      otherScripts.getSettingValue("moleholeMessageButton")
    ) {
      document.querySelectorAll(".write_message").forEach((element) => {
        element.style.display = "none";
      });
    }
  },
};


// Module: OceanGrid
// Discrption: This module will display a grid on the strategic map and island view.
// Last Updated: 2024/11/29

let oceanGrid = {
  module: "oceanGrid",
  rendered: false,
  styleDiv: `GrepoTools_oceanGrid`,
  activeStyle: "",
  strategicMapDiv: `GrepoTools_oceanGrid_strategic_map`,
  islandViewDiv: `GrepoTools_oceanGrid_island_view`,
  activeDiv: "",
  letters: ["A", "B", "C", "D", "E"],
  gridVisibleIslandView: [],
  gridVisibleStrategicMap: [],
  gridToDraw: [],
  oceanSize: "",
  gridsPerOcean: 5,
  settingsKeys: [
    { key: "visibleStrategicMap", value: null, default: true },
    { key: "visibleIslandView", value: null, default: true },
    { key: "gridColor", value: null, default: "grey" },
    { key: "gridTextColor", value: null, default: "blue" },
  ],

  init() {
    if (grepolisLoaded) {
      this.loadSettings();
      this.createDiv();
      this.createStyle();
    }
  },

  createDiv() {
    if (!this.rendered) {
      if (!$(`#${this.strategicMapDiv}`).length) {
        $(`<div id='${this.strategicMapDiv}'></div>`).insertAfter(
          "#minimap_islands_layer"
        );
      }

      oceanGrid.setVisibilityStrategicMap(
        oceanGrid.getSettingValue("visibleStrategicMap")
      );

      if (!$(`#${this.islandViewDiv}`).length) {
        $(`<div id='${this.islandViewDiv}'></div>`).insertAfter("#map_islands");
      }

      oceanGrid.setVisibilityIslandView(
        oceanGrid.getSettingValue("visibleIslandView")
      );
    }
  },

  createStyle() {
    if (!this.rendered) {
      $("head").append(
        $(`<style id="${this.styleDiv}">`).append(`
          .gridBorderRight {
            border-right-width: 3px;
            border-right-style: solid;
            position: absolute;
            z-index: 1;
            opacity: .5;
            width:3px;
          }
          .gridBorderBottom {
            border-bottom-width: 3px;
            border-bottom-style: solid;
            position: absolute;
            z-index: 1;
            opacity: .5;            
          }
          .gridBorder {
            border-width: 3px;
            border-style: solid;
            position: absolute;
            z-index: 1;
            opacity: .5;            
          }
          .gridTextStrategicMap {
            position: absolute;
            z-index: 1;
            text-align: center;
            min-width: 40px;
            margin: auto;
            padding: 3px;
            font-weight: normal;
            font-size: 12px;
            background-color: rgba(25, 25, 25, 0.5);
            border: 1px solid rgba(25, 25, 25, 0.7);
            border-radius: 3px;
          }
          .gridTextIslandView {
            position: absolute;
            z-index: 1;
            text-align: center;
            min-width: 80px;
            margin: auto;
            font-weight: normal;
            font-size: 24px;
            background-color: rgba(25, 25, 25, 0.5);
            border: 1px solid rgba(25, 25, 25, 0.7);
            border-radius: 3px;
          }
        `)
      );
      this.rendered = true;
    }
  },

  loadSettings() {
    this.settingsKeys.forEach((setting) => {
      const { key, default: defaultValue } = setting;
      let value = settings.loadSetting(
        `${Game.world_id}|${this.module}.${key}`,
        defaultValue
      );
      setting.value = value;
    });
  },

  getSettingValue(settingKey) {
    const setting = this.settingsKeys.find(({ key }) => key === settingKey);
    return setting ? setting.value : null;
  },

  setSettingValue(settingKey, value) {
    const setting = oceanGrid.settingsKeys.find(
      ({ key }) => key === settingKey
    );
    setting.value = value;

    settings.safeSetting(`${Game.world_id}|oceanGrid.${settingKey}`, value);
  },

  animate() {
    if (!this.rendered) {
      this.gridVisibleIslandView = [];
      this.gridVisibleStrategicMap = [];
      return;
    }
    this.gridToDraw = [];

    switch (Game.layout_mode) {
      case "strategic_map":
        this.oceanSize = 2560;
        this.activeDiv = this.strategicMapDiv;
        this.activeStyle = "gridTextStrategicMap";

        this.gridToDraw = ocean.visibleOceans.filter(
          (value) => !this.gridVisibleStrategicMap.includes(value)
        );
        this.gridToDraw.forEach((ocean) => {
          if (ocean >= 0 && ocean <= 99) {
            this.draw(ocean);
            this.gridVisibleStrategicMap.push(ocean);
          }
        });
        break;
      case "island_view":
        this.oceanSize = 12800;
        this.activeDiv = this.islandViewDiv;
        this.activeStyle = "gridTextIslandView";

        this.gridToDraw = ocean.visibleOceans.filter(
          (value) => !this.gridVisibleIslandView.includes(value)
        );
        this.gridToDraw.forEach((ocean) => {
          if (ocean >= 0 && ocean <= 99) {
            this.draw(ocean);
            this.gridVisibleIslandView.push(ocean);
          }
        });
        break;
    }
  },

  setVisibilityStrategicMap(value) {
    oceanGrid.setSettingValue("visibleStrategicMap", value);
    const displayValue = value ? "block" : "none";
    $("#" + oceanGrid.strategicMapDiv).css("display", displayValue);
  },

  setVisibilityIslandView(value) {
    oceanGrid.setSettingValue("visibleIslandView", value);
    const displayValue = value ? "block" : "none";
    $("#" + oceanGrid.islandViewDiv).css("display", displayValue);
  },

  gridColor(color) {
    if (color && color != oceanGrid.getSettingValue("gridColor")) {
      oceanGrid.setSettingValue("gridColor", color.split(" ").join(""));
    }
    $(".gridBorderRight, .gridBorderBottom, .gridBorder").css(
      "border-color",
      settings.colors[oceanGrid.getSettingValue("gridColor")]
    );
  },

  gridTextColor(color) {
    if (color && color != oceanGrid.getSettingValue("gridTextColor")) {
      oceanGrid.setSettingValue("gridTextColor", color.split(" ").join(""));
    }
    $(".gridTextStrategicMap, .gridTextIslandView").css(
      "color",
      settings.colors[oceanGrid.getSettingValue("gridTextColor")]
    );
  },

  draw(ocean) {
    const OceanX = Math.floor(ocean / 10) * this.oceanSize;
    const OceanY = (ocean % 10) * this.oceanSize;
    const gridStep = this.oceanSize / this.gridsPerOcean;
    const fragment = document.createDocumentFragment();

    for (let x = 0; x < this.gridsPerOcean - 1; x++) {
      const left = OceanX + x * gridStep;
      const top = OceanY;

      const div = document.createElement("div");
      div.className = "gridBorderRight";
      div.style.width = `${gridStep}px`;
      div.style.height = `${this.oceanSize}px`;
      div.style.left = `${left}px`;
      div.style.top = `${top}px`;
      fragment.appendChild(div);
    }

    for (let y = 0; y < this.gridsPerOcean - 1; y++) {
      const left = OceanX;
      const top = OceanY + y * gridStep;

      const div = document.createElement("div");
      div.className = "gridBorderBottom";
      div.style.width = `${this.oceanSize}px`;
      div.style.height = `${gridStep}px`;
      div.style.left = `${left}px`;
      div.style.top = `${top}px`;
      fragment.appendChild(div);
    }

    const borderDiv = document.createElement("div");
    borderDiv.className = "gridBorder";
    borderDiv.style.width = `${this.oceanSize - 3}px`;
    borderDiv.style.height = `${this.oceanSize - 3}px`;
    borderDiv.style.left = `${OceanX}px`;
    borderDiv.style.top = `${OceanY}px`;
    fragment.appendChild(borderDiv);

    for (let x = 0; x < this.gridsPerOcean; x++) {
      for (let y = 0; y < this.gridsPerOcean; y++) {
        const left = 10 + (OceanX + x * gridStep);
        const top = 10 + (OceanY + y * gridStep);
        const letter = this.letters[x];
        const number = y + 1;

        const div = document.createElement("div");
        div.className = this.activeStyle;
        div.style.left = `${left}px`;
        div.style.top = `${top}px`;
        div.textContent = `${ocean} ${letter}${number}`;
        fragment.appendChild(div);
      }
    }

    const container = document.createElement("div");
    container.className = `${this.module}_${ocean}`;
    container.appendChild(fragment);

    document.getElementById(this.activeDiv).appendChild(container);

    this.gridColor();
    this.gridTextColor();
  },
};


// Module: OceanNumbers
// Discrption: This module will display the ocean number on the strategic map and island view.
// Last Updated: 2024/11/28

// TODO: Add option for transparency of the numbers on the strategic map and island view. -> Next version

let oceanNumbers = {
  module: "oceanNumbers",
  rendered: false,
  styleDiv: `GrepoTools_oceanNumbers`,
  activeStyle: "",
  strategicMapDiv: `GrepoTools_oceanNumbers_strategic_map`,
  islandViewDiv: `GrepoTools_oceanNumbers_island_view`,
  activeDiv: "",
  oceanNumbersVisibleIslandView: [],
  oceanNumbersVisibleStrategicMap: [],
  oceanNumbersToDraw: [],
  oceanSize: "",
  settingsKeys: [
    { key: "visibleStrategicMap", value: null, default: true },
    { key: "visibleIslandView", value: null, default: true },
  ],

  init() {
    if (grepolisLoaded) {
      this.loadSettings();
      this.createDiv();
      this.createStyle();
    }
  },

  createDiv() {
    if (!this.rendered) {
      if (!$(`#${this.strategicMapDiv}`).length) {
        $(`<div id='${this.strategicMapDiv}'></div>`).insertAfter(
          "#minimap_islands_layer"
        );
      }
      oceanNumbers.setVisibilityStrategicMap(
        oceanNumbers.getSettingValue("visibleStrategicMap")
      );

      if (!$(`#${this.islandViewDiv}`).length) {
        $(`<div id='${this.islandViewDiv}'></div>`).insertAfter("#map_islands");
      }
      oceanNumbers.setVisibilityIslandView(
        oceanNumbers.getSettingValue("visibleIslandView")
      );
    }
  },

  createStyle() {
    if (!this.rendered) {
      $("head").append(
        $(`<style id="${this.styleDiv}">`).append(`
          .oceanNumbersTextStrategicMap {
            position: absolute;
            z-index: 2;
            font-weight: normal;
            font-size: 72px;
            color: rgba(255, 255, 255, 0.05);
          }
          .oceanNumbersTextIslandView {
            position: absolute;
            z-index: 2;
            font-weight: normal;
            font-size: 128px;
            color: rgba(255, 255, 255, 0.05);
          }
        `)
      );
      this.rendered = true;
    }
  },

  loadSettings() {
    this.settingsKeys.forEach((setting) => {
      const { key, default: defaultValue } = setting;
      const value = settings.loadSetting(
        `${Game.world_id}|${this.module}.${key}`,
        defaultValue
      );
      setting.value = value;
    });
  },

  getSettingValue(settingKey) {
    const setting = this.settingsKeys.find(({ key }) => key === settingKey);
    return setting ? setting.value : null;
  },

  setSettingValue(settingKey, value) {
    const setting = oceanNumbers.settingsKeys.find(
      ({ key }) => key === settingKey
    );
    setting.value = value;

    settings.safeSetting(`${Game.world_id}|oceanNumbers.${settingKey}`, value);
  },

  animate() {
    if (!this.rendered) {
      this.oceanNumbersVisibleIslandView = [];
      this.oceanNumbersVisibleStrategicMap = [];
      return;
    }
    this.oceanNumbersToDraw = [];

    switch (Game.layout_mode) {
      case "strategic_map":
        this.oceanSize = 2560;
        this.activeDiv = this.strategicMapDiv;
        this.step = 256;
        this.numbersPerOcean = 10;
        this.offset = 75;

        this.oceanNumbersToDraw = ocean.visibleOceans.filter(
          (value) => !this.oceanNumbersVisibleStrategicMap.includes(value)
        );
        this.oceanNumbersToDraw.forEach((ocean) => {
          if (ocean >= 0 && ocean <= 99) {
            this.draw(ocean);
            this.oceanNumbersVisibleStrategicMap.push(ocean);
          }
        });
        break;
      case "island_view":
        this.oceanSize = 12800;
        this.activeDiv = this.islandViewDiv;
        this.step = 512;
        this.numbersPerOcean = 25;
        this.offset = 175;

        this.oceanNumbersToDraw = ocean.visibleOceans.filter(
          (value) => !this.oceanNumbersVisibleIslandView.includes(value)
        );
        this.oceanNumbersToDraw.forEach((ocean) => {
          if (ocean >= 0 && ocean <= 99) {
            this.draw(ocean);
            this.oceanNumbersVisibleIslandView.push(ocean);
          }
        });
        break;
    }
  },

  setVisibilityStrategicMap(value) {
    oceanNumbers.setSettingValue("visibleStrategicMap", value);
    const displayValue = value ? "block" : "none";
    $("#" + oceanNumbers.strategicMapDiv).css("display", displayValue);
  },

  setVisibilityIslandView(value) {
    oceanNumbers.setSettingValue("visibleIslandView", value);
    const displayValue = value ? "block" : "none";
    $("#" + oceanNumbers.islandViewDiv).css("display", displayValue);
  },

  draw(ocean) {
    const OceanX = Math.floor(ocean / 10) * this.oceanSize;
    const OceanY = (ocean % 10) * this.oceanSize;
    const fragment = document.createDocumentFragment();

    for (let x = 0; x < this.numbersPerOcean; x++) {
      for (let y = 0; y < this.numbersPerOcean; y++) {
        const left = OceanX + (x * this.step + this.offset);
        const top = OceanY + (y * this.step + this.offset);
        const className =
          Game.layout_mode === "strategic_map"
            ? "oceanNumbersTextStrategicMap"
            : "oceanNumbersTextIslandView";

        const div = document.createElement("div");
        div.className = className;
        div.style.left = `${left}px`;
        div.style.top = `${top}px`;
        div.textContent = ocean;
        fragment.appendChild(div);
      }
    }

    const container = document.createElement("div");
    container.className = `${this.module}_${ocean}`;
    container.appendChild(fragment);

    document.getElementById(this.activeDiv).appendChild(container);
  },
};


// module script
// Discrption: this module will add the spells to the barracks and docks
// Last Updated: 2024/12/25

let spells = {
  module: "spells",
  rendered: false,
  styleDiv: `GrepoTools_spells`,

  init() {
    if (grepolisLoaded) {
      this.createStyle();
    }
  },

  createStyle() {
    if (!this.rendered) {
      $("head").append(
        $(`<style id="${this.styleDiv}">`).append(`
          #docksSpells {
            padding-top:5px
          }
          #docksSpells > .call_of_the_ocean{
            margin-left:5px
          }
          #barracksSpells {
            padding-top:5px
          }
          #barracksSpells > .spartan_training{
            margin-left:5px
          }
          #barracksSpells > .fertility_improvement{
            clear:left;margin-left:5px
          }
          .spellCounter{
            margin-top:50px;
          }
        `)
      );
      this.rendered = true;
    }
  },

  render() {
    function addSpells(containerSelector, spellsContainerId, spellsToAdd) {
      if ($(containerSelector)[0] && !$(spellsContainerId)[0]) {
        $('<div id="' + spellsContainerId.slice(1) + '"></div>').appendTo(
          $(containerSelector + " > #units")
        );
        spellsToAdd.forEach((spell) => {
          spells.addSpell(spellsContainerId.slice(1), spell.name, spell.god);
        });
      }
    }

    // Harbour window is open
    addSpells(".docks_building", "#harbourSpells", [
      { name: "call_of_the_ocean", god: "poseidon" },
    ]);

    // Barracks window is open
    addSpells(".barracks_building", "#barracksSpells", [
      { name: "spartan_training", god: "ares" },
      { name: "fertility_improvement", god: "hera" },
    ]);
  },

  isSpellActive(spell) {
    let spellsActive = MM.checkAndPublishRawModel("Town", {
      id: Game.townId,
    }).getCastedPowers();

    return spellsActive.some(
      (spellActive) => spellActive.attributes.power_id === spell
    );
  },

  getAllActiveSpells() {
    return MM.checkAndPublishRawModel("Town", {
      id: Game.townId,
    }).getCastedPowers();
  },

  getSpellCost(spell) {
    return GameData.powers[spell].favor;
  },

  getGodFavor(god) {
    return MM.checkAndPublishRawModel("PlayerGods", { id: Game.player_id }).get(
      god + "_favor"
    );
  },

  getAllGodsFavorAndProduction() {
    return MM.checkAndPublishRawModel("PlayerGods", {
      id: Game.player_id,
    }).getProductionOverview();
  },

  addSpell(divId, spell, god) {
    let _classAdd = "";

    if (spells.getGodFavor(god) - spells.getSpellCost(spell) < 0) {
      _classAdd = " disabled";
    }

    if (spells.isSpellActive(spell)) {
      _classAdd =
        " active_animation extendable animated_power_icon animated_power_icon_45x45";
    }

    $("#" + divId).append(
      $("<div/>", {
        class: "js-power-icon power_icon45x45 " + spell + " power" + _classAdd,
        "data-spell": spell,
      })
        .append(
          $("<div/>", { class: "extend_spell" })
            .append($("<div/>", { class: "gold" }))
            .append($("<div/>", { class: "amount" }))
        )
        .append($("<div/>", { class: "js-caption" }))
        .append($("<div/>", { class: `spellCounter ${god}` }))

        .on("mouseover", function (e) {
          var tooltip = {
            show_costs: true,
          };

          casted = HelperPower.createCastedPowerModel(spell, Game.townId);
          spells.getAllActiveSpells().forEach((elem) => {
            if (elem.getPowerId() === spell) {
              casted = elem;
            }
          });

          if (typeof casted.getId != "undefined") {
            (tooltip.casted_power_end_at = casted.getEndAt()),
              (tooltip.extendable = casted.isExtendable());
          }
          $(this)
            .tooltip(
              TooltipFactory.createPowerTooltip(casted.getPowerId(), tooltip)
            )
            .showTooltip(e);
        })

        .on("click", function (e) {
          casted = HelperPower.createCastedPowerModel(spell, Game.townId);
          spells.getAllActiveSpells().forEach((elem) => {
            if (elem.getPowerId() === spell) {
              casted = elem;
            }
          });

          let activeWindow;
          $.each(Layout.wnd.getAllOpen(), function (ind, elem) {
            activeWindow = elem;
          });

          CM.unregister(
            { main: activeWindow.getContext().main, sub: "casted_powers" },
            "harbourSpells" + casted.getId()
          );

          var _btn = CM.register(
              { main: activeWindow.getContext().main, sub: "casted_powers" },
              "#harbourSpells" + casted.getId(),
              activeWindow
                .getJQElement()
                .find($("#harbourSpells .new_ui_power_icon .gold"))
                .button()
            ),
            power = HelperPower.createCastedPowerModel(spell, Game.townId);
          if (casted.getId() == undefined) {
            power.cast();
          } else {
            if (casted.isExtendable()) {
              BuyForGoldWindowFactory.openExtendPowerForGoldWindow(
                _btn,
                casted
              );
              $(this).addClass(_classAdd); // -> Check if this line is necessary
            }
          }
        })
    );
  },
};


// Module: nightMode
// Discrption: This module will toggle the night mode on and off.
// Last Updated: 2024/12/29

let nightMode = {
  module: "nightMode",
  rendered: false,
  styleDiv: `GrepoTools_nightMode`,
  strategicMapDiv: `GrepoTools_nightMode_strategic_map`,
  nightModeActive: null,

  init() {
    if (grepolisLoaded) {
      this.cityViewElement = $(".ui_city_overview");
      this.islandViewElement = $(".map");
      this.strategicViewElement = $("#minimap_canvas");

      this.nightModeActive = Game.night_mode;

      this.createDiv();
      this.createStyle();
      if (Game.ui_scale.enlarged_ui_size) {
        this.addNightModeButton();
      } else {
        this.addNightModeMenu();
      }
      this.IntervalCityView = setInterval(this.intervalCityView, 100);
    }
  },

  createStyle() {
    if (!this.rendered) {
      $("head").append(
        $(`<style id="${this.styleDiv}">`).append(`
          .nightMode {
            position: absolute;
            left: 0;
            top: 0;
            width: 25600px;
            height: 25600px;
            background-color: #07142d;
            opacity: 0.7;
            z-index:2;
          }
          .nightModeButton{
            position: absolute;
             z-index:2;
          }
          .nightModeButtonIcon{ { 
            margin:5px 0px 0px 4px;
            width:21px; height:21px; 
          }
        `)
      );
      this.rendered = true;
    }
  },

  createDiv() {
    if (!this.rendered) {
      if (!$(`#${this.strategicMapDiv}`).length) {
        $(
          `<div id='${this.strategicMapDiv}'><div class="nightMode"></div></div>`
        ).insertAfter("#minimap_islands_layer");
        if (!this.nightModeActive) {
          $(`#${this.strategicMapDiv}`).css("display", "none");
        }
      }
    }
  },

  checkNightMode() {
    $(nightMode.islandViewElement).hasClass("night")
      ? (nightMode.nightModeActive = true)
      : (nightMode.nightModeActive = false);
    Game.night_mode = nightMode.nightModeActive;
  },

  intervalCityView() {
    if ($(nightMode.strategicViewElement).hasClass("night")) {
      nightMode.strategicViewElement.removeClass("night");
    }

    if (nightMode.nightModeActive) {
      if (!$(nightMode.cityViewElement).hasClass("night")) {
        nightMode.cityViewElement.addClass("night");
      }
    } else {
      if ($(nightMode.cityViewElement).hasClass("night")) {
        nightMode.cityViewElement.removeClass("night");
      }
    }
  },

  toggleNightMode() {
    if (nightMode.nightModeActive) {
      // nightmode is active -> turn off
      if ($(nightMode.cityViewElement).hasClass("night")) {
        nightMode.cityViewElement.removeClass("night");
      }
      if ($(nightMode.islandViewElement).hasClass("night")) {
        nightMode.islandViewElement.removeClass("night");
      }
      if ($(nightMode.strategicViewElement).hasClass("night")) {
        nightMode.strategicViewElement.removeClass("night");
      }
      $(`#${nightMode.strategicMapDiv}`).css("display", "none");
    } else {
      // nightmode is not active -> turn on
      if (!$(nightMode.cityViewElement).hasClass("night")) {
        nightMode.cityViewElement.addClass("night");
      }
      if (!$(nightMode.islandViewElement).hasClass("night")) {
        nightMode.islandViewElement.addClass("night");
      }
      $(`#${nightMode.strategicMapDiv}`).css("display", "block");
    }

    nightMode.checkNightMode();
  },

  // Old Small Ui
  addNightModeMenu() {
    let imgSrc = this.nightModeActive
      ? "https://www.grepotools.nl/grepotools/images/moon.png"
      : "https://www.grepotools.nl/grepotools/images/sun.png";

    let nightModeMenuHTML = `
      <li id="nightMode_button" class="nightModeButton" style="margin-bottom:3px; margin-top: -1px;">
          <span class="content_wrapper">
              <span class="button_wrapper">
                  <span class="button">
                      <span class="icon nightModeButtonIconImage"><img src="${imgSrc}"></span>
                  </span>
              </span>
              <span class="name_wrapper">
                  <span class="name">GrepoTools</span>
              </span>
          </span>
      </li>
    `;

    $(nightModeMenuHTML).prependTo(".nui_main_menu ul");
    nightMode.updateMenu();

    $("#nightMode_button").on("click", function () {
      nightMode.toggleNightMode();
      nightMode.updateMenu();
    });
  },

  // Old Small Ui
  updateMenu() {
    if (nightMode.nightModeActive) {
      $(".nightModeButtonIconImage img").attr(
        "src",
        "https://www.grepotools.nl/grepotools/images/moon.png"
      );
      $(".nightModeButtonIconImage img").css({
        "margin-left": "-1px",
        "margin-top": "0px",
        width: "18px",
        height: "18px",
      });
      $("#nightMode_button .name").html(
        `${language[language.settingActiveLanguage].dayMode}`
      );
    } else {
      $(".nightModeButtonIconImage img").attr(
        "src",
        "https://www.grepotools.nl/grepotools/images/sun.png"
      );
      $(".nightModeButtonIconImage img").css({
        "margin-left": "-3px",
        "margin-top": "1px",
        width: "18px",
        height: "18px",
      });
      $("#nightMode_button .name").html(
        `${language[language.settingActiveLanguage].nightMode}`
      );
    }
  },

  // New Big Ui
  addNightModeButton() {
    let imgSrc = this.nightModeActive
      ? "https://www.grepotools.nl/grepotools/images/moon.png"
      : "https://www.grepotools.nl/grepotools/images/sun.png";

    const nightModeButtonHTML = `
      <div class="btn_settings circle_button nightModeButton GrepoToolsSettingsButton">
        <div class="nightModeButtonIcon">
          <img class="nightModeButtonIconImage" src="${imgSrc}">
        </div>
      </div>
      `;

    $(nightModeButtonHTML).appendTo("body");

    $(".nightModeButton").css("top", "168px");
    $(".nightModeButton").css("right", "85px");
    nightMode.updateButton();

    $(".nightModeButton").on("click", function () {
      nightMode.toggleNightMode();
      nightMode.updateButton();
    });
  },

  // New Big Ui
  updateButton() {
    if (nightMode.nightModeActive) {
      $(".nightModeButtonIconImage").attr(
        "src",
        "https://www.grepotools.nl/grepotools/images/moon.png"
      );
      $(".nightModeButtonIconImage").css({
        "margin-left": "1px",
        "margin-top": "7px",
        width: "18px",
        height: "18px",
      });
    } else {
      $(".nightModeButtonIconImage").attr(
        "src",
        "https://www.grepotools.nl/grepotools/images/sun.png"
      );
      $(".nightModeButtonIconImage").css({
        "margin-left": "0px",
        "margin-top": "8px",
        width: "18px",
        height: "18px",
      });
    }
  },
};


// Module: otherScripts
// Discrption: This module handles the interaction with other scripts and affects them based on the chosen settings.
// Last Updated: 2025/01/05

let otherScripts = {
  module: "otherScripts",
  diotoolsActive: false,
  grcrtActive: false,
  moleholeActive: false,
  mapenhancerActive: false,
  grepotdataActive: false,
  settingsKeys: [
    { key: "diotoolsMessageButton", value: null, default: true },
    { key: "diotoolsBbcodeButton", value: null, default: true },
    { key: "diotoolsCityOverviewHero", value: null, default: true },
    { key: "grcrtMessageButton", value: null, default: true },
    { key: "grcrtBbcodeButton", value: null, default: true },
    { key: "grcrtCityOverviewHero", value: null, default: true },
    { key: "grcrtHideSpells", value: null, default: true },
    { key: "moleholeMessageButton", value: null, default: true },
    { key: "moleholeBbcodeButton", value: null, default: true },
  ],

  init() {
    this.loadSettings();
    this.IntervalGrcrt = setInterval(this.intervalGrcrt, 100);
    this.IntervalDiotools = setInterval(this.intervalDiotools, 100);
  },

  loadSettings() {
    this.settingsKeys.forEach((setting) => {
      const { key, default: defaultValue } = setting;
      const value = settings.loadSetting(
        `${Game.world_id}|${this.module}.${key}`,
        defaultValue
      );
      setting.value = value;
    });
  },

  getSettingValue(settingKey) {
    const setting = this.settingsKeys.find(({ key }) => key === settingKey);
    return setting ? setting.value : null;
  },

  setSettingValue(settingKey, value) {
    const setting = otherScripts.settingsKeys.find(
      ({ key }) => key === settingKey
    );
    setting.value = value;

    settings.safeSetting(`${Game.world_id}|otherScripts.${settingKey}`, value);
  },

  checkActiveScripts() {
    this.diotoolsActive = Boolean($("#diotools").get(0));
    this.grcrtActive = Boolean($(".grcrt").get(0));
    this.moleholeActive = Boolean($(".MoleHole").get(0));
    this.mapenhancerActive = Boolean($("#GMESetupLink").get(0));
    this.grepotdataActive = Boolean($(".gd_settings_icon").get(0));
  },

  setDiotoolsMessageButton(value) {
    otherScripts.setSettingValue("diotoolsMessageButton", value);
  },

  setGrcrtMessageButton(value) {
    otherScripts.setSettingValue("grcrtMessageButton", value);
  },

  setMoleholeMessageButton(value) {
    otherScripts.setSettingValue("moleholeMessageButton", value);
  },

  setDiotoolsBbcodeButton(value) {
    otherScripts.setSettingValue("diotoolsBbcodeButton", value);
  },

  setGrcrtBbcodeButton(value) {
    otherScripts.setSettingValue("grcrtBbcodeButton", value);
  },

  setMoleholeBbcodeButton(value) {
    otherScripts.setSettingValue("moleholeBbcodeButton", value);
  },

  setGrcrtHideSpells(value) {
    otherScripts.setSettingValue("grcrtHideSpells", value);
  },

  setGrcrtCityOverviewHero(value) {
    if ($(".town_group").get(0)) {
      $(".town_name").click();
    }
    otherScripts.setSettingValue("grcrtCityOverviewHero", value);
  },

  setDiotoolsCityOverviewHero(value) {
    if ($(".town_group").get(0)) {
      $(".town_name").click();
    }
    otherScripts.setSettingValue("diotoolsCityOverviewHero", value);
  },

  toggleDisplay(selector, condition) {
    $(selector).css("display", condition ? "none" : "block");
  },

  intervalGrcrt() {
    if (!Boolean($(".grcrt").get(0))) {
      return;
    }

    // Hide spells
    otherScripts.toggleDisplay(
      ".grcrt_power",
      otherScripts.getSettingValue("grcrtHideSpells")
    );

    // Hide or show the hero icon
    otherScripts.toggleDisplay(
      ".grcrt_hero",
      otherScripts.getSettingValue("grcrtCityOverviewHero")
    );

    // Hide or show the ocean numbers
    otherScripts.toggleDisplay(
      ".RepConvON",
      oceanNumbers.getSettingValue("visibleIslandView")
    );
  },

  intervalDiotools() {
    if (!Boolean($("#diotools").get(0))) {
      return;
    }

    // Hide or show the hero icon
    if (otherScripts.getSettingValue("diotoolsCityOverviewHero")) {
      $(".group_towns .hero_icon.hero25x25").css("display", "none");
    } else {
      $(".hero_icon.hero25x25").css("display", "inline-block");
    }

    // Hide or show the ocean numbers
    otherScripts.toggleDisplay(
      "#dio_oceanNumbers",
      oceanNumbers.getSettingValue("visibleIslandView")
    );
  },
};


// Module: settingsMenu
// Description: This is the settings menu module.
// Last Updated: 2025/01/05

let settingsMenu = {
  rendered: false,
  styleDiv: `GrepoTools_settingsMenu`,
  listAction: true,

  init() {
    if (grepolisLoaded) {
      this.settingsMenu("GrepoTools_settingsMenu");
      this.createStyle();
      this.addSettingsButtonToGodsArea();
    }
  },

  createStyle() {
    if (!this.rendered) {
      $("head").append(
        $(`<style id="${this.styleDiv}">`).append(`
          #menuScreen { 
            height:500px;
            background-color:"#FFE3A1"; 
          }
          #menuScreen .settings-sub-menu{
            right:-6px;
            position: absolute;
            top: -4px;
            bottom: 0;
            left: 217px;
            padding: 0 10px;
            overflow: auto;
          }
          #menuScreen .checkbox_new{
            display:block;
            margin-bottom:3px;
          }
          label + .dropdown{
            margin-left:10px;
            margin-bottom: 5px;
          }
          .dropdown .caption{
            padding-left: 5px !important;
            padding-right: 20px !important;
          }
          .grepotools.settings-sub-menu{
            background:url(https://www.grepotools.nl/grepotools/images/settingsBackGround.png) no-repeat right 20px bottom;
          }
          .infoText{
            margin-bottom:10px;
            margin-top:10px;
            font-weight: bold
          }
          .group{
            margin-top:10px;
            margin-left:10px
          }
          #settings-index-menu b,#settings-index-menu li{
            margin-left:10px
          }
          img#version { 
            position:relative ; margin-top: 20px
          }
          .settings_godsarea_icon { 
            margin:5px 0px 0px 4px;
            width:23px; height:23px; 
          }
          #gt_menu {          
            font: 13px Verdana,Arial,Helvetica,sans-serif;
            text-align: left;    
            list-style: none;    
            margin: 0 auto;    
            height: 22px;    
            z-index: 15;    
            position: absolute;    
            width: auto;    
            border: 2px solid darkgreen;
            background: #2B241A;    
            padding: 1px 1px 0px 1px;    
            right: auto;    
            border-top-left-radius: 5px;    
            border-top-right-radius: 5px;    
            border-bottom: 0px; 
          }
          #menuVersionInfo {
            position:relative;
            bottom:90px;
            left:10px
          }
          .settings_godsarea{
            position: absolute
          }
          .grepoToolsSettingsMenu{
            width: 220px;
            background: url(https://gpnl.innogamescdn.com/images/game/border/border_v.png) repeat-y right 0;
            marginTop: -12px;
            height: 508px;
          }
          .grepoToolsSettingsMenu b {
            margin-top: 12px;
            display: block;
          }
          .grepoToolsSettingsMenu a,
          .grepoToolsSettingsMenu a:active,
          .grepoToolsSettingsMenu a:link,
          .grepoToolsSettingsMenu a:visited {
            font-weight: 400;
          }
          .grepoToolsSettingsMenu a.selected {
            text-decoration: underline;
          }
          .grepoToolsSettingsMenu ul {
            color: #8a401f;
            margin: 3px 0 0 10px;
          }
        `)
      );
      this.rendered = true;
    }
  },

  createInfoText(infoText) {
    return $("<div/>", { class: "infoText" }).append(infoText);
  },

  createCheckbox(id, caption, setting = false) {
    const checkbox = $("<div/>", { id, class: "checkbox_new large" })
      .append($("<div/>", { class: "cbx_icon" }))
      .append($("<div/>", { class: "cbx_caption" }).text(caption));

    if (setting) {
      checkbox.addClass("checked");
    }

    return checkbox;
  },

  toggleCheckbox(checkbox) {
    const setting = checkbox.hasClass("checked");
    checkbox.toggleClass("checked", !setting);
    return !setting;
  },

  createButton(id, caption, disabled = false, functionToCall) {
    const button = $("<div/>", {
      id,
      class: "button_new",
      style: "margin-top:10px",
    })
      .append($("<div/>", { class: "left" }))
      .append($("<div/>", { class: "right" }))
      .append(
        $("<div/>", { class: "caption js-caption" })
          .append($("<span/>").text(caption))
          .append($("<div/>", { class: "effect js-effect" }))
      );

    if (disabled) {
      button.addClass("disabled");
    }

    button.on("click", function () {
      if (
        !button.hasClass("disabled") &&
        typeof functionToCall === "function"
      ) {
        functionToCall();
      }
    });

    return button;
  },

  statusButton(buttonId, value) {
    const button = $(`#${buttonId}`);
    if (value) {
      button.removeClass("disabled");
    } else {
      button.addClass("disabled");
    }
  },

  createDropdown(id, label, value, options = "") {
    return $("<div/>")
      .append($("<label/>", { for: id }).text(label))
      .append(
        $("<div/>", { id: id, class: "dropdown default" }).dropdown({
          list_pos: "left",
          value: value,
          options: options,
        })
      );
  },

  createMenuContent(tab) {
    let url = "";

    switch (tab) {
      case 0:
        url =
          language.settingActiveLanguage === "nl"
            ? "https://www.grepotools.nl/gt_over_nl/"
            : "https://www.grepotools.nl/gt_over_en/";

        $("#menuScreen").append(`
        <iframe src="${url}" style="padding:0;margin:0;width: 100%; height: 100%; border: 0px; float: left;"></iframe>
      `);
        break;
      case 1:
        url =
          language.settingActiveLanguage === "nl"
            ? "https://www.grepotools.nl/gt_veranderingen_nl/"
            : "https://www.grepotools.nl/gt_veranderingen_en/";

        $("#menuScreen").append(`
        <iframe src="${url}" style="padding:0;margin:0;width: 100%; height: 100%; border: 0px; float: left;"></iframe>
      `);
        break;
      case 2:
        $(document).ready(function () {
          $("#settings-index-menu a").click(function (event) {
            event.preventDefault();
            $('[id^="indexMenu"]').removeClass("selected");
            $(this).addClass("selected");

            const selectedId = $(this).attr("id");
            const newId = selectedId.replace("indexMenu-", "submenu-");

            $('[id^="submenu"]').css("display", "none");
            $("#" + newId).css("display", "block");
          });
        });

        // indexmenu
        $("#menuScreen").append(`
          <div id="settings-index-menu" class="grepoToolsSettingsMenu"></div>
        `);

        // submenu
        $("#menuScreen").append(
          `<div id="settings-sub-menu" class="grepotools settings-sub-menu"></div>`
        );
        $("#menuScreen").append(
          `<div id="menuVersionInfo">
        ${language[language.settingActiveLanguage].script}
        <br>
        ${language[language.settingActiveLanguage].version}: 
        ${GM_info.script.version} ${version.release}
         <br><br>
         <a href="https://discord.com/invite/K4jV7hFSRu" target="_blank">GrepoTools Discord</a>
      </div>`
        );
        this.createIndexMenu();
        this.createSubMenu();
        this.controlActions();
        this.disableOptions();
        break;
      case 3:
        url =
          language.settingActiveLanguage === "nl"
            ? "https://www.grepotools.nl/gt_donatie_nl/"
            : "https://www.grepotools.nl/en/gt_donate_en/";

        $("#menuScreen").append(`
        <iframe src="${url}" style="padding:0;margin:0;width: 100%; height: 100%; border: 0px; float: left;"></iframe>
      `);
        break;
    }
  },

  createIndexMenu() {
    const menuItems = [
      {
        gameHeaderText: language[language.settingActiveLanguage].grepoTools,
        options: [
          {
            id: "indexMenu-oceannumbers",
            caption: language[language.settingActiveLanguage].oceanNumbers,
          },
          {
            id: "indexMenu-grid",
            caption: language[language.settingActiveLanguage].oceanGrid,
          },
          {
            id: "indexMenu-coordinates",
            caption: language[language.settingActiveLanguage].coordinates,
          },
          {
            id: "indexMenu-islandNumbersTags",
            caption: language[language.settingActiveLanguage].islandNumbersTags,
          },
          {
            id: "indexMenu-mapTags",
            caption: language[language.settingActiveLanguage].mapTags,
          },
          {
            id: "indexMenu-general",
            caption: `${
              language[language.settingActiveLanguage].general
            } ${language[
              language.settingActiveLanguage
            ].settings.toLowerCase()}`,
          },
        ],
      },
      {
        gameHeaderText: language[language.settingActiveLanguage].otherScripts,
        options: [
          {
            id: "indexMenu-GRCRT",
            caption: "GrcrTools",
          },
          {
            id: "indexMenu-DioTools",
            caption: "DioTools",
          },
          {
            id: "indexMenu-MoleHole",
            caption: "MoleHole",
          },
        ],
      },
    ];

    const settingMenuDiv = $("#settings-index-menu");

    menuItems.forEach((item) => {
      const header = $("<b>").text(item.gameHeaderText);
      const list = $("<ul>");

      item.options.forEach((option) => {
        const listItem = $("<li>").addClass("");
        const link = $("<a>")
          .addClass("settings-link")
          .attr("id", option.id)
          .attr("href", "#")
          .text(option.caption);

        listItem.append(link);
        list.append(listItem);
      });

      settingMenuDiv.append(header).append(list);
    });
  },

  createSubMenu() {
    const subMenuItems = [
      {
        sectionId: "submenu-oceannumbers",
        gameHeaderText: language[language.settingActiveLanguage].oceanNumbers,
        display: "block",
        options: [
          {
            type: "infoText",
            caption: `${
              language[language.settingActiveLanguage].strategicMap
            } ${language[
              language.settingActiveLanguage
            ].settings.toLowerCase()}`,
          },
          {
            type: "checkBox",
            caption: `${
              language[language.settingActiveLanguage].show
            } ${language[
              language.settingActiveLanguage
            ].oceanNumbers.toLowerCase()}`,
            id: "settingOceanNumbersStrategicMap",
            setting: oceanNumbers.getSettingValue("visibleStrategicMap"),
            functionToCall: oceanNumbers.setVisibilityStrategicMap,
          },
          {
            type: "infoText",
            caption: `${
              language[language.settingActiveLanguage].islandView
            } ${language[
              language.settingActiveLanguage
            ].settings.toLowerCase()}`,
          },
          {
            type: "checkBox",
            caption: `${
              language[language.settingActiveLanguage].show
            } ${language[
              language.settingActiveLanguage
            ].oceanNumbers.toLowerCase()}`,
            id: "settingOceanNumbersIslandView",
            setting: oceanNumbers.getSettingValue("visibleIslandView"),
            functionToCall: oceanNumbers.setVisibilityIslandView,
          },
        ],
      },
      {
        sectionId: "submenu-grid",
        gameHeaderText: language[language.settingActiveLanguage].oceanGrid,
        display: "none",
        options: [
          {
            type: "infoText",
            caption: `${
              language[language.settingActiveLanguage].strategicMap
            } ${language[
              language.settingActiveLanguage
            ].settings.toLowerCase()}`,
          },
          {
            type: "checkBox",
            caption: `${
              language[language.settingActiveLanguage].show
            } ${language[
              language.settingActiveLanguage
            ].oceanGrid.toLowerCase()}`,
            id: "settingOceanGridStrategicMap",
            setting: oceanGrid.getSettingValue("visibleStrategicMap"),
            functionToCall: oceanGrid.setVisibilityStrategicMap,
          },
          {
            type: "infoText",
            caption: `${
              language[language.settingActiveLanguage].islandView
            } ${language[
              language.settingActiveLanguage
            ].settings.toLowerCase()}`,
          },
          {
            type: "checkBox",
            caption: `${
              language[language.settingActiveLanguage].show
            } ${language[
              language.settingActiveLanguage
            ].oceanGrid.toLowerCase()}`,
            id: "settingOceanGridIslandView",
            setting: oceanGrid.getSettingValue("visibleIslandView"),
            functionToCall: oceanGrid.setVisibilityIslandView,
          },
          {
            type: "infoText",
            caption: `${
              language[language.settingActiveLanguage].color
            } ${language[
              language.settingActiveLanguage
            ].settings.toLowerCase()}`,
          },
          {
            type: "dropDown",
            caption: `${language[language.settingActiveLanguage].oceanGrid} 
            ${language[language.settingActiveLanguage].text.toLowerCase()} 
            ${language[language.settingActiveLanguage].color.toLowerCase()}`,
            id: "settingOceanGridTextColor",
            setting: oceanGrid.getSettingValue("gridTextColor"),
            options: settingsMenu.selectColorOptions(),
          },
          {
            type: "dropDown",
            caption: `${language[language.settingActiveLanguage].oceanGrid} 
            ${language[language.settingActiveLanguage].color.toLowerCase()}`,
            id: "settingOceanGridColor",
            setting: oceanGrid.getSettingValue("gridColor"),
            options: settingsMenu.selectColorOptions(),
          },
        ],
      },
      {
        sectionId: "submenu-coordinates",
        gameHeaderText: language[language.settingActiveLanguage].coordinates,
        display: "none",
        options: [
          {
            type: "infoText",
            caption: `${
              language[language.settingActiveLanguage].strategicMap
            } ${language[
              language.settingActiveLanguage
            ].settings.toLowerCase()}`,
          },
          {
            type: "checkBox",
            caption: `${
              language[language.settingActiveLanguage].show
            } ${language[
              language.settingActiveLanguage
            ].coordinates.toLowerCase()} ${language[
              language.settingActiveLanguage
            ].grid.toLowerCase()}`,
            id: "settingCoordinatesGridStrategicMap",
            setting: coordinatesGrid.getSettingValue("visibleStrategicMap"),
            functionToCall: coordinatesGrid.setVisibilityStrategicMap,
          },
          {
            type: "infoText",
            caption: `${
              language[language.settingActiveLanguage].islandView
            } ${language[
              language.settingActiveLanguage
            ].settings.toLowerCase()}`,
          },
          {
            type: "checkBox",
            caption: `${
              language[language.settingActiveLanguage].show
            } ${language[
              language.settingActiveLanguage
            ].coordinates.toLowerCase()} ${language[
              language.settingActiveLanguage
            ].grid.toLowerCase()}`,
            id: "settingCoordinatesGridIslandView",
            setting: coordinatesGrid.getSettingValue("visibleIslandView"),
            functionToCall: coordinatesGrid.setVisibilityIslandView,
          },
          {
            type: "checkBox",
            caption: `${
              language[language.settingActiveLanguage].show
            } ${language[
              language.settingActiveLanguage
            ].coordinates.toLowerCase()} (X/Y)`,
            id: "settingCoordinatesIslandView",
            setting: coordinates.getSettingValue("visibleIslandView"),
            functionToCall: coordinates.setVisibilityIslandView,
          },
          {
            type: "checkBox",
            caption: `${
              language[language.settingActiveLanguage].update
            } ${language[
              language.settingActiveLanguage
            ].coordinates.toLowerCase()} ${language[
              language.settingActiveLanguage
            ].whileScrolling.toLowerCase()} (X/Y)`,
            id: "settingCoordinatesUpdateXYScrolling",
            setting: coordinates.getSettingValue("updateScrolling"),
            functionToCall: coordinates.setUpdateScrolling,
          },
        ],
      },
      {
        sectionId: "submenu-islandNumbersTags",
        gameHeaderText:
          language[language.settingActiveLanguage].islandNumbersTags,
        display: "none",
        options: [
          {
            type: "infoText",
            caption: `${
              language[language.settingActiveLanguage].strategicMap
            } ${language[
              language.settingActiveLanguage
            ].settings.toLowerCase()}`,
          },
          {
            type: "checkBox",
            caption: `${
              language[language.settingActiveLanguage].show
            } ${language[
              language.settingActiveLanguage
            ].farmerVillageIslandNumbers.toLowerCase()}`,
            id: "settingFarmerVillageIslandNumbersStrategicMap",
            setting: islandNumbers.getSettingValue(
              "visibleFarmingStrategicMap"
            ),
            functionToCall: islandNumbers.setVisibilityFarmingStrategicMap,
          },
          {
            type: "checkBox",
            caption: `${
              language[language.settingActiveLanguage].show
            } ${language[
              language.settingActiveLanguage
            ].farmerVillageIslandTags.toLowerCase()}`,
            id: "settingFarmerVillageIslandTagsStrategicMap",
            setting: islandNumbers.getSettingValue(
              "visibleFarmingTagsStrategicMap"
            ),
            functionToCall: islandNumbers.setVisibilityFarmingTagsStrategicMap,
          },
          {
            type: "checkBox",
            caption: `${
              language[language.settingActiveLanguage].show
            } ${language[
              language.settingActiveLanguage
            ].rockIslandNumbers.toLowerCase()}`,
            id: "settingRockIslandNumbersStrategicMap",
            setting: islandNumbers.getSettingValue("visibleRockStrategicMap"),
            functionToCall: islandNumbers.setVisibilityRockStrategicMap,
          },
          {
            type: "infoText",
            caption: `${
              language[language.settingActiveLanguage].islandView
            } ${language[
              language.settingActiveLanguage
            ].settings.toLowerCase()}`,
          },
          {
            type: "checkBox",
            caption: `${
              language[language.settingActiveLanguage].show
            } ${language[
              language.settingActiveLanguage
            ].farmerVillageIslandNumbers.toLowerCase()}`,
            id: "settingFarmerVillageIslandNumbersIslandView",
            setting: islandNumbers.getSettingValue("visibleFarmingIslandView"),
            functionToCall: islandNumbers.setVisibilityFarmingIslandView,
          },
          {
            type: "checkBox",
            caption: `${
              language[language.settingActiveLanguage].show
            } ${language[
              language.settingActiveLanguage
            ].farmerVillageIslandTags.toLowerCase()}`,
            id: "settingFarmerVillageIslandTagsIslandView",
            setting: islandNumbers.getSettingValue(
              "visibleFarmingTagsIslandView"
            ),
            functionToCall: islandNumbers.setVisibilityFarmingTagsIslandView,
          },
          {
            type: "checkBox",
            caption: `${
              language[language.settingActiveLanguage].show
            } ${language[
              language.settingActiveLanguage
            ].rockIslandNumbers.toLowerCase()}`,
            id: "settingRockIslandNumbersIslandView",
            setting: islandNumbers.getSettingValue("visibleRockIslandView"),
            functionToCall: islandNumbers.setVisibilityRockIslandView,
          },
          {
            type: "infoText",
            caption: `${
              language[language.settingActiveLanguage].general
            } ${language[
              language.settingActiveLanguage
            ].and.toLowerCase()} ${language[
              language.settingActiveLanguage
            ].color.toLowerCase()} ${language[
              language.settingActiveLanguage
            ].settings.toLowerCase()}`,
          },
          {
            type: "checkBox",
            caption: `${
              language[language.settingActiveLanguage].show
            } ${language[
              language.settingActiveLanguage
            ].islandLinkIslandInfo.toLowerCase()}`,
            id: "settingIslandLinkIslandInfo",
            setting: islandNumbers.getSettingValue("link"),
            functionToCall: islandNumbers.setLink,
          },
          {
            type: "dropDown",
            caption: `${
              language[language.settingActiveLanguage]
                .farmerIslandNumbersTextColor
            }`,
            id: "islandNumbersFarmingTextColor",
            setting: islandNumbers.getSettingValue("farmingTextColor"),
            options: settingsMenu.selectColorOptions(),
          },
          {
            type: "dropDown",
            caption: `${
              language[language.settingActiveLanguage]
                .rockIslandNumbersTextColor
            }`,
            id: "islandNumbersRockTextColor",
            setting: islandNumbers.getSettingValue("rockTextColor"),
            options: settingsMenu.selectColorOptions(),
          },
        ],
      },
      {
        sectionId: "submenu-mapTags",
        gameHeaderText: language[language.settingActiveLanguage].mapTags,
        display: "none",
        options: [
          {
            type: "checkBox",
            caption: `${
              language[language.settingActiveLanguage].show
            } ${language[
              language.settingActiveLanguage
            ].allianceName.toLowerCase()}`,
            id: "settingAllianceName",
            setting: mapTags.getSettingValue("settingAllianceName"),
            functionToCall: mapTags.setAllianceName,
          },
          {
            type: "checkBox",
            caption: `${
              language[language.settingActiveLanguage].show
            } ${language[
              language.settingActiveLanguage
            ].playerName.toLowerCase()}`,
            id: "settingPlayerName",
            setting: mapTags.getSettingValue("settingPlayerName"),
            functionToCall: mapTags.setPlayerName,
          },
          {
            type: "checkBox",
            caption: `${
              language[language.settingActiveLanguage].show
            } ${language[
              language.settingActiveLanguage
            ].townName.toLowerCase()}`,
            id: "settingTownName",
            setting: mapTags.getSettingValue("settingTownName"),
            functionToCall: mapTags.setTownName,
          },
          {
            type: "checkBox",
            caption: `${
              language[language.settingActiveLanguage].show
            } ${language[
              language.settingActiveLanguage
            ].townPoints.toLowerCase()}`,
            id: "settingTownPoints",
            setting: mapTags.getSettingValue("settingTownPoints"),
            functionToCall: mapTags.setTownPoints,
          },
          {
            type: "checkBox",
            caption: `${
              language[language.settingActiveLanguage].show
            } ${language[
              language.settingActiveLanguage
            ].inactiveTimePlayer.toLowerCase()}`,
            id: "settingInactiveTimePlayer",
            setting: mapTags.getSettingValue("settingInactiveTimePlayer"),
            functionToCall: mapTags.setInactiveTimePlayer,
          },
          {
            type: "checkBox",
            caption: `${
              language[language.settingActiveLanguage].show
            } ${language[language.settingActiveLanguage].noWrap.toLowerCase()}`,
            id: "settingNoWrap",
            setting: mapTags.getSettingValue("settingNoWrap"),
            functionToCall: mapTags.setNoWrap,
          },
        ],
      },
      {
        sectionId: "submenu-general",
        gameHeaderText: `${
          language[language.settingActiveLanguage].general
        } ${language[language.settingActiveLanguage].settings.toLowerCase()}`,
        display: "none",
        options: [
          {
            type: "infoText",
            caption: `${
              language[language.settingActiveLanguage].general
            } ${language[
              language.settingActiveLanguage
            ].settings.toLowerCase()}`,
          },
          {
            type: "checkBox",
            caption:
              language[language.settingActiveLanguage].attackNotification,
            id: "attackNotification",
            setting: attackNotification.getSettingValue("attackNotification"),
            functionToCall: attackNotification.setVisibilityAttackNotification,
          },
          {
            type: "checkBox",
            caption: language[language.settingActiveLanguage].joinBetaTesting,
            id: "attackNotification",
            setting: version.getSettingValue("joinBetaProgram"),
            functionToCall: version.setJoinBetaProgram,
          },
          {
            type: "infoText",
            caption: `${
              language[language.settingActiveLanguage].language
            } ${language[
              language.settingActiveLanguage
            ].settings.toLowerCase()}`,
          },
          {
            type: "dropDown",
            caption: `${language[language.settingActiveLanguage].language}`,
            id: "languageID",
            setting: language.settingActiveLanguage,
            options: settingsMenu.selectLanguageOpties(),
          },
          {
            type: "button",
            caption: language[language.settingActiveLanguage].safeAndReload,
            id: "saveAndReload",
            disabled: true,
            functionToCall: language.setActiveLanguage,
          },
        ],
      },
      {
        sectionId: "submenu-GRCRT",
        gameHeaderText: `GRCRT ${language[
          language.settingActiveLanguage
        ].settings.toLowerCase()} `,
        display: "none",
        options: [
          {
            type: "checkBox",
            caption: `${
              language[language.settingActiveLanguage].hide
            } bbcode ${language[
              language.settingActiveLanguage
            ].button.toLowerCase()} (${
              language[language.settingActiveLanguage].alliance
            } ${language[
              language.settingActiveLanguage
            ].and.toLowerCase()} ${language[
              language.settingActiveLanguage
            ].islandInformationWindow.toLowerCase()})`,
            id: "settingGrcrtBbcodeButton",
            setting: otherScripts.getSettingValue("grcrtBbcodeButton"),
            functionToCall: otherScripts.setGrcrtBbcodeButton,
          },
          {
            type: "checkBox",
            caption: `${
              language[language.settingActiveLanguage].hide
            } ${language[
              language.settingActiveLanguage
            ].heroIcon.toLowerCase()}`,
            id: "settingGrcrtCityOverviewHero",
            setting: otherScripts.getSettingValue("grcrtCityOverviewHero"),
            functionToCall: otherScripts.setGrcrtCityOverviewHero,
          },
          {
            type: "checkBox",
            caption: `${
              language[language.settingActiveLanguage].hide
            } ${language[
              language.settingActiveLanguage
            ].spellsHarborBarracks.toLowerCase()}`,
            id: "settingGrcrtHideSpells",
            setting: otherScripts.getSettingValue("grcrtHideSpells"),
            functionToCall: otherScripts.setGrcrtHideSpells,
          },
        ],
      },
      {
        sectionId: "submenu-DioTools",
        gameHeaderText: `DioTools ${language[
          language.settingActiveLanguage
        ].settings.toLowerCase()} `,
        display: "none",
        options: [
          {
            type: "checkBox",
            caption: `${
              language[language.settingActiveLanguage].hide
            } ${language[
              language.settingActiveLanguage
            ].message.toLowerCase()} ${language[
              language.settingActiveLanguage
            ].button.toLowerCase()} (${
              language[language.settingActiveLanguage].alliance
            } ${language[
              language.settingActiveLanguage
            ].and.toLowerCase()} ${language[
              language.settingActiveLanguage
            ].islandInformationWindow.toLowerCase()})`,
            id: "settingDiotoolsMessageButton",
            setting: otherScripts.getSettingValue("diotoolsMessageButton"),
            functionToCall: otherScripts.setDiotoolsMessageButton,
          },
          {
            type: "checkBox",
            caption: `${
              language[language.settingActiveLanguage].hide
            } bbcode ${language[
              language.settingActiveLanguage
            ].button.toLowerCase()} (${
              language[language.settingActiveLanguage].alliance
            } ${language[
              language.settingActiveLanguage
            ].and.toLowerCase()} ${language[
              language.settingActiveLanguage
            ].islandInformationWindow.toLowerCase()})`,
            id: "settingDiotoolsBbcodeButton",
            setting: otherScripts.getSettingValue("diotoolsBbcodeButton"),
            functionToCall: otherScripts.setDiotoolsBbcodeButton,
          },
          {
            type: "checkBox",
            caption: `${
              language[language.settingActiveLanguage].hide
            } ${language[
              language.settingActiveLanguage
            ].heroIcon.toLowerCase()}`,
            id: "settingDiotoolsCityOverviewHero",
            setting: otherScripts.getSettingValue("diotoolsCityOverviewHero"),
            functionToCall: otherScripts.setDiotoolsCityOverviewHero,
          },
        ],
      },
      {
        sectionId: "submenu-MoleHole",
        gameHeaderText: `MoleHole ${language[
          language.settingActiveLanguage
        ].settings.toLowerCase()} `,
        display: "none",
        options: [
          {
            type: "checkBox",
            caption: `${
              language[language.settingActiveLanguage].hide
            } ${language[
              language.settingActiveLanguage
            ].message.toLowerCase()} ${language[
              language.settingActiveLanguage
            ].button.toLowerCase()} (${
              language[language.settingActiveLanguage].alliance
            } ${language[
              language.settingActiveLanguage
            ].and.toLowerCase()} ${language[
              language.settingActiveLanguage
            ].islandInformationWindow.toLowerCase()})`,
            id: "settingMoleholeMessageButton",
            setting: otherScripts.getSettingValue("moleholeMessageButton"),
            functionToCall: otherScripts.setMoleholeMessageButton,
          },
        ],
      },
    ];

    const container = document.getElementById("settings-sub-menu");
    subMenuItems.forEach((section) => {
      const sectionDiv = document.createElement("div");
      sectionDiv.className = "subMenSection";
      sectionDiv.id = section.sectionId;
      sectionDiv.style.display = section.display;

      const headerDiv = document.createElement("div");
      headerDiv.className = "game_header bold";
      headerDiv.textContent = section.gameHeaderText;
      sectionDiv.appendChild(headerDiv);

      const groupDiv = document.createElement("div");
      groupDiv.className = "group";

      section.options.forEach((option) => {
        switch (option.type) {
          case "infoText":
            optionDiv = this.createInfoText(option.caption);
            break;
          case "checkBox":
            optionDiv = this.createCheckbox(
              option.id,
              option.caption,
              option.setting
            );
            optionDiv.click(function () {
              option.setting = settingsMenu.toggleCheckbox($(this));
              option.functionToCall(option.setting);
            });
            break;
          case "dropDown":
            optionDiv = this.createDropdown(
              option.id,
              option.caption,
              option.setting,
              option.options
            );
            break;
          case "button":
            optionDiv = this.createButton(
              option.id,
              option.caption,
              option.disabled,
              option.functionToCall
            );
            break;
        }

        groupDiv.append(optionDiv.get(0));
      });
      sectionDiv.appendChild(groupDiv);
      container.appendChild(sectionDiv);
    });
  },

  selectPageOptions() {
    let dropdownOptions = [];
    const maxPage = Math.ceil(
      bbcodeCopyPlayer.data.size / (bbcodeCopyPlayer.data.size - 1)
    );

    for (let i = 1; i <= maxPage; i++) {
      dropdownOptions.push({
        value: i,
        name: ` ${
          language[language.settingActiveLanguage].page
        } ${i} ${language[
          language.settingActiveLanguage
        ].of.toLowerCase()} ${maxPage} `,
      });
    }

    return dropdownOptions;
  },

  controlActions() {
    $("#settingOceanGridTextColor_list").click(function () {
      if (!settingsMenu.listAction) return;
      settingsMenu.listAction = false;

      $(".selected", this).each(function () {
        oceanGrid.gridTextColor($(this).attr("name"));
      });
      setTimeout(() => {
        settingsMenu.listAction = true;
      }, 500);
    });

    $("#settingOceanGridColor_list").click(function () {
      if (!settingsMenu.listAction) return;
      settingsMenu.listAction = false;
      $(".selected", this).each(function () {
        oceanGrid.gridColor($(this).attr("name"));
        coordinatesGrid.gridColor($(this).attr("name"));
      });
      setTimeout(() => {
        settingsMenu.listAction = true;
      }, 500);
    });

    $("#islandNumbersFarmingTextColor_list").click(function () {
      if (!settingsMenu.listAction) return;
      settingsMenu.listAction = false;
      $(".selected", this).each(function () {
        islandNumbers.setFarmingTextColor($(this).attr("name"));
      });
      setTimeout(() => {
        settingsMenu.listAction = true;
      }, 500);
    });

    $("#islandNumbersRockTextColor_list").click(function () {
      if (!settingsMenu.listAction) return;
      settingsMenu.listAction = false;
      $(".selected", this).each(function () {
        islandNumbers.setRockTextColor($(this).attr("name"));
      });
      setTimeout(() => {
        settingsMenu.listAction = true;
      }, 500);
    });

    $("#languageID_list").click(function () {
      if (!settingsMenu.listAction) return;
      settingsMenu.listAction = false;

      $(".selected", this).each(function () {
        const name = $(this).attr("name");
        const isLanguageChanged = language.settingActiveLanguage !== name;

        language.dropdownValueNewLanguage = name;
        settingsMenu.statusButton("saveAndReload", isLanguageChanged);
      });

      setTimeout(() => {
        settingsMenu.listAction = true;
      }, 500);
    });
  },

  selectColorOptions() {
    let dropdown_opties = [];
    for (let key in settings.colors) {
      dropdown_opties.push({
        value: key,
        name: language[language.settingActiveLanguage].colors[key],
      });
    }

    dropdown_opties.sort(settingsMenu.sortList("name"));
    return dropdown_opties;
  },

  selectLanguageOpties() {
    let dropdown_opties = [];

    for (let i = 0; i < language.languages.length; ++i) {
      dropdown_opties.push({
        value: language.languages[i],
        name: language[language.settingActiveLanguage].languages[
          language.languages[i]
        ],
      });
    }
    dropdown_opties.sort(settingsMenu.sortList("name"));

    return dropdown_opties;
  },

  sortList(property) {
    var sortOrder = 1;
    if (property[0] === "-") {
      sortOrder = -1;
      property = property.substr(1);
    }
    return function (a, b) {
      var result =
        a[property] < b[property] ? -1 : a[property] > b[property] ? 1 : 0;
      return result * sortOrder;
    };
  },

  disableOptions() {
    otherScripts.checkActiveScripts();
    if (!otherScripts.diotoolsActive) {
      $("#settingDiotoolsMessageButton").addClass("disabled");
      $("#settingDiotoolsMessageButton").off("click");
      $("#settingDiotoolsBbcodeButton").addClass("disabled");
      $("#settingDiotoolsBbcodeButton").off("click");
      $("#settingDiotoolsCityOverviewHero").addClass("disabled");
      $("#settingDiotoolsCityOverviewHero").off("click");
    }
    if (!otherScripts.grcrtActive) {
      $("#settingGrcrtBbcodeButton").addClass("disabled");
      $("#settingGrcrtBbcodeButton").off("click");
      $("#settingGrcrtCityOverviewHero").addClass("disabled");
      $("#settingGrcrtCityOverviewHero").off("click");
      $("#settingGrcrtHideSpells").addClass("disabled");
      $("#settingGrcrtHideSpells").off("click");
    }
    if (!otherScripts.moleholeActive) {
      $("#settingMoleholeMessageButton").addClass("disabled");
      $("#settingMoleholeMessageButton").off("click");
    }
  },

  addSettingsLinkToMenu() {
    if (!$("#menu_links").get(0)) {
      if ($("#player-apps").length) {
        const newItem = $("<li>", { class: "with-icon" })
          .append(
            $("<img/>", {
              class: "support-menu-item-icon",
              src: "https://www.grepotools.nl/grepotools/images/logoStable.png",
              style: "width: 15px;padding-top:2px",
            })
          )
          .append(
            $("<a/>", { id: "menu_links" })
              .html(
                "Grepotools - " +
                  language[language.settingActiveLanguage].settings
              )
              .click(function () {
                WF.open("GrepoTools_settingsMenu");
                settingsMenu.id.setActivePageNr(2);
              })
          );

        $("#player-apps").parent().after(newItem);
      }
    }
  },

  addSettingsButtonToGodsArea() {
    const imgSrc =
      version.release === "beta" || version.release === "development"
        ? "https://www.grepotools.nl/grepotools/images/logoBeta.png"
        : "https://www.grepotools.nl/grepotools/images/logoStable.png";

    const settingsButtonHTML = `
      <div class="btn_settings circle_button settings_godsarea GrepoToolsSettingsButton">
        <div class="settings_godsarea_icon">
          <img class="GrepoToolsSettingsIcon" src="${imgSrc}">
        </div>
      </div>
    `;

    $(settingsButtonHTML).appendTo("body");
    $(".GrepoToolsSettingsButton").tooltip("");
    $(".GrepoToolsSettingsButton").tooltip(`
      <div>
        ${language[language.settingActiveLanguage].script}
        <br>
        ${language[language.settingActiveLanguage].version}: 
        ${GM_info.script.version} ${version.release}
        <br>
        ${language[language.settingActiveLanguage].settings}
      </div>
    `);

    if (Game.ui_scale.enlarged_ui_size) {
      $(".settings_godsarea").css("top", "187px");
      $(".settings_godsarea").css("right", "52px");
      $(".settings_godsarea").css("z-index", "2");
    } else {
      $(".settings_godsarea").css("top", "140px");
      $(".settings_godsarea").css("right", "116px");
      $(".settings_godsarea").css("z-index", "51");
    }

    $(".settings_godsarea > div")
      .on("mouseover", function (event) {
        $("#popup_div").css({
          left: `${event.clientX - 180}px`,
          top: `${event.clientY + 15}px`,
          display: "block",
        });
      })
      .on("mouseout", function () {
        $("#popup_div").css("display", "none");
      })
      .on("click", function () {
        WF.open("GrepoTools_settingsMenu");
        settingsMenu.id.setActivePageNr(2);
      });
  },

  settingsMenu(id) {
    "use strict";
    var _IdS = id;
    var _windows = require("game/windows/ids");
    (_windows[_IdS.toUpperCase()] = _IdS),
      (function () {
        var a = uw.GameControllers.TabController,
          b = uw.GameModels.Progressable,
          _content = $("<div/>", { id: "menuScreen" }),
          c = a.extend({
            initialize: function (b) {
              a.prototype.initialize.apply(this, arguments);
              var _wnd = this.getWindowModel(),
                _$el = this.$el;
              settingsMenu.id = _wnd;
              this.$el.html(_content);
              _wnd.hideLoading();
              if (!_wnd.getJQElement) {
                _wnd.getJQElement = function () {
                  return _content;
                };
              }
              if (!_wnd.appendContent) {
                _wnd.appendContent = function (a) {
                  return _content.append(a);
                };
              }
              if (!_wnd.setContent2) {
                _wnd.setContent2 = function (a) {
                  return _content.html(a);
                };
              }
              this.bindEventListeners();
            },
            render: function () {
              this.reRender();
            },
            reRender: function () {
              var _wnd = this.getWindowModel(),
                _$el = this.$el;
              this.getWindowModel().setTitle(
                `<img src="https://www.grepotools.nl/grepotools/images/logoStable.png" width="15" height="15"> Grepotools ${
                  language[language.settingActiveLanguage].settings
                }`
              ),
                this.getWindowModel().showLoading();
              setTimeout(function () {
                _wnd.setContent2(""),
                  settingsMenu.createMenuContent(_wnd.getActivePageNr());

                _wnd.hideLoading();

                _$el.find(".js-scrollbar-viewport").skinableScrollbar({
                  orientation: "vertical",
                  template: "tpl_skinable_scrollbar",
                  skin: "narrow",
                  disabled: !1,
                  elements_to_scroll: _$el.find(".js-scrollbar-content"),
                  element_viewport: _$el.find(".js-scrollbar-viewport"),
                  scroll_position: 0,
                  min_slider_size: 16,
                });
              }, 100);
            },
            bindEventListeners: function () {
              this.$el
                .parents("." + _IdS)
                .on(
                  "click",
                  ".js-wnd-buttons .help",
                  this._handleHelpButtonClickEvent.bind(this)
                );
            },
            _handleHelpButtonClickEvent: function () {
              var a = this.getWindowModel().getHelpButtonSettings();
            },
          });
        uw.GameViews["grepotools_" + _IdS] = c;
      })(),
      (function () {
        "use strict";
        var a = uw.GameViews,
          b = uw.GameCollections,
          c = uw.GameModels,
          d = uw.WindowFactorySettings,
          e = require("game/windows/ids"),
          f = require("game/windows/tabs"),
          g = e[_IdS.toUpperCase()];
        d[g] = function (b) {
          b = b || {};
          return us.extend(
            {
              window_type: g,
              minheight: 550,
              maxheight: 560,
              width: 925,
              tabs: [
                {
                  type: id,
                  title: `${language[language.settingActiveLanguage].about}`,
                  content_view_constructor: a["grepotools_" + _IdS],
                  hidden: !1,
                },
                {
                  type: id,
                  title: `${language[language.settingActiveLanguage].changes}`,
                  content_view_constructor: a["grepotools_" + _IdS],
                  hidden: !1,
                },
                {
                  type: id,
                  title: `${language[language.settingActiveLanguage].settings}`,
                  content_view_constructor: a["grepotools_" + _IdS],
                  hidden: !1,
                },
                {
                  type: id,
                  title: `${language[language.settingActiveLanguage].donation}`,
                  content_view_constructor: a["grepotools_" + _IdS],
                  hidden: !1,
                },
              ],
              max_instances: 1,
              activepagenr: 0,
            },
            b
          );
        };
      })();
  },
};


// Module: settings
// Discrption: This module will handle all the settings for the modules.
// Last Updated: 2024/11/30

let settings = {
  colors: {
    white: "#FFFFFF",
    grey: "#969696",
    lightred: "#FF5555",
    red: "#FF0000",
    brown: "#BB5511",
    lightblue: "#00FFFF",
    blue: "#0099FF",
    purple: "#FF00FF",
    pink: "#FF95FF",
    lightgreen: "#00FF00",
    green: "#399B1E",
    yellow: "#FFFF00",
  },

  loadSetting(name, defaultValue) {
    let value;
    if (typeof GM !== "undefined" && GM_getValue) {
      value = GM_getValue(name, defaultValue);
    } else {
      value = localStorage.getItem(name) || defaultValue;
    }
    if (value === undefined || value === null) {
      value = defaultValue;
      settings.safeSetting(name, value);
    }
    return value;
  },

  safeSetting(name, val) {
    if (typeof GM !== "undefined" && GM_setValue) {
      setTimeout(() => {
        GM_setValue(name, val);
      }, 0);
    } else {
      localStorage.setItem(name, val);
    }
  },
};


// Module: externalData
// Discrption: This module will load external data from GrepoTools and GrepoData.
// Last Updated: 2024/12/22

let externalData = {
  module: "externalData",
  townData: new Map(),
  townDataLoaded: false,
  islandData: new Map(),
  idleData: new Map(),
  idleDataLoaded: false,

  init() {
    externalData.loadTownData();
    externalData.loadIdleData();

    externalData.intervalLoadTownData = setInterval(
      externalData.loadTownData,
      3600000
    );
    externalData.intervalLoadIdleData = setInterval(
      externalData.loadIdleData,
      3600000
    );
  },

  loadTownData() {
    $.ajax({
      type: "POST",
      url: "https://www.grepotools.nl/grepotools/php/townData.php",
      data: {
        server: uw.Game.world_id,
      },
      success: function (returnData) {
        if (returnData != "data niet beschikbaar") {
          const data = JSON.parse(returnData);
          for (let i = 0; i < data.length; i++) {
            externalData.townData.set(data[i].townId, data[i]);
          }
          externalData.townDataLoaded = true;

          mapTags.mapTagsReset = true;
          mapTags.animate();
        } else {
          console.log("GrepoTools - Data niet beschikbaar");
        }
      },
    });
  },

  loadIslandData: async function (ocean) {
    const url = "https://www.grepotools.nl/grepotools/php/islandNumbers.php";
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        server: Game.world_id,
        ocean: ocean,
        version: GM_info.script.version,
      }),
    };

    try {
      const response = await fetch(url, options);
      const data = await response.text();

      externalData.islandData.set(
        Game.world_id + "|" + ocean,
        JSON.parse(data)
      );

      GM_setValue(
        "islandData",
        JSON.stringify(Array.from(externalData.islandData.entries()))
      );
      islandNumbers.animate();
    } catch (networkError) {
      console.error("GrepoTools network error:", networkError);
    }
  },

  loadIdleData() {
    // Data available from GrepoData
    $.ajax({
      type: "GET",
      url:
        "https://api.grepodata.com/data/" +
        uw.Game.world_id +
        "/player_idle.json",
      data: {
        server: uw.Game.world_id,
      },
      success: function (returnData) {
        if (returnData) {
          $.each(returnData, function (speler, idle) {
            externalData.idleData.set(speler, {
              speler_id: speler,
              idle: idle,
            });
          });
          externalData.idleDataLoaded = true;
          mapTags.mapTagsReset = true;
        } else {
          console.log("GrepoTools - GrepoData not available");
        }
      },
    });
  },
};


// module ocean
// Discrption: this module will calculate the visible oceans on the screen on the strategic map and island view.
// Last Updated: 2024/11/30

let ocean = {
  oceanSize: "",
  visibleOceans: [],
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,

  visibleOnScreen() {
    if (Game.layout_mode === "city_overview") return;

    ocean.getGameLayoutInfo();

    this.visibleOceans.length = 0;

    const positions = [
      this.calculateOcean(this.left, this.top),
      this.calculateOcean(this.left, this.bottom),
      this.calculateOcean(this.right, this.top),
      this.calculateOcean(this.right, this.bottom),
    ];

    positions.forEach((position) => {
      if (!this.visibleOceans.includes(position)) {
        this.visibleOceans.push(position);
      }
    });
  },

  getGameLayoutInfo() {
    const convertToPositiveInt = (value) =>
      parseInt(value.replace("-", "").replace("px", ""));

    switch (Game.layout_mode) {
      case "strategic_map":
        this.oceanSize = 2560;

        [this.left, this.top] = $("#minimap")
          .css("translate")
          .split(",")
          .map(convertToPositiveInt);
        break;
      case "island_view":
        this.oceanSize = 12800;

        [this.left, this.top] = [
          convertToPositiveInt($("#map_move_container").css("left")),
          convertToPositiveInt($("#map_move_container").css("top")),
        ];
        break;
    }
    this.right = this.left + window.innerWidth;
    this.bottom = this.top + window.innerHeight;
  },

  calculateOcean(x, y) {
    return parseInt(
      Math.floor(x / this.oceanSize).toString() +
        Math.floor(y / this.oceanSize).toString()
    );
  },
};


// Module: statistics
// Discrption: This module will safe the stats of the user.
// Last Updated: 2024/12/22

let statistics = {
  module: "statistics",
  uidSaved: "",
  uidGenerated: "",
  settingsKeys: [{ key: "uid", value: null, default: null }],

  init() {
    if (grepolisLoaded) {
      this.loadSettings();
      statistics.uidGenerated = statistics.uniqueId();
      statistics.safe();
    }
  },

  loadSettings() {
    this.settingsKeys.forEach((setting) => {
      const { key, default: defaultValue } = setting;
      let value = settings.loadSetting(
        `${Game.world_id}|${this.module}.${key}`,
        defaultValue
      );
      setting.value = value;
    });
  },

  getSettingValue(settingKey) {
    const setting = statistics.settingsKeys.find(
      ({ key }) => key === settingKey
    );
    return setting ? setting.value : null;
  },

  setSettingValue(settingKey, value) {
    const setting = statistics.settingsKeys.find(
      ({ key }) => key === settingKey
    );
    setting.value = value;

    settings.safeSetting(`${Game.world_id}|statistics.${settingKey}`, value);
  },

  safe() {
    if (statistics.getSettingValue("uid") != statistics.uidGenerated) {
      $.ajax({
        type: "POST",
        url: "https://www.grepotools.nl/grepotools/php/statistics.php",
        data: {
          player: uw.Game.player_name,
          server: uw.Game.world_id,
          version: GM_info.script.version,
          language: language.settingActiveLanguage,
        },
        success: function (returnData) {
          if (returnData == "GrepoTools: Statistics saved successfully") {
            statistics.setSettingValue("uid", statistics.uidGenerated);
          }
        },
      });
    }
  },

  uniqueId() {
    const date = new Date();
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    return `${uw.Game.player_name}${uw.Game.world_id}${GM_info.script.version}${year}${month}${day}`;
  },
};


// module version
// Discrption: this module will check and handle the version of the script
// Last Updated: 2024/12/22

let version = {
  module: "version",
  rendered: false,
  styleDiv: `GrepoTools_version`,
  data: new Map(),
  localVersion: GM_info.script.version,
  betaVersion: "",
  stableVersion: "",
  release: "",
  releaseAction: "",
  notification: false,
  settingsKeys: [{ key: "joinBetaProgram", value: null, default: false }],

  init() {
    if (grepolisLoaded) {
      this.createStyle();
      this.loadSettings();
    }
  },

  createStyle() {
    if (!this.rendered) {
      $("head").append(
        $(`<style id="${this.styleDiv}">`).append(`
          #notification_area .GrepoToolsUpdate .icon {
            background: url(https://www.grepotools.nl/grepotools/images/logoNotification.png) 3px 3px no-repeat !important; 
            cursor: pointer;
          }
          #notification_area .GrepoToolsUpdate { 
            cursor: pointer;
          }
        `)
      );
      this.rendered = true;
    }
  },

  loadSettings() {
    this.settingsKeys.forEach((setting) => {
      const { key, default: defaultValue } = setting;
      let value = settings.loadSetting(
        `${Game.world_id}|${this.module}.${key}`,
        defaultValue
      );
      setting.value = value;
    });
  },

  getSettingValue(settingKey) {
    const setting = this.settingsKeys.find(({ key }) => key === settingKey);
    return setting ? setting.value : null;
  },

  setSettingValue(settingKey, value) {
    const setting = version.settingsKeys.find(({ key }) => key === settingKey);
    setting.value = value;

    settings.safeSetting(`${Game.world_id}|version.${settingKey}`, value);
  },

  setJoinBetaProgram(value) {
    version.setSettingValue("joinBetaProgram", value);
  },

  getScriptVersionData() {
    return fetch("https://www.grepotools.nl/grepotools/php/version.php", {
      method: "POST",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Failed to fetch server version. HTTP status: ${response.status}`
          );
        }

        return response.text();
      })
      .then((data) => {
        JSON.parse(data).forEach(function (value) {
          version.data.set(value.id, value);
        });
      })
      .catch((error) => {
        console.error("Error fetching server version:", error);
        throw error;
      });
  },

  getScriptVersions() {
    for (const [key, value] of version.data.entries()) {
      if (value.script === "beta") {
        version.betaVersion = value.version;
      }
      if (value.script === "stable") {
        version.stableVersion = value.version;
      }
    }
    version.getRelease();
  },

  getRelease() {
    if (version.localVersion < version.stableVersion) {
      version.release = "stable";
      version.releaseAction = "updateStable";
    } else if (version.localVersion === version.stableVersion) {
      version.release = "stable";
      version.releaseAction = "none";
    } else if (
      version.localVersion === version.betaVersion &&
      version.stableVersion < version.betaVersion
    ) {
      version.release = "beta";
      version.releaseAction = "none";
    } else if (
      version.localVersion > version.stableVersion &&
      version.localVersion < version.betaVersion
    ) {
      version.release = "beta";
      version.releaseAction = "updateBeta";
    } else if (
      version.localVersion > version.stableVersion &&
      version.localVersion > version.betaVersion
    ) {
      version.release = "development";
      version.releaseAction = "none";
    }
  },

  checkUpdate() {
    if (version.releaseAction === "none") {
      return;
    }

    const showUpdateNotification = (versionType, targetVersion) => {
      version.showNotification(
        `${versionType.toUpperCase()} ${language[
          language.settingActiveLanguage
        ].version.toUpperCase()} </br>${
          language[language.settingActiveLanguage].update
        } ${version.localVersion} ${language[
          language.settingActiveLanguage
        ].to.toLowerCase()} ${targetVersion}</br><br><a class="notify_subjectlink" href="https://www.grepotools.nl/" target="_blank">${
          language[language.settingActiveLanguage].update
        }</a>`
      );
    };

    if (version.releaseAction === "updateStable") {
      showUpdateNotification(version.release, version.stableVersion);
    }

    if (
      version.getSettingValue("joinBetaProgram") &&
      version.releaseAction === "updateBeta"
    ) {
      showUpdateNotification(version.release, version.betaVersion);
    }
  },

  showNotification(textNotification) {
    if (version.notification) return;

    if ($("#notification_area>.notification").length > 7) {
      return;
    } else {
      const date = new Date();
      const formatWithLeadingZero = (value) => (value < 10 ? "0" : "") + value;

      const day = formatWithLeadingZero(date.getDate());
      const month = formatWithLeadingZero(date.getMonth() + 1);
      const hour = formatWithLeadingZero(date.getHours());
      const minutes = formatWithLeadingZero(date.getMinutes());
      const seconds = formatWithLeadingZero(date.getSeconds());

      const dayTimeString = `${day}.${month}.|${hour}:${minutes}:${seconds}`;

      const notification = new uw.NotificationHandler();
      const layout =
        typeof Layout.notify === "undefined"
          ? new NotificationHandler()
          : Layout;

      notification.notify(
        $("#notification_area>.notification").length + 1,
        "GrepoToolsUpdate",
        `<span><b>${
          language[language.settingActiveLanguage].grepotoolsUpdateAvailable
        }</b></span>` +
          textNotification +
          `<span class="small notification_date">${dayTimeString}</span>`
      );
      version.notification = true;
    }
  },
};


// Module: language
// Discrption: This module will contain all the language settings for the script.
// Last Updated: 2024/12/23

let language = {
  module: "language",
  settingActiveLanguage: "en",
  dropdownValueNewLanguage: "",
  languages: ["en", "nl", "us", "fr", "de", "gr", "pl", "es"],

  nl: {
    about: "Over",
    active: "Actief",
    alliance: "Alliantie",
    allianceDataAvailable: "Alliantie data beschikbaar. Alliantie: ",
    allianceName: "Alliantie naam",
    allianceNumberPlayers: "Aantal alliantie leden",
    alliancePoints: "Alliantie punten",
    allianceRank: "Alliantie rank",
    and: "En",
    attackNotification: "Animeer het browser icoon bij een aanval",
    battlePoints: "Gevechtspunten",
    bbcodeAlliance: "Kopieer de informatie van alle leden van de alliantie",
    bbcodeAllianceCopySucces: "BBCode - Alliantie informatie is gekopieerd",
    bbcodeIsland: "Kopieer de informatie van dit eiland",
    bbcodeIslandCopyFail:
      "BBCode - Eiland is leeg, informatie is niet gekopieerd",
    bbcodeIslandCopySucces: "BBCode - Eiland informatie is gekopieerd",
    bbcodePlayer: "Kopieer de informatie van deze speler",
    bbcodePlayerCopySucces: "BBCode - Speler informatie is gekopieerd",
    bbcodeWindowTitle: "GrepoTools - BBCode - Plakken gegevens",
    button: "Knop",
    changes: "Veranderingen",
    cityRequired: "De stad wordt automatisch toegevoegd, dit veld is verplicht",
    color: "Kleur",
    coordinates: "Coördinaten",
    day: "dag",
    dayMode: "Dag mode",
    days: "dagen",
    donation: "Donatie",
    emptyColumn: "Lege kolom",
    farmerIslandNumbersTextColor: "Boerendorp eiland tekst kleur",
    farmerVillageIslandNumbers: "Boerendorp eilandnummers",
    farmerVillageIslandTags: "Boerendorp eilandtags",
    free: "Vrij",
    general: "Algemene",
    ghostTown: "Spookstad",
    grepoTools: "GrepoTools",
    grepotoolsUpdateAvailable: "Grepotools Update beschikbaar",
    grepolisRank: "Grepolis rank",
    grepolisScore: "Grepolis score",
    grid: "Raster",
    heroIcon: "Held icoon in stadsoverzicht",
    hide: "Verberg",
    hour: "uur",
    inactiveTimePlayer: "Speler inactiviteit (samenwerking met GrepoData)",
    island: "Eiland",
    islandDataAvailable: "Eiland data beschikbaar. Eiland: ",
    islandEmptyNoMessage:
      "Het eiland is leeg, er kan geen bericht worden verzonden",
    islandInformationWindow: "Eiland informatie venster",
    islandLinkIslandInfo: "eiland nummers/tags als link naar eiland informatie",
    islandNoAllianceNoMessage:
      "Op dit eiland zijn geen aliantieleden aanwezig, er kan geen bericht worden verzonden",
    islandNumber: "Eiland nummer",
    islandNumbersTags: "Eiland nummers / tags",
    islandOccupation: "Eiland bezetting",
    islandTag: "Eiland tag",
    islandView: "Eiland overzicht",
    joinBetaTesting: "Deelnemen aan het bètatestprogramma",
    language: "Taal",
    mapTags: "Map tags",
    maxMembers: "Maximaal aantal leden",
    member: "Lid",
    members: "Leden",
    message: "Bericht",
    nightMode: "Nacht mode",
    noDataAvailable: "GrepoTools BBCode - Geen data beschikbaar",
    noWrap: "Toon grote tags op één regel",
    number: "Nummer",
    numberShort: "Nr",
    occupied: "Bezet",
    ocean: "Oceaan",
    oceanGrid: "Oceaan raster",
    oceanNumbers: "Oceaan nummers",
    of: "Van",
    otherScripts: "Andere scripts",
    page: "Pagina",
    pasteData: "Gegevens plakken",
    player: "Speler",
    playerDataAvailable: "Speler data beschikbaar. Speler: ",
    playerName: "Spelersnaam",
    playerRequired:
      "De speler wordt automatisch toegevoegd, dit veld is verplicht",
    points: "Punten",
    rank: "Rank",
    resources: "Resources",
    rockIslandNumbers: "Rots eilandnummers",
    rockIslandNumbersTextColor: "Rots eiland tekst kleur",
    safe: "Opslaan",
    safeAndReload: "Opslaan en herladen",
    safeFail: "GrepoTools instellingen zijn niet succesvol opgeslagen",
    safeSuccess: "GrepoTools instellingen zijn succesvol opgeslagen",
    script: "Grepolis GrepoTools Script",
    selectPage: "Selecteer pagina:",
    sendMessageAlliance: "Verstuur bericht aan alle leden van de alliantie",
    sendMessageIsland:
      "Verstuur bericht aan alle leden van de alliantie op het eiland",
    settings: "Instellingen",
    show: "Toon",
    showInfoAboveTable: "Toon de informatie hieronder boven de tabel",
    showInfoInTable: "Toon de informatie hieronder in de tabel",
    silver: "Zilver",
    spellsHarborBarracks: "Spreuken in de haven en de kazerne",
    stone: "Steen",
    strategicMap: "Strategische kaart",
    text: "Tekst",
    to: "Naar",
    town: "Stad",
    townName: "Stadsnaam",
    townPoints: "Stad punten",
    towns: "Steden",
    update: "Update",
    version: "Versie",
    whileScrolling: "tijdens scrollen",
    wood: "Hout",
    world: "Wereld",

    colors: {
      blue: "blauw",
      brown: "bruin",
      green: "groen",
      grey: "grijs",
      lightblue: "licht blauw",
      lightgreen: "licht groen",
      lightred: "licht rood",
      pink: "roze",
      purple: "paars",
      red: "rood",
      white: "wit",
      yellow: "geel",
    },

    languages: {
      de: "Duits",
      en: "Engels",
      es: "Spaans",
      fr: "Frans",
      gr: "Grieks",
      nl: "Nederlands",
      pl: "Pools",
      us: "Amerikaans",
    },
  },

  en: {
    about: "About",
    active: "Active",
    alliance: "Alliance",
    allianceDataAvailable: "Alliance data available. Alliance: ",
    allianceName: "Alliance name",
    allianceNumberPlayers: "Number of alliance members",
    alliancePoints: "Alliance points",
    allianceRank: "Alliance rank",
    and: "And",
    attackNotification: "Animate the browser icon during an attack",
    battlePoints: "Battle points",
    bbcodeAlliance: "Copy the information of all alliance members",
    bbcodeAllianceCopySucces: "BBCode - Alliance information is copied",
    bbcodeIsland: "Copy the information of this island",
    bbcodeIslandCopyFail: "BBCode - Island is empty, information is not copied",
    bbcodeIslandCopySucces: "BBCode - Island information is copied",
    bbcodePlayer: "Copy the information of this player",
    bbcodePlayerCopySucces: "BBCode - Player information is copied",
    bbcodeWindowTitle: "GrepoTools - BBCode - Paste data",
    button: "Button",
    changes: "Changes",
    cityRequired: "The city is automatically added, this field is required",
    color: "Color",
    coordinates: "Coördinates",
    day: "day",
    dayMode: "Day mode",
    days: "days",
    donation: "Donations",
    emptyColumn: "Empty column",
    farmerIslandNumbersTextColor: "Farmer island text color",
    farmerVillageIslandNumbers: "Farmer village island numbers",
    farmerVillageIslandTags: "Farmer village island tags",
    free: "Free",
    general: "General",
    ghostTown: "Ghost town",
    grepoTools: "GrepoTools",
    grepotoolsUpdateAvailable: "Grepotools Update available",
    grepolisRank: "Grepolis rank",
    grepolisScore: "Grepolis score",
    grid: "Grid",
    heroIcon: "Hero icon in city overview",
    hide: "Hide",
    hour: "hour",
    inactiveTimePlayer: "Player inactivity (collaboration with GrepoData)",
    island: "Island",
    islandDataAvailable: "Island data available. Island: ",
    islandEmptyNoMessage: "The island is empty, no message can be sent",
    islandInformationWindow: "Island information window",
    islandLinkIslandInfo: "island numbers/tags as link to island information",
    islandNoAllianceNoMessage:
      "There are no alliance members on this island, no message can be sent",
    islandNumber: "Island number",
    islandNumbersTags: "Island numbers / tags",
    islandOccupation: "Island occupation",
    islandTag: "Island tag",
    islandView: "Island View",
    joinBetaTesting: "Join the beta testing program",
    language: "Language",
    mapTags: "Map tags",
    maxMembers: "Maximum number of members",
    member: "Member",
    members: "Members",
    message: "Message",
    nightMode: "Night mode",
    noDataAvailable: "GrepoTools BBCode - No data available",
    noWrap: "Show large tags on one line",
    number: "Number",
    numberShort: "No",
    occupied: "Occupied",
    ocean: "Ocean",
    oceanGrid: "Ocean grid",
    oceanNumbers: "Ocean numbers",
    of: "Of",
    otherScripts: "Other scripts",
    page: "Page",
    pasteData: "Paste data",
    player: "Player",
    playerDataAvailable: "Player data available. Player: ",
    playerName: "Player name",
    playerRequired: "The player is automatically added, this field is required",
    points: "Points",
    rank: "Rank",
    resources: "Resources",
    rockIslandNumbers: "Rock island numbers",
    rockIslandNumbersTextColor: "Rock island text color",
    safe: "Save",
    safeAndReload: "Save and reload",
    safeFail: "GrepoTools settings have not been successfully saved",
    safeSuccess: "GrepoTools settings have been successfully saved",
    script: "Grepolis GrepoTools Script",
    selectPage: "Select page:",
    sendMessageAlliance: "Send message to all alliance members",
    sendMessageIsland: "Send message to all alliance members on the island",
    settings: "Settings",
    show: "Show",
    showInfoAboveTable: "Show the information below above the table",
    showInfoInTable: "Show the information below in the table",
    silver: "Silver",
    spellsHarborBarracks: "Spells in the harbor and the barracks",
    stone: "Stone",
    strategicMap: "Strategic map",
    text: "text",
    to: "To",
    town: "Town",
    townName: "Town name",
    townPoints: "Town points",
    towns: "Towns",
    update: "Update",
    version: "Version",
    whileScrolling: "while scrolling",
    wood: "Wood",
    world: "World",

    colors: {
      blue: "blue",
      brown: "brown",
      green: "green",
      grey: "grey",
      lightblue: "light blue",
      lightgreen: "light green",
      lightred: "light red",
      pink: "rose",
      purple: "purple",
      red: "red",
      white: "white",
      yellow: "yellow",
    },

    languages: {
      de: "German",
      en: "English",
      es: "Spanish",
      fr: "French",
      gr: "Greek",
      nl: "Dutch",
      pl: "Polish",
      us: "American",
    },
  },

  de: {
    about: "Über",
    active: "Aktiv",
    alliance: "Allianz",
    allianceDataAvailable: "Allianzdaten verfügbar. Allianz: ",
    allianceName: "Allianzname",
    allianceNumberPlayers: "Anzahl der Allianzenmitglieder",
    alliancePoints: "Allianzpunkte",
    allianceRank: "Allianzrang",
    and: "Und",
    attackNotification:
      "Animieren Sie das Browser-Symbol während eines Angriffs",
    battlePoints: "Kampfpunkte",
    bbcodeAlliance: "Kopieren Sie die Informationen aller Allianzenmitglieder",
    bbcodeAllianceCopySucces: "BBCode - Allianzinformationen wurden kopiert",
    bbcodeIsland: "Kopieren Sie die Informationen dieser Insel",
    bbcodeIslandCopyFail:
      "BBCode - Insel ist leer, Informationen wurden nicht kopiert",
    bbcodeIslandCopySucces: "BBCode - Inselinformationen wurden kopiert",
    bbcodePlayer: "Kopieren Sie die Informationen dieses Spielers",
    bbcodePlayerCopySucces: "BBCode - Spielerinformationen wurden kopiert",
    bbcodeWindowTitle: "GrepoTools - BBCode - Daten einfügen",
    button: "Knopf",
    changes: "Änderungen",
    cityRequired:
      "Die Stadt wird automatisch hinzugefügt, dieses Feld ist erforderlich",
    color: "Farbe",
    coordinates: "Koordinaten",
    day: "Tag",
    dayMode: "Tagmodus",
    days: "Tage",
    donation: "Spenden",
    emptyColumn: "Leere Spalte",
    farmerIslandNumbersTextColor: "Bauerninsel Textfarbe",
    farmerVillageIslandNumbers: "Bauerninselnummern",
    farmerVillageIslandTags: "Bauerninseltags",
    free: "Frei",
    general: "Allgemein",
    ghostTown: "Geisterstadt",
    grepoTools: "GrepoTools",
    grepotoolsUpdateAvailable: "Grepotools Update verfügbar",
    grepolisRank: "Grepolis Rang",
    grepolisScore: "Grepolis Punktzahl",
    grid: "Raster",
    heroIcon: "Helden-Symbol in der Stadtübersicht",
    hide: "Verstecken",
    hour: "Stunde",
    inactiveTimePlayer: "Spieler Inaktivität (Zusammenarbeit mit GrepoData)",
    island: "Insel",
    islandDataAvailable: "Insel Daten verfügbar. Insel: ",
    islandEmptyNoMessage:
      "Die Insel ist leer, es kann keine Nachricht gesendet werden",
    islandInformationWindow: "Inselinformationsfenster",
    islandLinkIslandInfo: "Inselnummern/tags als Link zu Inselinformationen",
    islandNoAllianceNoMessage:
      "Es gibt keine Allianzenmitglieder auf dieser Insel, es kann keine Nachricht gesendet werden",
    islandNumber: "Inselnummer",
    islandNumbersTags: "Inselnummern / tags",
    islandOccupation: "Inselbesetzung",
    islandTag: "Insel tag",
    islandView: "Inselansicht",
    language: "Sprache",
    joinBetaTesting: "Am Beta-Testprogramm teilnehmen",
    mapTags: "Kartentags",
    maxMembers: "Maximale Anzahl von Mitgliedern",
    member: "Mitglied",
    members: "Mitglieder",
    message: "Nachricht",
    nightMode: "Nachtmodus",
    noDataAvailable: "GrepoTools BBCode - Keine Daten verfügbar",
    noWrap: "Große Tags in einer Zeile anzeigen",
    number: "Nummer",
    numberShort: "Nr",
    occupied: "Besetzt",
    ocean: "Ozean",
    oceanGrid: "Ozeanraster",
    oceanNumbers: "Ozeannummern",
    of: "Von",
    otherScripts: "Andere Skripte",
    page: "Seite",
    pasteData: "Daten einfügen",
    player: "Spieler",
    playerDataAvailable: "Spielerdaten verfügbar. Spieler: ",
    playerName: "Spielername",
    playerRequired:
      "Der Spieler wird automatisch hinzugefügt, dieses Feld ist erforderlich",
    points: "Punkte",
    rank: "Rang",
    resources: "Ressourcen",
    rockIslandNumbers: "Felseninselnummern",
    rockIslandNumbersTextColor: "Felseninsel Textfarbe",
    safe: "Speichern",
    safeAndReload: "Speichern und neu laden",
    safeFail: "GrepoTools Einstellungen wurden nicht erfolgreich gespeichert",
    safeSuccess: "GrepoTools Einstellungen wurden erfolgreich gespeichert",
    script: "Grepolis GrepoTools Skript",
    selectPage: "Seite auswählen:",
    sendMessageAlliance: "Nachricht an alle Allianzenmitglieder senden",
    sendMessageIsland:
      "Nachricht an alle Allianzenmitglieder auf der Insel senden",
    settings: "Einstellungen",
    show: "Anzeigen",
    showInfoAboveTable:
      "Zeigen Sie die Informationen unten über der Tabelle an",
    showInfoInTable: "Zeigen Sie die Informationen unten in der Tabelle an",
    silver: "Silber",
    spellsHarborBarracks: "Zauber im Hafen und in den Kasernen",
    stone: "Stein",
    strategicMap: "Strategische Karte",
    text: "Text",
    to: "Zu",
    town: "Stadt",
    townName: "Stadtname",
    townPoints: "Stadtpunkte",
    towns: "Städte",
    update: "Aktualisieren",
    version: "Version",
    whileScrolling: "während des Scrollens",
    wood: "Holz",
    world: "Welt",

    colors: {
      blue: "blau",
      brown: "braun",
      green: "grün",
      grey: "grau",
      lightblue: "hellblau",
      lightgreen: "hellgrün",
      lightred: "hellrot",
      pink: "rosa",
      purple: "lila",
      red: "rot",
      white: "weiß",
      yellow: "gelb",
    },

    languages: {
      de: "Deutsch",
      en: "Englisch",
      es: "Spanisch",
      fr: "Französisch",
      gr: "Griechisch",
      nl: "Niederländisch",
      pl: "Polnisch",
      us: "Amerikanisch",
    },
  },

  fr: {
    about: "À propos",
    active: "Actif",
    alliance: "Alliance",
    allianceDataAvailable: "Données de l'alliance disponibles. Alliance : ",
    allianceName: "Nom de l'alliance",
    allianceNumberPlayers: "Nombre de membres de l'alliance",
    alliancePoints: "Points de l'alliance",
    allianceRank: "Rang de l'alliance",
    and: "Et",
    attackNotification: "Animer l'icône du navigateur pendant une attaque",
    battlePoints: "Points de bataille",
    bbcodeAlliance: "Copier les informations de tous les membres de l'alliance",
    bbcodeAllianceCopySucces: "BBCode - Informations de l'alliance copiées",
    bbcodeIsland: "Copier les informations de cette île",
    bbcodeIslandCopyFail:
      "BBCode - L'île est vide, les informations ne sont pas copiées",
    bbcodeIslandCopySucces: "BBCode - Informations de l'île copiées",
    bbcodePlayer: "Copier les informations de ce joueur",
    bbcodePlayerCopySucces: "BBCode - Informations du joueur copiées",
    bbcodeWindowTitle: "GrepoTools - BBCode - Coller des données",
    button: "Bouton",
    changes: "Changements",
    cityRequired: "La ville est automatiquement ajoutée, ce champ est requis",
    color: "Couleur",
    coordinates: "Coordonnées",
    day: "jour",
    dayMode: "Mode jour",
    days: "jours",
    donation: "Dons",
    emptyColumn: "Colonne vide",
    farmerIslandNumbersTextColor:
      "Couleur du texte des numéros d'île de fermier",
    farmerVillageIslandNumbers: "Numéros d'île de village de fermier",
    farmerVillageIslandTags: "Tags d'île de village de fermier",
    free: "Gratuit",
    general: "Général",
    ghostTown: "Ville fantôme",
    grepoTools: "GrepoTools",
    grepotoolsUpdateAvailable: "Mise à jour Grepotools disponible",
    grepolisRank: "Rang Grepolis",
    grepolisScore: "Score Grepolis",
    grid: "Grille",
    heroIcon: "Icône du héros dans l'aperçu de la ville",
    hide: "Cacher",
    hour: "heure",
    inactiveTimePlayer: "Inactivité du joueur (collaboration avec GrepoData)",
    island: "Île",
    islandDataAvailable: "Données de l'île disponibles. Île : ",
    islandEmptyNoMessage: "L'île est vide, aucun message ne peut être envoyé",
    islandInformationWindow: "Fenêtre d'information sur l'île",
    islandLinkIslandInfo:
      "numéros/tags d'île comme lien vers les informations de l'île",
    islandNoAllianceNoMessage:
      "Il n'y a pas de membres de l'alliance sur cette île, aucun message ne peut être envoyé",
    islandNumber: "Numéro de l'île",
    islandNumbersTags: "Numéros / tags de l'île",
    islandOccupation: "Occupation de l'île",
    islandTag: "Tag de l'île",
    islandView: "Vue de l'île",
    joinBetaTesting: "Rejoindre le programme de test bêta",
    language: "Langue",
    mapTags: "Tags de carte",
    maxMembers: "Nombre maximum de membres",
    member: "Membre",
    members: "Membres",
    message: "Message",
    nightMode: "Mode nuit",
    noDataAvailable: "GrepoTools BBCode - Aucune donnée disponible",
    noWrap: "Afficher les grands tags sur une seule ligne",
    number: "Numéro",
    numberShort: "N°",
    occupied: "Occupé",
    ocean: "Océan",
    oceanGrid: "Grille de l'océan",
    oceanNumbers: "Numéros de l'océan",
    of: "De",
    otherScripts: "Autres scripts",
    page: "Page",
    pasteData: "Coller des données",
    player: "Joueur",
    playerDataAvailable: "Données du joueur disponibles. Joueur : ",
    playerName: "Nom du joueur",
    playerRequired: "Le joueur est automatiquement ajouté, ce champ est requis",
    points: "Points",
    rank: "Rang",
    resources: "Ressources",
    rockIslandNumbers: "Numéros d'île rocheuse",
    rockIslandNumbersTextColor: "Couleur du texte des numéros d'île rocheuse",
    safe: "Enregistrer",
    safeAndReload: "Enregistrer et recharger",
    safeFail:
      "Les paramètres de GrepoTools n'ont pas été enregistrés avec succès",
    safeSuccess: "Les paramètres de GrepoTools ont été enregistrés avec succès",
    script: "Script Grepolis GrepoTools",
    selectPage: "Sélectionner la page :",
    sendMessageAlliance: "Envoyer un message à tous les membres de l'alliance",
    sendMessageIsland:
      "Envoyer un message à tous les membres de l'alliance sur l'île",
    settings: "Paramètres",
    show: "Afficher",
    showInfoAboveTable:
      "Afficher les informations ci-dessous au-dessus de la table",
    showInfoInTable: "Afficher les informations ci-dessous dans la table",
    silver: "Argent",
    spellsHarborBarracks: "des sorts dans le port et la caserne",
    stone: "Pierre",
    strategicMap: "Carte stratégique",
    text: "Texte",
    to: "À",
    town: "Ville",
    townName: "Nom de la ville",
    townPoints: "Points de la ville",
    towns: "Villes",
    update: "Mettre à jour",
    version: "Version",
    whileScrolling: "pendant le défilement",
    wood: "Bois",
    world: "Monde",

    colors: {
      blue: "bleu",
      brown: "marron",
      green: "vert",
      grey: "gris",
      lightblue: "bleu clair",
      lightgreen: "vert clair",
      lightred: "rouge clair",
      pink: "rose",
      purple: "violet",
      red: "rouge",
      white: "blanc",
      yellow: "jaune",
    },

    languages: {
      de: "Allemand",
      en: "Anglais",
      es: "Espagnol",
      fr: "Français",
      gr: "Grec",
      nl: "Néerlandais",
      pl: "Polonais",
      us: "Américain",
    },
  },

  gr: {
    about: "Σχετικά",
    active: "Ενεργός",
    alliance: "Συμμαχία",
    allianceDataAvailable: "Δεδομένα συμμαχίας διαθέσιμα. Συμμαχία: ",
    allianceName: "Όνομα συμμαχίας",
    allianceNumberPlayers: "Αριθμός μελών συμμαχίας",
    alliancePoints: "Πόντοι συμμαχίας",
    allianceRank: "Βαθμός συμμαχίας",
    and: "Και",
    attackNotification:
      "Αναπαραγωγή του εικονιδίου του προγράμματος περιήγησης κατά τη διάρκεια μιας επίθεσης",
    battlePoints: "Πόντοι μάχης",
    bbcodeAlliance: "Αντιγραφή των πληροφοριών όλων των μελών της συμμαχίας",
    bbcodeAllianceCopySucces:
      "BBCode - Οι πληροφορίες της συμμαχίας αντιγράφηκαν",
    bbcodeIsland: "Αντιγραφή των πληροφοριών αυτού του νησιού",
    bbcodeIslandCopyFail:
      "BBCode - Το νησί είναι άδειο, οι πληροφορίες δεν αντιγράφηκαν",
    bbcodeIslandCopySucces: "BBCode - Οι πληροφορίες του νησιού αντιγράφηκαν",
    bbcodePlayer: "Αντιγραφή των πληροφοριών αυτού του παίκτη",
    bbcodePlayerCopySucces: "BBCode - Οι πληροφορίες του παίκτη αντιγράφηκαν",
    bbcodeWindowTitle: "GrepoTools - BBCode - Επικόλληση δεδομένων",
    button: "Κουμπί",
    changes: "Αλλαγές",
    cityRequired:
      "Η πόλη προστίθεται αυτόματα, αυτό το πεδίο είναι υποχρεωτικό",
    color: "Χρώμα",
    coordinates: "Συντεταγμένες",
    day: "ημέρα",
    dayMode: "Λειτουργία ημέρας",
    days: "ημέρες",
    donation: "Δωρεές",
    emptyColumn: "Κενή στήλη",
    farmerIslandNumbersTextColor: "Χρώμα κειμένου αριθμών νησιού αγρότη",
    farmerVillageIslandNumbers: "Αριθμοί νησιού χωριού αγρότη",
    farmerVillageIslandTags: "Ετικέτες νησιού χωριού αγρότη",
    free: "Δωρεάν",
    general: "Γενικός",
    ghostTown: "Πόλη φάντασμα",
    grepoTools: "GrepoTools",
    grepotoolsUpdateAvailable: "Διαθέσιμη ενημέρωση Grepotools",
    grepolisRank: "Βαθμός Grepolis",
    grepolisScore: "Σκορ Grepolis",
    grid: "Πλέγμα",
    heroIcon: "Εικονίδιο ήρωα στην επισκόπηση πόλης",
    hide: "Απόκρυψη",
    hour: "ώρα",
    inactiveTimePlayer: "Αδράνεια παίκτη (συνεργασία με GrepoData)",
    island: "Νησί",
    islandDataAvailable: "Δεδομένα νησιού διαθέσιμα. Νησί: ",
    islandEmptyNoMessage: "Το νησί είναι άδειο, δεν μπορεί να σταλεί μήνυμα",
    islandInformationWindow: "Παράθυρο πληροφοριών νησιού",
    islandLinkIslandInfo:
      "αριθμοί/ετικέτες νησιού ως σύνδεσμος προς τις πληροφορίες του νησιού",
    islandNoAllianceNoMessage:
      "Δεν υπάρχουν μέλη της συμμαχίας σε αυτό το νησί, δεν μπορεί να σταλεί μήνυμα",
    islandNumber: "Αριθμός νησιού",
    islandNumbersTags: "Αριθμοί / ετικέτες νησιού",
    islandOccupation: "Κατοχή νησιού",
    islandTag: "Ετικέτα νησιού",
    islandView: "Προβολή νησιού",
    joinBetaTesting: "Συμμετο",
    language: "Γλώσσα",
    mapTags: "Ετικέτες χάρτη",
    maxMembers: "Μέγιστος αριθμός μελών",
    member: "Μέλος",
    members: "Μέλη",
    message: "Μήνυμα",
    nightMode: "Λειτουργία νύχτας",
    noDataAvailable: "GrepoTools BBCode - Δεν υπάρχουν διαθέσιμα δεδομένα",
    noWrap: "Εμφάνιση μεγάλων ετικετών σε μία γραμμή",
    number: "Αριθμός",
    numberShort: "Αρ.",
    occupied: "Κατειλημμένο",
    ocean: "Ωκεανός",
    oceanGrid: "Πλέγμα ωκεανού",
    oceanNumbers: "Αριθμοί ωκεανού",
    of: "Του",
    otherScripts: "Άλλα σενάρια",
    page: "Σελίδα",
    pasteData: "Επικόλληση δεδομένων",
    player: "Παίκτης",
    playerDataAvailable: "Δεδομένα παίκτη διαθέσιμα. Παίκτης: ",
    playerName: "Όνομα παίκτη",
    playerRequired:
      "Ο παίκτης προστίθεται αυτόματα, αυτό το πεδίο είναι υποχρεωτικό",
    points: "Πόντοι",
    rank: "Βαθμός",
    resources: "Πόροι",
    rockIslandNumbers: "Αριθμοί βραχώδους νησιού",
    rockIslandNumbersTextColor: "Χρώμα κειμένου αριθμών βραχώδους νησιού",
    safe: "Αποθήκευση",
    safeAndReload: "Αποθήκευση και επαναφόρτωση",
    safeFail: "Οι ρυθμίσεις του GrepoTools δεν αποθηκεύτηκαν με επιτυχία",
    safeSuccess: "Οι ρυθμίσεις του GrepoTools αποθηκεύτηκαν με επιτυχία",
    script: "Σενάριο Grepolis GrepoTools",
    selectPage: "Επιλογή σελίδας:",
    sendMessageAlliance: "Αποστολή μηνύματος σε όλα τα μέλη της συμμαχίας",
    sendMessageIsland:
      "Αποστολή μηνύματος σε όλα τα μέλη της συμμαχίας στο νησί",
    settings: "Ρυθμίσεις",
    show: "Εμφάνιση",
    showInfoAboveTable: "Εμφάνιση των πληροφοριών παρακάτω πάνω από τον πίνακα",
    showInfoInTable: "Εμφάνιση των πληροφοριών παρακάτω στον πίνακα",
    silver: "Ασήμι",
    spellsHarborBarracks: "Μαγείες στο λιμάνι και στις στρατώνες",
    stone: "Πέτρα",
    strategicMap: "Στρατηγικός χάρτης",
    text: "κείμενο",
    to: "Προς",
    town: "Πόλη",
    townName: "Όνομα πόλης",
    townPoints: "Πόντοι πόλης",
    towns: "Πόλεις",
    update: "Ενημέρωση",
    version: "Έκδοση",
    whileScrolling: "κατά τη διάρκεια της κύλισης",
    wood: "Ξύλο",
    world: "Κόσμος",

    colors: {
      blue: "μπλε",
      brown: "καφέ",
      green: "πράσινο",
      grey: "γκρι",
      lightblue: "γαλάζιο",
      lightgreen: "ανοιχτό πράσινο",
      lightred: "ανοιχτό κόκκινο",
      pink: "ροζ",
      purple: "μωβ",
      red: "κόκκινο",
      white: "λευκό",
      yellow: "κίτρινο",
    },

    languages: {
      de: "Γερμανικά",
      en: "Αγγλικά",
      es: "Ισπανικά",
      fr: "Γαλλικά",
      gr: "Ελληνικά",
      nl: "Ολλανδικά",
      pl: "Πολωνικ",
      us: "Αμερικανικά",
    },
  },

  pl: {
    about: "O",
    active: "Aktywny",
    alliance: "Sojusz",
    allianceDataAvailable: "Dane sojuszu dostępne. Sojusz: ",
    allianceName: "Nazwa sojuszu",
    allianceNumberPlayers: "Liczba członków sojuszu",
    alliancePoints: "Punkty sojuszu",
    allianceRank: "Ranga sojuszu",
    and: "I",
    attackNotification: "Animuj ikonę przeglądarki podczas ataku",
    battlePoints: "Punkty bitewne",
    bbcodeAlliance: "Skopiuj informacje o wszystkich członkach sojuszu",
    bbcodeAllianceCopySucces:
      "BBCode - Informacje o sojuszu zostały skopiowane",
    bbcodeIsland: "Skopiuj informacje o tej wyspie",
    bbcodeIslandCopyFail:
      "BBCode - Wyspa jest pusta, informacje nie zostały skopiowane",
    bbcodeIslandCopySucces: "BBCode - Informacje o wyspie zostały skopiowane",
    bbcodePlayer: "Skopiuj informacje o tym graczu",
    bbcodePlayerCopySucces: "BBCode - Informacje o graczu zostały skopiowane",
    bbcodeWindowTitle: "GrepoTools - BBCode - Wklej dane",
    button: "Przycisk",
    changes: "Zmiany",
    cityRequired: "Miasto jest automatycznie dodawane, to pole jest wymagane",
    color: "Kolor",
    coordinates: "Współrzędne",
    day: "dzień",
    dayMode: "Tryb dnia",
    days: "dni",
    donation: "Darowizny",
    emptyColumn: "Pusta kolumna",
    farmerIslandNumbersTextColor: "Kolor tekstu numerów wysp rolników",
    farmerVillageIslandNumbers: "Numery wysp wioski rolników",
    farmerVillageIslandTags: "Tagi wysp wioski rolników",
    free: "Darmowy",
    general: "Ogólny",
    ghostTown: "Miasto duchów",
    grepoTools: "GrepoTools",
    grepotoolsUpdateAvailable: "Dostępna aktualizacja Grepotools",
    grepolisRank: "Ranga Grepolis",
    grepolisScore: "Wynik Grepolis",
    grid: "Siatka",
    heroIcon: "Ikona bohatera w przeglądzie miasta",
    hide: "Ukryj",
    hour: "godzina",
    inactiveTimePlayer: "Nieaktywność gracza (współpraca z GrepoData)",
    island: "Wyspa",
    islandDataAvailable: "Dane wyspy dostępne. Wyspa: ",
    islandEmptyNoMessage: "Wyspa jest pusta, nie można wysłać wiadomości",
    islandInformationWindow: "Okno informacji o wyspie",
    islandLinkIslandInfo: "numery/tagi wysp jako link do informacji o wyspie",
    islandNoAllianceNoMessage:
      "Na tej wyspie nie ma członków sojuszu, nie można wysłać wiadomości",
    islandNumber: "Numer wyspy",
    islandNumbersTags: "Numery / tagi wysp",
    islandOccupation: "Zajęcie wyspy",
    islandTag: "Tag wyspy",
    islandView: "Widok wyspy",
    joinBetaTesting: "Dołącz do programu testów beta",
    language: "Język",
    mapTags: "Tagi mapy",
    maxMembers: "Maksymalna liczba członków",
    member: "Członek",
    members: "Członkowie",
    message: "Wiadomość",
    nightMode: "Tryb nocny",
    noDataAvailable: "GrepoTools BBCode - Brak dostępnych danych",
    noWrap: "Pokaż duże tagi w jednej linii",
    number: "Numer",
    numberShort: "Nr",
    occupied: "Zajęty",
    ocean: "Ocean",
    oceanGrid: "Siatka oceanu",
    oceanNumbers: "Numery oceanu",
    of: "Z",
    otherScripts: "Inne skrypty",
    page: "Strona",
    pasteData: "Wklej dane",
    player: "Gracz",
    playerDataAvailable: "Dane gracza dostępne. Gracz: ",
    playerName: "Nazwa gracza",
    playerRequired: "Gracz jest automatycznie dodawany, to pole jest wymagane",
    points: "Punkty",
    rank: "Ranga",
    resources: "Zasoby",
    rockIslandNumbers: "Numery skalistych wysp",
    rockIslandNumbersTextColor: "Kolor tekstu numerów skalistych wysp",
    safe: "Zapisz",
    safeAndReload: "Zapisz i przeładuj",
    safeFail: "Ustawienia GrepoTools nie zostały pomyślnie zapisane",
    safeSuccess: "Ustawienia GrepoTools zostały pomyślnie zapisane",
    script: "Skrypt Grepolis GrepoTools",
    selectPage: "Wybierz stronę:",
    sendMessageAlliance: "Wyślij wiadomość do wszystkich członków sojuszu",
    sendMessageIsland:
      "Wyślij wiadomość do wszystkich członków sojuszu na wyspie",
    settings: "Ustawienia",
    show: "Pokaż",
    showInfoAboveTable: "Pokaż informacje poniżej nad tabelą",
    showInfoInTable: "Pokaż informacje poniżej w tabeli",
    silver: "Srebro",
    spellsHarborBarracks: "Zaklęcia w porcie i koszarach",
    stone: "Kamień",
    strategicMap: "Mapa strategiczna",
    text: "tekst",
    to: "Do",
    town: "Miasto",
    townName: "Nazwa miasta",
    townPoints: "Punkty miasta",
    towns: "Miasta",
    update: "Aktualizacja",
    version: "Wersja",
    whileScrolling: "podczas przewijania",
    wood: "Drewno",
    world: "Świat",

    colors: {
      blue: "niebieski",
      brown: "brązowy",
      green: "zielony",
      grey: "szary",
      lightblue: "jasnoniebieski",
      lightgreen: "jasnozielony",
      lightred: "jasnoczerwony",
      pink: "różowy",
      purple: "fioletowy",
      red: "czerwony",
      white: "biały",
      yellow: "żółty",
    },

    languages: {
      de: "Niemiecki",
      en: "Angielski",
      es: "Hiszpański",
      fr: "Francuski",
      gr: "Grecki",
      nl: "Holenderski",
      pl: "Polski",
      us: "Amerykański",
    },
  },

  es: {
    about: "Acerca de",
    active: "Activo",
    alliance: "Alianza",
    allianceDataAvailable: "Datos de la alianza disponibles. Alianza: ",
    allianceName: "Nombre de la alianza",
    allianceNumberPlayers: "Número de miembros de la alianza",
    alliancePoints: "Puntos de la alianza",
    allianceRank: "Rango de la alianza",
    and: "Y",
    attackNotification: "Animar el icono del navegador durante un ataque",
    battlePoints: "Puntos de batalla",
    bbcodeAlliance: "Copiar la información de todos los miembros de la alianza",
    bbcodeAllianceCopySucces: "BBCode - Información de la alianza copiada",
    bbcodeIsland: "Copiar la información de esta isla",
    bbcodeIslandCopyFail:
      "BBCode - La isla está vacía, la información no se copió",
    bbcodeIslandCopySucces: "BBCode - Información de la isla copiada",
    bbcodePlayer: "Copiar la información de este jugador",
    bbcodePlayerCopySucces: "BBCode - Información del jugador copiada",
    bbcodeWindowTitle: "GrepoTools - BBCode - Pegar datos",
    button: "Botón",
    changes: "Cambios",
    cityRequired:
      "La ciudad se agrega automáticamente, este campo es obligatorio",
    color: "Color",
    coordinates: "Coordenadas",
    day: "día",
    dayMode: "Modo día",
    days: "días",
    donation: "Donaciones",
    emptyColumn: "Columna vacía",
    farmerIslandNumbersTextColor:
      "Color del texto de los números de la isla del granjero",
    farmerVillageIslandNumbers: "Números de la isla del pueblo del granjero",
    farmerVillageIslandTags: "Etiquetas de la isla del pueblo del granjero",
    free: "Gratis",
    general: "General",
    ghostTown: "Ciudad fantasma",
    grepoTools: "GrepoTools",
    grepotoolsUpdateAvailable: "Actualización de Grepotools disponible",
    grepolisRank: "Rango de Grepolis",
    grepolisScore: "Puntuación de Grepolis",
    grid: "Cuadrícula",
    heroIcon: "Icono del héroe en la vista de la ciudad",
    hide: "Ocultar",
    hour: "hora",
    inactiveTimePlayer: "Inactividad del jugador (colaboración con GrepoData)",
    island: "Isla",
    islandDataAvailable: "Datos de la isla disponibles. Isla: ",
    islandEmptyNoMessage: "La isla está vacía, no se puede enviar un mensaje",
    islandInformationWindow: "Ventana de información de la isla",
    islandLinkIslandInfo:
      "números/etiquetas de la isla como enlace a la información de la isla",
    islandNoAllianceNoMessage:
      "No hay miembros de la alianza en esta isla, no se puede enviar un mensaje",
    islandNumber: "Número de la isla",
    islandNumbersTags: "Números / etiquetas de la isla",
    islandOccupation: "Ocupación de la isla",
    islandTag: "Etiqueta de la isla",
    islandView: "Vista de la isla",
    joinBetaTesting: "Unirse al programa de pruebas beta",
    language: "Idioma",
    mapTags: "Etiquetas del mapa",
    maxMembers: "Número máximo de miembros",
    member: "Miembro",
    members: "Miembros",
    message: "Mensaje",
    nightMode: "Modo nocturno",
    noDataAvailable: "GrepoTools BBCode - No hay datos disponibles",
    noWrap: "Mostrar etiquetas grandes en una línea",
    number: "Número",
    numberShort: "No",
    occupied: "Ocupado",
    ocean: "Océano",
    oceanGrid: "Cuadrícula del océano",
    oceanNumbers: "Números del océano",
    of: "De",
    otherScripts: "Otros scripts",
    page: "Página",
    pasteData: "Pegar datos",
    player: "Jugador",
    playerDataAvailable: "Datos del jugador disponibles. Jugador: ",
    playerName: "Nombre del jugador",
    playerRequired:
      "El jugador se agrega automáticamente, este campo es obligatorio",
    points: "Puntos",
    rank: "Rango",
    resources: "Recursos",
    rockIslandNumbers: "Números de la isla rocosa",
    rockIslandNumbersTextColor:
      "Color del texto de los números de la isla rocosa",
    safe: "Guardar",
    safeAndReload: "Guardar y recargar",
    safeFail: "La configuración de GrepoTools no se ha guardado correctamente",
    safeSuccess: "La configuración de GrepoTools se ha guardado correctamente",
    script: "Script de Grepolis GrepoTools",
    selectPage: "Seleccionar página:",
    sendMessageAlliance: "Enviar mensaje a todos los miembros de la alianza",
    sendMessageIsland:
      "Enviar mensaje a todos los miembros de la alianza en la isla",
    settings: "Configuraciones",
    show: "Mostrar",
    showInfoAboveTable: "Mostrar la información a continuación sobre la tabla",
    showInfoInTable: "Mostrar la información a continuación en la tabla",
    silver: "Plata",
    spellsHarborBarracks: "Hechizos en el puerto y cuarteles",
    stone: "Piedra",
    strategicMap: "Mapa estratégico",
    text: "texto",
    town: "Ciudad",
    to: "A",
    townName: "Nombre de la ciudad",
    townPoints: "Puntos de la ciudad",
    towns: "Ciudades",
    update: "Actualizar",
    version: "Versión",
    whileScrolling: "mientras se desplaza",
    wood: "Madera",
    world: "Mundo",

    colors: {
      blue: "azul",
      brown: "marrón",
      green: "verde",
      grey: "gris",
      lightblue: "azul claro",
      lightgreen: "verde claro",
      lightred: "rojo claro",
      pink: "rosa",
      purple: "púrpura",
      red: "rojo",
      white: "blanco",
      yellow: "amarillo",
    },

    languages: {
      de: "Alemán",
      en: "Inglés",
      es: "Español",
      fr: "Francés",
      gr: "Griego",
      nl: "Holandés",
      pl: "Polaco",
      us: "Americano",
    },
  },

  init() {
    language.loadSettings();

    if (
      !language.languages.includes(language.settingActiveLanguage) ||
      !language.settingActiveLanguage
    ) {
      language.settingActiveLanguage = "en";
    }

    language.us = language.en;
  },

  loadSettings() {
    const settingsKeys = [{ key: "settingActiveLanguage", default: "en" }];

    settingsKeys.forEach(({ key, default: defaultValue }) => {
      this[key] = settings.loadSetting(
        `${Game.world_id}|${this.module}.${key}`,
        defaultValue
      );
    });
  },

  safeSetting(setting) {
    const settingsKeys = {
      settingActiveLanguage: language.settingActiveLanguage,
    };

    if (settingsKeys.hasOwnProperty(setting)) {
      settings.safeSetting(
        `${Game.world_id}|${language.module}.${setting}`,
        settingsKeys[setting]
      );
    }
  },

  setActiveLanguage() {
    language.settingActiveLanguage = language.dropdownValueNewLanguage;
    language.safeSetting("settingActiveLanguage");

    HumanMessage.success(language[language.settingActiveLanguage].safeSuccess);

    setTimeout(function () {
      window.location.reload();
    }, 1000);
  },
};


// module script
// Discrption: this module will initialize the script and render the modules
// Last Updated: 2024/12/29

let script = {
  async startUp() {
    await version.getScriptVersionData();
    version.getScriptVersions();

    language.init();

    console.log(
      `%cGrepolis Grepotools Script: ${
        language[language.settingActiveLanguage].active
      }| ${language[language.settingActiveLanguage].version}: ${
        GM_info.script.version
      } ${version.release} | ${
        language[language.settingActiveLanguage].world
      }: ${Game.world_id} | ${
        language[language.settingActiveLanguage].language
      }: ${
        language.settingActiveLanguage
      } \nDiscord: https://discord.com/invite/K4jV7hFSRu`,
      `color: green; font-size: 1em; font-weight: bolder;`
    );

    script.initInterval = setInterval(script.modulesInit, 500);
    script.renderInterval = setInterval(script.modulesRenderActions, 250);
    script.versionUpdateInterval = setInterval(version.checkUpdate, 10000);
  },

  modulesInit() {
    modulesInit.forEach((module) => module.init());
    clearInterval(script.initInterval);
  },

  modulesRenderActions() {
    $.each(Layout.wnd.getAllOpen(), function (ind, elem) {
      let window = elem.getController();
      switch (window) {
        case "player":
          settingsMenu.addSettingsLinkToMenu(); // Grepolis settingsmenu
          bbcodeCopyPlayer.animate(); // Grepolis bbcode player
          break;
        case "island_info":
          bbcodeCopyIsland.animate();
          messageIsland.animate();
          break;
        case "town_info":
          bbcodeCopyPlayer.animate();
          break;
        case "alliance":
          bbcodeCopyAlliance.animate();
          messageAlliance.animate();
          break;
        case "building_barracks":
          spells.render();
          break;
        case "building_docks":
          spells.render();
          break;
        case "alliance_forum":
          bbcodePaste.render();
          break;
        case "message":
          bbcodePaste.render();
          break;
        default:
          break;
      }
    });

    // check for notes window
    if ($(".notes_container").get(0)) {
      bbcodePaste.render();
    }

    // check for farm towns window
    if ($(".farm_towns").get(0)) {
    }

    ocean.visibleOnScreen();
    modulesAnimate.forEach((module) => module.animate());
  },
};


// module main
// Discrption: this module will initialize and startup the main script
// Last Updated: 2025/01/05

const uw = unsafeWindow || window;
const $ = uw.jQuery || jQuery;

let grepolisLoaded = false;

const modulesInit = [
  statistics,
  externalData,
  version,
  settingsMenu,
  otherScripts,
  oceanGrid,
  oceanNumbers,
  islandNumbers,
  coordinatesGrid,
  coordinates,
  mapTags,
  nightMode,
  attackNotification,
  spells,
  bbcodePaste,
  bbcodeCopyAlliance,
  bbcodePasteAlliance,
  bbcodeCopyIsland,
  bbcodePasteIsland,
  bbcodeCopyPlayer,
  bbcodePastePlayer,
  messageAlliance,
  messageIsland,
];

const modulesAnimate = [
  oceanGrid,
  oceanNumbers,
  islandNumbers,
  mapTags,
  coordinatesGrid,
  attackNotification,
];

$(function () {
  const intervalId = setInterval(function () {
    const loaderContent = $("#loader_content").get(0);
    if (!loaderContent) {
      grepolisLoaded = true;
      script.startUp();
      clearInterval(intervalId);
    }
  }, 50);
});


