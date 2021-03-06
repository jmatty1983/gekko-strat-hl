var _ = require('lodash');
var log = require('../core/log.js');
var math = require('mathjs')

var method = {};

method.init = function() {
    this.name = 'Scalper';
    this.addTulipIndicator('ps', 'psar', {optInAcceleration:0.25,
        optInMaximum:0.50
    });
    
    this.candle_queue = [];
    this.is_buyin = false;
    this.price_buyin = 0;
}

var barscount = 0;
var DarvasHigh = 0;
var DarvasLow = 0;

method.update = function(candle) {
    this.psar = this.tulipIndicators.ps.result.result;

    if(candle.low < DarvasLow){DarvasLow = candle.low;}
    if(candle.high < DarvasHigh){DarvasHigh = candle.low;}

    this.candle_queue.push(candle);
    barscount++;
    if(this.candle_queue.length>0){
        candle.delta = candle.close - this.candle_queue[0].close;
    }

}
var percent = 35;
var distance = 3;
var Period = 25;
var lastcolor = 0;
var Min = [];
var MovingTR = [];
var NoTradedSince = 0; 
IsReversalUp = function(min,candle){

    var c1 = this.candle_queue[this.candle_queue.length -2];
    return (candle.low < min && candle.close > c1.close);
}

var MoveCycle = [];
var LowTopDif = [];
method.check = function(candle) {
    if (this.candle_queue.length >= Period)
    {

       //Get Min Max
        runningMin = 99999999;
        runninMax = 0;
        for (var barsBack = Math.min(this.candle_queue.length, Period - 1); barsBack > 0; barsBack--)
        {
            var bar = this.candle_queue[barsBack];
            if(bar.close <= runningMin)
            {
                var runningMin  = bar.close;
            }
        }
        Min.push(runningMin);

        for (var barsBack = Math.min(this.candle_queue.length, Period - 1); barsBack > 0; barsBack--)
        {
            var bar = this.candle_queue[barsBack];
            if(bar.close >= runninMax)
            {
                var runninMax  = bar.close;

            }
        }
       //Get Min Max EOF


        var LowerLow = Min[Min.length -1] > Min[0];
        var CandeLow = this.candle.close < runningMin && (this.candle.close - runningMin) / 100;
        MoveCycle.push((this.candle.close - runningMin) / 100);
        var Downslow = MoveCycle[MoveCycle.length -1] > MoveCycle[0];
        

        var c1 = this.candle_queue[this.candle_queue.length -2];
        var TrueRange = Math.max(runninMax,c1.close) - Math.min(runningMin,c1.close);
        var valid = TrueRange / (candle.close - c1.close);
        var Range = 100 * ((valid - runningMin) / (runninMax - runningMin));
        MovingTR.push(valid);
        var MovingSlower = MovingTR[MovingTR.length -2] > valid;
        var RangeControl = valid != Infinity;

        LowTopDif.push((runningMin - runninMax) / 100);
        var BoxExpanding = LowTopDif[LowTopDif.length -2] < LowTopDif[LowTopDif.length -1];



        // log.debug('Min: ',runningMin);
        // log.debug('Max: ',runninMax);
        if(CandeLow   && valid > 0 &&! this.is_buyin)
        {
            this.price_buyin = candle.close;
            this.candle_queue.length = 0;
            runningMin = 0;
            runninMax = 0;
            Min.length = 0;
            Downslow.length = 0;
            MovingTR.length = 0;
            MovingSlower.length = 0;
            this.is_buyin = true;
            return this.advice("long");
        }
        else if (candle.close >= runninMax && this.is_buyin  )
        {
            this.candle_queue.length = 0;
            runningMin = 0;
            runninMax = 0;
            Min.length = 0;
            MovingTR.length = 0;
            Downslow.length = 0;
            MovingSlower.length = 0;
            this.is_buyin = false;
            return this.advice("short");
        }
        if(NoTradedSince > 2 &&! this.is_buyin)
        {
            this.candle_queue.length = 0;
            runningMin = 0;
            Min.length = 0;
            runninMax = 0;
            Downslow.length = 0;
            MovingTR.length = 0;
            MovingSlower.length = 0;
            NoTradedSince = 0;
        }
        NoTradedSince++;
    
    }
}

module.exports = method;