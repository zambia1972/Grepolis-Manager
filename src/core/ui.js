// ui.js - Beheert de 6 hoofdbuttons en de popup

let buttonStates = [false, false, false, false, false, false];
const buttonIcons = [
  'icioon-GM.png',  // Button 1
  'icon-2.png',
  'icon-3.png',
  'icon-4.png',
  'icon-5.png',
  'icon-6.png',
];

export function initializeButtons() {
  const container = document.createElement('div');
  container.id = 'gm-button-bar';
  container.style.cssText = `
    position: fixed;
    top: 10px;
    left: 180px;
    z-index: 9999;
    display: flex;
    gap: 5px;
  `;

  for (let i = 0; i < 6; i++) {
    const button = document.createElement('div');
    button.className = 'gm-toggle-button';
    button.dataset.index = i;
    button.style.backgroundImage = 'url("https://raw.githubusercontent.com/zambia1972/Grepolis-Manager/main/icons/button-off.png")';

    const icon = document.createElement('img');
    icon.src = `https://raw.githubusercontent.com/zambia1972/Grepolis-Manager/main/icons/${buttonIcons[i]}`;
    icon.style.height = '16px';
    icon.style.pointerEvents = 'none';
    button.appendChild(icon);

    button.addEventListener('click', () => {
      toggleButtonState(i, button);
      if (i === 0) showPopup(); // alleen eerste knop opent popup
    });

    container.appendChild(button);
  }

  document.body.appendChild(container);
}

function toggleButtonState(index, button) {
  buttonStates[index] = !buttonStates[index];
  button.style.backgroundImage = buttonStates[index]
    ? 'url("https://raw.githubusercontent.com/zambia1972/Grepolis-Manager/main/icons/button-on.png")'
    : 'url("https://raw.githubusercontent.com/zambia1972/Grepolis-Manager/main/icons/button-off.png")';
}

function showPopup() {
  let popup = document.getElementById('gm-popup');
  if (!popup) {
    popup = document.createElement('div');
    popup.id = 'gm-popup';
    popup.innerHTML = `
      <div class="gm-popup-content">
        <h2>Grepolis Manager Startscherm</h2>
        <p>Download hier handige scripts voor Grepolis:</p>
        <ul>
          <li><a href="https://www.grepotools.nl/script/stable/grepotools.user.js" target="_blank">Grepotools</a></li>
          <li><a href="https://dio-david1327.github.io/DIO-TOOLS-David1327/code.user.js" target="_blank">DIO-Tools</a></li>
          <li><a href="https://www.grcrt.net/scripts/GrepolisReportConverterV2.user.js" target="_blank">GRCRTools</a></li>
        </ul>
      </div>
    `;
    document.body.appendChild(popup);
  }
  popup.style.display = 'block';
}