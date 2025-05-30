// modules/chat/parser.js

(function() {
  'use strict';

  function parseBBCode(text) {
    if (!text) return '';

    const escape = (str) => str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    let out = text;

    const rules = [
      { regex: /\[b\](.*?)\[\/b\]/gis, replacement: '<strong>$1</strong>' },
      { regex: /\[i\](.*?)\[\/i\]/gis, replacement: '<em>$1</em>' },
      { regex: /\[u\](.*?)\[\/u\]/gis, replacement: '<u>$1</u>' },
      { regex: /\[s\](.*?)\[\/s\]/gis, replacement: '<s>$1</s>' },
      { regex: /\[url=(.*?)\](.*?)\[\/url\]/gis, replacement: '<a href="$1" target="_blank">$2</a>' },
      { regex: /\[img\](.*?)\[\/img\]/gis, replacement: '<img src="$1" style="max-width:100%; height:auto;">' },
      { regex: /\[color=(.*?)\](.*?)\[\/color\]/gis, replacement: '<span style="color:$1;">$2</span>' },
      { regex: /\[size=(\d+)\](.*?)\[\/size\]/gis, replacement: '<span style="font-size:$1px;">$2</span>' },
      { regex: /\[quote\](.*?)\[\/quote\]/gis, replacement: '<blockquote>$1</blockquote>' },
      { regex: /\[center\](.*?)\[\/center\]/gis, replacement: '<div style="text-align:center;">$1</div>' },
    ];

    for (const rule of rules) {
      out = out.replace(rule.regex, rule.replacement);
    }

    return out.replace(/\n/g, '<br>');
  }

  window.parseBBCode = parseBBCode;
})();

