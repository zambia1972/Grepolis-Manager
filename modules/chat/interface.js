// modules/chat/interface.js

(function () {
  'use strict';

  function setupGrepoChatInterface() {
    if (document.getElementById('grepochat-container')) return;

    const container = document.createElement('div');
    container.id = 'grepochat-container';
    container.style = `
      position: fixed;
      bottom: 100px;
      right: 30px;
      width: 360px;
      height: 480px;
      background: #2f3136;
      border: 2px solid #444;
      border-radius: 8px;
      color: white;
      font-family: sans-serif;
      z-index: 9999;
      display: flex;
      flex-direction: column;
    `;

    const header = document.createElement('div');
    header.textContent = 'GrepoChat';
    header.style = 'padding: 8px; background: #202225; font-weight: bold;';
    container.appendChild(header);

    const messages = document.createElement('div');
    messages.id = 'grepochat-messages';
    messages.style = 'flex: 1; padding: 8px; overflow-y: auto; font-size: 13px;';
    container.appendChild(messages);

    const inputArea = document.createElement('div');
    inputArea.style = 'padding: 8px; border-top: 1px solid #444;';

    const textarea = document.createElement('textarea');
    textarea.id = 'grepochat-input';
    textarea.rows = 2;
    textarea.style = 'width: 100%; resize: none;';
    inputArea.appendChild(textarea);

    const toolbar = window.createBBCodeToolbar(textarea);
    inputArea.insertBefore(toolbar, textarea);

    const sendBtn = document.createElement('button');
    sendBtn.textContent = 'Verstuur';
    sendBtn.style = 'margin-top: 4px; float: right;';
    sendBtn.onclick = () => {
      const raw = textarea.value.trim();
      if (!raw) return;
      const div = document.createElement('div');
      div.innerHTML = window.parseBBCode(raw);
      messages.appendChild(div);
      textarea.value = '';
      messages.scrollTop = messages.scrollHeight;
    };

    inputArea.appendChild(sendBtn);
    container.appendChild(inputArea);

    document.body.appendChild(container);
  }

  window.setupGrepoChatInterface = setupGrepoChatInterface;
})();
