// ui.js - Beheert de 7 hoofdbuttons en de popup + modules

import { showStartscreenPopup } from './popup.js';
import { startAttackRangeHelper } from '../modules/attackRangeHelper.js';
import { startFeestenManager } from '../modules/feestenManager.js';
import { startTroopManager } from '../modules/troopManager.js';
import { startForumManager } from '../modules/forumManager.js';

let buttonStates = Array(7).fill(false);
const buttonIcons = [
  'icioon-GM.png',                  // Button 1 - Startscherm
  'icioon-attackrange-helper.png',  // Button 2 - AttackRangeHelper
  'icioon-Feesten-manager.png',     // Button 3 - Feesten
  'icioon-chat.png',                // Button 4 - Chat (nog niet gekoppeld)
  'icioon-troop-counter.png',       // Button 5 - TroopCounter
  'icioon-Kaart.png',               // Button 6 - Kaart (nog niet gekoppeld)
  'icioon-fora-en-topics.png'       // Button 7 - ForumManager
];

export function initializeButtons(callbacks) {
  const container = document.createElement('div');
  container.id = 'gm-button-bar';
  container.style.cssText = 'position: fixed; top: 5px; left: 330px; z-index: 9999; display: flex; gap: 0px;';

  callbacks.forEach((callback, i) => {
    const button = document.createElement('div');
    button.className = 'gm-toggle-button';
    button.dataset.index = i;
    button.style.backgroundImage = 'url("https://raw.githubusercontent.com/zambia1972/Grepolis-Manager/main/icons/button-off.png")';

    const icon = document.createElement('img');
    icon.src = `https://raw.githubusercontent.com/zambia1972/Grepolis-Manager/main/icons/${buttonIcons[i]}`;
    icon.style.height = '16px';
    icon.style.pointerEvents = 'none';
    button.appendChild(icon);

    let active = false;
    button.addEventListener('click', () => {
      active = !active;
      button.style.backgroundImage = active
        ? 'url("https://raw.githubusercontent.com/zambia1972/Grepolis-Manager/main/icons/button-on.png")'
        : 'url("https://raw.githubusercontent.com/zambia1972/Grepolis-Manager/main/icons/button-off.png")';
      if (typeof callback === 'function') callback(active);
    });
  container.appendChild(button);
  });

  document.body.appendChild(container);
}

function toggleButtonState(index, button) {
  buttonStates[index] = !buttonStates[index];
  button.style.backgroundImage = buttonStates[index]
    ? 'url("https://raw.githubusercontent.com/zambia1972/Grepolis-Manager/main/icons/button-on.png")'
    : 'url("https://raw.githubusercontent.com/zambia1972/Grepolis-Manager/main/icons/button-off.png")';
}

function handleModule(index, isActive) {
  switch (index) {
    case 0:
      showStartscreenPopup();
      break;
    case 1:
      startAttackRangeHelper(isActive);
      break;
    case 2:
      startFeestenManager(isActive);
      break;
    case 4:
      startTroopManager(isActive);
      break;
    case 6:
      startForumManager(isActive);
      break;
    default:
      console.log(`Button ${index + 1} is (nog) niet gekoppeld aan een module.`);
  }
}
