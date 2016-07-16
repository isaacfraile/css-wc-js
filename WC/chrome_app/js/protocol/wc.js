// protocol.wc.js

var WCMessage = {
    TYPE_REQUEST: 0, // Constant: Message type 0 "request"
    TYPE_RESPONSE: 1, // Constant: Message type 1 "response with no follow-up"
    TYPE_RESPONSE_WITH_FOLLOWUP: 2, // Constant: Message type 2 "response to be followed by a follow-up response"
    TYPE_FOLLOWUP: 3, // Constant: Message type 3 "follow-up response"
    TYPE_ANY_RESPONSE : [1,2,3],
    TYPE_ANY_FIRST_RESPONSE : [1,2],
    
    STRUCT_FMT: ">BBbBLLLLLLL",
    MSG_SIZE: 32,

    msgtype: 0, // (read/write :class:`int`) Type of message. 0=request, 1=response, 2=response-with-followup, 3=followup
    precision: 0, // (read/write :class:`int`) Precision encoded in log base 2 seconds between -128 and +127 inclusive. For example: -10 encodes a precision value of roughly 0.001 seconds. 
    maxFreqError: 0, // (read/write :class:`int`) Maximum frequency error in units of  1/256ths ppm. For example: 12800 encodes a max freq error of 50ppm.
    originateNanos: 0, // (read/write :class:`int`) Originate timevalue in integer number of nanoseconds
    receiveNanos: 0, // (read/write :class:`int`) Receive timevalue in integer number of nanosecond
    transmitNanos: 0, // (read/write :class:`int`) Transmit timevalue in integer number of nanosecond
    originalOriginate: null, // (read/write :obj:`None` or (:class:`int`, :class:`int`)) Optional original encoding of the originate timevalue as (seconds, nanos). Overrides `originateNanos` when the message is packed if the value is not `None`. 

    wcMessage : function(msgtype,precision,maxFreqError,originateNanos,receiveNanos,transmitNanos,originalOriginate) {
        //console.log("dvbcss.protocol.wc.WCMessage");
        this.msgtype = msgtype;
        this.setPrecision(precision);
        this.maxFreqError = maxFreqError;
        this.originateNanos = originateNanos;
        this.receiveNanos = receiveNanos;
        this.transmitNanos = transmitNanos;
        this.originalOriginate = originalOriginate;
        return WCMessage;
    },

    pack: function() {
        if (this.originalOriginate == null) {
            os = parseInt(this.originateNanos / 1000000000);
            on = parseInt(this.originateNanos % 1000000000);
        } else {
            os = this.originalOriginate[0];
            on = this.originalOriginate[1];
        }
        rs = parseInt(this.receiveNanos / 1000000000);
        rn = parseInt(this.receiveNanos % 1000000000);
        ts = parseInt(this.transmitNanos / 1000000000);
        tn = parseInt(this.transmitNanos % 1000000000);

        values = [0, this.msgtype, this.precision, 0, this.maxFreqError, os, on, rs, rn, ts, tn];
        // console.log("values ======= " + values);

        var hex = 0;
        var array = new Uint8Array(32);
        array.set([0], 0);
        array.set([this.msgtype], 1);
        array.set([this.precision], 2);
        array.set([0], 3);

        hex = this.maxFreqError;
        array.set([Math.trunc(hex / (256 * 256 * 256))], 4);
        hex = hex % (256 * 256 * 256);
        array.set([Math.trunc(hex / (256 * 256))], 5);
        hex = hex % (256 * 256);
        array.set([Math.trunc(hex / 256)], 6);
        hex = hex % (256);
        array.set([hex], 7);

        hex = os;
        array.set([Math.trunc(hex / (256 * 256 * 256))], 8);
        hex = hex % (256 * 256 * 256);
        array.set([Math.trunc(hex / (256 * 256))], 9);
        hex = hex % (256 * 256);
        array.set([Math.trunc(hex / 256)], 10);
        hex = hex % (256);
        array.set([hex], 11);

        hex = on;
        array.set([Math.trunc(hex / (256 * 256 * 256))], 12);
        hex = hex % (256 * 256 * 256);
        array.set([Math.trunc(hex / (256 * 256))], 13);
        hex = hex % (256 * 256);
        array.set([Math.trunc(hex / 256)], 14);
        hex = hex % (256);
        array.set([hex], 15);

        hex = rs;
        array.set([Math.trunc(hex / (256 * 256 * 256))], 16);
        hex = hex % (256 * 256 * 256);
        array.set([Math.trunc(hex / (256 * 256))], 17);
        hex = hex % (256 * 256);
        array.set([Math.trunc(hex / 256)], 18);
        hex = hex % (256);
        array.set([hex], 19);

        hex = rn;
        array.set([Math.trunc(hex / (256 * 256 * 256))], 20);
        hex = hex % (256 * 256 * 256);
        array.set([Math.trunc(hex / (256 * 256))], 21);
        hex = hex % (256 * 256);
        array.set([Math.trunc(hex / 256)], 22);
        hex = hex % (256);
        array.set([hex], 23);

        hex = ts;
        array.set([Math.trunc(hex / (256 * 256 * 256))], 24);
        hex = hex % (256 * 256 * 256);
        array.set([Math.trunc(hex / (256 * 256))], 25);
        hex = hex % (256 * 256);
        array.set([Math.trunc(hex / 256)], 26);
        hex = hex % (256);
        array.set([hex], 27);

        hex = tn;
        array.set([Math.trunc(hex / (256 * 256 * 256))], 28);
        hex = hex % (256 * 256 * 256);
        array.set([Math.trunc(hex / (256 * 256))], 29);
        hex = hex % (256 * 256);
        array.set([Math.trunc(hex / 256)], 30);
        hex = hex % (256);
        array.set([hex], 31);

        // console.log("array ======= " + array + "  len == " + array.byteLength);

        return array;
        //return msg;
    },

    unpack : function(buffer) {
        // console.log("unpack buffer === " + buffer.data);
        data = new Uint8Array(buffer.data);
        // console.log("unpack data === " + data);

        version = data[0];
        msgtype = data[1];
        precision = this.decodePrecision(data[2] -256);
        maxFreqError = data[4]*256*256*256 + data[5]*256*256 + data[6]*256 + data[7];
        os = data[8]*256*256*256 + data[9]*256*256 + data[10]*256 + data[11];
        on = data[12]*256*256*256 + data[13]*256*256 + data[14]*256 + data[15];
        rs = data[16]*256*256*256 + data[17]*256*256 + data[18]*256 + data[19];
        rn = data[20]*256*256*256 + data[21]*256*256 + data[22]*256 + data[23];
        ts = data[24]*256*256*256 + data[25]*256*256 + data[26]*256 + data[27];
        tn = data[28]*256*256*256 + data[29]*256*256 + data[30]*256 + data[31];

        if (version != 0) {
            throw Error ("Wall Clock WCMessage version number not recognised.");
        }
        if (msgtype > WCMessage.TYPE_FOLLOWUP) {
            throw Error ("Wall Clock WCMessage type not recognised.");
        }
        o = os*1000000000 + on;
        r = rs*1000000000 + rn;
        t = ts*1000000000 + tn;
        if (on >= 1000000000){
            originalOriginate = [os,on];
        }
        else{
            originalOriginate = null;
        }
        return this.wcMessage(msgtype, precision, maxFreqError, o, r, t, originalOriginate);
    },

    copy : function() {
        //"Duplicate this wallclock message object"
        return this.wcMessage(this.msgtype, this.precision, this.maxFreqError, this.originateNanos, this.receiveNanos, this.transmitNanos, this.originalOriginate);
    },

    getPrecision : function() {
        //"Get precision value in fractions of a second"
        return this.decodePrecision(this.precision);
    },

    setPrecision : function(precisionSecs) {
        //"Set precision value given a precision represented as factions of a second"
        this.precision=this.encodePrecision(precisionSecs);
    },

    getMaxFreqError : function() {
        //"Get frequency error in ppm"
        return this.decodeMaxFreqError(this.maxFreqError);
    },

    setMaxFreqError : function(maxFreqErrorPpm) {
        //"Set freq error given a freq error represented as ppm"
        this.maxFreqError=this.encodeMaxFreqError(maxFreqErrorPpm);
    },

    encodePrecision : function(precisionSecs) {
        //"Convert a precision value in seconds to the format used in these messages"
        //console.log("PRECISION SECS ================================= " + Math.round(Math.log(precisionSecs)/Math.log(2)));
        return parseInt(Math.round(Math.log(precisionSecs)/Math.log(2)));
    },

    encodeMaxFreqError : function(maxFreqErrorPpm) {
        return parseInt(Math.ceil(maxFreqErrorPpm*256));
    },

    decodePrecision : function(precision) {
        return Math.pow(2,precision);
    },

    decodeMaxFreqError : function(maxFreqError) {
        return maxFreqError/256.0;
    }
};

var Candidate = {
    t1: 0,
    t2: 0,
    t3: 0,
    t4: 0,
    offset: 0,
    rtt: 0,
    precision: 0,
    maxFreqError: 0,
    msg: null,
    isNanos: true,

    candidate : function(msg, nanosRx) {
        //console.log("dvbcss.protocol.wc.Candidate");
        this.t1 = msg.originateNanos;
        this.t2 = msg.receiveNanos;
        this.t3 = msg.transmitNanos;
        this.t4 = nanosRx;
        this.offset = Math.trunc(((this.t3+this.t2)-(this.t4+this.t1))/2);

        this.rtt = (this.t4-this.t1)-(this.t3-this.t2);
        this.precision = msg.getPrecision();
        this.maxFreqError =  msg.getMaxFreqError();
        this.msg = msg;
        return Candidate;
    },

    toTicks : function(clock) {
        copy = Candidate(this.msg, this.t4);
        copy.isNanos = false;
        if (this.isNanos) {
            copy.t1 = clock.nanosToTicks(this.t1);
            copy.t2 = clock.nanosToTicks(this.t2);
            copy.t3 = clock.nanosToTicks(this.t3);
            copy.t4 = clock.nanosToTicks(this.t4);
            copy.offset = clock.nanosToTicks(this.offset);
            copy.rtt = clock.nanosToTicks(this.rtt);
        }
        return copy;
    }
};            
