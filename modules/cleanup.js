// Auto-delete messages older than 3 days
setInterval(() => {
    const now = Date.now();
    const ref = GMFirebase.ref(GMFirebase.db, "messages");
    GMFirebase.onValue(ref, (snapshot) => {
        const data = snapshot.val();
        for (let key in data) {
            if (now - data[key].timestamp > 259200000) { // 3 days
                GMFirebase.remove(GMFirebase.ref(GMFirebase.db, "messages/" + key));
            }
        }
    });
}, 60000); // Check every minute
