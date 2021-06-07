// export GOOGLE_APPLICATION_CREDENTIALS=/Users/sungyu/Documents/wise-baton-243208-79bf15b36afb.json

const chalk = require("chalk");
const { Writable } = require("stream");
const recorder = require("node-record-lpcm16");
const speech = require("@google-cloud/speech").v1p1beta1;

interface IConfigType {
  encoding: string;
  sampleRateHertz: number;
  languageCode: string;
}

interface IRequestType {
  config: IConfigType;
  interimResults: boolean;
}
class SpeechToText {
  public onTrans?: (subtitle: string, isFinal: boolean) => any;

  private streamingLimit: number;
  private client: any;
  private config: IConfigType;
  private request: IRequestType;

  private recognizeStream: any = null;
  private restartCounter = 0;
  private audioInput: any[] = [];
  private lastAudioInput: any[] = [];
  private resultEndTime = 0;
  private isFinalEndTime = 0;
  private finalRequestEndTime = 0;
  private newStream = true;
  private bridgingOffset = 0;
  private lastTranscriptWasFinal = false;

  constructor(
    encoding?: string,
    sampleRateHertz?: number,
    languageCode?: string,
    streamingLimit?: number
  ) {
    this.streamingLimit = streamingLimit ?? 290000;
    this.config = {
      encoding: encoding ?? "LINEAR16",
      sampleRateHertz: sampleRateHertz ?? 16000,
      languageCode: languageCode ?? "ko-kr",
    };
    this.request = {
      config: this.config,
      interimResults: true,
    };
    this.client = new speech.SpeechClient();

    recorder
      .record({
        sampleRateHertz: sampleRateHertz,
        threshold: 0, // Silence threshold
        silence: 1000,
        keepSilence: true,
        recordProgram: "rec", // Try also "arecord" or "sox"
      })
      .stream()
      .on("error", (err: any) => {
        console.error("Audio recording error " + err);
      })
      .pipe(this.audioInputStreamTransform());

    console.log("STT Connect");
  }

  private speechCallback(self: this) {
    return (stream : any) => {
      // Convert API result end time from seconds + nanoseconds to milliseconds
      self.resultEndTime =
        stream.results[0].resultEndTime.seconds * 1000 +
        Math.round(stream.results[0].resultEndTime.nanos / 1000000);

      // Calculate correct time based on offset from audio sent twice
      const correctedTime =
        self.resultEndTime -
        self.bridgingOffset +
        self.streamingLimit * self.restartCounter;

      let stdoutText = "";
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
  }

  private audioInputStreamTransform() {
    var self = this;

    return new Writable({
      write(chunk: any, encoding: any, next: any) {
        if (self.newStream && self.lastAudioInput.length !== 0) {
          // Approximate math to calculate time of chunks
          const chunkTime = self.streamingLimit / self.lastAudioInput.length;
          if (chunkTime !== 0) {
            if (self.bridgingOffset < 0) {
              self.bridgingOffset = 0;
            }
            if (self.bridgingOffset > self.finalRequestEndTime) {
              self.bridgingOffset = self.finalRequestEndTime;
            }
            const chunksFromMS = Math.floor(
              (self.finalRequestEndTime - self.bridgingOffset) / chunkTime
            );
            self.bridgingOffset = Math.floor(
              (self.lastAudioInput.length - chunksFromMS) * chunkTime
            );

            for (let i = chunksFromMS; i < self.lastAudioInput.length; i++) {
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

      final() {
        if (self.recognizeStream) {
          self.recognizeStream.end();
        }
      },
    });
  }
  private restartStream() {
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
  }

  public startStream() {
    // Clear current audioInput

    this.audioInput = [];
    // Initiate (Reinitiate) a recognize stream
    this.recognizeStream = this.client
      .streamingRecognize(this.request)
      .on("error", (err: any) => {
        if (err.code === 11) {
          // restartStream();
        } else {
          console.error("API request error " + err);
        }
      })
      .on("data", this.speechCallback(this));

    // Restart stream when streamingLimit expires
    setTimeout(this.restartStream, this.streamingLimit);
  }

  public stopStream() {
    if (this.recognizeStream) {
      this.recognizeStream.end();
      this.recognizeStream.removeListener("data", this.speechCallback);
      this.recognizeStream = null;
    }
  }
}

export default SpeechToText;
