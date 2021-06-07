"use strict";
// export GOOGLE_APPLICATION_CREDENTIALS=/Users/sungyu/Documents/wise-baton-243208-79bf15b36afb.json
exports.__esModule = true;
var chalk = require("chalk");
var Writable = require("stream").Writable;
var recorder = require("node-record-lpcm16");
var speech = require("@google-cloud/speech").v1p1beta1;
var SpeechToText = /** @class */ (function () {
    function SpeechToText(encoding, sampleRateHertz, languageCode, streamingLimit) {
        this.recognizeStream = null;
        this.restartCounter = 0;
        this.audioInput = [];
        this.lastAudioInput = [];
        this.resultEndTime = 0;
        this.isFinalEndTime = 0;
        this.finalRequestEndTime = 0;
        this.newStream = true;
        this.bridgingOffset = 0;
        this.lastTranscriptWasFinal = false;
        this.streamingLimit = streamingLimit !== null && streamingLimit !== void 0 ? streamingLimit : 290000;
        this.config = {
            encoding: encoding !== null && encoding !== void 0 ? encoding : "LINEAR16",
            sampleRateHertz: sampleRateHertz !== null && sampleRateHertz !== void 0 ? sampleRateHertz : 16000,
            languageCode: languageCode !== null && languageCode !== void 0 ? languageCode : "ko-kr"
        };
        this.request = {
            config: this.config,
            interimResults: true
        };
        this.client = new speech.SpeechClient();
        recorder
            .record({
            sampleRateHertz: sampleRateHertz,
            threshold: 0,
            silence: 1000,
            keepSilence: true,
            recordProgram: "rec"
        })
            .stream()
            .on("error", function (err) {
            console.error("Audio recording error " + err);
        })
            .pipe(this.audioInputStreamTransform());
        console.log("STT Connect");
    }
    SpeechToText.prototype.speechCallback = function (self) {
        return function (stream) {
            // Convert API result end time from seconds + nanoseconds to milliseconds
            self.resultEndTime =
                stream.results[0].resultEndTime.seconds * 1000 +
                    Math.round(stream.results[0].resultEndTime.nanos / 1000000);
            // Calculate correct time based on offset from audio sent twice
            var correctedTime = self.resultEndTime -
                self.bridgingOffset +
                self.streamingLimit * self.restartCounter;
            var stdoutText = "";
            if (stream.results[0] && stream.results[0].alternatives[0]) {
                stdoutText = stream.results[0].alternatives[0].transcript;
            }
            if (self.onTrans !== undefined) {
                self.onTrans(stdoutText, stream.results[0].isFinal);
            }
            // if (stream.results[0].isFinal) {
            //   process.stdout.write(chalk.green(`${stdoutText}\n`));
            //   isFinalEndTime = resultEndTime;
            //   lastTranscriptWasFinal = true;
            // } else {
            //   process.stdout.write(chalk.red(`${stdoutText}`));
            //   cbFunc(stdoutText, stream.results[0].isFinal);
            //   lastTranscriptWasFinal = false;
            // }
        };
    };
    SpeechToText.prototype.audioInputStreamTransform = function () {
        var self = this;
        return new Writable({
            write: function (chunk, encoding, next) {
                if (self.newStream && self.lastAudioInput.length !== 0) {
                    // Approximate math to calculate time of chunks
                    var chunkTime = self.streamingLimit / self.lastAudioInput.length;
                    if (chunkTime !== 0) {
                        if (self.bridgingOffset < 0) {
                            self.bridgingOffset = 0;
                        }
                        if (self.bridgingOffset > self.finalRequestEndTime) {
                            self.bridgingOffset = self.finalRequestEndTime;
                        }
                        var chunksFromMS = Math.floor((self.finalRequestEndTime - self.bridgingOffset) / chunkTime);
                        self.bridgingOffset = Math.floor((self.lastAudioInput.length - chunksFromMS) * chunkTime);
                        for (var i = chunksFromMS; i < self.lastAudioInput.length; i++) {
                            self.recognizeStream.write(self.lastAudioInput[i]);
                        }
                    }
                    self.newStream = false;
                }
                self.audioInput.push(chunk);
                if (self.recognizeStream) {
                    self.recognizeStream.write(chunk);
                }
                next();
            },
            final: function () {
                if (self.recognizeStream) {
                    self.recognizeStream.end();
                }
            }
        });
    };
    SpeechToText.prototype.restartStream = function () {
        if (this.recognizeStream) {
            this.recognizeStream.end();
            this.recognizeStream.removeListener("data", this.speechCallback);
            this.recognizeStream = null;
        }
        if (this.resultEndTime > 0) {
            this.finalRequestEndTime = this.isFinalEndTime;
        }
        this.resultEndTime = 0;
        this.lastAudioInput = [];
        this.lastAudioInput = this.audioInput;
        this.restartCounter++;
        this.newStream = true;
        this.startStream();
    };
    SpeechToText.prototype.startStream = function () {
        // Clear current audioInput
        this.audioInput = [];
        // Initiate (Reinitiate) a recognize stream
        this.recognizeStream = this.client
            .streamingRecognize(this.request)
            .on("error", function (err) {
            if (err.code === 11) {
                // restartStream();
            }
            else {
                console.error("API request error " + err);
            }
        })
            .on("data", this.speechCallback(this));
        // Restart stream when streamingLimit expires
        setTimeout(this.restartStream, this.streamingLimit);
    };
    SpeechToText.prototype.stopStream = function () {
        if (this.recognizeStream) {
            this.recognizeStream.end();
            this.recognizeStream.removeListener("data", this.speechCallback);
            this.recognizeStream = null;
        }
    };
    return SpeechToText;
}());
exports["default"] = SpeechToText;
