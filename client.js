var name;
var connectedUser;
var conn = new WebSocket('ws://localhost:9090');

conn.onopen = function() {
    console.log("Connected to signalling server.");
}

// When message is received from the signalling server
conn.onmessage = function (msg) {
    console.log("Got message: ", msg.data);
    console.log(msg);
    var data = msg;
    //var data = JSON.parse(msg);

    switch (data.type) {
        case "login":
            handleLogin(data.success);
            break;

        case "offer":
            handleOffer(data.offer, data.name);
            break;

        case "answer":
            handleAnswer(data.answer);
            break;

        case "candidate":
            handleCandidate(data.candidate);
            break;

        case "leave":
            handleLeave();
            break;
    
        default:
            break;
    }
}

conn.onerror = function(err) {
    console.error("Error: ", err);    
}

// alias for sending JSON encoded message
function sendMessage(message) {
    if (connectedUser) {
        message.name = connectedUser;
    }

    conn.send(JSON.stringify(message));
}