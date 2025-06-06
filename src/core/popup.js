// popup.js - popup voor startscherm (button 1)

export function showStartscreenPopup() {
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
