// modules/chat/firebase.js

(function() {
  'use strict';

  const firebaseConfig = {
    apiKey: "AIzaSyDDrzMwH87tLO5tKGORcPSDpg6UdVIFX9U",
    authDomain: "grepochat-ff097.firebaseapp.com",
    projectId: "grepochat-ff097",
    storageBucket: "grepochat-ff097.appspot.com",
    messagingSenderId: "855439763418",
    appId: "1:855439763418:web:7d567af9844bd1d72d02e3"
  };

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log('[Firebase] Verbonden met GrepoChat');
  }

  window.grepoFirebase = firebase;
})();

