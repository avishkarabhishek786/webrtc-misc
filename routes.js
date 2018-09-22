const express = require('express');
const router = express.Router();

// users list
var users = {};

function sendTo(socket, message) {
    socket.emit("message", JSON.stringify(message));
    console.log("sent..........", JSON.stringify(message));
}

router.get('/', (req, res)=>{
    res.render('index.ejs', {
        data: {},
        errors: {},
        title: 'WebRTC.'
    })
})

module.exports = function(io) {

// When user connects to server
io.on('connection', function(socket){
    console.log('user connected');

    // When a user arrives
    socket.on('message', function(message) {
        console.log("Got message from a user ", message);

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
                     sendTo(socket, {
                         type: "login",
                         success: false
                     })
                 } else {
                     // save user connction on server
                     users[data.name] = socket;
                     socket.name = data.name;

                     sendTo(socket, {
                         type: "login",
                         success: true
                     });
                 }  

                 break;

             case "offer":
                 console.log("Sending offer to ", data.name);
                 var conn = users[data.name];
                 if (conn != null) {
                     socket.otherName = data.name;

                     sendTo(conn, {
                        type: "offer",
                        offer: data.offer,
                        name: socket.name
                     });
                 }
                 break;

             case "answer":
                 console.log("Sending answer to: ", data.name);
                 var conn = users[data.name];
                 if (conn != null) {
                     socket.otherName = data.name;
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
                 sendTo(socket, {
                     type: "error",
                     message: "Command not found: "+ data.type
                 });
                 break;
         }

    });

    socket.on("close", function() {
        console.log(socket);
        
        if (socket.name) {
            delete users[socket.name];
            if (socket.otherName) {
                console.log("Disconnecting from ", socket.otherName);
                var conn = users[socket.otherName];
                conn.otherName = null;

                if (conn != null) {
                    sendTo(conn, {
                        type: "leave"
                    })
                }
            }
        }
    });

    socket.send({"data":"Hello from Server"});

});
    return router;
}