// modules/chat/autocomplete.js

(function () {
  'use strict';

  async function fetchAutocomplete(type, term) {
    const url = `/autocomplete?what=game_${type}&term=${encodeURIComponent(term)}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return [];
    }
  }

  function showAutocomplete(textarea, type) {
    const popup = document.createElement('div');
    popup.style.position = 'absolute';
    popup.style.background = '#222';
    popup.style.border = '1px solid #555';
    popup.style.padding = '4px';
    popup.style.zIndex = 9999;
    popup.style.width = '250px';

    const input = document.createElement('input');
    input.placeholder = `Zoek ${type}...`;
    input.style.width = '100%';
    popup.appendChild(input);

    const list = document.createElement('div');
    list.style.maxHeight = '120px';
    list.style.overflowY = 'auto';
    popup.appendChild(list);

    document.body.appendChild(popup);
    const rect = textarea.getBoundingClientRect();
    popup.style.top = `${rect.bottom + window.scrollY}px`;
    popup.style.left = `${rect.left + window.scrollX}px`;
    input.focus();

    input.oninput = async () => {
      const val = input.value.trim();
      if (val.length < 2) return;
      const results = await fetchAutocomplete(type, val);
      list.innerHTML = '';
      results.forEach(([name]) => {
        const item = document.createElement('div');
        item.textContent = name;
        item.style.padding = '4px';
        item.style.cursor = 'pointer';
        item.onclick = () => {
          textarea.value += `[${type}]${name}[/${type}]`;
          popup.remove();
        };
        list.appendChild(item);
      });
    };
  }

  window.showAutocomplete = showAutocomplete;
})();
