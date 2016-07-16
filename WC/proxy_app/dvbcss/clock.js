// clock.js
var Now = require("performance-now");

var SysClock = {
    tickRate: 1000000,
    //ticks: performance.now(), // en milis ex: 234.023000000 ms
    ticks: Now(), // en milis ex: 234.023000000 ms
    //nanos: (this.ticks * 1000000/this.tickRate), 

    getTicks: function() {
        //return performance.now() * this.tickRate;
        return Now() * this.tickRate;
    },
    getTickRate: function() {
        return this.tickRate;
    },
    getNanos: function() {
        return this.getTicks() * 1000000 / this.tickRate;
    },
    nanosToTicks: function(t) {
        return t / this.tickRate;
    },
    measurePrecision: function() {
        sampleSize = 10000;
        diffs = [];
        while (diffs.length < sampleSize) {
            a = this.getTicks();
            b = this.getTicks();
            if (a < b) {
                diffs.push(b - a);
            }
        }
        return Math.min.apply(null, diffs) / this.tickRate;
    }
};

var TunableClock = {
    ticks: 0,
    tickRate: 1000000,
    speed: 1.0,
    parent: null,
    last: 0,
    offset: 0,

    getTickRate: function() {
        return this.tickRate;
    },
    setTickRate: function(value) {
        this.tickRate = value;
    },
    getNanos: function() {
        return Math.trunc(this.getTicks() * 1000000 / this.tickRate);
    },
    getTicks: function() {
        now = this.parent.getTicks() + this.offset;
        //delta = now - last;
        //this.last = now;
        this.ticks = now;
        return now;
    },
    adjustTicks: function(offset) {
        this.ticks = this.ticks + offset;
        this.offset = this.offset + offset;
    },
    measurePrecision: function() {
        sampleSize = 10000;
        diffs = [];
        while (diffs.length < sampleSize) {
            a = this.parent.getTicks();
            b = this.parent.getTicks();
            if (a < b) {
                diffs.push(b - a);
            }
        }
        return Math.min.apply(null, diffs) / this.tickRate;
    }
};


function tunableClock(parentClock, tickRate) {
    if (tickRate <= 0) {
        throw Error("Cannot set tickRate to " + tickRate);
    }
    TunableClock.parent = parentClock;
    TunableClock.tickRate = tickRate;
    TunableClock.ticks = 0;
    TunableClock.speed = 1.0;
    TunableClock.last = TunableClock.parent.ticks;
    return TunableClock;
}

function measurePrecision(clock) {
    sampleSize = 10000;
    diffs = [];
    while (diffs.length < sampleSize) {
        a = clock.getTicks();
        b = clock.getTicks();
        if (a < b) {
            diffs.push(b - a);
        }
    }
    return Math.min.apply(null, diffs) / clock.tickRate;
}

module.exports = {
    measurePrecision: measurePrecision,
    tunableClock: tunableClock,
    TunableClock: TunableClock,
    SysClock: SysClock
}
