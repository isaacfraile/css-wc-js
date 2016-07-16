
var DEFAULT_BIND = ["192.168.10.124",6677];
var DEFAULT_PPM = 500;

var dgram = require('dgram');
var Clock = require('./dvbcss/clock');
var WC = require('./dvbcss/protocol/wc');
var server = dgram.createSocket('udp4');

clock = Clock.SysClock;
wallClock = Clock.tunableClock(clock, 1000000);
precisionSecs = Clock.measurePrecision(clock);
//console.log("precisionSecs: "+precisionSecs+" segons");

server.on('listening', function () {
    var address = server.address();
    console.log("----");
    console.log('CSS-WC UDP Server listening on ' + address.address + ":" + address.port);
    console.log("----");
});

server.on('message', function (message, remote) {
    //recv_ticks = clock.getTicks();
    //console.log("received msg");
    recv_ticks = wallClock.getTicks();
    msg = WC.WCMessage.unpack(message);
    reply = msg.copy();
    if (msg.msgtype == WC.WCMessage.TYPE_REQUEST) {
        reply.receiveNanos = recv_ticks;
        reply.msgtype = WC.WCMessage.TYPE_RESPONSE;
        reply.setPrecision(precisionSecs);
        reply.setMaxFreqError(DEFAULT_PPM);
        reply.transmitNanos = wallClock.getTicks();

        var udp_msg = reply.pack();
        server.send(udp_msg, 0, udp_msg.length, remote.port, remote.address, function(err, bytes) {
            if (err) throw err;
            //console.log('UDP message sent to ' + remote.address +':'+ remote.port);
            //server.close();
        });
        //console.log('From: ' + remote.port + " with originate time (T2) ==  " + reply.receiveNanos);
    }
    else {
        throw Error ("Wall clock server received non request message");
    }
});

server.bind(DEFAULT_BIND[1], DEFAULT_BIND[0]);


var server2 = require('websocket').server,
    http = require('http');
var connection;

var socket = new server2({
    httpServer: http.createServer().listen(1338)
});

var haveMaster = false;

socket.on('request', function(request) {
    connection = request.accept('echo-protocol', request.origin);

    haveMaster = true;

    connection.on('message', function(message) {
        wallClock.offset = 0;
        time = -1*clock.getTicks();
        var d = new Date();
        var msg = message.utf8Data;
        msg = msg - 1000000000 + d.getTime()/1000000000;
        wallClock.adjustTicks(time+msg*1000000000);
    });

    connection.on('close', function(connection) {
        haveMaster = false;
        console.log('connection closed');
    });
});

var socket2 = new server2({
    httpServer: http.createServer().listen(1340)
});

var user;

socket2.on('request', function(request) {
    user = request.accept('echo-protocol', request.origin);

    user.on('message', function(message) {
        if (!haveMaster) {
            user.sendUTF(false);
        } else {
            user.sendUTF(true);
        }
    });
});