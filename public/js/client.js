var name;
var connectedUser;
var conn = new WebSocket('ws://localhost:9090');

conn.onopen = function() {
    console.log("Connected to signalling server.");
}

// When message is received from the signalling server
conn.onmessage = function (msg) {
    console.log("Got messageeeee: ", msg.data);

    try {
        var data = JSON.parse(msg.data);
    } catch(e) {
        var data = msg.data;
    }    

    switch (data.type) {
        case "login":
            console.log("login started...");
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
function send(message) {
    if (connectedUser) {
        message.name = connectedUser;
    }

    conn.send(JSON.stringify(message));
}

//UI selectors block
var loginPage = document.querySelector('#loginPage');
var usernameInput = document.querySelector('#usernameInput');
var loginBtn = document.querySelector('#loginBtn');
var callPage = document.querySelector('#callPage');

var callToUsernameInput = document.querySelector('#callToUsernameInput');
var callBtn = document.querySelector('#callBtn');
var hangUpBtn = document.querySelector('#hangUpBtn');

var localVideo = document.querySelector('#localVideo');
var remoteVideo = document.querySelector('#remoteVideo');

var yourConn;
var stream;

// haide call page
callPage.style.display = "none";

// Login btn
loginBtn.addEventListener('click', function(even) {
    name = usernameInput.value;
    
    if (name.length>0) {
        send({
            type: "login",
            name: name
        });
    }
});

function handleLogin(success) {
    if (success===false) {
        alert("Please try a different username");
    } else {
        // display the call page if login is successfull
        loginPage.style.display = "none";
        callPage.style.display = "block";

        /** start peer connection */
        // getting local video stream
        navigator.webkitGetUserMedia({
            video: true, 
            audio: true
        }, function(myStream) {
            stream = myStream;

            // displaying local video on the page
            localVideo.src = window.URL.createObjectURL(stream);

            // using google public stun server
            var configuration = {
                "iceServers": [{
                    "url": "stun:stun2.1.google.com:19302"
                }]
            }

            yourConn = new webkitRTCPeerConnection(configuration);
            
            //setup stream listenning
            yourConn.addStream(stream);

            // when a remote user adds stream to peer to peer connection we display
            yourConn.onaddstream = function(e) {
                remoteVideo.src = window.URL.createObjectURL(e.stream);
            }

            //setup ICE handling
            yourConn.onicecandidate = function(event) {
                if (event.candidate) {
                    send({
                        type: "candidate",
                        candidate: event.candidate
                    });
                }
            }
        }, function(error) {
            console.error(error);
        });

    }
}

// initialting a call
callBtn.addEventListener('click', function() {
    var callToUsername = callToUsernameInput.value;

    if (callToUsername.length>0) {
        connectedUser = callToUsername;

        // create an offer
        yourConn.createOffer(function(offer) {
            send({
                type: "offer",
                offer: offer
            });

            yourConn.setLocalDescription(offer);
        }, function(error) {
            console.error(error);
            alert("Error while creating an offer")
        });
    }
});


// When somebody sends us an offer
function handleOffer(offer, name) {
    connectedUser = name;

    yourConn.setRemoteDescription(new RTCSessionDescription(offer));

    // create an answer to the offer
    yourConn.createAnswer(function(answer) {
        yourConn.setLocalDescription(answer);
        send({
            type: "answer",
            answer: answer
        });
    }, function(error) {
        console.error("Error when creating an answer.");
        alert("Error when creating an answer.");
    });
}

// When we got an answer from a remote user
function handleAnswer(answer) {
    yourConn.setRemoteDescription(new RTCSessionDescription(answer));
}

// When we got an ICE candidate from aremote user
function handleCandidate(candidate) {
    yourConn.addIceCandidate(new RTCIceCandidate(candidate))
}

// hang up
hangUpBtn.addEventListener('click', function() {
    send({type: "leave"});
    handleLeave();
});

function handleLeave() {
    connectedUser = null;
    remoteVideo.src = null;
    yourConn.close();
    yourConn.onicecandidate = null;
    yourConn.onaddstream = null;
}
