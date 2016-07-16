var dgram = require('dgram');
var Clock = require('./dvbcss/clock');
var Algorithm = require('./dvbcss/protocol/algorithm');
var WC = require('./dvbcss/protocol/wc');

var DEFAULT_DEST = ["192.168.10.124", 6677];

var client = dgram.createSocket('udp4');

sysclock = Clock.SysClock;
wallClock = Clock.tunableClock(sysclock, 1000000);
algorithm = Algorithm.LowestDispersionCandidate.lowestDispersionCandidate(wallClock, 1, 0.5);
precisionSecs = Clock.measurePrecision(sysclock);

client.on('message', function(message) {

    recv_ticks = Math.trunc(wallClock.getTicks());
    msg = WC.WCMessage.unpack(message);
    candidate = WC.Candidate.candidate(msg, recv_ticks);
    //console.log(" ");
    console.log("candidate t1 == " + candidate.t1 + " t2 == " + candidate.t2 + " t3 == " + candidate.t3 + " t4 == " + candidate.t4);
    algorithm.algorithm(candidate);

});

var n = 0;
var m = 0;
sleep(200);

function sleep(millis, callback) {
    n = n + 1;
    if (m == 0) {
        msg = WC.WCMessage.wcMessage(0, precisionSecs, 500, wallClock.getTicks(), 0, 0, null);
        var message = new Buffer(msg.pack());
        client.send(message, 0, message.length, DEFAULT_DEST[1], DEFAULT_DEST[0], function(err, bytes) {
            if (err) throw err;
            //console.log('UDP message sent to ' + DEFAULT_DEST[0] + ':' + DEFAULT_DEST[1]);
            //client.close();
        });
    }
    m = n % 5;
    //console.log("Time =          " + wallClock.getTicks() / 1000 + " microseconds. Dispersion =          " + Math.trunc(algorithm.getCurrentDispersion() / 1000) / 1000 + " milliseconds. Offset =  " + wallClock.offset);
    if (n >= 25) {
        console.log("*** Worst dispersion over previous 5 seconds = " + algorithm.getWorstDispersion() / 1000000 + " milliseconds");
        n = 0;
    }
    setTimeout(function() {
        sleep(millis);
    }, millis);
}

var server = require('websocket').server,
    http = require('http');
var connection;
var count = 0;
var clients = {};

var socket = new server({
    httpServer: http.createServer().listen(1337)
});

socket.on('request', function(request) {
    connection = request.accept('echo-protocol', request.origin);
    // Specific id for this client & increment count
    var id = count++;
    // Store the connection method so we can loop through & contact all clients
    clients[id] = connection;

    connection.on('message', function(message) {
        sleep2(1000);

        function sleep2(millis, callback) {
            for (var i in clients) {
                clients[i].sendUTF(wallClock.getTicks());
            }
            setTimeout(function() {
                sleep2(millis);
            }, millis);
        }
    });

    connection.on('close', function(connection) {
        console.log('connection closed');
    });
});