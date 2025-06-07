(function () {
    'use strict';

    window.injectGlobalStyles = function () {
        if (document.getElementById('gm-styles')) return; // voorkom dubbele injectie

        const style = document.createElement('style');
        style.id = 'gm-styles';
        style.innerHTML = `
            .gm-toggle-button {
              width: 40px;
              height: 20px;
              background-size: cover;
              background-position: center;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
            }
        
            #gm-button-bar {
              position: fixed;
              top: 10px;
              left: 350px; /* aangepast van 180px naar 350px */
              z-index: 9999;
              display: flex;
              gap: 5px;
            }
        
            #gm-popup {
              position: fixed;
              top: 50%;
              left: 50%;
              width: 800px;
              height: 600px;
              transform: translate(-50%, -50%);
              background: #1e1e1e;
              border: 2px solid #FF0000;
              border-radius: 10px;
              padding: 20px;
              color: white;
              z-index: 10000;
              box-shadow: 0 0 15px #FF0000;
              overflow-y: auto;
            }
        
            #gm-popup h2 {
              margin-top: 0;
              color: #FF0000;
              text-align: center;
            }
        
            #gm-popup ul {
              list-style: none;
              padding: 0;
            }
        
            #gm-popup ul li {
              margin: 8px 0;
            }
        
            #gm-popup a {
              color: #FFCC00;
              text-decoration: none;
            }
        
            #gm-popup a:hover {
              text-decoration: underline;
            }
      `;
      document.head.appendChild(style);
    };
})();
