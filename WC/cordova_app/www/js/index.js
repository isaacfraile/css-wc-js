/* global chrome, SysClock, LowestDispersionCandidate, WCMessage, Candidate, dashjs */

var app = {

initialize: function () {
  this.bindEvents();
},

bindEvents: function () {
  document.addEventListener('deviceready', this.onDeviceReady, false);
},

onDeviceReady: function () {
    console.log("onDeviceReady");
  
    var DEFAULT_DEST = ["192.168.10.124", 6677];
    var client = chrome.sockets.udp;

    var sysclock = SysClock;
    var wallClock = tunableClock(sysclock, 1000000);
    var algorithm = LowestDispersionCandidate.lowestDispersionCandidate(wallClock, 1, 0.5);
    var precisionSecs = measurePrecision(sysclock);

    var syncTime = 0;
    var seekAndroid = 0.5;
    var isLive = false;

//// ---------------------------------------------- VOD ------------------------------------------/////
    var url = "http://dash.edgesuite.net/dash264/TestCases/1a/netflix/exMPD_BIP_TC1.mpd";
    //var url = "http://192.168.10.124:1935/vod/mp4:video_100K.mp4/manifest.mpd";

    var vid = document.getElementById("videoPlayer");
    var player = dashjs.MediaPlayer().create();
    player.initialize(vid, url, true);

    //vid.oncanplay = function() {
        //if (!isLive) duration = vid.duration;
    //};

    client.create({}, function(socketInfo) {
        var socketId = socketInfo.socketId;
        address = "0.0.0.0";
        client.bind(socketId, address, 0, function(result) {

            client.getInfo(socketId, function(result) {
                console.log(result);
            });

            client.onReceive.addListener(function(message) {
                recv_ticks = Math.trunc(wallClock.getTicks());
                msg = WCMessage.unpack(message);
                candidate = Candidate.candidate(msg, recv_ticks);
                algorithm.algorithm(candidate);
            });

            var n = 0;
            var m = 0;
            sleep(200);

            function sleep(millis, callback) {
                n = n + 1;
                if (m === 0) {
                    msg = WCMessage.wcMessage(0, precisionSecs, 500, wallClock.getTicks(), 0, 0, null);
                    var message = msg.pack();
                    var addr = "192.168.10.124";
                    var port = 6677;
                    client.send(socketId, message.buffer, addr, port, function() {});

                    var d = wallClock.getTicks();
                    syncTime = d / 1000000000;

                    if (!isLive) {

                        var aux = Math.round((vid.currentTime - syncTime) * 1000) / 1000;
                        if (aux <= -0.05) {
                            vid.currentTime = syncTime + seekAndroid;
                            if (seekAndroid <= 2) seekAndroid = seekAndroid * 2;
                        } else if (aux > -0.05 && aux <= 0.03) {
                            seekAndroid = 0.5;
                        } else if (aux > 0.03 && aux <= 1) {
                            vid.pause();
                            mysleep = aux * 60;
                            if (mysleep <= 40) mysleep = 40;
                            else if (mysleep >= 200) mysleep = 200;
                            setTimeout(function() {
                                vid.play();
                            }, mysleep);
                        } else if (aux > 1 && aux <= 4) {
                            vid.pause();
                        } else if (aux > 4) {
                            seekAndroid = 0.5;
                            vid.currentTime = syncTime + seekAndroid;
                        }

                    } else {
                        /// LIVE
                    }
                    document.querySelector("#diff").innerHTML = aux;
                }
                m = n % 5;
                if (n >= 25) n = 0;
                setTimeout(function() {
                    sleep(millis);
                }, millis);
            }
        });
    });
    
  }
};
app.initialize();