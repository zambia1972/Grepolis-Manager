
const firebaseConfig = {
    apiKey: "AIzaSyCF-b6jIFQ6mqlaqwagI2BSVtpPlmu9nEc",
    authDomain: "grepolis-chat-firebase.firebaseapp.com",
    databaseURL: "https://grepolis-chat-firebase-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "grepolis-chat-firebase",
    storageBucket: "grepolis-chat-firebase.appspot.com",
    messagingSenderId: "278773055009",
    appId: "1:278773055009:web:ff1c70d26fc401a6966d60"
};


// Initialize Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getDatabase, ref, onValue, set, push, remove } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

window.GMFirebase = { db, ref, onValue, set, push, remove };
console.log("Firebase initialized");
