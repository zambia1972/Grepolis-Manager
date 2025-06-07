(function () {
    'use strict';

    window.initializeButtons = function (callbacks) {
        if (document.getElementById('gm-button-container')) return; // voorkom dubbele weergave

        const container = document.createElement('div');
        container.id = 'gm-button-container';

        const labels = [
            'Startscherm',
            'AttackRange',
            'Feesten',
            'Chat',
            'TroopManager',
            'Kaart',
            'Forum'
        ];

        callbacks.forEach((callback, index) => {
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
        container.appendChild(btn);
        });
    };
})();
