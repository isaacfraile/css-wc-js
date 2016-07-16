
var net = require('net');
var Clock = require('./dvbcss/clock');
var WC = require('./dvbcss/protocol/wc');

var DEFAULT_BIND = ["127.0.0.1",6677];
var DEFAULT_PPM = 500;


clock = Clock.SysClock;
precisionSecs = Clock.measurePrecision(clock);
console.log("precisionSecs: "+precisionSecs+" segons");


net.createServer(function(sock) {
    console.log('CONNECTED: ' + sock.remoteAddress +':'+ sock.remotePort);
    sock.on('data', function(data) {
        recv_ticks = clock.getTicks();
        parse = JSON.parse(data);
        //console.log("msg.length === " + parse.length + " msg == " + JSON.parse(data));
        //sock.write('Server said "' + recv_ticks + '"');
        msg = WC.WCMessage.unpack(JSON.parse(data));
        reply = msg.copy();
        if (msg.msgtype == WC.WCMessage.TYPE_REQUEST) {
            reply.receiveNanos = recv_ticks;
            reply.msgtype = WC.WCMessage.TYPE_RESPONSE;
            reply.setPrecision(precisionSecs);
            reply.setMaxFreqError(DEFAULT_PPM);
            reply.transmitNanos = clock.getTicks();

            sock.write(JSON.stringify(reply.pack()));
            console.log('From: ' + sock.remotePort + " with originate time (T1) ==  " + reply.originateNanos);
        }
        else {
            throw Error ("Wall clock server received non request message");
        }
    });
    sock.on('close', function(data) {
        console.log('CLOSED: ' + sock.remoteAddress +' '+ sock.remotePort);
    });

}).listen(DEFAULT_BIND[1], DEFAULT_BIND[0]);

console.log("----");
console.log('CSS-WC Server listening on ' + DEFAULT_BIND[0] +':'+ DEFAULT_BIND[1]);
console.log("----");
    

// sleep (1000);
// function sleep(millis, callback) {
//     	console.log("Time==   " + clock.getTicks()/1000000);
//         aux = clock.getNanos();
//         console.log("Nanos==   " + aux + " ===? "  +clock.nanosToTicks(aux));
//     setTimeout(function() {
//         sleep(millis);
//     }, millis);
// }