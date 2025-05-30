// modules/chat/toolbar.js

(function () {
  'use strict';

  function createBBCodeToolbar(textarea) {
    const toolbar = document.createElement('div');
    toolbar.style.display = 'flex';
    toolbar.style.flexWrap = 'wrap';
    toolbar.style.gap = '6px';
    toolbar.style.marginBottom = '6px';

    const buttons = [
      { tag: 'b', label: 'B' },
      { tag: 'i', label: 'I' },
      { tag: 'u', label: 'U' },
      { tag: 's', label: 'S' },
      { tag: 'quote', label: '""' },
      { tag: 'url', label: '🔗' },
      { tag: 'img', label: '🖼️' },
    ];

    buttons.forEach(({ tag, label }) => {
      const btn = document.createElement('button');
      btn.textContent = label;
      btn.title = tag;
      btn.style.padding = '2px 6px';
      btn.style.background = '#444';
      btn.style.color = '#fff';
      btn.style.border = 'none';
      btn.style.borderRadius = '4px';
      btn.style.cursor = 'pointer';

      btn.addEventListener('click', () => {
        insertBBCode(textarea, `[${tag}]`, `[/${tag}]`);
      });

      toolbar.appendChild(btn);
    });

    return toolbar;
  }

  function insertBBCode(textarea, startTag, endTag) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.substring(start, end);
    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(end);
    const insert = `${startTag}${selected}${endTag}`;
    textarea.value = before + insert + after;
    textarea.focus();
    textarea.setSelectionRange(start + startTag.length, start + startTag.length + selected.length);
  }

  window.createBBCodeToolbar = createBBCodeToolbar;
})();
