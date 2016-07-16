var DEFAULT_DEST = ["192.168.10.124", 6677];

var client = chrome.sockets.udp;

var sysclock = SysClock;
var wallClock = tunableClock(sysclock, 1000000);
var algorithm = LowestDispersionCandidate.lowestDispersionCandidate(wallClock, 1, 0.5);
var precisionSecs = measurePrecision(sysclock);

console.debug = function() {};
var first = true;
var stoped = false;
var syncTime = 0;
var duration = 0;

var isLive = false;

//// ---------------------------------------------- VOD ------------------------------------------/////
var url = "http://dash.edgesuite.net/dash264/TestCases/1a/netflix/exMPD_BIP_TC1.mpd";
//var url = "http://demo.unified-streaming.com/video/ateam/ateam.ism/ateam.mpd";
//var url = "http://dash.edgesuite.net/dash264/TestCases/1a/sony/SNE_DASH_SD_CASE1A_REVISED.mpd";
//var url = "http://dash.edgesuite.net/dash264/TestCases/2a/qualcomm/1/MultiResMPEG2.mpd";
//var url = "http://dash.edgesuite.net/akamai/test/caption_test/ElephantsDream/elephants_dream_480p_heaac5_1.mpd";
//var url = "http://global.mediaclienttest.edgesuite.net/test/video/coral/coral-single.mpd";
//var url = "http://192.168.10.124:1935/vod/mp4:video_100K.mp4/manifest.mpd";

//// ---------------------------------------------- LIVE -----------------------------------------/////
//var url = "http://vm2.dashif.org/livesim/testpic_2s/Manifest.mpd";
//var url = "http://192.168.10.124:1935/live/video1.stream/manifest.mpd";
//var url = "http://live.unified-streaming.com/loop/loop.isml/loop.mpd?format=mp4&session_id=25020";
//var url = "http://irtdashreference-i.akamaihd.net/dash/live/901161/bfs/manifestARD.mpd";

window.addEventListener("load", function() {

    var vid = document.getElementById("videoPlayer");
    var player = dashjs.MediaPlayer().create();
    player.initialize(vid, url, true);

    vid.oncanplay = function() {
        if (!isLive) duration = vid.duration;
    };

    client.create({}, function(socketInfo) {
        var socketId = socketInfo.socketId;
        address = "0.0.0.0";
        client.bind(socketId, address, 0, function(result) {

            client.getInfo(socketId, function(result) {
                console.log(result);
            });

            client.onReceive.addListener(function(message) {
                // console.log('UDP message recived from ' + DEFAULT_DEST[0] + ':' + DEFAULT_DEST[1]);
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
                if (m == 0) {
                    msg = WCMessage.wcMessage(0, precisionSecs, 500, wallClock.getTicks(), 0, 0, null);
                    var message = msg.pack();
                    client.send(socketId, message.buffer, DEFAULT_DEST[0], DEFAULT_DEST[1], function(sendResult) {
                        //console.log('UDP message sent to ' + DEFAULT_DEST[0] + ':' + DEFAULT_DEST[1]);
                    });

                    var d = wallClock.getTicks();
                    var dif = 0;
                    syncTime = d / 1000000000;

                    if (!isLive) {

                        if (syncTime > duration && duration > 0) {
                            vid.pause();
                            aux = 0;
                            stoped = true;
                        } else stoped = false;

                        if (first) {
                            vid.currentTime = syncTime + 2;
                            first = false;
                        }

                        time_repr = vid.currentTime;
                        dif = Math.round((time_repr - syncTime) * 1000) / 1000;
                        if (dif > -0.015 && dif < 0.015) {
                            aux = 1;
                        } else {
                            if (dif < -2 || dif > 2) {
                                vid.currentTime = syncTime + 2;
                                aux = 0;
                            } else aux = 1 - Math.round(dif * 50) / 100;
                        }

                    } else {
                        time_repr = vid.currentTime;

                        dif = Math.round((time_repr - syncTime) * 1000) / 1000;
                        if (dif > -0.015 && dif < 0.015) {
                            aux = 1;
                        } else {
                            if (dif > 2) {
                                aux = 0;
                            } else aux = 1 - Math.round(dif * 50) / 100;
                        }
                    }
                    if (vid.paused && aux >= 0.5 && !stoped) vid.play();

                    if (aux > 2) aux = 2;
                    else if (aux < 0.5 && !vid.paused) {
                        vid.pause();
                        aux = 0.5;
                    }

                    if (vid.playbackRate != aux && !vid.paused) {
                        vid.playbackRate = aux;
                    }

                    document.querySelector("#sp").innerHTML = vid.playbackRate;
                    document.querySelector("#diff").innerHTML = dif;
                }

                m = n % 5;
                if (n >= 25) {
                    //console.log("*** Worst dispersion over previous 5 seconds = " + algorithm.getWorstDispersion() / 1000000 + " milliseconds");
                    n = 0;
                }
                setTimeout(function() {
                    sleep(millis);
                }, millis);
            }
        });
    });

});