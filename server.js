var WebSocketServer = require('ws').Server;

var wss = new WebSocketServer({port:9090});

// users list
var users = {};

// When user connects to server
wss.on('connection', function(connection){
    console.log('user connected');

    // When a user arrives
    connection.on('message', function(message) {
        console.log("Got message from a user", message);

        var data;
         try {
            data =  JSON.parse(message);   
         } catch(e) {
            console.log("Invalid JSON");
            data = {}
         }
         
         //switching type of user message
         switch (data.type) {
             case "login":
                 console.log("User logged: ", data.name);
                 // refuse if already logged in
                 if (users[data.name]) {
                     sendTo(connection, {
                         type: "login",
                         success: false
                     })
                 } else {
                     // save user connction on server
                     users[data.name] = connection;
                     connection.name = data.name;

                     sendTo(connection, {
                         type: "login",
                         success: true
                     });
                 }  

                 break;

             case "offer":
                 console.log("Sending offer to ", data.name);
                 var conn = users[data.name];
                 if (conn != null) {
                     connection.otherName = data.name;

                     sendTo(conn, {
                        type: "offer",
                        offer: data.offer,
                        name: connection.name
                     });
                 }
                 break;

             case "answer":
                 console.log("Sending answer to: ", data.name);
                 var conn = users[data.name];
                 if (conn != null) {
                     connection.otherName = data.name;
                     sendTo(conn, {
                         type: "answer",
                         answer: data.answer
                     })
                 }
                 break;

             case "candidate":
                 console.log("Sending candidate to: ", data.name);
                 var conn = users[data.name];

                 if (conn != null) {
                     sendTo(conn, {
                         type: "candidate",
                         candidate: data.candidate
                     })
                 }
                 break;

             case "leave":
                 console.log("Disconnecting from ", data.name);
                 var conn = users[data.name];
                 conn.otherName = null;

                 if (conn != null) {
                     sendTo(conn, {
                         type: "leave"
                     });
                 }
                 break;
         
             default:
                 sendTo(connection, {
                     type: "error",
                     message: "Command not found: "+ data.type
                 });
                 break;
         }

    });

    connection.on("close", function() {
        console.log(connection);
        
        if (connection.name) {
            delete users[connection.name];
            if (connection.otherName) {
                console.log("Disconnecting from ", connection.otherName);
                var conn = users[connection.otherName];
                conn.otherName = null;

                if (conn != null) {
                    sendTo(conn, {
                        type: "leave"
                    })
                }
            }
        }
    });

    connection.send("Hello from Server");

});

function sendTo(connection, message) {
    connection.send(JSON.stringify(message));
    //connection.send(message);
    console.log("sent..........", JSON.stringify(message));
}