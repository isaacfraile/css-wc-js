
var net = require('net');
var Clock = require('./dvbcss/clock');
var Algorithm = require('./dvbcss/protocol/algorithm');
var WC = require('./dvbcss/protocol/wc');

var DEFAULT_DEST = ["127.0.0.1",6677];

sysclock = Clock.SysClock;
wallClock = Clock.tunableClock(sysclock,1000000);  
algorithm = Algorithm.LowestDispersionCandidate.lowestDispersionCandidate(wallClock,1,0.5);
precisionSecs = Clock.measurePrecision(sysclock);


var client = new net.Socket();
client.connect(DEFAULT_DEST[1], DEFAULT_DEST[0], function() {

    console.log('CONNECTED TO: ' + DEFAULT_DEST[0] + ':' + DEFAULT_DEST[1]);

});

client.on('data', function(data) {
    
    recv_ticks = Math.trunc(wallClock.getTicks());
    parse = JSON.parse(data);
    msg = WC.WCMessage.unpack(parse);
    candidate = WC.Candidate.candidate(msg, recv_ticks);
    console.log(" ");
    console.log("candidate t1 == " + candidate.t1 + " t2 == " + candidate.t2 + " t3 == " + candidate.t3 + " t4 == " + candidate.t4);
    algorithm.algorithm(candidate);
    
});

client.on('close', function() {
    console.log('Connection closed');
});

var n = 0;
var m = 0;
sleep (200);
function sleep(millis, callback) {
    n = n+1;
    if (m == 0) {
        msg = WC.WCMessage.wcMessage(0,precisionSecs,500,wallClock.getTicks(),0,0,null);
        client.write(JSON.stringify(msg.pack()));
    }
    m = n%5;
    console.log("Time =          "+ wallClock.getTicks()/1000 +" microseconds. Dispersion =          " + Math.trunc(algorithm.getCurrentDispersion()/1000)/1000 +" milliseconds. Offset =  " + wallClock.offset);
    if (n>=25){
        console.log("*** Worst dispersion over previous 5 seconds = " + algorithm.getWorstDispersion()/1000000 + " milliseconds");
        n = 0;
    }
    setTimeout(function() {
        sleep(millis);
    }, millis);
}      