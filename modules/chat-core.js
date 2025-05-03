// Basic live chat with Firebase
const chatBox = document.createElement('div');
chatBox.id = 'gm-chat-box';
chatBox.style = 'position:fixed;bottom:20px;right:20px;width:300px;height:200px;overflow:auto;background:#222;color:white;padding:10px;z-index:9999;font-size:12px';
document.body.appendChild(chatBox);

const input = document.createElement('input');
input.style = 'width:80%;padding:5px';
chatBox.appendChild(input);

const send = document.createElement('button');
send.textContent = 'Send';
send.style = 'width:15%;margin-left:5px';
chatBox.appendChild(send);

const messagesRef = GMFirebase.ref(GMFirebase.db, "messages");

GMFirebase.onValue(messagesRef, (snapshot) => {
    const data = snapshot.val();
    chatBox.innerHTML = '';
    for (let key in data) {
        const msg = document.createElement('div');
        msg.textContent = data[key].text;
        chatBox.appendChild(msg);
    }
    chatBox.appendChild(input);
    chatBox.appendChild(send);
});

send.onclick = () => {
    const msg = input.value;
    if (msg) {
        GMFirebase.push(messagesRef, {{ text: msg, timestamp: Date.now() }});
        input.value = '';
    }
};
