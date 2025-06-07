// ==UserScript==
// @name         Grepolis Manager
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Popup + modules: startscherm, feesten, troops, forum, enz.
// @author       Zambia1972
// @match        *://*.grepolis.com/*
// @grant        none
// ==/UserScript==

// --- styles.js ---
const style = document.createElement('style');
style.textContent = `...CSS HIER...`;
document.head.appendChild(style);

// --- popup.js ---
function showStartscreenPopup() {
  let popup = document.getElementById('gm-popup');
  if (!popup) {
    popup = document.createElement('div');
    popup.id = 'gm-popup';
    popup.innerHTML = `...`;
    document.body.appendChild(popup);
  }
  popup.style.display = 'block';
}

// --- attackRangeHelper.js ---
function startAttackRangeHelper(isActive) {
  console.log("AttackRangeHelper: ", isActive);
}

// --- ui.js ---
function initializeButtons() {
  // Maak buttons aan, koppel aan functies zoals: showStartscreenPopup()
}

// --- main.js ---
(function () {
  'use strict';
  initializeButtons();
})();
