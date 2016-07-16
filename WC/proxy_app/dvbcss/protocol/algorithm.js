// algorithm.js

var LowestDispersionCandidate = {
    clock: null,
    repeatSecs: 1,
    timeoutSecs: 0.2,
    dispCalc: null,
    worstDispersion: 0,
    bestCandidate: null,
    cumulativeOffset: null,
    currentDispersion: 0,

    lowestDispersionCandidate : function(clock,repeatSecs,timeoutSecs) {
        //console.log("dvbcss.protocol.client.wc.algorithm.BestCandidateByDispersion");
        this.clock = clock;
        this.repeatSecs = repeatSecs;
        this.timeoutSecs = timeoutSecs;
        this.dispCalc = DispersionCalculator.dispersionCalculator(clock, clock.measurePrecision(), 500);
        this.worstDispersion = Math.pow(2,64)-1;
        return LowestDispersionCandidate;
    },

    getCurrentDispersion : function() {
        x = this.bestCandidate;
        if (x == null) {
            this.currentDispersion = this.worstDispersion;
            return this.worstDispersion;
        }
        else {
            return this.dispCalc.calc(x);
        }
    },

    algorithm : function(candidate) {
        update = false;
        if (candidate != null) {
            if (candidate.t2 <= candidate.t1 || candidate.t4 <= candidate.t3) {
                this.currentDispersion = Math.pow(2,64)-1;
            }
            candidateDispersion = this.dispCalc.calc(candidate);
            if (this.currentDispersion >= candidateDispersion) {
                this.bestCandidate = candidate;
                update = true;
                this.clock.adjustTicks(candidate.offset);
                if (this.cumulativeOffset == null) {
                    this.cumulativeOffset = 0;
                }
                else {
                    this.cumulativeOffset = this.cumulativeOffset + candidate.offset;
                }
            }
            this.worstDispersion = Math.max(this.worstDispersion, this.currentDispersion, candidateDispersion);
            // console.log("   ");
            // console.log("Old / New dispersion (millis) is " + Math.trunc((this.currentDispersion/1000000)*10000)/10000 + " / " + Math.trunc((candidateDispersion/1000000)*10000)/10000 + " ... CumulativeOffset = " + this.cumulativeOffset + " micros.");
            // console.log("New best candidate??? " + update);
            // console.log("   ");
            if (update) {
                this.currentDispersion = candidateDispersion;
            }
        }
        else {
            console.log("Timeout.  Dispersion (millis) is " + this.currentDispersion/1000000);
        }
    },

    getWorstDispersion : function() {
        answer = Math.max(this.worstDispersion, this.currentDispersion);
        this.worstDispersion = this.currentDispersion;
        return answer;
    }
};
            
var DispersionCalculator = {
    clock: null,
    precision: 0,
    maxFreqError: 0,

    dispersionCalculator : function(clock, localPrecisionSecs, localMaxFreqErrorPpm) {
        this.clock = clock;
        this.precision = localPrecisionSecs;
        this.maxFreqError = localMaxFreqErrorPpm;
        return DispersionCalculator;
    },

    calc : function(candidate) {
        return 1000*(candidate.precision + this.precision)/2 + (candidate.maxFreqError*(candidate.t3-candidate.t2) + this.maxFreqError*(candidate.t4-candidate.t1) + (candidate.maxFreqError+this.maxFreqError)*(this.clock.getNanos() - candidate.t4)) / 1000000 + candidate.rtt/2;
    },

    getGrowthRate : function(candidate) {
        return (candidate.maxFreqError+self.maxFreqError) / 1000000.0;
    }
};

module.exports = {
  LowestDispersionCandidate: LowestDispersionCandidate,
  DispersionCalculator: DispersionCalculator
}